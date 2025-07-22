
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, MapPin, Phone, Clock, Package } from 'lucide-react'

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
  receiptUrl: string | null
}

interface OrderDetailsProps {
  orderId: string
}

export function OrderDetails({ orderId }: OrderDetailsProps) {
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchOrder()
  }, [orderId])

  const fetchOrder = async () => {
    try {
      const response = await fetch(`/api/orders/${orderId}`)
      if (response.ok) {
        const data = await response.json()
        setOrder(data)
      }
    } catch (error) {
      console.error('Error fetching order:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="loading-spinner" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Package className="mx-auto mb-4 text-muted-foreground" size={48} />
          <h1 className="text-xl font-semibold text-foreground mb-2">
            Заказ не найден
          </h1>
          <button
            onClick={() => router.push('/dashboard')}
            className="btn-primary"
          >
            Вернуться к заказам
          </button>
        </div>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return 'Недавно'
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-md">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-6">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold text-foreground">
            Детали заказа
          </h1>
        </div>

        {/* Receipt Image */}
        {order.receiptUrl && (
          <div className="mb-6">
            <img
              src={order.receiptUrl}
              alt="Чек"
              className="receipt-preview w-full border border-border rounded-lg"
            />
          </div>
        )}

        {/* Order Details */}
        <div className="bg-card border border-border rounded-lg p-4 mb-6">
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <MapPin className="text-primary mt-1" size={20} />
              <div>
                <p className="text-sm text-muted-foreground">Адрес доставки</p>
                <p className="text-foreground">{order.address}</p>
                <p className="text-sm text-muted-foreground">{order.zone}</p>
              </div>
            </div>

            {order.phone && (
              <div className="flex items-center space-x-3">
                <Phone className="text-primary" size={20} />
                <div>
                  <p className="text-sm text-muted-foreground">Телефон</p>
                  <p className="text-foreground">{order.phone}</p>
                </div>
              </div>
            )}

            <div className="flex items-center space-x-3">
              <Clock className="text-primary" size={20} />
              <div>
                <p className="text-sm text-muted-foreground">Время создания</p>
                <p className="text-foreground">{formatDate(order.createdAt)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Financial Details */}
        <div className="bg-card border border-border rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-foreground mb-4">
            Финансовые детали
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Сумма заказа:</span>
              <span className="text-foreground">{order.amount} ₽</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ваш заработок:</span>
              <span className="text-primary font-semibold">{order.earnings} ₽</span>
            </div>
            {order.paymentMethod && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Способ оплаты:</span>
                <span className="text-foreground">
                  {order.paymentMethod === 'cash' ? 'Наличные' : 'Карта'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Status */}
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className={`w-4 h-4 rounded-full ${
              order.status === 'completed' ? 'bg-green-500' : 'bg-yellow-500'
            }`} />
            <span className="text-foreground font-medium">
              {order.status === 'completed' ? 'Заказ выполнен' : 'В работе'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
