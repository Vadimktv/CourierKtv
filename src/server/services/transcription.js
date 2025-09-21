const { ensureMimeType } = require('../utils/base64');
const { parseCourierText } = require('../utils/parser');

const DEFAULT_MODEL = 'whisper-1';

async function transcribeAudio(buffer, providedMime) {
  const mimeType = ensureMimeType(providedMime, 'audio/webm');

  if (!buffer || buffer.length === 0) {
    throw new Error('Пустой аудиофайл');
  }

  const text = await runWhisper(buffer, mimeType);
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

async function runWhisper(buffer, mimeType) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return process.env.MOCK_TRANSCRIBE_TEXT || '';
  }

  const model = process.env.OPENAI_MODEL || DEFAULT_MODEL;
  const fileName = `audio-${Date.now()}.${mimeType.split('/')[1] || 'webm'}`;

  const form = new FormData();
  form.append('model', model);
  form.append('response_format', 'json');
  form.append('language', 'ru');
  form.append('file', new Blob([buffer], { type: mimeType }), fileName);

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: form,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ошибка распознавания речи: ${errorText}`);
  }

  const payload = await response.json();
  return payload.text || '';
}

module.exports = {
  transcribeAudio,
};
