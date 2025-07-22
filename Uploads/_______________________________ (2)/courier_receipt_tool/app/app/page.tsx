
'use client';

import { useState } from 'react';
import FileUpload from '@/components/file-upload';
import OrderCard from '@/components/order-card';
import RouteBuilder from '@/components/route-builder';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Truck, Upload, Package } from 'lucide-react';

export default function HomePage() {
  const [processedOrders, setProcessedOrders] = useState<any[]>([]);

  const handleFilesProcessed = (orders: any[]) => {
    setProcessedOrders(prev => [...orders, ...prev]);
  };

  const clearOrders = () => {
    setProcessedOrders([]);
  };

  return (
    <div className="min-h-screen-mobile bg-gradient-to-br from-background to-muted/30">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Truck className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">Курьер Помощник</h1>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Быстро извлекайте данные из чеков доставки с помощью ИИ. 
            Получайте адреса, телефоны и суммы для эффективной работы курьера.
          </p>
        </div>

        {/* File Upload Section */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" />
                Загрузка чеков
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FileUpload onFilesProcessed={handleFilesProcessed} />
            </CardContent>
          </Card>
        </div>

        {/* Route Builder */}
        {processedOrders.length > 0 && (
          <div className="mb-8">
            <RouteBuilder 
              orders={processedOrders.map(order => ({
                id: order.id,
                restaurant: order.restaurant,
                fullAddress: order.fullAddress,
                totalAmount: order.totalAmount
              }))}
            />
          </div>
        )}

        {/* Processed Orders */}
        {processedOrders.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Package className="h-6 w-6 text-primary" />
                Обработанные заказы ({processedOrders.length})
              </h2>
              {processedOrders.length > 0 && (
                <button
                  onClick={clearOrders}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Очистить все
                </button>
              )}
            </div>
            
            <div className="grid gap-4">
              {processedOrders.map((order) => (
                <OrderCard 
                  key={order.id} 
                  order={order}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {processedOrders.length === 0 && (
          <Card className="border-dashed border-2 border-muted-foreground/25">
            <CardContent className="p-12 text-center">
              <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
                <Package className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Нет обработанных заказов</h3>
              <p className="text-muted-foreground">
                Загрузите изображения чеков выше, чтобы начать извлечение данных
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
