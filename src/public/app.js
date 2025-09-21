const recordButton = document.getElementById('record-button');
const recordStatus = document.getElementById('record-status');
const transcriptBox = document.getElementById('transcript');
const addressInput = document.getElementById('address');
const amountInput = document.getElementById('amount');
const phoneInput = document.getElementById('phone');
const notesInput = document.getElementById('notes');
const callButton = document.getElementById('call-button');
const routeButton = document.getElementById('route-button');
const warningsBox = document.getElementById('warnings');
const receiptInput = document.getElementById('receipt-input');
const uploadHint = document.getElementById('upload-hint');

const formModeBadge = document.getElementById('form-mode');
const saveOrderButton = document.getElementById('save-order-button');
const resetFormButton = document.getElementById('reset-form-button');

const startRouteButton = document.getElementById('start-route-button');
const activeOrdersList = document.getElementById('active-orders-list');
const activeOrdersEmpty = document.getElementById('active-orders-empty');

const completedSummary = document.getElementById('completed-summary');
const completedOrdersList = document.getElementById('completed-orders-list');
const cancelledWrapper = document.getElementById('cancelled-orders-wrapper');
const cancelledOrdersList = document.getElementById('cancelled-orders-list');
const finishDayButton = document.getElementById('finish-day-button');

const completeOverlay = document.getElementById('complete-overlay');
const completeAddress = document.getElementById('complete-address');
const completeMethod = document.getElementById('complete-method');
const completeAmount = document.getElementById('complete-amount');
const completeCancel = document.getElementById('complete-cancel');
const completeConfirm = document.getElementById('complete-confirm');
const completeClose = document.getElementById('complete-close');

let mediaRecorder;
let currentStream;
let audioChunks = [];
let cancelOnRelease = false;
let pointerId = null;
let cancelRequested = false;
let isRecording = false;

const STORAGE_KEY = 'courier-orders-state-v1';
const PAYMENT_LABELS = {
  cash: 'Наличные',
  transfer: 'Перевод',
  card: 'Карта',
};

let state = loadState();
let editingOrderId = null;
let completionOrderId = null;
let pendingSource = 'manual';
let pendingRawText = '';
let latestWarnings = [];

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
  handleServerResult({ ...data, source: data.source || 'audio' });
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
  handleServerResult({ ...data, source: data.source || 'ocr' });
}

function handleServerResult(result) {
  const rawText = result.normalizedText || result.text || '';
  const normalizedText = typeof rawText === 'string' ? rawText.trim() : '';
  setTranscript(normalizedText);

  const parsed = parseRecognizedText(normalizedText);
  addressInput.value = parsed.address;
  amountInput.value = parsed.amount !== null ? String(parsed.amount) : '';
  phoneInput.value = parsed.phone ? formatPhone(parsed.phone) : '';

  updateCallAction();
  updateRouteAction();

  pendingSource = result.source || 'recognition';

  const serverWarnings = Array.isArray(result.warnings) ? result.warnings : [];
  const combinedWarnings = mergeWarnings(serverWarnings, buildParsingWarnings(parsed));
  renderWarnings(combinedWarnings);
}

function parseRecognizedText(text) {
  if (!text) {
    return { address: '', amount: null, phone: '' };
  }

  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) {
    return { address: '', amount: null, phone: '' };
  }

  const address = extractAddressFromText(normalized);
  const amount = extractAmountFromText(normalized);
  const phone = extractPhoneFromText(normalized);

  return {
    address,
    amount,
    phone,
  };
}

function extractAddressFromText(text) {
  const match = text.match(/^(.+?)(?=\sсумма|\sтелефон|$)/i);
  if (!match) {
    return '';
  }

  let address = match[1] || '';
  address = address.replace(/^(?:адрес|по адресу)[\s:,-]*/i, '');
  address = cleanAddressText(address);
  return address;
}

function extractAmountFromText(text) {
  const compactNumbers = text.replace(/(\d)\s+(?=\d)/g, '$1');
  const match = compactNumbers.match(/(\d{2,6})(?:[\s.,](\d{2}))?\s?(?:р|руб|₽)/i);
  if (!match) {
    return null;
  }
  const major = match[1].replace(/\s+/g, '');
  const minor = match[2] ? match[2] : '';
  const raw = minor ? `${major}.${minor}` : major;
  const amount = Number.parseFloat(raw.replace(',', '.'));
  if (!Number.isFinite(amount)) {
    return null;
  }
  return Math.round(amount * 100) / 100;
}

