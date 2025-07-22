
// Утилиты для работы с localStorage

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
  paymentMethod: string
  earnings: number
  receiptFileName: string
  timestamp: string
}

// Проверка доступности localStorage
const isLocalStorageAvailable = () => {
  try {
    const test = '__test__'
    localStorage.setItem(test, test)
    localStorage.removeItem(test)
    return true
  } catch {
    return false
  }
}

// Безопасное чтение из localStorage
const safeGetItem = (key: string): string | null => {
  if (!isLocalStorageAvailable()) return null
  
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

// Безопасная запись в localStorage
const safeSetItem = (key: string, value: string): boolean => {
  if (!isLocalStorageAvailable()) return false
  
  try {
    localStorage.setItem(key, value)
    return true
  } catch {
    return false
  }
}

// Функции для работы с данными пользователя
export const loadUserData = (): UserData | null => {
  const data = safeGetItem('courierAuth')
  if (!data) return null
  
  try {
    return JSON.parse(data)
  } catch {
    return null
  }
}

export const saveUserData = (userData: UserData): boolean => {
  return safeSetItem('courierAuth', JSON.stringify(userData))
}

// Функции для работы с данными смены
export const loadShiftData = (): ShiftData | null => {
  const data = safeGetItem('courierShift')
  if (!data) return null
  
  try {
    return JSON.parse(data)
  } catch {
    return null
  }
}

export const saveShiftData = (shiftData: ShiftData): boolean => {
  return safeSetItem('courierShift', JSON.stringify(shiftData))
}

// Функции для работы с заказами
export const loadOrdersData = (): Order[] => {
  const data = safeGetItem('courierOrders')
  if (!data) return []
  
  try {
    return JSON.parse(data)
  } catch {
    return []
  }
}

export const saveOrdersData = (orders: Order[]): boolean => {
  return safeSetItem('courierOrders', JSON.stringify(orders))
}

export const saveOrder = (order: Order): boolean => {
  const orders = loadOrdersData()
  orders.push(order)
  return saveOrdersData(orders)
}

// Функция для очистки всех данных
export const clearAllData = (): void => {
  if (isLocalStorageAvailable()) {
    localStorage.removeItem('courierAuth')
    localStorage.removeItem('courierShift')
    localStorage.removeItem('courierOrders')
  }
}
