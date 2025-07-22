
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import OrderCard from '@/components/order-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  History, 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight,
  Loader2,
  AlertCircle
} from 'lucide-react';

interface Order {
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
}

export default function HistoryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    totalCount: 0,
    hasNext: false,
    hasPrev: false
  });
  
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    restaurant: ''
  });
  
  const router = useRouter();

  const fetchOrders = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      });
      
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.restaurant) params.append('restaurant', filters.restaurant);
      
      const response = await fetch(`/api/orders?${params}`);
      if (!response.ok) throw new Error('Ошибка загрузки заказов');
      
      const data = await response.json();
      setOrders(data.orders || []);
      setPagination(data.pagination);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteOrder = async (orderId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот заказ?')) return;
    
    try {
      const response = await fetch(`/api/orders?id=${orderId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Ошибка удаления заказа');
      
      // Refresh the list
      fetchOrders(pagination.page);
    } catch (err: any) {
      alert('Ошибка удаления: ' + err.message);
    }
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const applyFilters = () => {
    fetchOrders(1);
  };

  const clearFilters = () => {
    setFilters({ startDate: '', endDate: '', restaurant: '' });
    setTimeout(() => fetchOrders(1), 0);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handlePageChange = (newPage: number) => {
    fetchOrders(newPage);
  };

  if (loading && orders.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Загрузка истории...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen-mobile bg-gradient-to-br from-background to-muted/30">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <History className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">История заказов</h1>
          </div>
          <p className="text-muted-foreground">
            Просматривайте и управляйте всеми обработанными заказами
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Фильтры
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <Label htmlFor="startDate">Дата начала</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="endDate">Дата окончания</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="restaurant">Ресторан</Label>
                <Input
                  id="restaurant"
                  placeholder="Название ресторана..."
                  value={filters.restaurant}
                  onChange={(e) => handleFilterChange('restaurant', e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={applyFilters} className="flex-1">
                  <Search className="mr-2 h-4 w-4" />
                  Поиск
                </Button>
                <Button onClick={clearFilters} variant="outline">
                  Сброс
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error State */}
        {error && (
          <Card className="mb-6 border-destructive">
            <CardContent className="p-6 text-center">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <p className="text-destructive mb-4">Ошибка: {error}</p>
              <Button onClick={() => fetchOrders(pagination.page)}>
                Попробовать снова
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Orders List */}
        {orders.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                Найдено заказов: {pagination.totalCount}
              </h2>
              {loading && (
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              )}
            </div>
            
            <div className="grid gap-4">
              {orders.map((order) => (
                <OrderCard 
                  key={order.id} 
                  order={{
                    ...order,
                    createdAt: new Date(order.createdAt),
                    orderDate: order.orderDate ? new Date(order.orderDate) : null
                  }}
                  onDelete={deleteOrder}
                  showDeleteButton={true}
                />
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={!pagination.hasPrev || loading}
                  variant="outline"
                  size="sm"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Предыдущая
                </Button>
                
                <div className="flex items-center gap-2 px-4">
                  <span className="text-sm text-muted-foreground">
                    Страница {pagination.page} из {pagination.totalPages}
                  </span>
                </div>
                
                <Button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={!pagination.hasNext || loading}
                  variant="outline"
                  size="sm"
                >
                  Следующая
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {orders.length === 0 && !loading && !error && (
          <Card className="border-dashed border-2 border-muted-foreground/25">
            <CardContent className="p-12 text-center">
              <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
                <History className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">История пуста</h3>
              <p className="text-muted-foreground mb-4">
                Пока нет обработанных заказов. Начните с загрузки чеков на главной странице.
              </p>
              <Button onClick={() => router.push('/')}>
                Перейти к загрузке
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