function extractPhoneFromText(text) {
  const compact = text.replace(/[\s\-()]/g, '');
  const match = compact.match(/(\+7|8)\d{10}/);
  if (!match) {
    return '';
  }

  const raw = match[0];
  return normalizePhone(raw) || '';
}

function normalizePhone(value) {
  if (!value) {
    return '';
  }
  const digits = value.replace(/\D/g, '');
  if (!digits) {
    return '';
  }

  let normalized = digits;
  if (normalized.length === 11 && normalized.startsWith('8')) {
    normalized = `7${normalized.slice(1)}`;
  }
  if (normalized.length === 10) {
    normalized = `7${normalized}`;
  }
  if (normalized.length !== 11 || !normalized.startsWith('7')) {
    return '';
  }
  return `+${normalized}`;
}

function cleanAddressText(value) {
  if (!value) {
    return '';
  }

  return value
    .replace(/\s+/g, ' ')
    .replace(/\s*,\s*/g, ', ')
    .replace(/,+/g, ',')
    .replace(/^[,\.\s]+/g, '')
    .replace(/[\s,.;:-]+$/g, '')
    .trim();
}

function buildParsingWarnings(parsed) {
  const warnings = [];
  if (!parsed.address) {
    warnings.push('Адрес не найден в тексте');
  }
  if (parsed.amount === null) {
    warnings.push('Сумма не найдена в тексте');
  }
  if (!parsed.phone) {
    warnings.push('Телефон не найден в тексте');
  }
  return warnings;
}

function mergeWarnings(serverWarnings, parsingWarnings) {
  const seen = new Set();
  const result = [];

  [...serverWarnings, ...parsingWarnings].forEach((warning) => {
    if (!warning || seen.has(warning)) {
      return;
    }
    seen.add(warning);
    result.push(warning);
  });

  return result;
}

function renderWarnings(items) {
  warningsBox.innerHTML = '';
  latestWarnings = Array.isArray(items) ? [...items] : [];
  if (!items || items.length === 0) {
    return;
  }
  items.forEach((warning) => {
    const element = document.createElement('div');
    element.className = 'warning-item';
    if (/не найден/i.test(warning) || /укажите/i.test(warning)) {
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

function setTranscript(text) {
  const normalized = typeof text === 'string' ? text.trim() : '';
  pendingRawText = normalized;
  transcriptBox.textContent = normalized || '—';
}

function resetForm({ keepTranscript = false } = {}) {
  addressInput.value = '';
  amountInput.value = '';
  phoneInput.value = '';
  notesInput.value = '';
  if (!keepTranscript) {
    setTranscript('');
  }
  pendingSource = 'manual';
  renderWarnings([]);
  updateCallAction();
  updateRouteAction();
  setFormMode(null);
}

function setFormMode(order) {
  if (order) {
    editingOrderId = order.id;
    formModeBadge.hidden = false;
    const short = order.id.slice(-4).toUpperCase();
    formModeBadge.textContent = `Редактирование заказа #${short}`;
    saveOrderButton.textContent = 'Сохранить изменения';
  } else {
    editingOrderId = null;
    formModeBadge.hidden = true;
    saveOrderButton.textContent = 'Сохранить заказ';
  }
}

function collectFormData() {
  const address = addressInput.value.trim();
  const amount = parseAmount(amountInput.value);
  const normalizedPhone = normalizePhone(phoneInput.value);
  const notes = notesInput.value.trim();
  const rawText = pendingRawText;

  return {
    address,
    amount,
    phone: normalizedPhone,
    notes,
    rawText,
  };
}

function parseAmount(raw) {
  if (!raw) {
    return null;
  }
  const cleaned = String(raw).replace(/\s+/g, '').replace(',', '.');
  const amount = Number.parseFloat(cleaned);
  if (!Number.isFinite(amount)) {
    return null;
  }
  return Math.round(amount * 100) / 100;
}

function formatCurrency(value) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '—';
  }
  const formatter = new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
  return `${formatter.format(value)} ₽`;
}

function pluralize(count, one, few, many) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) {
    return `${count} ${one}`;
  }
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) {
    return `${count} ${few}`;
  }
  return `${count} ${many}`;
}

