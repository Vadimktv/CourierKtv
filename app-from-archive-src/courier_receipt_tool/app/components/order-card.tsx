
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Phone, 
  MapPin, 
  CreditCard, 
  Clock, 
  Building2,
  ExternalLink,
  Trash2
} from 'lucide-react';

interface OrderCardProps {
  order: {
    id: string;
    restaurant: string;
    orderDate?: Date | null;
    orderTime?: string | null;
    fullAddress: string;
    street?: string | null;
    houseNumber?: string | null;
    building?: string | null;
    entrance?: string | null;
    floor?: string | null;
    apartment?: string | null;
    phoneNumber: string;
    totalAmount: number;
    paymentMethod: string;
    status: string;
    createdAt: Date;
  };
  onDelete?: (orderId: string) => void;
  showDeleteButton?: boolean;
}

export default function OrderCard({ order, onDelete, showDeleteButton = false }: OrderCardProps) {
  const formatDate = (date: Date | null | undefined) => {
    if (!date) return null;
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(new Date(date));
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  const buildYandexMapsUrl = (address: string) => {
    const encodedAddress = encodeURIComponent(address);
    return `https://yandex.ru/maps/?text=${encodedAddress}&mode=routes`;
  };

  const formatPhoneNumber = (phone: string) => {
    // Remove any non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Format as +7 (XXX) XXX-XX-XX
    if (cleaned.length === 11 && cleaned.startsWith('7')) {
      return `+7 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7, 9)}-${cleaned.slice(9)}`;
    } else if (cleaned.length === 10) {
      return `+7 (${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 8)}-${cleaned.slice(8)}`;
    }
    
    return phone;
  };

  const getAddressDetails = () => {
    const parts = [];
    if (order.entrance) parts.push(`подъезд ${order.entrance}`);
    if (order.floor) parts.push(`этаж ${order.floor}`);
    if (order.apartment) parts.push(`кв. ${order.apartment}`);
    return parts.join(', ');
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              {order.restaurant}
            </CardTitle>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>
                  {formatDate(order.orderDate) || formatDate(order.createdAt)}
                  {order.orderTime && ` в ${order.orderTime}`}
                  {!order.orderTime && ` в ${formatTime(order.createdAt)}`}
                </span>
              </div>
              <Badge variant={order.status === 'processed' ? 'default' : 'secondary'}>
                {order.status === 'processed' ? 'Обработан' : order.status}
              </Badge>
            </div>
          </div>
          {showDeleteButton && onDelete && (
            <Button
              onClick={() => onDelete(order.id)}
              variant="ghost"
              size="sm"
              className="text-red-500 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-4">
        {/* Address */}
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium">{order.fullAddress}</p>
              {getAddressDetails() && (
                <p className="text-sm text-muted-foreground mt-1">
                  {getAddressDetails()}
                </p>
              )}
            </div>
          </div>
          <Button
            onClick={() => window.open(buildYandexMapsUrl(order.fullAddress), '_blank')}
            variant="outline"
            size="sm"
            className="w-full"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Построить маршрут
          </Button>
        </div>

        {/* Contact & Payment */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Телефон</span>
            </div>
            <Button
              onClick={() => window.open(`tel:${order.phoneNumber}`, '_self')}
              variant="outline"
              size="sm"
              className="w-full justify-start"
            >
              {formatPhoneNumber(order.phoneNumber)}
            </Button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Оплата</span>
            </div>
            <div className="flex items-center justify-between">
              <Badge variant={order.paymentMethod === 'cash' ? 'destructive' : 'default'}>
                {order.paymentMethod === 'cash' ? 'Наличные' : 'Безналичный'}
              </Badge>
              <span className="font-bold text-lg">
                {order.totalAmount.toLocaleString('ru-RU')}₽
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
