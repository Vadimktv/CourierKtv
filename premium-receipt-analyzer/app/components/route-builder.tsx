
'use client'

import { Route, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Order } from '@/lib/types'

interface RouteBuilderProps {
  orders: Order[]
}

export function RouteBuilder({ orders }: RouteBuilderProps) {
  const buildCombinedRoute = () => {
    const addresses = orders
      .map(order => order.address)
      .filter(Boolean)
    
    if (addresses.length === 0) {
      return
    }

    // Build Yandex Maps URL with multiple waypoints
    const origin = encodeURIComponent(addresses[0]!)
    const destination = encodeURIComponent(addresses[addresses.length - 1]!)
    const waypoints = addresses.slice(1, -1).map(addr => encodeURIComponent(addr!)).join('~')
    
    let yandexUrl = `https://yandex.ru/maps/?mode=routes&rtext=${origin}~${destination}`
    if (waypoints) {
      yandexUrl = `https://yandex.ru/maps/?mode=routes&rtext=${origin}~${waypoints}~${destination}`
    }
    
    window.open(yandexUrl, '_blank')
  }

  const validAddressCount = orders.filter(order => order.address).length

  return (
    <div className="glass rounded-lg p-6 text-center animate-fade-in-up">
      <div className="flex items-center justify-center space-x-3 mb-4">
        <Route className="h-6 w-6 text-primary" />
        <h3 className="text-lg font-semibold">Общий маршрут</h3>
      </div>
      
      <p className="text-muted-foreground mb-6">
        Построить маршрут по всем {validAddressCount} адресам доставки
      </p>
      
      <Button
        onClick={buildCombinedRoute}
        disabled={validAddressCount < 2}
        className="premium-button"
      >
        <ExternalLink className="h-4 w-4 mr-2" />
        Построить общий маршрут
      </Button>
    </div>
  )
}