function translatePaymentMethod(method) {
  return PAYMENT_LABELS[method] || '—';
}

function formatTime(timestamp) {
  if (!timestamp) {
    return '';
  }
  try {
    return new Date(timestamp).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    return '';
  }
}

function generateId() {
  return `ord-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function getDefaultState() {
  return {
    activeOrders: [],
    completedOrders: [],
    cancelledOrders: [],
  };
}

function sanitizeOrder(order) {
  if (!order || typeof order !== 'object') {
    return null;
  }
  const sanitized = {
    id: typeof order.id === 'string' ? order.id : generateId(),
    address: typeof order.address === 'string' ? order.address : '',
    amount: typeof order.amount === 'number' && Number.isFinite(order.amount)
      ? Math.round(order.amount * 100) / 100
      : null,
    phone: typeof order.phone === 'string' ? order.phone : '',
    notes: typeof order.notes === 'string' ? order.notes : '',
    rawText: typeof order.rawText === 'string' ? order.rawText : '',
    createdAt: Number.isFinite(order.createdAt) ? order.createdAt : Date.now(),
    status: ['pending', 'arrived', 'postponed'].includes(order.status) ? order.status : 'pending',
    source: typeof order.source === 'string' ? order.source : 'manual',
    warnings: Array.isArray(order.warnings) ? order.warnings.filter(Boolean) : [],
    postponedCount: Number.isFinite(order.postponedCount) ? order.postponedCount : 0,
    arrivedAt: Number.isFinite(order.arrivedAt) ? order.arrivedAt : null,
    confirmedAmount: typeof order.confirmedAmount === 'number' && Number.isFinite(order.confirmedAmount)
      ? Math.round(order.confirmedAmount * 100) / 100
      : null,
    completedAt: Number.isFinite(order.completedAt) ? order.completedAt : null,
    cancelledAt: Number.isFinite(order.cancelledAt) ? order.cancelledAt : null,
    payment: order.payment && typeof order.payment === 'object'
      ? {
          method: order.payment.method || null,
          amount: typeof order.payment.amount === 'number' && Number.isFinite(order.payment.amount)
            ? Math.round(order.payment.amount * 100) / 100
            : null,
        }
      : null,
  };
  if (sanitized.phone) {
    sanitized.phone = normalizePhone(sanitized.phone);
  }
  return sanitized;
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return getDefaultState();
    }
    const parsed = JSON.parse(raw);
    const active = Array.isArray(parsed.activeOrders)
      ? parsed.activeOrders.map(sanitizeOrder).filter(Boolean)
      : [];
    const completed = Array.isArray(parsed.completedOrders)
      ? parsed.completedOrders.map((order) => {
          const sanitized = sanitizeOrder(order);
          if (!sanitized) {
            return null;
          }
          sanitized.status = 'completed';
          return sanitized;
        }).filter(Boolean)
      : [];
    const cancelled = Array.isArray(parsed.cancelledOrders)
      ? parsed.cancelledOrders.map((order) => {
          const sanitized = sanitizeOrder(order);
          if (!sanitized) {
            return null;
          }
          sanitized.status = 'cancelled';
          return sanitized;
        }).filter(Boolean)
      : [];
    return {
      activeOrders: active,
      completedOrders: completed,
      cancelledOrders: cancelled,
    };
  } catch (error) {
    console.warn('Failed to load state', error);
    return getDefaultState();
  }
}

function persistState() {
  try {
    const payload = JSON.stringify(state);
    localStorage.setItem(STORAGE_KEY, payload);
  } catch (error) {
    console.warn('Не удалось сохранить состояние', error);
  }
}

function buildOrderWarnings(data, existingWarnings = []) {
  const filtered = existingWarnings.filter((warning) => {
    if (data.address && /адрес/i.test(warning)) {
      return false;
    }
    if (data.amount !== null && /сумм/i.test(warning)) {
      return false;
    }
    if (data.phone && /телефон/i.test(warning)) {
      return false;
    }
    return true;
  });

  if (data.amount === null && !filtered.some((warning) => /сумм/i.test(warning))) {
    filtered.push('Сумма не указана');
  }
  if (!data.phone && !filtered.some((warning) => /телефон/i.test(warning))) {
    filtered.push('Телефон не указан');
  }
  return mergeWarnings(filtered, []);
}

function saveCurrentOrder() {
  const data = collectFormData();
  if (!data.address) {
    addressInput.focus();
    renderWarnings(['Укажите адрес доставки']);
    return;
  }

  const orderWarnings = buildOrderWarnings(data, latestWarnings);

  if (editingOrderId) {
    const order = state.activeOrders.find((item) => item.id === editingOrderId);
    if (!order) {
      setFormMode(null);
    } else {
      order.address = data.address;
      order.amount = data.amount;
      order.phone = data.phone;
      order.notes = data.notes;
      order.rawText = data.rawText;
      order.source = pendingSource || order.source;
      order.warnings = orderWarnings;
    }
  } else {
    const newOrder = {
      id: generateId(),
      address: data.address,
      amount: data.amount,
      phone: data.phone,
      notes: data.notes,
      rawText: data.rawText,
      createdAt: Date.now(),
      status: 'pending',
      source: pendingSource || 'manual',
      warnings: orderWarnings,
      postponedCount: 0,
      arrivedAt: null,
      confirmedAmount: null,
      completedAt: null,
      payment: null,
    };
    state.activeOrders.push(newOrder);
  }

  persistState();
  renderActiveOrders();
  renderCompletedOrders();
  updateStatus('Заказ сохранён', 'success');
  resetForm();
}

function loadOrderIntoForm(order) {
  addressInput.value = order.address || '';
  amountInput.value = order.amount !== null ? String(order.amount) : '';
  phoneInput.value = order.phone ? formatPhone(order.phone) : '';
  notesInput.value = order.notes || '';
  pendingSource = order.source || 'manual';
  setTranscript(order.rawText || '');
  renderWarnings(order.warnings || []);
  updateCallAction();
  updateRouteAction();
  setFormMode(order);
}

function renderActiveOrders() {
  activeOrdersList.innerHTML = '';
  if (!state.activeOrders.length) {
    activeOrdersEmpty.style.display = 'block';
  } else {
    activeOrdersEmpty.style.display = 'none';
  }

  state.activeOrders.forEach((order, index) => {
    const card = document.createElement('div');
    card.className = 'order-card';
    card.dataset.id = order.id;

    const header = document.createElement('div');
    header.className = 'order-header';

    const main = document.createElement('div');
    main.className = 'order-main';

    const title = document.createElement('div');
    title.className = 'order-title';
    title.textContent = `№${index + 1} • ${order.address || 'Без адреса'}`;

    const meta = document.createElement('div');
    meta.className = 'order-meta';

    const amount = document.createElement('span');
    amount.className = 'order-amount';
    amount.textContent = order.amount !== null ? formatCurrency(order.amount) : 'Сумма не указана';
    meta.appendChild(amount);

    if (order.phone) {
      const phone = document.createElement('span');
      phone.className = 'order-phone';
      phone.textContent = formatPhone(order.phone);
      meta.appendChild(phone);
    }

    if (order.postponedCount > 0) {
      const postponed = document.createElement('span');
      postponed.textContent = pluralize(order.postponedCount, 'Отложен 1 раз', 'Отложен 2 раза', `Отложен ${order.postponedCount} раз`);
      meta.appendChild(postponed);
    }

    if (order.arrivedAt) {
      const arrived = document.createElement('span');
      arrived.textContent = `На месте: ${formatTime(order.arrivedAt)}`;
      meta.appendChild(arrived);
    }

    main.appendChild(title);
    main.appendChild(meta);

    const reorder = document.createElement('div');
    reorder.className = 'order-reorder';

    const upButton = document.createElement('button');
    upButton.className = 'icon-button';
    upButton.type = 'button';
    upButton.dataset.action = 'move-up';
    upButton.textContent = '↑';
    upButton.setAttribute('aria-label', 'Переместить заказ выше');
    if (index === 0) {
      upButton.disabled = true;
    }

    const downButton = document.createElement('button');
    downButton.className = 'icon-button';
    downButton.type = 'button';
    downButton.dataset.action = 'move-down';
    downButton.textContent = '↓';
    downButton.setAttribute('aria-label', 'Переместить заказ ниже');
    if (index === state.activeOrders.length - 1) {
      downButton.disabled = true;
    }

    reorder.appendChild(upButton);
    reorder.appendChild(downButton);

    header.appendChild(main);
    header.appendChild(reorder);
    card.appendChild(header);

    const badges = document.createElement('div');
    badges.className = 'order-badges';

    if (order.status === 'arrived') {
      const badge = document.createElement('span');
      badge.className = 'badge success';
      badge.textContent = 'На месте';
      badges.appendChild(badge);
    }
    if (order.status === 'postponed') {
      const badge = document.createElement('span');
      badge.className = 'badge warning';
      badge.textContent = 'Отложен';
      badges.appendChild(badge);
    }
    if (order.source === 'audio') {
      const badge = document.createElement('span');
      badge.className = 'badge info';
      badge.textContent = 'Голос';
      badges.appendChild(badge);
    }
    if (order.source === 'ocr') {
      const badge = document.createElement('span');
      badge.className = 'badge info';
      badge.textContent = 'Чек';
      badges.appendChild(badge);
    }
    if (order.warnings && order.warnings.length) {
      const badge = document.createElement('span');
      badge.className = 'badge warning';
      badge.textContent = 'Проверьте данные';
      badges.appendChild(badge);
    }

    if (badges.childElementCount > 0) {
      card.appendChild(badges);
    }

    const actions = document.createElement('div');
    actions.className = 'order-actions';

    const callAction = document.createElement('a');
    callAction.className = 'order-action';
    callAction.dataset.action = 'call';
    callAction.textContent = 'Позвонить';
    callAction.rel = 'noopener';
    if (order.phone) {
      callAction.href = `tel:${order.phone.replace(/\D/g, '').replace(/^7/, '+7')}`;
    } else {
      callAction.href = '#';
      callAction.classList.add('disabled');
      callAction.setAttribute('aria-disabled', 'true');
    }

    const routeAction = document.createElement('a');
    routeAction.className = 'order-action secondary';
    routeAction.dataset.action = 'navigate';
    routeAction.textContent = 'Маршрут';
    routeAction.rel = 'noopener';
    routeAction.target = '_blank';
    if (order.address) {
      const encoded = encodeURIComponent(order.address);
      routeAction.href = `yandexnavi://search?text=${encoded}`;
      routeAction.dataset.fallback = `https://yandex.ru/maps/?text=${encoded}`;
    } else {
      routeAction.href = '#';
      routeAction.classList.add('disabled');
      routeAction.setAttribute('aria-disabled', 'true');
    }

    const arriveAction = document.createElement('button');
    arriveAction.className = 'order-action';
    arriveAction.type = 'button';
    arriveAction.dataset.action = 'arrive';
    arriveAction.textContent = order.status === 'arrived' ? 'В пути' : 'На месте';

    const postponeAction = document.createElement('button');
    postponeAction.className = 'order-action';
    postponeAction.type = 'button';
    postponeAction.dataset.action = 'postpone';
    postponeAction.textContent = 'Отложить';

    const editAction = document.createElement('button');
    editAction.className = 'order-action ghost';
    editAction.type = 'button';
    editAction.dataset.action = 'edit';
    editAction.textContent = 'Редактировать';

    const cancelAction = document.createElement('button');
    cancelAction.className = 'order-action danger';
    cancelAction.type = 'button';
    cancelAction.dataset.action = 'cancel';
    cancelAction.textContent = 'Отменить';

    const completeAction = document.createElement('button');
    completeAction.className = 'order-action primary';
    completeAction.type = 'button';
    completeAction.dataset.action = 'complete';
    completeAction.textContent = 'Завершить';

    actions.appendChild(callAction);
    actions.appendChild(routeAction);
    actions.appendChild(arriveAction);
    actions.appendChild(postponeAction);
    actions.appendChild(completeAction);
    actions.appendChild(editAction);
    actions.appendChild(cancelAction);

    card.appendChild(actions);

    const detailText = order.notes || order.rawText;
    if (detailText) {
      const notes = document.createElement('div');
      notes.className = 'order-notes';
      notes.textContent = detailText;
      card.appendChild(notes);
    }

    if (order.warnings && order.warnings.length) {
      const warningBox = document.createElement('div');
      warningBox.className = 'order-warning';

      const warningTitle = document.createElement('div');
      warningTitle.className = 'order-warning-title';
      warningTitle.textContent = 'Предупреждения';
      warningBox.appendChild(warningTitle);

      const warningList = document.createElement('ul');
      warningList.className = 'order-warning-list';
      order.warnings.forEach((warning) => {
        const item = document.createElement('li');
        item.textContent = warning;
        warningList.appendChild(item);
      });
      warningBox.appendChild(warningList);

      card.appendChild(warningBox);
    }

    activeOrdersList.appendChild(card);
  });

  updateStartRouteAction();
}

