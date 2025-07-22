
'use client'

import { useState } from 'react'
import { UploadZone } from './upload-zone'
import { OrderCard } from './order-card'
import { RouteBuilder } from './route-builder'
import { useToast } from '@/hooks/use-toast'
import type { Order } from '@/lib/types'

export function ReceiptAnalyzer() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const { toast } = useToast()

  const handleFileUpload = async (files: File[]) => {
    setIsProcessing(true)
    
    try {
      const newOrders: Order[] = []
      
      for (const file of files) {
        const formData = new FormData()
        formData.append('file', file)
        
        const response = await fetch('/api/analyze-receipt', {
          method: 'POST',
          body: formData,
        })
        
        if (!response.ok) {
          throw new Error(`Ошибка анализа файла ${file.name}`)
        }
        
        const result = await response.json()
        if (result.success && result.order) {
          newOrders.push(result.order)
        }
      }
      
      if (newOrders.length > 0) {
        setOrders(prev => [...prev, ...newOrders])
        toast({
          title: "Анализ завершен",
          description: `Успешно обработано ${newOrders.length} чеков`,
        })
      } else {
        toast({
          title: "Ошибка анализа",
          description: "Не удалось извлечь данные из загруженных файлов",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: "Ошибка загрузки",
        description: "Произошла ошибка при обработке файлов",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleOrderUpdate = (orderId: string, updatedData: Partial<Order>) => {
    setOrders(prev => 
      prev.map(order => 
        order.id === orderId 
          ? { ...order, ...updatedData }
          : order
      )
    )
  }

  const handleOrderDelete = (orderId: string) => {
    setOrders(prev => prev.filter(order => order.id !== orderId))
    toast({
      title: "Заказ удален",
      description: "Заказ успешно удален из списка",
    })
  }

  return (
    <div className="space-y-8">
      {/* Upload Zone */}
      <div className="animate-fade-in-up">
        <UploadZone 
          onFilesUpload={handleFileUpload}
          isProcessing={isProcessing}
        />
      </div>

      {/* Route Builder */}
      {orders.length > 1 && (
        <div className="animate-fade-in-up">
          <RouteBuilder orders={orders} />
        </div>
      )}

      {/* Results Section */}
      <div className="space-y-6">
        {orders.length === 0 && !isProcessing && (
          <div className="text-center py-16 animate-fade-in">
            <div className="glass-light rounded-xl p-12 max-w-md mx-auto">
              <p className="text-muted-foreground text-lg">
                Здесь появятся данные ваших заказов
              </p>
            </div>
          </div>
        )}

        {orders.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-up">
            {orders.map((order) => (
              <div key={order.id}>
                <OrderCard
                  order={order}
                  onUpdate={handleOrderUpdate}
                  onDelete={handleOrderDelete}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
