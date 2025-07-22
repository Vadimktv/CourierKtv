
// User and Auth Types
export interface UserData {
  id: string;
  name?: string;
  email: string;
  emailVerified?: Date;
  image?: string;
  password: string;
  role: 'courier' | 'restaurant' | 'admin';
  phone?: string;
  city?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthFormData {
  email: string;
  password: string;
  name?: string;
  phone?: string;
  city?: string;
  role?: 'courier' | 'restaurant';
}

export interface ReceiptData {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadedAt: Date;
  processedAt?: Date;
  ocrStatus: 'pending' | 'processing' | 'completed' | 'failed';
  rawOcrText?: string;
  userId: string;
  orders: OrderData[];
}

export interface OrderData {
  id: string;
  receiptId: string;
  userId: string;
  restaurantName?: string;
  deliveryAddress?: string;
  entrance?: string;
  floor?: string;
  apartment?: string;
  phoneNumber?: string;
  orderAmount?: number;
  paymentMethod?: 'cash' | 'card' | 'online';
  orderNumber?: string;
  latitude?: number;
  longitude?: number;
  status: 'active' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
  
  // New fields for completion functionality
  completedAt?: Date;
  finalPaymentMethod?: 'paid' | 'terminal' | 'transfer' | 'cash';
  confirmedAmount?: number;
  zone?: 'purple' | 'blue' | 'red' | 'green';
  earnings?: number;
  shiftId?: string;
  
  // Enhanced OCR fields
  isYandexFood?: boolean;
  paymentWarning?: string;
}

export interface UploadedFile {
  file: File;
  preview: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
}

export interface ExtractedOrderData {
  restaurantName: string;
  deliveryAddress: string;
  entrance?: string;
  floor?: string;
  apartment?: string;
  phoneNumber: string;
  orderAmount: number;
  paymentMethod: 'cash' | 'card' | 'online';
  orderNumber?: string;
  rawText?: string;
  isYandexFood?: boolean;
  paymentWarning?: string;
}

export interface DeliveryZoneData {
  id: string;
  name: 'purple' | 'blue' | 'red' | 'green';
  displayName: string;
  rate: number;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ShiftData {
  id: string;
  startTime: Date;
  endTime?: Date;
  isActive: boolean;
  totalOrders: number;
  totalEarnings: number;
  userId: string;
  
  // Zone statistics
  purpleCount: number;
  blueCount: number;
  redCount: number;
  greenCount: number;
  
  purpleEarnings: number;
  blueEarnings: number;
  redEarnings: number;
  greenEarnings: number;
  
  orders: OrderData[];
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderCompletionData {
  finalPaymentMethod: 'paid' | 'terminal' | 'transfer' | 'cash';
  confirmedAmount: number;
  zone: 'purple' | 'blue' | 'red' | 'green';
}

export interface ZoneStatistics {
  purple: { count: number; earnings: number };
  blue: { count: number; earnings: number };
  red: { count: number; earnings: number };
  green: { count: number; earnings: number };
  total: { count: number; earnings: number };
}

export interface PaymentMethodBreakdown {
  cash: {
    count: number;
    amount: number;
    earnings: number;
  };
  terminal: {
    count: number;
    amount: number;
    earnings: number;
  };
  transfer: {
    count: number;
    amount: number;
    earnings: number;
  };
  paid: {
    count: number;
    amount: number;
    earnings: number;
  };
}

export interface ZoneBreakdown {
  purple: {
    count: number;
    amount: number;
    earnings: number;
    displayName: string;
    color: string;
  };
  blue: {
    count: number;
    amount: number;
    earnings: number;
    displayName: string;
    color: string;
  };
  red: {
    count: number;
    amount: number;
    earnings: number;
    displayName: string;
    color: string;
  };
  green: {
    count: number;
    amount: number;
    earnings: number;
    displayName: string;
    color: string;
  };
}

export interface DetailedStatistics {
  totalOrders: number;
  totalAmount: number;
  totalEarnings: number;
  shiftStart: Date;
  shiftDuration: {
    hours: number;
    minutes: number;
    formatted: string;
  };
  averageOrderValue: number;
  averageEarningsPerOrder: number;
}

export interface ShiftReport {
  shiftId: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: string;
  summary: {
    totalOrders: number;
    totalAmount: number;
    totalEarnings: number;
  };
  paymentBreakdown: {
    [key: string]: {
      count: number;
      amount: number;
      label: string;
    };
  };
  zoneBreakdown: {
    [key: string]: {
      count: number;
      earnings: number;
      label: string;
    };
  };
  ordersList: Array<{
    number: number;
    time: string;
    restaurant: string;
    address: string;
    amount: number;
    paymentMethod: string;
    zone: string;
    earnings: number;
  }>;
  generatedAt: string;
}

export interface StatisticsData {
  shift: ShiftData | null;
  statistics: DetailedStatistics | null;
  paymentBreakdown: PaymentMethodBreakdown | null;
  zoneBreakdown: ZoneBreakdown | null;
  ordersList: Array<{
    id: string;
    restaurantName?: string;
    deliveryAddress?: string;
    orderAmount?: number;
    confirmedAmount?: number;
    finalPaymentMethod?: string;
    zone?: string;
    earnings?: number;
    completedAt?: Date;
    phoneNumber?: string;
  }>;
}
