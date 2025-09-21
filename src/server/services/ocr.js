const { ensureMimeType } = require('../utils/base64');
const { parseCourierText } = require('../utils/parser');

async function recognizeReceipt(buffer, providedMime) {
  const mimeType = ensureMimeType(providedMime, 'image/jpeg');
  if (!mimeType.startsWith('image/')) {
    throw new Error('Поддерживаются только изображения');
  }

  if (!buffer || buffer.length === 0) {
    throw new Error('Пустое изображение');
  }

  const text = await runVision(buffer, mimeType);
  const parsed = parseCourierText(text);
  return {
    text,
    normalizedText: parsed.normalizedText,
    address: parsed.address,
    amount: parsed.amount,
    phone: parsed.phone,
    warnings: parsed.warnings,
  };
}

async function runVision(buffer, mimeType) {
  const apiKey = process.env.GOOGLE_VISION_API_KEY;
  if (!apiKey) {
    return process.env.MOCK_OCR_TEXT || '';
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

  const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Ошибка OCR: ${message}`);
  }

  const payload = await response.json();
  const annotation = payload.responses?.[0];
  const text = annotation?.fullTextAnnotation?.text
    || annotation?.textAnnotations?.[0]?.description
    || '';
  return text.trim();
}

module.exports = {
  recognizeReceipt,
};
