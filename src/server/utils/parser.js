const PHONE_REGEX = /(?:\+?7|8)[\s\-()]*\d{3}[\s\-()]*\d{3}[\s\-()]*\d{2}[\s\-()]*\d{2}/g;
const GENERIC_AMOUNT_REGEX = /(\d+[\s\d]*[\.,]?\d*)\s*(?:руб(?:лей|ля|\b)|₽|р\b)/i;
const LABELED_AMOUNT_REGEX = /(сумма|итого|к\s*оплате|получилось|всего)[^\d]*(\d+[\s\d]*[\.,]?\d*)/i;

function parseCourierText(text) {
  if (!text || typeof text !== 'string') {
    return {
      normalizedText: '',
      address: null,
      amount: null,
      phone: null,
      warnings: ['Не удалось распознать текст'],
    };
  }

  const normalizedWhitespace = text.replace(/\s+/g, ' ').trim();
  const lower = normalizedWhitespace.toLowerCase();

  const phone = extractPhone(normalizedWhitespace);
  const amount = extractAmount(normalizedWhitespace);
  const address = extractAddress(normalizedWhitespace, lower);

  const warnings = [];
  if (!address) {
    warnings.push('Адрес не найден в тексте');
  }
  if (amount === null) {
    warnings.push('Сумма не найдена в тексте');
  }
  if (!phone) {
    warnings.push('Телефон не найден в тексте');
  }

  return {
    normalizedText: normalizedWhitespace,
    address,
    amount,
    phone,
    warnings,
  };
}

function extractPhone(text) {
  const matches = [...text.matchAll(PHONE_REGEX)];
  if (matches.length === 0) {
    return null;
  }

  for (const match of matches) {
    const digits = match[0].replace(/\D/g, '');
    const normalized = normalizePhoneDigits(digits);
    if (normalized) {
      return normalized;
    }
  }
  return null;
}

function normalizePhoneDigits(digits) {
  if (!digits) {
    return null;
  }
  let cleaned = digits;
  if (cleaned.length === 11 && cleaned.startsWith('8')) {
    cleaned = `7${cleaned.slice(1)}`;
  }
  if (cleaned.length === 10) {
    cleaned = `7${cleaned}`;
  }
  if (cleaned.length === 11 && cleaned.startsWith('7')) {
    return `+7${cleaned.slice(1)}`;
  }
  return null;
}

function extractAmount(text) {
  const labeledMatch = LABELED_AMOUNT_REGEX.exec(text.toLowerCase());
  if (labeledMatch) {
    return toNumber(labeledMatch[2]);
  }

  const genericMatch = GENERIC_AMOUNT_REGEX.exec(text.toLowerCase());
  if (genericMatch) {
    return toNumber(genericMatch[1]);
  }

  const digits = text.replace(/[^0-9]/g, '');
  if (digits.length >= 2 && digits.length <= 6) {
    return toNumber(digits);
  }

  return null;
}

function toNumber(raw) {
  if (!raw) {
    return null;
  }
  const normalized = raw.replace(/\s+/g, '').replace(',', '.');
  const value = Number.parseFloat(normalized);
  if (Number.isNaN(value)) {
    return null;
  }
  return Number.isInteger(value) ? value : Number(value.toFixed(2));
}

function extractAddress(original, lower) {
  let endIndex = original.length;
  const sumIndex = lower.indexOf('сумм');
  const phoneIndex = lower.indexOf('тел');
  if (sumIndex >= 0) {
    endIndex = Math.min(endIndex, sumIndex);
  }
  if (phoneIndex >= 0) {
    endIndex = Math.min(endIndex, phoneIndex);
  }

  let startIndex = 0;
  const addressMatch = /(?:адрес|по адресу)[:\s-]*/i.exec(original);
  if (addressMatch) {
    startIndex = addressMatch.index + addressMatch[0].length;
  }

  const segment = original.slice(startIndex, endIndex).trim();
  const cleaned = segment.replace(/\s{2,}/g, ' ').replace(/[,:;\-\s]+$/, '').trim();

  if (!cleaned) {
    return null;
  }

  return capitalizeFirst(cleaned);
}

function capitalizeFirst(value) {
  if (!value) {
    return value;
  }
  return value
    .split(' ')
    .map((word) => {
      if (!word) {
        return word;
      }
      return word[0].toUpperCase() + word.slice(1);
    })
    .join(' ');
}

module.exports = {
  parseCourierText,
  normalizePhoneDigits,
};
