
'use client'

import { useState } from 'react'
import { 
  MapPin, 
  Phone, 
  CreditCard, 
  CircleDollarSign, 
  Map, 
  Pencil, 
  Check, 
  X, 
  Building, 
  ArrowUp, 
  Home,
  Trash2,
  Landmark,
  CheckCircle,
  Clock
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { OrderData } from '@/lib/types'

interface OrderCardProps {
  order: OrderData
  index: number
  onUpdate: (order: OrderData) => void
  onDelete: (orderId: string) => void
  onComplete?: (order: OrderData) => void
  showCompleteButton?: boolean
}

export function OrderCard({ order, index, onUpdate, onDelete, onComplete, showCompleteButton = true }: OrderCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState(order)

  const handleEdit = () => {
    setIsEditing(true)
    setEditData(order)
  }

  const handleSave = () => {
    onUpdate(editData)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditData(order)
    setIsEditing(false)
  }

  const handleDelete = () => {
    if (window.confirm('Вы уверены, что хотите удалить этот заказ?')) {
      onDelete(order.id)
    }
  }

  const buildRoute = () => {
    const address = order.deliveryAddress
    if (address) {
      const yandexMapsUrl = `https://yandex.ru/maps/?text=${encodeURIComponent(address)}&rtt=auto`
      window.open(yandexMapsUrl, '_blank')
    }
  }

  const formatAddress = (order: OrderData) => {
    const parts = [
      order.deliveryAddress,
      order.entrance ? `подъезд ${order.entrance}` : '',
      order.floor ? `этаж ${order.floor}` : '',
      order.apartment ? `кв. ${order.apartment}` : ''
    ].filter(Boolean)
    
    return parts.join(', ')
  }

  const getPaymentIcon = (method?: string) => {
    switch (method) {
      case 'cash':
        return <Landmark className="h-4 w-4" />
      case 'card':
        return <CreditCard className="h-4 w-4" />
      case 'online':
        return <CreditCard className="h-4 w-4" />
      default:
        return <CreditCard className="h-4 w-4" />
    }
  }

  const getPaymentText = (method?: string) => {
    switch (method) {
      case 'cash':
        return 'Наличные'
      case 'card':
        return 'Карта'
      case 'online':
        return 'Онлайн'
      default:
        return 'Не указано'
    }
  }

  return (
    <Card className={`order-card ${isEditing ? 'edit-mode' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <CardTitle className="text-lg font-semibold text-foreground">
                {isEditing ? (
                  <Input
                    value={editData.restaurantName || ''}
                    onChange={(e) => setEditData({...editData, restaurantName: e.target.value})}
                    placeholder="Название ресторана"
                    className="text-lg font-semibold"
                  />
                ) : (
                  order.restaurantName || `Заказ #${index + 1}`
                )}
              </CardTitle>
              {order.status === 'completed' && (
                <Badge variant="secondary" className="flex items-center space-x-1">
                  <CheckCircle className="h-3 w-3" />
                  <span>Завершен</span>
                </Badge>
              )}
              {order.status === 'active' && (
                <Badge variant="outline" className="flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>Активный</span>
                </Badge>
              )}
            </div>
            {order.status === 'completed' && order.completedAt && (
              <p className="text-xs text-muted-foreground">
                Завершен: {new Date(order.completedAt).toLocaleString('ru-RU')}
              </p>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {!isEditing && order.status === 'active' ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleEdit}
                  className="h-8 w-8 p-0"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            ) : !isEditing ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSave}
                  className="h-8 w-8 p-0 text-green-500 hover:text-green-600"
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancel}
                  className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                >
                  <X className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Address */}
        <div className="space-y-2">
          <div className="flex items-start space-x-3">
            <MapPin className="h-5 w-5 text-primary mt-0.5" />
            <div className="flex-1 space-y-2">
              {isEditing ? (
                <div className="space-y-2">
                  <div>
                    <Label htmlFor="address" className="text-sm font-medium">
                      Адрес
                    </Label>
                    <Input
                      id="address"
                      value={editData.deliveryAddress || ''}
                      onChange={(e) => setEditData({...editData, deliveryAddress: e.target.value})}
                      placeholder="Адрес доставки"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label htmlFor="entrance" className="text-sm font-medium">
                        Подъезд
                      </Label>
                      <Input
                        id="entrance"
                        value={editData.entrance || ''}
                        onChange={(e) => setEditData({...editData, entrance: e.target.value})}
                        placeholder="№"
                      />
                    </div>
                    <div>
                      <Label htmlFor="floor" className="text-sm font-medium">
                        Этаж
                      </Label>
                      <Input
                        id="floor"
                        value={editData.floor || ''}
                        onChange={(e) => setEditData({...editData, floor: e.target.value})}
                        placeholder="№"
                      />
                    </div>
                    <div>
                      <Label htmlFor="apartment" className="text-sm font-medium">
                        Квартира
                      </Label>
                      <Input
                        id="apartment"
                        value={editData.apartment || ''}
                        onChange={(e) => setEditData({...editData, apartment: e.target.value})}
                        placeholder="№"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-foreground font-medium">
                    {formatAddress(order)}
                  </p>
                  {(order.entrance || order.floor || order.apartment) && (
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                      {order.entrance && (
                        <div className="flex items-center space-x-1">
                          <Building className="h-3 w-3" />
                          <span>Подъезд {order.entrance}</span>
                        </div>
                      )}
                      {order.floor && (
                        <div className="flex items-center space-x-1">
                          <ArrowUp className="h-3 w-3" />
                          <span>Этаж {order.floor}</span>
                        </div>
                      )}
                      {order.apartment && (
                        <div className="flex items-center space-x-1">
                          <Home className="h-3 w-3" />
                          <span>Кв. {order.apartment}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Phone */}
        <div className="flex items-center space-x-3">
          <Phone className="h-5 w-5 text-primary" />
          <div className="flex-1">
            {isEditing ? (
              <Input
                value={editData.phoneNumber || ''}
                onChange={(e) => setEditData({...editData, phoneNumber: e.target.value})}
                placeholder="Номер телефона"
              />
            ) : (
              <a 
                href={`tel:${order.phoneNumber}`}
                className="phone-link font-medium"
              >
                {order.phoneNumber || 'Не указан'}
              </a>
            )}
          </div>
        </div>

        {/* Amount and Payment */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-3">
            <CircleDollarSign className="h-5 w-5 text-primary" />
            <div className="flex-1">
              {isEditing ? (
                <Input
                  type="number"
                  value={editData.orderAmount || ''}
                  onChange={(e) => setEditData({...editData, orderAmount: parseFloat(e.target.value)})}
                  placeholder="Сумма"
                />
              ) : (
                <span className="font-medium text-foreground">
                  {order.orderAmount ? `${order.orderAmount} ₽` : 'Не указана'}
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {getPaymentIcon(order.paymentMethod)}
            <div className="flex-1">
              {isEditing ? (
                <Select
                  value={editData.paymentMethod || ''}
                  onValueChange={(value) => setEditData({...editData, paymentMethod: value as 'cash' | 'card' | 'online'})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Способ оплаты" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Наличные</SelectItem>
                    <SelectItem value="card">Карта</SelectItem>
                    <SelectItem value="online">Онлайн</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <span className="text-foreground">
                  {getPaymentText(order.paymentMethod)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Completion Information for Completed Orders */}
        {order.status === 'completed' && (
          <div className="pt-2 space-y-3 border-t">
            <h4 className="text-sm font-medium text-foreground">Информация о завершении</h4>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              {order.zone && (
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ 
                      backgroundColor: order.zone === 'purple' ? '#8B5CF6' :
                                     order.zone === 'blue' ? '#3B82F6' :
                                     order.zone === 'red' ? '#EF4444' :
                                     order.zone === 'green' ? '#10B981' : '#6B7280'
                    }}
                  />
                  <span>
                    {order.zone === 'purple' ? 'Фиолетовая зона' :
                     order.zone === 'blue' ? 'Синяя зона' :
                     order.zone === 'red' ? 'Красная зона' :
                     order.zone === 'green' ? 'Зеленая зона' : 'Неизвестная зона'}
                  </span>
                </div>
              )}
              
              {order.finalPaymentMethod && (
                <div className="flex items-center space-x-2">
                  {order.finalPaymentMethod === 'paid' && <CheckCircle className="h-3 w-3 text-green-500" />}
                  {order.finalPaymentMethod === 'terminal' && <CreditCard className="h-3 w-3 text-blue-500" />}
                  {order.finalPaymentMethod === 'transfer' && <Landmark className="h-3 w-3 text-purple-500" />}
                  {order.finalPaymentMethod === 'cash' && <Landmark className="h-3 w-3 text-amber-500" />}
                  <span>
                    {order.finalPaymentMethod === 'paid' ? 'Оплачено' :
                     order.finalPaymentMethod === 'terminal' ? 'Терминал' :
                     order.finalPaymentMethod === 'transfer' ? 'Перевод' :
                     order.finalPaymentMethod === 'cash' ? 'Наличные' : 'Не указано'}
                  </span>
                </div>
              )}
              
              {order.confirmedAmount && (
                <div className="flex items-center space-x-2">
                  <CircleDollarSign className="h-3 w-3 text-green-500" />
                  <span>Сумма: {order.confirmedAmount}₽</span>
                </div>
              )}
              
              {order.earnings && (
                <div className="flex items-center space-x-2">
                  <CircleDollarSign className="h-3 w-3 text-primary" />
                  <span className="font-medium text-green-600">Заработок: {order.earnings}₽</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {!isEditing && (
          <div className="pt-2 space-y-2">
            {/* Route Button */}
            {order.deliveryAddress && (
              <Button
                onClick={buildRoute}
                variant="outline"
                className="w-full mobile-button"
              >
                <Map className="h-4 w-4 mr-2" />
                Построить маршрут
              </Button>
            )}
            
            {/* Complete Order Button */}
            {order.status === 'active' && showCompleteButton && onComplete && (
              <Button
                onClick={() => onComplete(order)}
                className="w-full mobile-button bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Заказ выполнил
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
