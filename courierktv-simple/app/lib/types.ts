
// Типы данных для приложения CourierKtv

export interface UserData {
  username: string
  isLoggedIn: boolean
  loginTime: string
}

export interface ShiftData {
  isActive: boolean
  startTime: string | null
  totalEarnings: number
  totalOrders: number
}

export interface Order {
  id: string
  zone: string
  paymentMethod: 'cash' | 'card'
  earnings: number
  receiptFileName: string
  timestamp: string
}

export interface Zone {
  id: string
  name: string
  price: number
}

export interface PaymentMethod {
  id: 'cash' | 'card'
  name: string
  icon: string
}

// Константы для зон Геленджика
export const GELENDZHIK_ZONES: Zone[] = [
  { id: 'center', name: 'Центр', price: 300 },
  { id: 'tolstiy', name: 'Толстый мыс', price: 400 },
  { id: 'tonkiy', name: 'Тонкий мыс', price: 350 },
  { id: 'golubaya', name: 'Голубая бухта', price: 450 }
]

// Константы для способов оплаты
export const PAYMENT_METHODS: PaymentMethod[] = [
  { id: 'cash', name: 'Наличные', icon: 'banknote' },
  { id: 'card', name: 'Карта', icon: 'credit-card' }
]
