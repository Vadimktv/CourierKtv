
'use client'

import { useState } from 'react'
import { MapPin, Phone, Clock, CheckCircle, CreditCard, Banknote, Smartphone, Terminal } from 'lucide-react'

interface Order {
  id: string
  address: string
  phone: string | null
  amount: number
  zone: string
  earnings: number
  status: string
  paymentMethod: string | null
  createdAt: string
}

interface OrderCardProps {
  order: Order
  onUpdate: () => void
}

const paymentMethods = [
  {
    id: 'cash',
    name: 'Наличные',
    icon: Banknote,
    color: 'from-green-400 to-green-600',
    description: 'Наличный расчет'
  },
  {
    id: 'card',
    name: 'Карта',
    icon: CreditCard,
    color: 'from-blue-400 to-blue-600',
    description: 'Банковская карта'
  },
  {
    id: 'transfer',
    name: 'Перевод',
    icon: Smartphone,
    color: 'from-purple-400 to-purple-600',
    description: 'Перевод по телефону'
  },
  {
    id: 'terminal',
    name: 'Терминал',
    icon: Terminal,
    color: 'from-orange-400 to-orange-600',
    description: 'Платежный терминал'
  }
]

export function OrderCard({ order, onUpdate }: OrderCardProps) {
  const [completing, setCompleting] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  const handleComplete = async (paymentMethod: string) => {
    setCompleting(true)

    try {
      const response = await fetch(`/api/orders/${order.id}/complete`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethod }),
      })

      if (response.ok) {
        onUpdate()
        setShowPaymentModal(false)
      }
    } catch (error) {
      console.error('Error completing order:', error)
    } finally {
      setCompleting(false)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return 'Недавно'
    }
  }

  const formatPhone = (phone: string | null) => {
    if (!phone) return null
    
    // Обработка номеров Яндекс.Еды с добавочными
    if (phone.includes(',')) {
      const [mainPhone, extension] = phone.split(',')
      return `${mainPhone}, доб. ${extension}`
    }
    
    return phone
  }

  const getZoneColor = (zone: string) => {
    switch (zone.toLowerCase()) {
      case 'центр':
        return 'from-emerald-400 to-emerald-600'
      case 'ближние районы':
        return 'from-blue-400 to-blue-600'
      case 'дальние районы':
        return 'from-orange-400 to-orange-600'
      case 'пригород':
        return 'from-red-400 to-red-600'
      default:
        return 'from-gray-400 to-gray-600'
    }
  }

  const getPaymentMethodInfo = (method: string | null) => {
    if (!method) return null
    return paymentMethods.find(pm => pm.id === method) || {
      id: method,
      name: method === 'cash' ? 'Наличные' : 'Карта',
      icon: method === 'cash' ? Banknote : CreditCard,
      color: method === 'cash' ? 'from-green-400 to-green-600' : 'from-blue-400 to-blue-600'
    }
  }

  const paymentInfo = getPaymentMethodInfo(order.paymentMethod)

  return (
    <>
      <div className={`order-card ${order.status === 'completed' ? 'completed' : ''}`}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`w-4 h-4 rounded-full ${
              order.status === 'completed' 
                ? 'bg-gradient-to-r from-green-400 to-green-600 shadow-lg shadow-green-400/50' 
                : 'bg-gradient-to-r from-yellow-400 to-orange-500 shadow-lg shadow-yellow-400/50 animate-pulse'
            }`} />
            <span className="text-sm font-semibold text-foreground">
              {order.status === 'completed' ? 'Выполнен' : 'В работе'}
            </span>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              {order.earnings} ₽
            </div>
            <div className="text-sm text-muted-foreground">
              из {order.amount} ₽
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-lg flex items-center justify-center mt-0.5">
              <MapPin className="text-white" size={14} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">{order.address}</p>
              <div className="flex items-center space-x-2 mt-1">
                <div className={`px-2 py-1 rounded-full text-xs font-medium text-white bg-gradient-to-r ${getZoneColor(order.zone)}`}>
                  {order.zone}
                </div>
              </div>
            </div>
          </div>

          {order.phone && (
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center">
                <Phone className="text-white" size={14} />
              </div>
              <span className="text-sm text-foreground font-medium">
                {formatPhone(order.phone)}
              </span>
            </div>
          )}

          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center">
              <Clock className="text-white" size={14} />
            </div>
            <span className="text-sm text-muted-foreground">
              {formatDate(order.createdAt)}
            </span>
          </div>

          {paymentInfo && (
            <div className="flex items-center space-x-3">
              <div className={`w-6 h-6 bg-gradient-to-br ${paymentInfo.color} rounded-lg flex items-center justify-center`}>
                <paymentInfo.icon className="text-white" size={14} />
              </div>
              <span className="text-sm text-foreground font-medium">
                {paymentInfo.name}
              </span>
            </div>
          )}
        </div>

        {order.status === 'active' && (
          <div className="mt-6 pt-4 border-t border-border/50">
            <button
              onClick={() => setShowPaymentModal(true)}
              disabled={completing}
              className="btn-primary w-full flex items-center justify-center space-x-2"
            >
              {completing ? (
                <>
                  <div className="loading-spinner" />
                  <span>Завершение...</span>
                </>
              ) : (
                <>
                  <CheckCircle size={18} />
                  <span>Заказ выполнен</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Enhanced Payment Method Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center p-4 z-50">
          <div className="modal-content p-6 w-full max-w-sm">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="text-primary-foreground" size={28} />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">
                Способ оплаты
              </h3>
              <p className="text-sm text-muted-foreground">
                Как клиент оплатил заказ?
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {paymentMethods.map((method) => (
                <button
                  key={method.id}
                  onClick={() => handleComplete(method.id)}
                  disabled={completing}
                  className="payment-card flex flex-col items-center p-4 text-center"
                >
                  <div className={`w-12 h-12 bg-gradient-to-br ${method.color} rounded-xl flex items-center justify-center mb-3`}>
                    <method.icon className="text-white" size={20} />
                  </div>
                  <span className="text-sm font-semibold text-foreground mb-1">
                    {method.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {method.description}
                  </span>
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowPaymentModal(false)}
              disabled={completing}
              className="w-full py-3 text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              Отмена
            </button>
          </div>
        </div>
      )}
    </>
  )
}
