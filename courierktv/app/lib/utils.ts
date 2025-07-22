
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

export function extractAddressComponents(fullAddress: string) {
  // Simple address parsing - in real app would use geocoding API
  const parts = fullAddress.split(',').map(part => part.trim());
  
  return {
    street: parts[0] || '',
    houseNumber: parts[1] || '',
    building: parts[2] || '',
    entrance: parts[3] || '',
    floor: parts[4] || '',
    apartment: parts[5] || '',
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
