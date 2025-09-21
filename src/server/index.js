const path = require('path');
const express = require('./framework/mini-express');
const { decodeDataUrl } = require('./utils/base64');
const { loadEnvironment } = require('./utils/load-env');
const { transcribeAudio } = require('./services/transcription');
const { recognizeReceipt } = require('./services/ocr');

loadEnvironment();

const app = express();
const PORT = Number.parseInt(process.env.PORT, 10) || 3000;

app.use(express.json({ limit: '20mb' }));

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  next();
});

app.post('/api/transcribe', async (req, res) => {
  try {
    const body = req.body || {};
    const audioPayload = body.audio;
    if (!audioPayload) {
      res.status(400).json({ error: 'Не передан аудиофайл' });
      return;
    }

    const decoded = decodeDataUrl(audioPayload);
    if (!decoded) {
      res.status(400).json({ error: 'Некорректный формат аудио' });
      return;
    }

    const result = await transcribeAudio(decoded.buffer, decoded.mimeType);
    res.json({
      success: true,
      source: 'audio',
      text: result.text,
      normalizedText: result.normalizedText,
      data: {
        address: result.address,
        amount: result.amount,
        phone: result.phone,
      },
      warnings: result.warnings,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/ocr', async (req, res) => {
  try {
    const body = req.body || {};
    const imagePayload = body.image;
    if (!imagePayload) {
      res.status(400).json({ error: 'Не передано изображение' });
      return;
    }

    const decoded = decodeDataUrl(imagePayload);
    if (!decoded) {
      res.status(400).json({ error: 'Некорректное изображение' });
      return;
    }

    const result = await recognizeReceipt(decoded.buffer, decoded.mimeType);
    res.json({
      success: true,
      source: 'ocr',
      text: result.text,
      normalizedText: result.normalizedText,
      data: {
        address: result.address,
        amount: result.amount,
        phone: result.phone,
      },
      warnings: result.warnings,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const publicDir = path.resolve(__dirname, '../public');
app.use(express.static(publicDir));

app.listen(PORT, () => {
  console.log(`Courier assistant server listening on http://localhost:${PORT}`);
});
