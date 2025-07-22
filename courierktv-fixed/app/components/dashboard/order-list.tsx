
'use client';

import { useEffect, useState } from 'react';
import { MapPin, Phone, CreditCard, Banknote, Smartphone, Computer, Package } from 'lucide-react';

interface Zone {
  id: string;
  name: string;
  rate: number;
  color: string;
}

interface Order {
  id: string;
  address: string;
  phone?: string;
  amount: number;
  paymentMethod: string;
  zone?: Zone;
  createdAt: string;
}

interface OrderListProps {
  refreshTrigger: number;
}

const paymentIcons = {
  CASH: Banknote,
  CARD: CreditCard,
  TRANSFER: Smartphone,
  TERMINAL: Computer
};

const paymentLabels = {
  CASH: 'Наличные',
  CARD: 'Карта',
  TRANSFER: 'Перевод',
  TERMINAL: 'Терминал'
};

export function OrderList({ refreshTrigger }: OrderListProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, [refreshTrigger]);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/orders');
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getZoneClasses = (zoneName?: string) => {
    switch (zoneName) {
      case 'Фиолетовая':
        return 'zone-violet';
      case 'Зеленая':
        return 'zone-green';
      case 'Красная':
        return 'zone-red';
      case 'Синяя':
        return 'zone-blue';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  if (isLoading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="card text-center">
        <div className="py-8">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            Заказов пока нет
          </h3>
          <p className="text-muted-foreground">
            Добавьте первый заказ, чтобы начать работу
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center">
        <Package className="h-5 w-5 mr-2 text-primary" />
        Заказы текущей смены ({orders.length})
      </h3>
      
      <div className="space-y-3">
        {orders.map((order) => {
          const PaymentIcon = paymentIcons[order.paymentMethod as keyof typeof paymentIcons] || CreditCard;
          
          return (
            <div key={order.id} className="card card-hover">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                  <div className="flex items-start space-x-2">
                    <MapPin className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                    <p className="text-sm font-medium">{order.address}</p>
                  </div>
                  
                  {order.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">{order.phone}</p>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <PaymentIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {paymentLabels[order.paymentMethod as keyof typeof paymentLabels]}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-bold">{order.amount}₽</span>
                      {order.zone && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getZoneClasses(order.zone.name)}`}>
                          +{order.zone.rate}₽
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
