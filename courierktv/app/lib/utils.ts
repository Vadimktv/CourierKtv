
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDuration(ms: number): string {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((ms % (1000 * 60)) / 1000);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}

export function parsePhoneNumber(phone: string): { main: string; additional?: string } {
  const match = phone.match(/^(\+?\d+)(?:,(\d+))?$/);
  if (match) {
    return {
      main: match[1] || '',
      additional: match[2] || undefined,
    };
  }
  return { main: phone };
}

export function detectHandwrittenSum(text: string): boolean {
  // Simple heuristic to detect handwritten sums
  // This would be replaced with actual OCR confidence analysis
  const hasIrregularSpacing = /\d\s+\d/.test(text);
  const hasUncommonChars = /[~`!@#$%^&*()_+=\[\]{}|;':",./<>?\\]/.test(text);
  const hasLowConfidenceIndicators = /[?]/.test(text);

  return hasIrregularSpacing || hasUncommonChars || hasLowConfidenceIndicators;
}

const CURRENCY_PATTERN = /(\d[\d\s]*[.,]?\d*)\s*(?:₽|руб(?:\.|ля|лей)?|р\b|тенге|тг|сом|сомони|kzt|₸|usd|\$|eur|€)/gi;
const AMOUNT_KEYWORD_PATTERN = /(?:сумма|стоимость|к оплате|оплата|итог(?:овая)?|получить)\s*(?:составляет|будет|=|:)?\s*\d[\d\s]*(?:[.,]\d+)?/gi;
const ADDRESS_QUALIFIER_PATTERN = /(корп|корпус|кв|квартира|подъезд|пд|под\.|этаж|стр|строение|литер|офис|пом|склад|дом)\s*$/i;
const STREET_KEYWORDS = /(ул\.?|улица|просп\.?|проспект|пер\.?|переулок|шоссе|ш\.?|площадь|пл\.?|наб\.?|набережная|бульвар|бул\.?|тракт|проезд|микрорайон|мкр\.?|аллея|дорога)/i;

function tidyAddressText(value: string): string {
  if (!value) return '';
  let result = value.replace(/\s{2,}/g, ' ').trim();
  const leadingPatterns = [
    /^(?:по\s+адресу|адрес(?:\s+доставки)?|адрес|куда ехать|куда везти|куда|ехать(?: в| к)?|везти(?: в)?|доставка(?: в)?|по направлению)\s+/i,
    /^(?:нужно\s+ехать|нужно\s+везти|надо\s+ехать|надо\s+везти)\s+/i,
  ];
  let changed = true;
  while (changed) {
    changed = false;
    for (const pattern of leadingPatterns) {
      if (pattern.test(result)) {
        result = result.replace(pattern, '').trim();
        changed = true;
      }
    }
  }
  result = result.replace(/^(?:в|к)\s+/i, '');
  result = result.replace(/[.,;]+$/, ' ').replace(/\s{2,}/g, ' ').trim();
  return result;
}

function prepareAddressForParsing(address: string): string {
  let result = tidyAddressText(address);
  result = result.replace(CURRENCY_PATTERN, ' ');
  result = result.replace(AMOUNT_KEYWORD_PATTERN, ' ');

  result = result
    .replace(/\s+(корп(?:ус)?\.?\s*[A-Za-zА-Яа-я0-9/-]+)/gi, ', $1')
    .replace(/\s+(строение\.?\s*[A-Za-zА-Яа-я0-9/-]+)/gi, ', $1')
    .replace(/\s+(стр\.?\s*[A-Za-zА-Яа-я0-9/-]+)/gi, ', $1')
    .replace(/\s+(подъезд\.?\s*[A-Za-zА-Яа-я0-9/-]+)/gi, ', $1')
    .replace(/\s+(пд\.?\s*[A-Za-zА-Яа-я0-9/-]+)/gi, ', $1')
    .replace(/\s+(этаж\.?\s*\d+)/gi, ', $1')
    .replace(/\s+(эт\.?\s*\d+)/gi, ', $1')
    .replace(/\s+(кв\.?\s*[A-Za-zА-Яа-я0-9/-]+)/gi, ', $1')
    .replace(/\s+(квартира\s*[A-Za-zА-Яа-я0-9/-]+)/gi, ', $1')
    .replace(/\s+(ап\.?\s*[A-Za-zА-Яа-я0-9/-]+)/gi, ', $1')
    .replace(/\s+(оф\.?\s*[A-Za-zА-Яа-я0-9/-]+)/gi, ', $1')
    .replace(/\s+(офис\s*[A-Za-zА-Яа-я0-9/-]+)/gi, ', $1');

  result = tidyAddressText(result);

  const trailing = result.match(/(\d{3,}(?:[.,]\d+)?)(?=\s*$)/);
  if (trailing && typeof trailing.index === 'number') {
    const start = trailing.index;
    const before = result.slice(0, start).trim();
    if (/\d/.test(before) && !ADDRESS_QUALIFIER_PATTERN.test(before)) {
      result = before;
    }
  }

  return tidyAddressText(result);
}

export function extractAddressComponents(fullAddress: string) {
  const defaults = {
    street: '',
    houseNumber: '',
    building: '',
    entrance: '',
    floor: '',
    apartment: '',
  };

  if (!fullAddress) {
    return defaults;
  }

  const normalized = prepareAddressForParsing(fullAddress);
  if (!normalized) {
    return defaults;
  }

  const segments = normalized
    .split(/[,;]/)
    .map(segment => tidyAddressText(segment))
    .filter(segment => segment.length > 0);

  if (segments.length === 0) {
    return defaults;
  }

  let street = '';
  let houseNumber = '';
  let building = '';
  let entrance = '';
  let floor = '';
  let apartment = '';

  let streetIndex = segments.findIndex(segment => STREET_KEYWORDS.test(segment));
  if (streetIndex === -1 && segments.length > 0) {
    streetIndex = 0;
  }

  if (streetIndex >= 0) {
    const streetSegment = segments[streetIndex];
    const explicit = streetSegment.match(/(?:дом|д\.?|№|no\.?|house)\s*([0-9A-Za-zА-Яа-я/-]+)/i);
    if (explicit) {
      const start = explicit.index ?? 0;
      const before = streetSegment.slice(0, start).replace(/[,\.\s]+$/, '');
      street = tidyAddressText(before) || streetSegment;
      houseNumber = explicit[1].trim();
      const remainder = tidyAddressText(streetSegment.slice(start + explicit[0].length));
      if (remainder) {
        segments.push(remainder);
      }
      segments.splice(streetIndex, 1, street);
    } else {
      const numberMatches = [...streetSegment.matchAll(/\d+[A-Za-zА-Яа-я/-]*/g)];
      let selected: RegExpMatchArray | null = null;
      for (let i = numberMatches.length - 1; i >= 0; i -= 1) {
        const match = numberMatches[i];
        const start = match.index ?? 0;
        const end = start + match[0].length;
        const after = streetSegment.slice(end).trim();
        if (after && /^[A-Za-zА-Яа-яЁё]/.test(after)) {
          continue;
        }
        selected = match;
        break;
      }
      if (selected) {
        const start = selected.index ?? 0;
        const end = start + selected[0].length;
        const before = streetSegment.slice(0, start).replace(/[,\.\s]+$/, '');
        street = tidyAddressText(before) || streetSegment;
        houseNumber = selected[0].trim();
        const remainder = tidyAddressText(streetSegment.slice(end));
        if (remainder) {
          segments.push(remainder);
        }
        segments.splice(streetIndex, 1, street);
      } else {
        street = streetSegment;
      }
    }
  }

  for (let i = 0; i < segments.length; i += 1) {
    const segment = tidyAddressText(segments[i]);
    if (!segment) continue;
    if (street && segment === street) continue;

    if (!houseNumber) {
      const direct = segment.match(/^(?:д\.?|дом|№|no\.?|house)\s*([0-9A-Za-zА-Яа-я/-]+)/i);
      if (direct) {
        houseNumber = direct[1].trim();
        continue;
      }
      if (/^\d+[A-Za-zА-Яа-я/-]*$/.test(segment)) {
        houseNumber = segment;
        continue;
      }
    }

    if (!building && /^(?:корп(?:ус)?|к\.?|строение|стр\.?|литер)/i.test(segment)) {
      building = segment;
      continue;
    }
    if (!entrance && /^(?:подъезд|под\.?|пд\.?)/i.test(segment)) {
      entrance = segment;
      continue;
    }
    if (!floor && /^(?:этаж|эт\.?)/i.test(segment)) {
      floor = segment;
      continue;
    }
    if (!apartment && /^(?:кв\.?|квартира|ап\.?|оф\.?|офис)/i.test(segment)) {
      apartment = segment;
      continue;
    }
  }

  if (!street && segments.length > 0) {
    street = segments[0];
  }

  return {
    street,
    houseNumber,
    building,
    entrance,
    floor,
    apartment,
  };
}

export function getZoneByAddress(address: string, zones: any[]): any | null {
  // Simple zone detection - in real app would use geocoding
  // For demo purposes, we'll use simple string matching
  const addressLower = address.toLowerCase();
  
  for (const zone of zones) {
    const zoneName = zone.name.toLowerCase();
    if (addressLower.includes('центр') && zoneName.includes('фиолетовая')) {
      return zone;
    }
    if (addressLower.includes('микрорайон') && zoneName.includes('зеленая')) {
      return zone;
    }
    if (addressLower.includes('окраина') && zoneName.includes('красная')) {
      return zone;
    }
    if (addressLower.includes('набережная') && zoneName.includes('синяя')) {
      return zone;
    }
  }
  
  return zones[0] || null; // Default to first zone if no match
}
