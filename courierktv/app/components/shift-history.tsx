
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calendar,
  Clock,
  Package,
  TrendingUp,
  ChevronRight,
  Loader2,
  ClockIcon
} from 'lucide-react';
import { formatCurrency, formatDuration } from '@/lib/utils';

interface ShiftHistoryProps {
  user: any;
}

export function ShiftHistory({ user }: ShiftHistoryProps) {
  const [shifts, setShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedShift, setSelectedShift] = useState<any>(null);

  useEffect(() => {
    fetchShifts();
  }, []);

  const fetchShifts = async () => {
    try {
      const response = await fetch('/api/shifts/history');
      if (response.ok) {
        const data = await response.json();
        setShifts(data);
      }
    } catch (error) {
      console.error('Error fetching shifts:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatShiftDuration = (startTime: string, endTime: string) => {
    const duration = new Date(endTime).getTime() - new Date(startTime).getTime();
    return formatDuration(duration);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (selectedShift) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => setSelectedShift(null)}
            className="mb-4"
          >
            ← Назад к истории
          </Button>
          <h1 className="text-2xl font-bold">
            Детали смены от {new Date(selectedShift.startTime).toLocaleDateString('ru-RU')}
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Время работы
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Начало:</span>
                  <span>{new Date(selectedShift.startTime).toLocaleString('ru-RU')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Конец:</span>
                  <span>{new Date(selectedShift.endTime).toLocaleString('ru-RU')}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Продолжительность:</span>
                  <span>{formatShiftDuration(selectedShift.startTime, selectedShift.endTime)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Итоги
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Заказов:</span>
                  <span className="font-bold">{selectedShift.totalOrders}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Заработок:</span>
                  <span className="font-bold text-green-500">
                    {formatCurrency(selectedShift.totalEarnings)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">За заказ:</span>
                  <span className="font-bold">
                    {selectedShift.totalOrders > 0 
                      ? formatCurrency(selectedShift.totalEarnings / selectedShift.totalOrders)
                      : '0 ₽'
                    }
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Чеки смены</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedShift.receipts?.length > 0 ? (
              <div className="space-y-4">
                {selectedShift.receipts.map((receipt: any) => (
                  <div key={receipt.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold">{receipt.restaurant || 'Не указан'}</h4>
                        <p className="text-sm text-muted-foreground">{receipt.fullAddress}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatCurrency(receipt.totalAmount)}</p>
                        <Badge variant="outline">{receipt.paymentMethod}</Badge>
                      </div>
                    </div>
                    {receipt.zone && (
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-sm text-muted-foreground">
                          Зона: {receipt.zone.name}
                        </span>
                        <span className="text-sm font-bold text-green-500">
                          +{formatCurrency(receipt.earnings || 0)}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                В этой смене не было чеков
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">История смен</h1>
        <p className="text-muted-foreground">
          Просмотр завершенных рабочих смен и статистики
        </p>
      </div>

      {shifts.length > 0 ? (
        <div className="space-y-4">
          {shifts.map((shift) => (
            <Card key={shift.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div 
                  className="flex items-center justify-between"
                  onClick={() => setSelectedShift(shift)}
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-primary/10 rounded-full">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">
                        {new Date(shift.startTime).toLocaleDateString('ru-RU', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {formatShiftDuration(shift.startTime, shift.endTime)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Package className="h-4 w-4" />
                          {shift.totalOrders} заказов
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-bold text-lg text-green-500">
                        {formatCurrency(shift.totalEarnings)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        заработано
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
              <ClockIcon className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">История пуста</h3>
            <p className="text-muted-foreground">
              Завершенные смены будут отображаться здесь
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
