
'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Building2, LogOut, Package, TrendingUp, Users, Eye } from 'lucide-react';
import { OrderData } from '@/lib/types';

export function RestaurantDashboard() {
  const { data: session } = useSession();
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/restaurant/orders');
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPaymentMethodBadge = (method?: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      cash: 'default',
      terminal: 'secondary',
      transfer: 'outline',
      paid: 'destructive',
    };
    
    return (
      <Badge variant={variants[method || ''] || 'outline'}>
        {method === 'cash' && 'Наличные'}
        {method === 'terminal' && 'Терминал'}
        {method === 'transfer' && 'Перевод'}
        {method === 'paid' && 'Оплачен'}
        {!method && 'Неизвестно'}
      </Badge>
    );
  };

  const getZoneBadge = (zone?: string) => {
    const colors: Record<string, string> = {
      purple: 'bg-purple-100 text-purple-800 border-purple-200',
      blue: 'bg-blue-100 text-blue-800 border-blue-200',
      red: 'bg-red-100 text-red-800 border-red-200',
      green: 'bg-green-100 text-green-800 border-green-200',
    };
    
    return (
      <Badge variant="outline" className={colors[zone || ''] || ''}>
        {zone === 'purple' && 'Фиолетовая'}
        {zone === 'blue' && 'Синяя'}
        {zone === 'red' && 'Красная'}
        {zone === 'green' && 'Зеленая'}
        {!zone && 'Неизвестно'}
      </Badge>
    );
  };

  const completedOrders = orders?.filter(order => order.status === 'completed') || [];
  const activeOrders = orders?.filter(order => order.status === 'active') || [];
  const totalRevenue = completedOrders.reduce((sum, order) => sum + (order.confirmedAmount || order.orderAmount || 0), 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
              <Building2 className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Панель Ресторана</h1>
              <p className="text-sm text-muted-foreground">
                Добро пожаловать, {session?.user?.name || 'Ресторан'}
              </p>
            </div>
          </div>
          <Button 
            variant="outline" 
            onClick={() => signOut({ callbackUrl: '/' })}
            className="flex items-center space-x-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Выйти</span>
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Всего заказов</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{orders?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                {completedOrders.length} завершено
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Активные заказы</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeOrders.length}</div>
              <p className="text-xs text-muted-foreground">
                В процессе доставки
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Общий доход</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalRevenue.toFixed(0)}₽</div>
              <p className="text-xs text-muted-foreground">
                От завершенных заказов
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Средний чек</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {completedOrders.length > 0 ? (totalRevenue / completedOrders.length).toFixed(0) : 0}₽
              </div>
              <p className="text-xs text-muted-foreground">
                На заказ
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Orders Tabs */}
        <Tabs defaultValue="active" className="space-y-4">
          <TabsList>
            <TabsTrigger value="active">
              <Eye className="w-4 h-4 mr-2" />
              Активные заказы ({activeOrders.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Завершенные ({completedOrders.length})
            </TabsTrigger>
            <TabsTrigger value="all">Все заказы ({orders?.length || 0})</TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            <Card>
              <CardHeader>
                <CardTitle>Активные заказы</CardTitle>
                <CardDescription>
                  Заказы в процессе доставки курьерами
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">Загрузка...</div>
                ) : activeOrders.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Нет активных заказов
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeOrders.map((order) => (
                      <div key={order.id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-semibold">{order.restaurantName}</h3>
                            <p className="text-sm text-muted-foreground">
                              {order.deliveryAddress}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">{order.orderAmount?.toFixed(0)}₽</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(order.createdAt).toLocaleString('ru-RU')}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {getPaymentMethodBadge(order.paymentMethod)}
                          {order.zone && getZoneBadge(order.zone)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="completed">
            <Card>
              <CardHeader>
                <CardTitle>Завершенные заказы</CardTitle>
                <CardDescription>
                  История выполненных заказов
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">Загрузка...</div>
                ) : completedOrders.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Нет завершенных заказов
                  </div>
                ) : (
                  <div className="space-y-4">
                    {completedOrders.map((order) => (
                      <div key={order.id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-semibold">{order.restaurantName}</h3>
                            <p className="text-sm text-muted-foreground">
                              {order.deliveryAddress}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">{(order.confirmedAmount || order.orderAmount)?.toFixed(0)}₽</p>
                            <p className="text-xs text-muted-foreground">
                              Завершен: {order.completedAt ? new Date(order.completedAt).toLocaleString('ru-RU') : 'Неизвестно'}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {getPaymentMethodBadge(order.finalPaymentMethod || order.paymentMethod)}
                          {order.zone && getZoneBadge(order.zone)}
                          {order.earnings && (
                            <Badge variant="secondary">
                              Заработок курьера: {order.earnings}₽
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="all">
            <Card>
              <CardHeader>
                <CardTitle>Все заказы</CardTitle>
                <CardDescription>
                  Полная история заказов
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">Загрузка...</div>
                ) : !orders || orders.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Нет заказов
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div key={order.id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-semibold">{order.restaurantName}</h3>
                            <p className="text-sm text-muted-foreground">
                              {order.deliveryAddress}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Создан: {new Date(order.createdAt).toLocaleString('ru-RU')}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">{(order.confirmedAmount || order.orderAmount)?.toFixed(0)}₽</p>
                            <Badge variant={order.status === 'completed' ? 'default' : order.status === 'active' ? 'secondary' : 'destructive'}>
                              {order.status === 'completed' && 'Завершен'}
                              {order.status === 'active' && 'Активен'}
                              {order.status === 'cancelled' && 'Отменен'}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {getPaymentMethodBadge(order.finalPaymentMethod || order.paymentMethod)}
                          {order.zone && getZoneBadge(order.zone)}
                          {order.earnings && order.status === 'completed' && (
                            <Badge variant="outline">
                              Заработок курьера: {order.earnings}₽
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
