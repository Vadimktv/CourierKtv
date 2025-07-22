
'use client'

import { Button } from '@/components/ui/button'
import { Map, MapPin } from 'lucide-react'
import { OrderData } from '@/lib/types'

interface RouteBuilderProps {
  orders: OrderData[]
  onBuildRoute: () => void
}

export function RouteBuilder({ orders, onBuildRoute }: RouteBuilderProps) {
  const validOrders = orders.filter(order => order.deliveryAddress)
  
  if (validOrders.length < 2) {
    return null
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <MapPin className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground">
            Маршрут по {validOrders.length} точкам
          </span>
        </div>
        <div className="text-xs text-muted-foreground">
          Яндекс.Карты
        </div>
      </div>
      
      <Button
        onClick={onBuildRoute}
        className="w-full mobile-button bg-primary text-primary-foreground hover:bg-primary/90"
        size="lg"
      >
        <Map className="h-5 w-5 mr-2" />
        Построить общий маршрут
      </Button>
    </div>
  )
}
