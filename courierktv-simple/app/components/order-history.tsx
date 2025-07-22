
'use client'

import { useState, useEffect } from 'react'
import { History, MapPin, CreditCard, Banknote, FileText, Trash2 } from 'lucide-react'
import { loadOrdersData, saveOrdersData } from '../lib/storage'

interface Order {
  id: string
  zone: string
  paymentMethod: string
  earnings: number
  receiptFileName: string
  timestamp: string
}

export default function OrderHistory() {
  const [orders, setOrders] = useState<Order[]>([])

  useEffect(() => {
    const savedOrders = loadOrdersData()
    setOrders(savedOrders)
  }, [])

  // Обновляем список при добавлении нового заказа
  useEffect(() => {
    const handleStorageChange = () => {
      const savedOrders = loadOrdersData()
      setOrders(savedOrders)
    }

    window.addEventListener('storage', handleStorageChange)
    
    // Проверяем изменения каждые 500мс (простое решение)
    const interval = setInterval(() => {
      const savedOrders = loadOrdersData()
      if (savedOrders.length !== orders.length) {
        setOrders(savedOrders)
      }
    }, 500)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [orders.length])

  const handleDeleteOrder = (orderId: string) => {
    if (confirm('Удалить заказ?')) {
      const updatedOrders = orders.filter(order => order.id !== orderId)
      setOrders(updatedOrders)
      saveOrdersData(updatedOrders)
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('ru-RU', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const getPaymentIcon = (method: string) => {
    return method === 'cash' ? (
      <Banknote className="h-4 w-4 text-green-600" />
    ) : (
      <CreditCard className="h-4 w-4 text-blue-600" />
    )
  }

  const getPaymentText = (method: string) => {
    return method === 'cash' ? 'Наличные' : 'Карта'
  }

  if (orders.length === 0) {
    return (
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <History className="h-6 w-6 text-green-600" />
          <h2 className="text-xl font-bold text-white">История заказов</h2>
        </div>
        
        <div className="text-center py-8">
          <div className="text-zinc-400 mb-2">
            <History className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Заказов пока нет</p>
            <p className="text-sm">Добавьте первый заказ</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-4">
        <History className="h-6 w-6 text-green-600" />
        <h2 className="text-xl font-bold text-white">История заказов</h2>
        <span className="text-sm text-zinc-400">({orders.length})</span>
      </div>
      
      <div className="space-y-3">
        {orders.map((order) => (
          <div
            key={order.id}
            className="bg-zinc-800 rounded-lg p-4 border border-zinc-700"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-zinc-400" />
                <span className="text-white font-medium">{order.zone}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-600 font-bold">{order.earnings} ₽</span>
                <button
                  onClick={() => handleDeleteOrder(order.id)}
                  className="text-red-500 hover:text-red-400 p-1"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                {getPaymentIcon(order.paymentMethod)}
                <span className="text-zinc-400">{getPaymentText(order.paymentMethod)}</span>
              </div>
              <span className="text-zinc-500">{formatTime(order.timestamp)}</span>
            </div>
            
            {order.receiptFileName && order.receiptFileName !== 'Без чека' && (
              <div className="flex items-center gap-2 mt-2 text-sm">
                <FileText className="h-4 w-4 text-zinc-400" />
                <span className="text-zinc-400 truncate">{order.receiptFileName}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
