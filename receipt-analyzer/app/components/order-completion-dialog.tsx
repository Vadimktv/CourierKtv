
'use client'

import { useState } from 'react'
import { CheckCircle, CreditCard, Smartphone, Banknote, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { OrderData, OrderCompletionData } from '@/lib/types'

interface OrderCompletionDialogProps {
  order: OrderData
  open: boolean
  onOpenChange: (open: boolean) => void
  onComplete: (orderId: string, completionData: OrderCompletionData) => void
  zones: Array<{ name: string; displayName: string; rate: number; color: string }>
}

const paymentMethods = [
  { value: 'paid', label: 'Оплачено', icon: CheckCircle, color: '#10B981' },
  { value: 'terminal', label: 'Терминал', icon: CreditCard, color: '#3B82F6' },
  { value: 'transfer', label: 'Перевод', icon: Smartphone, color: '#8B5CF6' },
  { value: 'cash', label: 'Наличные', icon: Banknote, color: '#F59E0B' }
]

export function OrderCompletionDialog({
  order,
  open,
  onOpenChange,
  onComplete,
  zones
}: OrderCompletionDialogProps) {
  const [finalPaymentMethod, setFinalPaymentMethod] = useState<string>('')
  const [confirmedAmount, setConfirmedAmount] = useState<string>(order.orderAmount?.toString() || '')
  const [selectedZone, setSelectedZone] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleComplete = async () => {
    if (!finalPaymentMethod || !confirmedAmount || !selectedZone) {
      toast({
        title: "Заполните все поля",
        description: "Выберите способ оплаты, подтвердите сумму и укажите зону",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const completionData: OrderCompletionData = {
        finalPaymentMethod: finalPaymentMethod as any,
        confirmedAmount: parseFloat(confirmedAmount),
        zone: selectedZone as any
      }

      await onComplete(order.id, completionData)
      onOpenChange(false)
      
      // Reset form
      setFinalPaymentMethod('')
      setConfirmedAmount('')
      setSelectedZone('')
      
      toast({
        title: "Заказ завершен",
        description: "Заказ успешно помечен как выполненный",
      })
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось завершить заказ",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span>Завершить заказ</span>
          </DialogTitle>
          <DialogDescription>
            Заказ #{order.orderNumber || order.id.slice(-6)} из {order.restaurantName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Payment Method Selection */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Способ оплаты</Label>
            <div className="grid grid-cols-2 gap-2">
              {paymentMethods.map((method) => {
                const Icon = method.icon
                return (
                  <Card
                    key={method.value}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      finalPaymentMethod === method.value
                        ? 'ring-2 ring-primary bg-primary/5'
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setFinalPaymentMethod(method.value)}
                  >
                    <CardContent className="p-3 text-center">
                      <Icon 
                        className="h-6 w-6 mx-auto mb-1" 
                        style={{ color: method.color }}
                      />
                      <p className="text-xs font-medium">{method.label}</p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* Amount Confirmation */}
          <div>
            <Label htmlFor="amount" className="text-sm font-medium">
              Подтвердите сумму заказа
            </Label>
            <div className="relative mt-1">
              <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="amount"
                type="number"
                value={confirmedAmount}
                onChange={(e) => setConfirmedAmount(e.target.value)}
                placeholder="0.00"
                className="pl-10"
                step="0.01"
              />
            </div>
            {order.orderAmount && parseFloat(confirmedAmount) !== order.orderAmount && (
              <p className="text-xs text-amber-600 mt-1">
                Сумма изменена с {order.orderAmount}₽
              </p>
            )}
          </div>

          {/* Zone Selection */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Зона доставки</Label>
            <div className="grid grid-cols-2 gap-2">
              {zones.map((zone) => (
                <Card
                  key={zone.name}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedZone === zone.name
                      ? 'ring-2 ring-primary bg-primary/5'
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedZone(zone.name)}
                >
                  <CardContent className="p-3 text-center">
                    <div 
                      className="w-6 h-6 rounded-full mx-auto mb-1"
                      style={{ backgroundColor: zone.color }}
                    />
                    <p className="text-xs font-medium">{zone.displayName}</p>
                    <p className="text-xs text-muted-foreground">{zone.rate}₽</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row space-y-2 sm:space-y-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            Отмена
          </Button>
          <Button
            onClick={handleComplete}
            disabled={isLoading || !finalPaymentMethod || !confirmedAmount || !selectedZone}
            className="w-full sm:w-auto mobile-button"
          >
            {isLoading ? 'Завершение...' : 'Завершить заказ'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
