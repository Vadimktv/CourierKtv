const recordButton = document.getElementById('record-button');
const recordStatus = document.getElementById('record-status');
const transcriptBox = document.getElementById('transcript');
const addressInput = document.getElementById('address');
const amountInput = document.getElementById('amount');
const phoneInput = document.getElementById('phone');
const callButton = document.getElementById('call-button');
const routeButton = document.getElementById('route-button');
const warningsBox = document.getElementById('warnings');
const receiptInput = document.getElementById('receipt-input');
const uploadHint = document.getElementById('upload-hint');

let mediaRecorder;
let currentStream;
let audioChunks = [];
let cancelOnRelease = false;
let pointerId = null;
let cancelRequested = false;
let isRecording = false;

function updateStatus(message, variant = 'idle') {
  recordStatus.textContent = message;
  recordStatus.dataset.variant = variant;
}

function setRecordButtonState(state) {
  recordButton.classList.remove('active', 'cancel');
  switch (state) {
    case 'recording':
      recordButton.classList.add('active');
      break;
    case 'cancel':
      recordButton.classList.add('cancel');
      break;
    default:
      break;
  }
}

async function ensureStream() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error('Устройство не поддерживает запись звука');
  }
  if (currentStream) {
    return currentStream;
  }
  currentStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  return currentStream;
}

async function startRecording() {
  try {
    const stream = await ensureStream();
    audioChunks = [];
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.addEventListener('dataavailable', (event) => {
      if (event.data && event.data.size > 0) {
        audioChunks.push(event.data);
      }
    });
    mediaRecorder.addEventListener('stop', async () => {
      setRecordButtonState('idle');
      stopStream(stream);
      currentStream = null;
      if (cancelRequested) {
        updateStatus('Запись отменена', 'muted');
        cancelRequested = false;
        return;
      }
      updateStatus('Отправка аудио…', 'upload');
      const blob = new Blob(audioChunks, { type: mediaRecorder.mimeType || 'audio/webm' });
      try {
        await sendAudio(blob);
        updateStatus('Готово', 'success');
      } catch (error) {
        console.error(error);
        updateStatus(error.message || 'Ошибка при отправке аудио', 'error');
      }
    });
    mediaRecorder.start();
    isRecording = true;
    updateStatus('Идёт запись…', 'recording');
    setRecordButtonState('recording');
  } catch (error) {
    console.error(error);
    updateStatus('Нет доступа к микрофону', 'error');
    isRecording = false;
    setRecordButtonState('idle');
    try {
      if (pointerId !== null) {
        recordButton.releasePointerCapture(pointerId);
      }
    } catch (e) {
      // ignore release errors
    }
  }
}

function stopStream(stream) {
  if (!stream) {
    return;
  }
  stream.getTracks().forEach((track) => track.stop());
}

function stopRecording(cancelled) {
  if (!mediaRecorder || mediaRecorder.state !== 'recording') {
    return;
  }
  cancelRequested = cancelled;
  mediaRecorder.stop();
  isRecording = false;
  setRecordButtonState('idle');
  if (cancelled) {
    updateStatus('Отмена…', 'muted');
  } else {
    updateStatus('Обработка…', 'upload');
  }
}

recordButton.addEventListener('pointerdown', async (event) => {
  event.preventDefault();
  pointerId = event.pointerId;
  cancelOnRelease = false;
  recordButton.setPointerCapture(pointerId);
  await startRecording();
});

recordButton.addEventListener('pointerup', (event) => {
  if (event.pointerId !== pointerId) {
    return;
  }
  recordButton.releasePointerCapture(pointerId);
  pointerId = null;
  stopRecording(cancelOnRelease);
  cancelOnRelease = false;
});

recordButton.addEventListener('pointercancel', () => {
  if (pointerId !== null) {
    try {
      recordButton.releasePointerCapture(pointerId);
    } catch (error) {
      // ignore
    }
  }
  pointerId = null;
  stopRecording(true);
  cancelOnRelease = false;
});

recordButton.addEventListener('pointerleave', () => {
  if (!isRecording) {
    return;
  }
  cancelOnRelease = true;
  setRecordButtonState('cancel');
  updateStatus('Отпустите, чтобы отменить', 'warning');
});

recordButton.addEventListener('pointerenter', () => {
  if (!isRecording) {
    return;
  }
  cancelOnRelease = false;
  setRecordButtonState('recording');
  updateStatus('Идёт запись…', 'recording');
});

