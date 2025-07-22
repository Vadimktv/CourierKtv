
'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { Camera, Plus, TrendingUp, Package, Clock, Star, Wallet, Target } from 'lucide-react'
import { ReceiptUpload } from './receipt-upload'
import { OrderCard } from './order-card'

interface Statistics {
  totalEarnings: number
  todayEarnings: number
  totalOrders: number
  todayOrders: number
}

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

export function DashboardContent() {
  const { data: session } = useSession()
  const [statistics, setStatistics] = useState<Statistics | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)

  useEffect(() => {
    if (session?.user) {
      fetchData()
    }
  }, [session])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      const [statsResponse, ordersResponse] = await Promise.all([
        fetch('/api/statistics'),
        fetch('/api/orders')
      ])

      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStatistics(statsData)
      }

      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json()
        setOrders(ordersData)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOrderCreated = () => {
    fetchData()
    setShowUpload(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4" />
          <p className="text-muted-foreground">Загружаем данные...</p>
        </div>
      </div>
    )
  }

  if (showUpload) {
    return (
      <ReceiptUpload 
        onClose={() => setShowUpload(false)}
        onOrderCreated={handleOrderCreated}
      />
    )
  }

  const activeOrders = orders?.filter(order => order.status === 'active') ?? []
  const completedOrders = orders?.filter(order => order.status === 'completed') ?? []
  const todayProgress = statistics?.todayEarnings ? Math.min((statistics.todayEarnings / 2000) * 100, 100) : 0

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-6 max-w-md">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
              <Star className="text-primary-foreground" size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Привет, {session?.user?.name || 'Курьер'}!
              </h1>
              <p className="text-muted-foreground">
                Готовы к новым заказам?
              </p>
            </div>
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="stats-card animate-slide-in">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center">
                <Wallet className="text-white" size={16} />
              </div>
              <span className="text-sm font-medium text-muted-foreground">Сегодня</span>
            </div>
            <div className="text-2xl font-bold text-foreground animate-count-up">
              {statistics?.todayEarnings ?? 0} ₽
            </div>
            <div className="mt-2 bg-muted rounded-full h-2 overflow-hidden">
              <div 
                className="progress-bar h-full transition-all duration-1000"
                style={{ width: `${todayProgress}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Цель: 2000 ₽
            </p>
          </div>
          
          <div className="stats-card animate-slide-in" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
                <Package className="text-white" size={16} />
              </div>
              <span className="text-sm font-medium text-muted-foreground">В работе</span>
            </div>
            <div className="text-2xl font-bold text-foreground animate-count-up">
              {activeOrders.length}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              {activeOrders.length > 0 ? 'Активных заказов' : 'Нет активных'}
            </p>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="stats-card animate-slide-in" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center">
                <Target className="text-white" size={16} />
              </div>
              <span className="text-sm font-medium text-muted-foreground">Всего</span>
            </div>
            <div className="text-xl font-bold text-foreground animate-count-up">
              {statistics?.totalEarnings ?? 0} ₽
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              За все время
            </p>
          </div>

          <div className="stats-card animate-slide-in" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center">
                <Clock className="text-white" size={16} />
              </div>
              <span className="text-sm font-medium text-muted-foreground">Заказов</span>
            </div>
            <div className="text-xl font-bold text-foreground animate-count-up">
              {statistics?.totalOrders ?? 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Выполнено
            </p>
          </div>
        </div>

        {/* Main Action */}
        <div className="mb-8 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <button
            onClick={() => setShowUpload(true)}
            className="btn-primary w-full flex items-center justify-center space-x-3"
          >
            <Camera size={22} />
            <span>Распознать новый чек</span>
          </button>
        </div>

        {/* Active Orders */}
        {activeOrders.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
              <h2 className="text-lg font-semibold text-foreground">
                Активные заказы
              </h2>
              <div className="bg-yellow-400 text-primary-foreground text-xs px-2 py-1 rounded-full font-medium">
                {activeOrders.length}
              </div>
            </div>
            <div className="space-y-4">
              {activeOrders.map((order, index) => (
                <div 
                  key={order.id} 
                  className="animate-slide-in"
                  style={{ animationDelay: `${0.1 * index}s` }}
                >
                  <OrderCard order={order} onUpdate={fetchData} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Completed Orders */}
        {completedOrders.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-2 h-2 bg-green-400 rounded-full" />
              <h2 className="text-lg font-semibold text-foreground">
                Недавно выполненные
              </h2>
            </div>
            <div className="space-y-4">
              {completedOrders.slice(0, 5).map((order, index) => (
                <div 
                  key={order.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${0.1 * index}s` }}
                >
                  <OrderCard order={order} onUpdate={fetchData} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {orders.length === 0 && (
          <div className="text-center py-16 animate-fade-in">
            <div className="w-24 h-24 bg-gradient-to-br from-muted to-muted/50 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Package size={40} className="text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Пока нет заказов
            </h3>
            <p className="text-muted-foreground mb-6">
              Добавьте первый заказ, чтобы начать зарабатывать
            </p>
            <button
              onClick={() => setShowUpload(true)}
              className="btn-primary inline-flex items-center space-x-2"
            >
              <Plus size={18} />
              <span>Добавить первый заказ</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
