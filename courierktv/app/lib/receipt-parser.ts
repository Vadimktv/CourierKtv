import { detectHandwrittenSum } from '@/lib/utils';
import type {
  ReceiptAnalysisResult,
  ReceiptDetectedFields,
} from '@/lib/types';

const ADDRESS_KEYWORDS = [
  'ул',
  'улица',
  'пр',
  'пр-т',
  'просп',
  'проспект',
  'дом',
  'д.',
  'корп',
  'к.',
  'строение',
  'стр.',
  'лит',
  'мкр',
  'микрорайон',
  'кв',
  'квартира',
  'офис',
  'подъезд',
  'этаж',
  'город',
  'г.',
  'пос',
  'посёлок',
];

const RESTAURANT_STOP_WORDS = [
  'кассов',
  'фиск',
  'покуп',
  'оплат',
  'адрес',
  'тел',
  'инн',
  'огрн',
  'чек',
  'смена',
  'пробит',
  'поставщик',
  'пользовател',
  'дата',
  'время',
  'сайт',
  'состав',
  'операц',
  'сумма',
  'итог',
  'итого',
];

const PAYMENT_KEYWORDS: Record<string, RegExp[]> = {
  cash: [
    /налич/i,
    /нал\.?/i,
    /оплата\s+курьеру/i,
    /выдать\s+сдачу/i,
    /оплатил\s+налом/i,
  ],
  card: [
    /карта/i,
    /банковск.*кар/i,
    /оплачено\s+картой/i,
    /безнал/i,
    /visa/i,
    /mastercard/i,
    /mir/i,
  ],
  transfer: [
    /перевод/i,
    /сбербанк\s*онлайн/i,
    /sbp/i,
    /быстрых\s+платежей/i,
    /по\s+номеру\s+тел/i,
    /по\s+реквизитам/i,
  ],
  terminal: [
    /терминал/i,
    /pos/i,
    /пин.?пад/i,
    /эквайр/i,
  ],
};

