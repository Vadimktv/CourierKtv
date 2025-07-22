
export interface User {
  id: string
  name: string | null
  email: string
  role: string
  createdAt: Date
  updatedAt: Date
}

export interface Order {
  id: string
  userId: string
  address: string
  phone: string | null
  amount: number
  zone: string
  earnings: number
  status: string
  paymentMethod: string | null
  receiptUrl: string | null
  createdAt: Date
  updatedAt: Date
}

export interface Statistics {
  id: string
  userId: string
  totalEarnings: number
  todayEarnings: number
  totalOrders: number
  todayOrders: number
  lastUpdated: Date
}

export interface ReceiptAnalysis {
  address: string
  phone: string | null
  amount: number
  zone: string
  earnings: number
  success: boolean
  error?: string
}

export interface ZoneInfo {
  name: string
  rate: number
  description: string
}

export const ZONES: ZoneInfo[] = [
  { name: 'Зона 1', rate: 0.15, description: 'Центр города' },
  { name: 'Зона 2', rate: 0.18, description: 'Ближние районы' },
  { name: 'Зона 3', rate: 0.20, description: 'Дальние районы' },
  { name: 'Зона 4', rate: 0.22, description: 'Пригород' }
]
