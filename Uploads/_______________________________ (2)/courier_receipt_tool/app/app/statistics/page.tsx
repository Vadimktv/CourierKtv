
'use client';

import StatisticsDashboard from '@/components/statistics-dashboard';
import { BarChart3 } from 'lucide-react';

export default function StatisticsPage() {
  return (
    <div className="min-h-screen-mobile bg-gradient-to-br from-background to-muted/30">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <BarChart3 className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">Статистика и аналитика</h1>
          </div>
          <p className="text-muted-foreground">
            Анализируйте производительность и получайте инсайты из данных заказов
          </p>
        </div>

        {/* Dashboard */}
        <StatisticsDashboard />
      </div>
    </div>
  );
}