async function sendAudio(blob) {
  const payload = await blobToBase64(blob);
  const response = await fetch('/api/transcribe', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ audio: payload }),
  });
  const data = await response.json();
  if (!response.ok || data.error) {
    throw new Error(data.error || 'Ошибка сервера');
  }
  handleServerResult(data);
}

async function sendReceipt(file) {
  const payload = await fileToBase64(file);
  const response = await fetch('/api/ocr', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ image: payload }),
  });
  const data = await response.json();
  if (!response.ok || data.error) {
    throw new Error(data.error || 'Ошибка распознавания');
  }
  handleServerResult(data);
}

function handleServerResult(result) {
  transcriptBox.textContent = result.normalizedText || result.text || '—';
  if (result.data) {
    if (result.data.address) {
      addressInput.value = result.data.address;
    }
    if (result.data.amount !== null && result.data.amount !== undefined) {
      amountInput.value = result.data.amount;
    }
    if (result.data.phone) {
      phoneInput.value = formatPhone(result.data.phone);
    }
  }

  updateCallAction();
  updateRouteAction();
  renderWarnings(result.warnings || []);
}

function renderWarnings(items) {
  warningsBox.innerHTML = '';
  if (!items || items.length === 0) {
    return;
  }
  items.forEach((warning) => {
    const element = document.createElement('div');
    element.className = 'warning-item';
    if (/не найден/i.test(warning)) {
      element.classList.add('critical');
    }
    element.textContent = warning;
    warningsBox.appendChild(element);
  });
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function fileToBase64(file) {
  return blobToBase64(file);
}

function formatPhone(phone) {
  if (!phone) {
    return '';
  }
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11) {
    return `+${digits[0]} (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9, 11)}`;
  }
  return phone;
}

function updateCallAction() {
  const digits = phoneInput.value.replace(/\D/g, '');
  if (digits.length >= 10) {
    let normalized = digits.length === 10 ? `7${digits}` : digits;
    if (normalized.length === 11 && normalized.startsWith('8')) {
      normalized = `7${normalized.slice(1)}`;
    }
    callButton.href = `tel:+${normalized}`;
    callButton.classList.remove('disabled');
    callButton.setAttribute('aria-disabled', 'false');
  } else {
    callButton.href = '#';
    callButton.classList.add('disabled');
    callButton.setAttribute('aria-disabled', 'true');
  }
}

function updateRouteAction() {
  const address = addressInput.value.trim();
  if (!address) {
    routeButton.href = '#';
    routeButton.dataset.fallback = '';
    routeButton.classList.add('disabled');
    routeButton.setAttribute('aria-disabled', 'true');
    return;
  }
  const encoded = encodeURIComponent(address);
  routeButton.href = `yandexnavi://search?text=${encoded}`;
  routeButton.dataset.fallback = `https://yandex.ru/maps/?text=${encoded}`;
  routeButton.classList.remove('disabled');
  routeButton.setAttribute('aria-disabled', 'false');
}

routeButton.addEventListener('click', (event) => {
  if (routeButton.classList.contains('disabled')) {
    event.preventDefault();
    return;
  }
  const fallback = routeButton.dataset.fallback;
  if (fallback) {
    setTimeout(() => {
      window.open(fallback, '_blank', 'noopener');
    }, 800);
  }
});

[addressInput, phoneInput].forEach((input) => {
  input.addEventListener('input', () => {
    if (input === phoneInput) {
      updateCallAction();
    }
    if (input === addressInput) {
      updateRouteAction();
    }
  });
});

receiptInput.addEventListener('change', async () => {
  const file = receiptInput.files && receiptInput.files[0];
  if (!file) {
    return;
  }
  updateStatus('Отправка фото…', 'upload');
  uploadHint.textContent = `Обработка файла: ${file.name}`;
  try {
    await sendReceipt(file);
    updateStatus('Данные обновлены', 'success');
    uploadHint.textContent = 'Готово! Можно загрузить другой чек.';
  } catch (error) {
    console.error(error);
    updateStatus(error.message || 'Ошибка OCR', 'error');
    uploadHint.textContent = 'Не удалось обработать чек. Попробуйте ещё раз.';
  }
  receiptInput.value = '';
});

updateCallAction();
updateRouteAction();
updateStatus('Готов к записи', 'idle');
