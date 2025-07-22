
export interface User {
  id: string;
  name: string | null;
  email: string;
  cityId: string | null;
  telegramId: string | null;
  telegramUsername: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  city?: City;
  _count?: {
    shifts: number;
    receipts: number;
  };
}

export interface City {
  id: string;
  name: string;
  region: string;
  createdAt: Date;
}

export interface Zone {
  id: string;
  name: string;
  color: string;
  rate: number;
  cityId: string;
  coordinates: any; // GeoJSON
  createdAt: Date;
}

export interface Shift {
  id: string;
  userId: string;
  startTime: Date;
  endTime: Date | null;
  isActive: boolean;
  totalEarnings: number;
  totalOrders: number;
  createdAt: Date;
  updatedAt: Date;
  receipts?: Receipt[];
}

export interface Receipt {
  id: string;
  userId: string;
  shiftId: string | null;
  zoneId: string | null;
  
  // Image data
  imageUrl: string | null;
  originalFileName: string | null;
  
  // OCR extracted data
  restaurant: string | null;
  orderDate: Date | null;
  orderTime: string | null;
  
  // Address data
  fullAddress: string;
  street: string | null;
  houseNumber: string | null;
  building: string | null;
  entrance: string | null;
  floor: string | null;
  apartment: string | null;
  
  // Contact info
  phoneNumber: string | null;
  additionalNumber: string | null;
  
  // Payment info
  totalAmount: number;
  paymentMethod: string;
  
  // Processing info
  status: string;
  hasHandwrittenSum: boolean;
  isEdited: boolean;
  errorMessage: string | null;
  
  // Earnings calculation
  zoneRate: number | null;
  earnings: number | null;
  
  createdAt: Date;
  updatedAt: Date;
  
  zone?: Zone;
  shift?: Shift;
}

export interface ShiftStats {
  totalEarnings: number;
  totalOrders: number;
  paymentMethods: {
    cash: number;
    card: number;
    transfer: number;
    terminal: number;
  };
  zones: Record<string, number>;
}

export interface TelegramSession {
  id: string;
  telegramId: string;
  userId: string | null;
  sessionData: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentMethod {
  value: string;
  label: string;
  icon: any;
  color: string;
}

export interface AddressComponents {
  street: string;
  houseNumber: string;
  building: string;
  entrance: string;
  floor: string;
  apartment: string;
}

export interface PhoneData {
  main: string;
  additional?: string;
}

export interface ZoneSearchResult {
  address: string;
  zone: Zone | null;
  city: City | null;
}
