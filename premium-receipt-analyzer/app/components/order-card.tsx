
'use client'

import { useState } from 'react'
import { 
  MapPin, 
  Phone, 
  CircleDollarSign, 
  CreditCard, 
  Edit3, 
  Check, 
  X, 
  Trash2,
  ExternalLink
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import type { Order } from '@/lib/types'

interface OrderCardProps {
  order: Order
  onUpdate: (orderId: string, updatedData: Partial<Order>) => void
  onDelete: (orderId: string) => void
}

export function OrderCard({ order, onUpdate, onDelete }: OrderCardProps) {
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const { toast } = useToast()

  const startEdit = (field: string, currentValue: string) => {
    setEditingField(field)
    setEditValue(currentValue || '')
  }

  const saveEdit = () => {
    if (editingField) {
      onUpdate(order.id, { [editingField]: editValue })
      setEditingField(null)
      setEditValue('')
    }
  }

  const cancelEdit = () => {
    setEditingField(null)
    setEditValue('')
  }

  const handlePhoneClick = () => {
    if (order.phoneNumber) {
      window.open(`tel:${order.phoneNumber}`, '_self')
    }
  }

  const handleRouteClick = () => {
    if (order.address) {
      const yandexUrl = `https://yandex.ru/maps/?text=${encodeURIComponent(order.address)}&mode=routes`
      window.open(yandexUrl, '_blank')
    } else {
      toast({
        title: "Адрес не указан",
        description: "Добавьте адрес для построения маршрута",
        variant: "destructive",
      })
    }
  }

  const fullAddress = [order.address, order.entrance, order.floor, order.apartment]
    .filter(Boolean)
    .join(', ')

  return (
    <div className="premium-card group relative hover:-translate-y-1 transition-transform duration-200">
      {/* Delete Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onDelete(order.id)}
        className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-muted-foreground hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      <div className="space-y-4">
        {/* Restaurant Name */}
        <div className="pr-8">
          <h3 className="text-lg font-semibold text-primary">
            {order.restaurantName || 'Неизвестное заведение'}
          </h3>
        </div>

        {/* Address */}
        <div className="space-y-2">
          <div className="flex items-start space-x-3">
            <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              {editingField === 'address' ? (
                <div className="space-y-2">
                  <Input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    placeholder="Адрес доставки"
                    className="bg-background/50"
                    autoFocus
                  />
                  <div className="flex space-x-2">
                    <Button size="sm" onClick={saveEdit} className="h-8 px-2">
                      <Check className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={cancelEdit} className="h-8 px-2">
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div 
                  className="group/field cursor-pointer"
                  onClick={() => startEdit('address', fullAddress)}
                >
                  <p className="text-sm break-words">
                    {fullAddress || 'Адрес не указан'}
                  </p>
                  <Edit3 className="h-3 w-3 text-muted-foreground opacity-0 group-hover/field:opacity-100 transition-opacity mt-1" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Phone */}
        <div className="flex items-center space-x-3">
          <Phone className="h-5 w-5 text-primary flex-shrink-0" />
          <div className="flex-1 min-w-0">
            {editingField === 'phoneNumber' ? (
              <div className="space-y-2">
                <Input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  placeholder="Номер телефона"
                  className="bg-background/50"
                  autoFocus
                />
                <div className="flex space-x-2">
                  <Button size="sm" onClick={saveEdit} className="h-8 px-2">
                    <Check className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={cancelEdit} className="h-8 px-2">
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="group/field cursor-pointer">
                {order.phoneNumber ? (
                  <button
                    onClick={handlePhoneClick}
                    className="text-sm text-primary hover:text-primary/80 transition-colors underline"
                  >
                    {order.phoneNumber}
                  </button>
                ) : (
                  <div onClick={() => startEdit('phoneNumber', '')}>
                    <p className="text-sm text-muted-foreground">Телефон не указан</p>
                    <Edit3 className="h-3 w-3 text-muted-foreground opacity-0 group-hover/field:opacity-100 transition-opacity mt-1" />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Amount */}
        <div className="flex items-center space-x-3">
          <CircleDollarSign className="h-5 w-5 text-primary flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium">
              {order.totalAmount || 'Сумма не указана'}
            </p>
          </div>
        </div>

        {/* Payment Method */}
        <div className="flex items-center space-x-3">
          <CreditCard className="h-5 w-5 text-primary flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm">
              {order.paymentMethod || 'Способ оплаты не указан'}
            </p>
          </div>
        </div>

        {/* Route Button */}
        <div className="pt-4 border-t border-border">
          <Button
            onClick={handleRouteClick}
            disabled={!order.address}
            className="premium-button-secondary w-full"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Маршрут в Яндекс.Картах
          </Button>
        </div>
      </div>
    </div>
  )
}
