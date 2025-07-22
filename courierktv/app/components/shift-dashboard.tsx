
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Square, 
  Plus, 
  Banknote, 
  CreditCard, 
  Smartphone,
  Building2,
  Clock,
  Package,
  TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency, formatDuration } from '@/lib/utils';

interface ShiftDashboardProps {
  user: any;
  onAddReceipt: () => void;
}

export function ShiftDashboard({ user, onAddReceipt }: ShiftDashboardProps) {
  const [currentShift, setCurrentShift] = useState<any>(null);
  const [shiftStats, setShiftStats] = useState({
    totalEarnings: 0,
    totalOrders: 0,
    paymentMethods: {
      cash: 0,
      card: 0,
      transfer: 0,
      terminal: 0,
    },
    zones: {},
  });
  const [loading, setLoading] = useState(false);
  const [shiftDuration, setShiftDuration] = useState('');

  useEffect(() => {
    fetchCurrentShift();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (currentShift?.isActive) {
      interval = setInterval(() => {
        updateShiftDuration();
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [currentShift]);

  const fetchCurrentShift = async () => {
    try {
      const response = await fetch('/api/shifts/current');
      if (response.ok) {
        const data = await response.json();
        setCurrentShift(data.shift);
        setShiftStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching shift:', error);
    }
  };

  const updateShiftDuration = () => {
    if (currentShift?.startTime) {
      const duration = Date.now() - new Date(currentShift.startTime).getTime();
      setShiftDuration(formatDuration(duration));
    }
  };

  const handleShiftToggle = async () => {
    setLoading(true);
    try {
      const endpoint = currentShift?.isActive ? '/api/shifts/end' : '/api/shifts/start';
      const response = await fetch(endpoint, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        if (currentShift?.isActive) {
          toast.success('Смена завершена!');
          setCurrentShift(null);
        } else {
          toast.success('Смена начата!');
          setCurrentShift(data.shift);
        }
        fetchCurrentShift();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Ошибка при изменении статуса смены');
      }
    } catch (error) {
      toast.error('Произошла ошибка. Попробуйте еще раз');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">
          Привет, {user?.name || 'Курьер'}! 👋
        </h1>
        <p className="text-muted-foreground">
          {user?.city?.name && `Работаете в городе ${user.city.name}`}
        </p>
      </div>

      {/* Shift Control */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Управление сменой
            </CardTitle>
            {currentShift?.isActive && (
              <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500">
                Активная смена
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {currentShift?.isActive ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Время работы:</span>
                  <span className="font-mono text-lg">{shiftDuration}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Заработано:</span>
                  <span className="font-bold text-lg text-green-500">
                    {formatCurrency(shiftStats.totalEarnings)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Заказов:</span>
                  <span className="font-bold text-lg">{shiftStats.totalOrders}</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground mb-4">
                  Смена не начата. Нажмите кнопку ниже, чтобы начать работу.
                </p>
              </div>
            )}
            
            <Button
              onClick={handleShiftToggle}
              disabled={loading}
              className="w-full"
              size="lg"
              variant={currentShift?.isActive ? "destructive" : "default"}
            >
              {currentShift?.isActive ? (
                <>
                  <Square className="mr-2 h-5 w-5" />
                  Закончить смену
                </>
              ) : (
                <>
                  <Play className="mr-2 h-5 w-5" />
                  Начать смену
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Add Receipt Button */}
      {currentShift?.isActive && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <Button
              onClick={onAddReceipt}
              className="w-full"
              size="lg"
              variant="outline"
            >
              <Plus className="mr-2 h-5 w-5" />
              Добавить чек
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Statistics */}
      {currentShift?.isActive && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Payment Methods */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CreditCard className="h-5 w-5" />
                Способы оплаты
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Banknote className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Наличные</span>
                </div>
                <span className="font-bold">
                  {formatCurrency(shiftStats.paymentMethods.cash)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">Карта</span>
                </div>
                <span className="font-bold">
                  {formatCurrency(shiftStats.paymentMethods.card)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-purple-500" />
                  <span className="text-sm">Перевод</span>
                </div>
                <span className="font-bold">
                  {formatCurrency(shiftStats.paymentMethods.transfer)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-orange-500" />
                  <span className="text-sm">Терминал</span>
                </div>
                <span className="font-bold">
                  {formatCurrency(shiftStats.paymentMethods.terminal)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Zone Statistics (only for Gelendzhik) */}
          {user?.city?.name === 'Геленджик' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="h-5 w-5" />
                  Заработок по зонам
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(shiftStats.zones).map(([zoneName, earnings]) => (
                  <div key={zoneName} className="flex justify-between items-center">
                    <span className="text-sm">{zoneName}</span>
                    <span className="font-bold">
                      {formatCurrency(earnings as number)}
                    </span>
                  </div>
                ))}
                {Object.keys(shiftStats.zones).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Пока нет данных по зонам
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Recent Receipts */}
      {currentShift?.isActive && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Чеки текущей смены
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Чеки будут отображаться здесь</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