function updateStartRouteAction() {
  const addresses = state.activeOrders.map((order) => order.address).filter((address) => !!address);
  if (!addresses.length) {
    startRouteButton.href = '#';
    startRouteButton.dataset.fallback = '';
    startRouteButton.classList.add('disabled');
    startRouteButton.setAttribute('aria-disabled', 'true');
    return;
  }

  const primary = buildNavigatorLink(addresses);
  const fallback = buildMapsFallback(addresses);
  startRouteButton.href = primary;
  startRouteButton.dataset.fallback = fallback;
  startRouteButton.classList.remove('disabled');
  startRouteButton.setAttribute('aria-disabled', 'false');
}

function buildNavigatorLink(addresses) {
  const points = addresses.map((address) => `ymapsbm1://geo?text=${encodeURIComponent(address)}`);
  return `yandexnavi://build_route_on_map?points=${points.join('~')}`;
}

function buildMapsFallback(addresses) {
  const encoded = addresses.map((address) => encodeURIComponent(address));
  return `https://yandex.ru/maps/?rtext=~${encoded.join('~')}&rtt=auto`;
}

function renderCompletedOrders() {
  completedOrdersList.innerHTML = '';
  if (!state.completedOrders.length) {
    completedSummary.classList.add('empty');
    completedSummary.textContent = 'Заказов пока нет.';
  } else {
    completedSummary.classList.remove('empty');
    const totals = state.completedOrders.reduce((acc, order) => {
      acc.total += 1;
      const method = order.payment ? order.payment.method : null;
      const amount = order.payment && typeof order.payment.amount === 'number' ? order.payment.amount : order.confirmedAmount;
      if (method === 'cash') {
        acc.cash += amount || 0;
        acc.cashCount += 1;
      } else if (method === 'transfer') {
        acc.transfer += amount || 0;
        acc.transferCount += 1;
      } else if (method === 'card') {
        acc.card += amount || 0;
        acc.cardCount += 1;
      }
      return acc;
    }, {
      total: 0,
      cash: 0,
      cashCount: 0,
      transfer: 0,
      transferCount: 0,
      card: 0,
      cardCount: 0,
    });

    const lines = [];
    lines.push(`Завершённых заказов: ${pluralize(totals.total, 'заказ', 'заказа', 'заказов')}`);
    lines.push(`Наличные: ${formatCurrency(totals.cash)}`);
    lines.push(`Переводы: ${formatCurrency(totals.transfer)}`);
    const cardLine = totals.cardCount
      ? `${pluralize(totals.cardCount, 'заказ', 'заказа', 'заказов')} (${formatCurrency(totals.card)})`
      : '0 заказов';
    lines.push(`Оплата картой: ${cardLine}`);

    completedSummary.innerHTML = lines.map((line) => `<div>${line}</div>`).join('');
  }

  state.completedOrders.forEach((order) => {
    const item = document.createElement('div');
    item.className = 'history-item';

    const title = document.createElement('div');
    title.className = 'history-title';
    title.textContent = order.address || 'Без адреса';

    const meta = document.createElement('div');
    meta.className = 'history-meta';

    if (order.payment) {
      const amount = document.createElement('span');
      amount.textContent = `Сумма: ${formatCurrency(order.payment.amount)}`;
      meta.appendChild(amount);

      const method = document.createElement('span');
      method.textContent = `Оплата: ${translatePaymentMethod(order.payment.method)}`;
      meta.appendChild(method);
    }

    if (order.amount !== null && order.payment && order.payment.amount !== order.amount) {
      const expected = document.createElement('span');
      expected.textContent = `По чеку: ${formatCurrency(order.amount)}`;
      meta.appendChild(expected);
    }

    if (order.phone) {
      const phone = document.createElement('span');
      phone.textContent = formatPhone(order.phone);
      meta.appendChild(phone);
    }

    if (order.completedAt) {
      const completedAt = document.createElement('span');
      completedAt.textContent = `Завершено: ${formatTime(order.completedAt)}`;
      meta.appendChild(completedAt);
    }

    item.appendChild(title);
    if (meta.childElementCount > 0) {
      item.appendChild(meta);
    }

    const detailText = order.notes || order.rawText;
    if (detailText) {
      const notes = document.createElement('div');
      notes.className = 'history-notes';
      notes.textContent = detailText;
      item.appendChild(notes);
    }

    completedOrdersList.appendChild(item);
  });

  renderCancelledOrders();
}

