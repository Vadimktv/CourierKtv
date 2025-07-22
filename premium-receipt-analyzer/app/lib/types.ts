
export interface Order {
  id: string
  receiptId?: string
  restaurantName?: string
  address?: string
  entrance?: string
  floor?: string
  apartment?: string
  phoneNumber?: string
  totalAmount?: string
  paymentMethod?: string
  notes?: string
  createdAt?: Date
  updatedAt?: Date
}

export interface Receipt {
  id: string
  filename: string
  originalUrl: string
  processedData?: any
  status: 'processing' | 'completed' | 'error'
  createdAt: Date
  updatedAt: Date
  orders: Order[]
}

export interface AnalysisResult {
  success: boolean
  order?: Order
  error?: string
}
