
'use client';

import { useEffect, useState } from 'react';
import { DollarSign, Package, CreditCard, Timer } from 'lucide-react';

interface Order {
  id: string;
  amount: number;
  paymentMethod: string;
  zone?: {
    name: string;
    rate: number;
    color: string;
  };
}

interface ShiftStatsProps {
  refreshTrigger: number;
}

export function ShiftStats({ refreshTrigger }: ShiftStatsProps) {
  const [stats, setStats] = useState({
    totalEarnings: 0,
    totalOrders: 0,
    cashPayments: 0,
    zoneEarnings: 0
  });

  useEffect(() => {
    fetchStats();
  }, [refreshTrigger]);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/orders');
      if (response.ok) {
        const data = await response.json();
        const orders: Order[] = data.orders || [];
        
        const totalEarnings = orders.reduce((sum, order) => sum + order.amount, 0);
        const totalOrders = orders.length;
        const cashPayments = orders.filter(order => order.paymentMethod === 'CASH').length;
        const zoneEarnings = orders.reduce((sum, order) => {
          return sum + (order.zone?.rate || 0);
        }, 0);

        setStats({
          totalEarnings,
          totalOrders,
          cashPayments,
          zoneEarnings
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const statCards = [
    {
      title: 'Заработано за смену',
      value: `${stats.zoneEarnings}₽`,
      icon: DollarSign,
      color: 'text-green-500',
      bg: 'bg-green-500/10'
    },
    {
      title: 'Всего заказов',
      value: stats.totalOrders.toString(),
      icon: Package,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10'
    },
    {
      title: 'Сумма заказов',
      value: `${stats.totalEarnings.toFixed(0)}₽`,
      icon: Timer,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10'
    },
    {
      title: 'Наличных',
      value: stats.cashPayments.toString(),
      icon: CreditCard,
      color: 'text-orange-500',
      bg: 'bg-orange-500/10'
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat, index) => (
        <div key={index} className="card">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${stat.bg}`}>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground truncate">
                {stat.title}
              </p>
              <p className="text-lg font-bold animate-count-up">
                {stat.value}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
