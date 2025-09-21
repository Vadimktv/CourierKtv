const PHONE_REGEX = /(\+7|8)\d{10}/;
const AMOUNT_REGEX = /(\d{2,6})\s?(?:р|руб|₽)/i;
const ADDRESS_REGEX = /^(.+?)(?=\sсумма|\sтелефон|$)/i;

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
  if (!normalizedWhitespace) {
    return {
      normalizedText: '',
      address: null,
      amount: null,
      phone: null,
      warnings: ['Не удалось распознать текст'],
    };
  }

  const phone = extractPhone(normalizedWhitespace);
  const amount = extractAmount(normalizedWhitespace);
  const address = extractAddress(normalizedWhitespace);

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
  if (!text) {
    return null;
  }

  const compact = text.replace(/[\s\-()]/g, '');
  const match = compact.match(PHONE_REGEX);
  if (!match) {
    return null;
  }

  return normalizePhoneDigits(match[0]);
}

function normalizePhoneDigits(digits) {
  if (!digits) {
    return null;
  }
  const onlyDigits = String(digits).replace(/\D/g, '');
  if (!onlyDigits) {
    return null;
  }

  let normalized = onlyDigits;
  if (normalized.length === 11 && normalized.startsWith('8')) {
    normalized = `7${normalized.slice(1)}`;
  }
  if (normalized.length === 10) {
    normalized = `7${normalized}`;
  }
  if (normalized.length !== 11 || !normalized.startsWith('7')) {
    return null;
  }

  return `+${normalized}`;
}

function extractAmount(text) {
  if (!text) {
    return null;
  }

  const compact = text.replace(/(\d)\s+(?=\d)/g, '$1');
  const match = compact.match(AMOUNT_REGEX);
  if (!match) {
    return null;
  }

  const numeric = match[1].replace(/\s+/g, '');
  const value = Number.parseInt(numeric, 10);
  if (Number.isNaN(value)) {
    return null;
  }

  return value;
}

function extractAddress(text) {
  if (!text) {
    return null;
  }

  const match = text.match(ADDRESS_REGEX);
  if (!match) {
    return null;
  }

  let address = match[1] || '';
  address = address.replace(/^(?:адрес|по адресу)[\s:,-]*/i, '');
  address = cleanAddress(address);

  if (!address) {
    return null;
  }

  return capitalizeWords(address);
}

function cleanAddress(value) {
  return String(value)
    .replace(/\s+/g, ' ')
    .replace(/\s*,\s*/g, ', ')
    .replace(/,+/g, ',')
    .replace(/^[,\.\s]+/g, '')
    .replace(/[\s,.;:-]+$/g, '')
    .trim();
}

function capitalizeWords(value) {
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
