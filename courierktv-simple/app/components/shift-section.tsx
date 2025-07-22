
'use client'

import { useState, useEffect } from 'react'
import { Clock, Play, Square, DollarSign, Package } from 'lucide-react'
import { loadShiftData, saveShiftData, loadOrdersData } from '../lib/storage'

interface ShiftData {
  isActive: boolean
  startTime: string | null
  totalEarnings: number
  totalOrders: number
}

export default function ShiftSection() {
  const [shiftData, setShiftData] = useState<ShiftData>({
    isActive: false,
    startTime: null,
    totalEarnings: 0,
    totalOrders: 0
  })
  const [currentTime, setCurrentTime] = useState('')

  useEffect(() => {
    const savedShift = loadShiftData()
    const orders = loadOrdersData()
    
    if (savedShift) {
      setShiftData({
        ...savedShift,
        totalEarnings: orders.reduce((sum, order) => sum + order.earnings, 0),
        totalOrders: orders.length
      })
    }
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      if (shiftData.isActive && shiftData.startTime) {
        const start = new Date(shiftData.startTime)
        const now = new Date()
        const diff = now.getTime() - start.getTime()
        
        const hours = Math.floor(diff / (1000 * 60 * 60))
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((diff % (1000 * 60)) / 1000)
        
        setCurrentTime(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`)
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [shiftData.isActive, shiftData.startTime])

  const handleToggleShift = () => {
    if (shiftData.isActive) {
      // Завершаем смену
      if (confirm('Завершить смену?')) {
        const newShiftData = {
          isActive: false,
          startTime: null,
          totalEarnings: 0,
          totalOrders: 0
        }
        setShiftData(newShiftData)
        saveShiftData(newShiftData)
        setCurrentTime('')
        
        // Очищаем заказы
        localStorage.removeItem('courierOrders')
      }
    } else {
      // Начинаем смену
      const newShiftData = {
        isActive: true,
        startTime: new Date().toISOString(),
        totalEarnings: 0,
        totalOrders: 0
      }
      setShiftData(newShiftData)
      saveShiftData(newShiftData)
    }
  }

  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-4">
        <Clock className="h-6 w-6 text-green-600" />
        <h2 className="text-xl font-bold text-white">Смена</h2>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-zinc-300">Статус:</span>
          <span className={shiftData.isActive ? 'status-active' : 'status-inactive'}>
            {shiftData.isActive ? 'На смене' : 'Смена окончена'}
          </span>
        </div>
        
        {shiftData.isActive && (
          <div className="flex items-center justify-between">
            <span className="text-zinc-300">Длительность:</span>
            <span className="text-white font-mono text-lg">{currentTime}</span>
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Package className="h-4 w-4 text-zinc-400" />
              <span className="text-sm text-zinc-400">Заказов</span>
            </div>
            <div className="text-xl font-bold text-white">{shiftData.totalOrders}</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-zinc-400" />
              <span className="text-sm text-zinc-400">Заработано</span>
            </div>
            <div className="text-xl font-bold text-green-600">{shiftData.totalEarnings} ₽</div>
          </div>
        </div>
        
        <button
          onClick={handleToggleShift}
          className={`w-full flex items-center justify-center gap-2 ${
            shiftData.isActive ? 'btn-secondary' : 'btn-primary'
          }`}
        >
          {shiftData.isActive ? (
            <>
              <Square className="h-5 w-5" />
              Завершить смену
            </>
          ) : (
            <>
              <Play className="h-5 w-5" />
              Начать смену
            </>
          )}
        </button>
      </div>
    </div>
  )
}