function renderCancelledOrders() {
  cancelledOrdersList.innerHTML = '';
  if (!state.cancelledOrders.length) {
    cancelledWrapper.hidden = true;
    return;
  }
  cancelledWrapper.hidden = false;

  state.cancelledOrders.forEach((order) => {
    const item = document.createElement('div');
    item.className = 'history-item';

    const title = document.createElement('div');
    title.className = 'history-title';
    title.textContent = order.address || 'Без адреса';

    const meta = document.createElement('div');
    meta.className = 'history-meta';

    if (order.amount !== null) {
      const amount = document.createElement('span');
      amount.textContent = `Сумма: ${formatCurrency(order.amount)}`;
      meta.appendChild(amount);
    }

    if (order.cancelledAt) {
      const cancelledAt = document.createElement('span');
      cancelledAt.textContent = `Отменён: ${formatTime(order.cancelledAt)}`;
      meta.appendChild(cancelledAt);
    }

    item.appendChild(title);
    if (meta.childElementCount > 0) {
      item.appendChild(meta);
    }

    const detailText = order.notes || order.rawText;
    if (detailText) {
      const notes = document.createElement('div');
      notes.className = 'history-notes';
      notes.textContent = detailText;
      item.appendChild(notes);
    }

    cancelledOrdersList.appendChild(item);
  });
}

