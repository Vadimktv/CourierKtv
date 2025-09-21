const { ensureMimeType } = require('../utils/base64');
const { parseCourierText } = require('../utils/parser');

const OCR_SPACE_ENDPOINT = 'https://api.ocr.space/parse/image';

async function recognizeReceipt(buffer, providedMime) {
  let mimeType = ensureMimeType(providedMime, 'image/jpeg');
  if (!mimeType || typeof mimeType !== 'string') {
    mimeType = 'image/jpeg';
  }

  const normalizedMime = mimeType.toLowerCase();
  if (!normalizedMime.startsWith('image/')) {
    throw new Error('Поддерживаются только изображения');
  }

  if (!buffer || buffer.length === 0) {
    throw new Error('Пустое изображение');
  }

  const { text: recognizedText, warnings: recognitionWarnings } = await recognizeTextWithFallback(buffer, normalizedMime);
  const trimmedText = typeof recognizedText === 'string' ? recognizedText.trim() : '';
  const parsed = parseCourierText(trimmedText);
  const combinedWarnings = mergeWarnings(recognitionWarnings, parsed.warnings);

  return {
    text: trimmedText,
    normalizedText: parsed.normalizedText,
    address: parsed.address,
    amount: parsed.amount,
    phone: parsed.phone,
    warnings: combinedWarnings,
  };
}

async function recognizeTextWithFallback(buffer, mimeType) {
  const warnings = [];

  const primary = await tryGoogleVision(buffer, mimeType);
  pushWarning(warnings, primary.warning);

  let text = primary.text || '';

  if (!text) {
    const fallback = await tryOcrSpace(buffer, mimeType);
    pushWarning(warnings, fallback.warning);
    if (fallback.text) {
      text = fallback.text;
      pushWarning(warnings, 'Использован резервный сервис распознавания OCR.space');
    }
  }

  if (!text) {
    const mockText = typeof process.env.MOCK_OCR_TEXT === 'string' ? process.env.MOCK_OCR_TEXT.trim() : '';
    if (mockText) {
      text = mockText;
      pushWarning(warnings, 'Использован текст из переменной MOCK_OCR_TEXT');
    }
  }

  return {
    text: typeof text === 'string' ? text.trim() : '',
    warnings,
  };
}

async function tryGoogleVision(buffer, mimeType) {
  const apiKey = process.env.GOOGLE_VISION_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      text: '',
      warning: 'Google Vision API недоступен, используется резервное распознавание',
    };
  }

  const body = {
    requests: [
      {
        image: { content: buffer.toString('base64') },
        features: [{ type: 'DOCUMENT_TEXT_DETECTION' }],
        imageContext: { languageHints: ['ru'] },
      },
    ],
  };

  try {
    const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const message = await response.text();
      console.error('Google Vision OCR error:', message);
      return {
        ok: false,
        text: '',
        warning: 'Не удалось получить ответ от Google Vision',
      };
    }

    const payload = await response.json();
    const annotation = payload.responses?.[0];
    const text = annotation?.fullTextAnnotation?.text
      || annotation?.textAnnotations?.[0]?.description
      || '';

    return {
      ok: true,
      text: typeof text === 'string' ? text.trim() : '',
      warning: null,
    };
  } catch (error) {
    console.error('Google Vision OCR request failed:', error);
    return {
      ok: false,
      text: '',
      warning: 'Ошибка запроса к Google Vision',
    };
  }
}

async function tryOcrSpace(buffer, mimeType) {
  const apiKey = process.env.OCR_SPACE_API_KEY || 'helloworld';
  const params = new URLSearchParams();
  params.set('language', 'rus');
  params.set('scale', 'true');
  params.set('detectOrientation', 'true');
  params.set('isOverlayRequired', 'false');
  params.set('OCREngine', '2');
  params.set('base64Image', `data:${mimeType};base64,${buffer.toString('base64')}`);

  try {
    const response = await fetch(OCR_SPACE_ENDPOINT, {
      method: 'POST',
      headers: {
        apikey: apiKey,
      },
      body: params,
    });

    if (!response.ok) {
      const message = await response.text();
      console.error('OCR.space error response:', message);
      return {
        ok: false,
        text: '',
        warning: 'Резервный сервис OCR вернул ошибку',
      };
    }

    const payload = await response.json();
    if (payload?.IsErroredOnProcessing) {
      const errors = []
        .concat(payload?.ErrorMessage || [])
        .concat(payload?.ErrorDetails || [])
        .filter(Boolean)
        .join('; ');
      return {
        ok: false,
        text: '',
        warning: errors || 'Резервный сервис OCR не смог обработать изображение',
      };
    }

    const parsedText = (payload?.ParsedResults || [])
      .map((item) => item?.ParsedText || '')
      .join('\n')
      .trim();

    if (!parsedText) {
      return {
        ok: false,
        text: '',
        warning: 'Резервный сервис OCR не распознал текст',
      };
    }

    return {
      ok: true,
      text: parsedText,
      warning: null,
    };
  } catch (error) {
    console.error('OCR.space request failed:', error);
    return {
      ok: false,
      text: '',
      warning: 'Не удалось подключиться к резервному сервису OCR',
    };
  }
}

function pushWarning(list, message) {
  if (!message) {
    return;
  }
  if (!Array.isArray(list)) {
    return;
  }
  if (!list.includes(message)) {
    list.push(message);
  }
}

function mergeWarnings(...lists) {
  const merged = [];
  const seen = new Set();

  lists.forEach((list) => {
    if (!Array.isArray(list)) {
      return;
    }
    list.forEach((item) => {
      if (!item || seen.has(item)) {
        return;
      }
      seen.add(item);
      merged.push(item);
    });
  });

  return merged;
}

module.exports = {
  recognizeReceipt,
};
