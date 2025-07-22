
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink, Route, MapPin } from 'lucide-react';

interface RoutBuilderProps {
  orders: Array<{
    id: string;
    restaurant: string;
    fullAddress: string;
    totalAmount: number;
  }>;
}

export default function RouteBuilder({ orders }: RoutBuilderProps) {
  if (orders.length === 0) return null;

  const buildMultipleRouteUrl = () => {
    if (orders.length === 1) {
      const encodedAddress = encodeURIComponent(orders[0].fullAddress);
      return `https://yandex.ru/maps/?text=${encodedAddress}&mode=routes`;
    }

    // For multiple addresses, create a route
    const addresses = orders.map(order => encodeURIComponent(order.fullAddress));
    const routeUrl = `https://yandex.ru/maps/?mode=routes&rtext=${addresses.join('~')}`;
    return routeUrl;
  };

  const totalAmount = orders.reduce((sum, order) => sum + order.totalAmount, 0);

  return (
    <Card className="bg-primary/5 border-primary/20">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Route className="h-5 w-5 text-primary" />
          Маршрут доставки ({orders.length} заказов)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {orders.map((order, index) => (
            <div key={order.id} className="flex items-center gap-3 p-2 bg-background rounded-lg">
              <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{order.restaurant}</p>
                <p className="text-xs text-muted-foreground truncate">{order.fullAddress}</p>
              </div>
              <div className="text-sm font-medium">
                {order.totalAmount.toLocaleString('ru-RU')}₽
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <div>
            <p className="text-sm text-muted-foreground">Общая сумма</p>
            <p className="text-lg font-bold">{totalAmount.toLocaleString('ru-RU')}₽</p>
          </div>
          <Button
            onClick={() => window.open(buildMultipleRouteUrl(), '_blank')}
            className="flex-shrink-0"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Открыть маршрут
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