function handleActiveOrderClick(event) {
  const target = event.target.closest('[data-action]');
  if (!target) {
    return;
  }
  const card = target.closest('.order-card');
  if (!card) {
    return;
  }
  const orderId = card.dataset.id;
  const action = target.dataset.action;

  if (!orderId || !action) {
    return;
  }

  if (action === 'call') {
    if (target.classList.contains('disabled')) {
      event.preventDefault();
    }
    return;
  }

  if (action === 'navigate') {
    if (target.classList.contains('disabled')) {
      event.preventDefault();
      return;
    }
    const fallback = target.dataset.fallback;
    if (fallback) {
      setTimeout(() => {
        window.open(fallback, '_blank', 'noopener');
      }, 800);
    }
    return;
  }

  event.preventDefault();

  switch (action) {
    case 'move-up':
      moveOrder(orderId, -1);
      break;
    case 'move-down':
      moveOrder(orderId, 1);
      break;
    case 'arrive':
      toggleArrived(orderId);
      break;
    case 'postpone':
      postponeOrder(orderId);
      break;
    case 'cancel':
      cancelOrder(orderId);
      break;
    case 'edit':
      editOrder(orderId);
      break;
    case 'complete':
      openCompletionDialog(orderId);
      break;
    default:
      break;
  }
}

