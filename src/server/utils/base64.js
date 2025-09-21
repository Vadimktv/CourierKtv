function decodeDataUrl(input) {
  if (!input || typeof input !== 'string') {
    return null;
  }

  const trimmed = input.trim();
  const dataUrlMatch = /^data:([^;]+);base64,(.*)$/i.exec(trimmed);
  try {
    if (dataUrlMatch) {
      const mimeType = dataUrlMatch[1];
      const base64 = dataUrlMatch[2];
      return {
        buffer: Buffer.from(base64, 'base64'),
        mimeType,
      };
    }

    return {
      buffer: Buffer.from(trimmed, 'base64'),
      mimeType: null,
    };
  } catch (error) {
    return null;
  }
}

function ensureMimeType(candidate, fallback) {
  if (candidate && typeof candidate === 'string' && candidate.length > 0) {
    return candidate;
  }
  return fallback || 'application/octet-stream';
}

module.exports = {
  decodeDataUrl,
  ensureMimeType,
};