const FIELD_LABELS: Array<keyof ReceiptDetectedFields> = [
  'restaurant',
  'fullAddress',
  'phoneNumber',
  'totalAmount',
  'paymentMethod',
];

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function cleanupLine(line: string): string {
  return line.replace(/[«»"'`]/g, '').trim();
}

function toNumber(value: string): number | null {
  const normalized = value.replace(/\s+/g, '').replace(',', '.');
  const parsed = parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function extractRestaurant(lines: string[]): string {
  for (const line of lines) {
    if (line.length < 2 || line.length > 60) {
      continue;
    }

    if (!/[A-Za-zА-Яа-я]/.test(line)) {
      continue;
    }

    if (/\d{4,}/.test(line)) {
      continue;
    }

    const lower = line.toLowerCase();
    if (RESTAURANT_STOP_WORDS.some((word) => lower.includes(word))) {
      continue;
    }

    // Avoid picking addresses as restaurant names
    if (ADDRESS_KEYWORDS.some((keyword) => lower.includes(keyword))) {
      continue;
    }

    return line;
  }

  return '';
}

function extractAddress(lines: string[]): string {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lower = line.toLowerCase();

    if (!ADDRESS_KEYWORDS.some((keyword) => lower.includes(keyword))) {
      continue;
    }

    let candidate = line;
    let nextIndex = i + 1;

    while (nextIndex < lines.length) {
      const nextLine = lines[nextIndex];
      const nextLower = nextLine.toLowerCase();
      if (/^(дом|д\.|корп|к\.|стр\.|строение|лит|литера|кв|квартира|офис|подъезд|этаж|мкр|микрорайон|пос|пос\.)/.test(nextLower)) {
        candidate = `${candidate}, ${nextLine}`;
        nextIndex++;
      } else {
        break;
      }
    }

    return candidate;
  }

  return '';
}

function extractPhone(text: string): { phoneNumber: string; additionalNumber?: string } {
  const normalized = text.replace(/\u0000/g, ' ').replace(/\s+/g, ' ');
  const regex = /(\+?7|8)(?:[\s-]*\(?\d{3}\)?[\s-]*)\d{3}[\s-]*\d{2}[\s-]*\d{2}(?:[,\s-]*(?:доб\.?|ext\.?|#)?\s*(\d{2,6}))?/i;
  const match = normalized.match(regex);

  if (!match) {
    return { phoneNumber: '' };
  }

  let raw = match[0];
  let additional: string | undefined = undefined;

  if (raw.includes(',')) {
    const parts = raw.split(',');
    raw = parts[0];
    if (parts[1]) {
      additional = parts[1].replace(/[^\d]/g, '');
    }
  }

  if (match[2] && !additional) {
    additional = match[2].replace(/[^\d]/g, '');
  }

  let digits = raw.replace(/[^\d]/g, '');

  if (digits.length === 11 && digits.startsWith('8')) {
    digits = `7${digits.slice(1)}`;
  }

  if (digits.length === 11 && digits.startsWith('7')) {
    return {
      phoneNumber: `+${digits}`,
      additionalNumber: additional,
    };
  }

  if (digits.length === 10) {
    return {
      phoneNumber: `+7${digits}`,
      additionalNumber: additional,
    };
  }

  return {
    phoneNumber: digits ? `+${digits}` : '',
    additionalNumber: additional,
  };
}

function extractTotalAmount(lines: string[]): number | null {
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i];
    const keywordMatch = line.match(/(итог|итого|к\s*оплате|всего|сумма|total|amount)[^\d]*([\d\s]+[\d.,]*)/i);
    if (keywordMatch) {
      const value = toNumber(keywordMatch[2]);
      if (value !== null) {
        return value;
      }
    }

    const currencyMatch = line.match(/([\d\s]+[\d.,]*)\s*(?:руб|р\.?|rub|₽)/i);
    if (currencyMatch) {
      const value = toNumber(currencyMatch[1]);
      if (value !== null) {
        return value;
      }
    }
  }

  return null;
}

function detectPaymentMethod(text: string): string {
  const normalized = text.toLowerCase();
  const scores: Record<string, number> = {
    cash: 0,
    card: 0,
    transfer: 0,
    terminal: 0,
  };

  for (const [method, patterns] of Object.entries(PAYMENT_KEYWORDS)) {
    for (const pattern of patterns) {
      if (pattern.test(normalized)) {
        scores[method] += 1;
      }
    }
  }

  // Terminal usually implies card payment as well
  if (scores.terminal > 0) {
    scores.card += 0.5;
  }

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [method, value] = sorted[0];

  return value > 0 ? method : '';
}

function extractDate(text: string): string | undefined {
  const match = text.match(/(\d{2}[.\/-]\d{2}[.\/-]\d{2,4})/);
  if (!match) {
    return undefined;
  }

  const [day, month, year] = match[1].split(/[.\/-]/);
  if (!day || !month || !year) {
    return undefined;
  }

  const normalizedYear = year.length === 2 ? `20${year}` : year;

  return `${normalizedYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

function extractTime(text: string): string | undefined {
  const match = text.match(/(\d{2}:\d{2}(?::\d{2})?)/);
  return match ? match[1] : undefined;
}

export function analyzeReceiptText(rawText: string): ReceiptAnalysisResult {
  const sanitized = rawText.replace(/\r/g, '\n');
  const lines = sanitized
    .split(/\n+/)
    .map((line) => cleanupLine(line))
    .filter(Boolean);

  const restaurant = extractRestaurant(lines);
  const fullAddress = extractAddress(lines);
  const phoneData = extractPhone(sanitized);
  const totalAmount = extractTotalAmount(lines);
  const paymentMethod = detectPaymentMethod(sanitized);
  const orderDate = extractDate(sanitized);
  const orderTime = extractTime(sanitized);
  const hasHandwrittenSum = detectHandwrittenSum(sanitized);

  const detectedFields: ReceiptDetectedFields = {
    restaurant: Boolean(restaurant),
    fullAddress: Boolean(fullAddress),
    phoneNumber: Boolean(phoneData.phoneNumber),
    totalAmount: totalAmount !== null,
    paymentMethod: Boolean(paymentMethod),
  };

  const warnings: string[] = [];

  if (!fullAddress) {
    warnings.push('Не удалось определить адрес доставки. Проверьте поле вручную.');
  }

  if (!phoneData.phoneNumber) {
    warnings.push('Номер телефона клиента не найден. Добавьте его вручную.');
  }

  if (totalAmount === null) {
    warnings.push('Сумма заказа не распознана автоматически. Укажите сумму вручную.');
  }

  if (!paymentMethod) {
    warnings.push('Способ оплаты не найден в тексте чека. Выберите подходящий вариант.');
  }

  if (hasHandwrittenSum) {
    warnings.push('Обнаружены признаки рукописной суммы. Проверьте корректность данных.');
  }

  const suggestions: string[] = [];

  if (phoneData.additionalNumber) {
    suggestions.push('Добавочный номер был найден в чеке и добавлен автоматически.');
  }

  if (orderDate) {
    suggestions.push(`Дата заказа распознана как ${orderDate.split('-').reverse().join('.')}.`);
  }

  if (orderTime) {
    suggestions.push(`Время заказа распознано как ${orderTime}.`);
  }

  const confidence = FIELD_LABELS.reduce((acc, field) => acc + (detectedFields[field] ? 1 : 0), 0) /
    FIELD_LABELS.length;

  return {
    restaurant,
    fullAddress,
    phoneNumber: phoneData.phoneNumber,
    additionalNumber: phoneData.additionalNumber,
    totalAmount,
    paymentMethod,
    hasHandwrittenSum,
    orderDate,
    orderTime,
    rawText: normalizeWhitespace(sanitized),
    warnings,
    suggestions,
    confidence,
    detectedFields,
  };
}