function moveOrder(orderId, direction) {
  const index = state.activeOrders.findIndex((order) => order.id === orderId);
  if (index === -1) {
    return;
  }
  const newIndex = index + direction;
  if (newIndex < 0 || newIndex >= state.activeOrders.length) {
    return;
  }
  const [order] = state.activeOrders.splice(index, 1);
  state.activeOrders.splice(newIndex, 0, order);
  persistState();
  renderActiveOrders();
}

function toggleArrived(orderId) {
  const order = state.activeOrders.find((item) => item.id === orderId);
  if (!order) {
    return;
  }
  if (order.status === 'arrived') {
    order.status = 'pending';
    order.arrivedAt = null;
  } else {
    order.status = 'arrived';
    order.arrivedAt = Date.now();
  }
  persistState();
  renderActiveOrders();
}

function postponeOrder(orderId) {
  const index = state.activeOrders.findIndex((order) => order.id === orderId);
  if (index === -1) {
    return;
  }
  const [order] = state.activeOrders.splice(index, 1);
  order.status = 'postponed';
  order.postponedCount = (order.postponedCount || 0) + 1;
  order.arrivedAt = null;
  state.activeOrders.push(order);
  persistState();
  renderActiveOrders();
}

function cancelOrder(orderId) {
  const index = state.activeOrders.findIndex((order) => order.id === orderId);
  if (index === -1) {
    return;
  }
  const order = state.activeOrders[index];
  const confirmed = window.confirm('Отменить этот заказ?');
  if (!confirmed) {
    return;
  }
  const [removed] = state.activeOrders.splice(index, 1);
  removed.status = 'cancelled';
  removed.cancelledAt = Date.now();
  state.cancelledOrders.push(removed);
  persistState();
  renderActiveOrders();
  renderCompletedOrders();
}

function editOrder(orderId) {
  const order = state.activeOrders.find((item) => item.id === orderId);
  if (!order) {
    return;
  }
  loadOrderIntoForm(order);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function openCompletionDialog(orderId) {
  const order = state.activeOrders.find((item) => item.id === orderId);
  if (!order) {
    return;
  }
  completionOrderId = orderId;
  completeAddress.textContent = order.address || 'Без адреса';
  completeMethod.value = order.payment?.method || 'cash';
  const amountValue = order.confirmedAmount ?? order.amount;
  completeAmount.value = amountValue !== null && amountValue !== undefined ? String(amountValue) : '';
  completeOverlay.hidden = false;
  completeConfirm.focus();
}

function closeCompletionDialog() {
  completionOrderId = null;
  completeOverlay.hidden = true;
  completeAmount.value = '';
}

function finalizeOrder() {
  if (!completionOrderId) {
    return;
  }
  const orderIndex = state.activeOrders.findIndex((item) => item.id === completionOrderId);
  if (orderIndex === -1) {
    closeCompletionDialog();
    return;
  }
  const order = state.activeOrders[orderIndex];
  const method = completeMethod.value || 'cash';
  let amount = parseAmount(completeAmount.value);
  if (amount === null) {
    amount = order.amount;
  }
  if (amount === null) {
    completeAmount.setCustomValidity('Укажите сумму оплаты');
    completeAmount.reportValidity();
    completeAmount.setCustomValidity('');
    return;
  }

  order.confirmedAmount = amount;
  order.completedAt = Date.now();
  order.payment = {
    method,
    amount,
  };
  order.status = 'completed';

  state.activeOrders.splice(orderIndex, 1);
  state.completedOrders.push(order);
  persistState();
  closeCompletionDialog();
  renderActiveOrders();
  renderCompletedOrders();
}

function finishDay() {
  const confirmed = window.confirm('Очистить все данные за день?');
  if (!confirmed) {
    return;
  }
  state = getDefaultState();
  persistState();
  renderActiveOrders();
  renderCompletedOrders();
  resetForm();
  updateStatus('Данные дня очищены', 'muted');
}

function updateCallAction() {
  const normalized = normalizePhone(phoneInput.value);
  if (normalized) {
    const digits = normalized.replace('+', '');
    callButton.href = `tel:+${digits}`;
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

[startRouteButton].forEach((anchor) => {
  anchor.addEventListener('click', (event) => {
    if (anchor.classList.contains('disabled')) {
      event.preventDefault();
      return;
    }
    const fallback = anchor.dataset.fallback;
    if (fallback) {
      setTimeout(() => {
        window.open(fallback, '_blank', 'noopener');
      }, 800);
    }
  });
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

phoneInput.addEventListener('blur', () => {
  const normalized = normalizePhone(phoneInput.value);
  phoneInput.value = normalized ? formatPhone(normalized) : phoneInput.value.trim();
  updateCallAction();
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

saveOrderButton.addEventListener('click', () => {
  saveCurrentOrder();
});

resetFormButton.addEventListener('click', () => {
  resetForm({ keepTranscript: false });
  updateStatus('Форма очищена', 'muted');
});

activeOrdersList.addEventListener('click', handleActiveOrderClick);

completeCancel.addEventListener('click', () => {
  closeCompletionDialog();
});

completeClose.addEventListener('click', () => {
  closeCompletionDialog();
});

completeConfirm.addEventListener('click', () => {
  finalizeOrder();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !completeOverlay.hidden) {
    closeCompletionDialog();
  }
});

finishDayButton.addEventListener('click', () => {
  finishDay();
});

function initialize() {
  renderActiveOrders();
  renderCompletedOrders();
  updateCallAction();
  updateRouteAction();
  setTranscript('');
  updateStatus('Готов к записи', 'idle');
}

initialize();
