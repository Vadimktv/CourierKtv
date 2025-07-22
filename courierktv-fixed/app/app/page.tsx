
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { DashboardHeader } from '@/components/dashboard/header';
import { ShiftControl } from '@/components/dashboard/shift-control';
import { ShiftStats } from '@/components/dashboard/shift-stats';
import { OrderList } from '@/components/dashboard/order-list';
import { AddOrderForm } from '@/components/dashboard/add-order-form';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isAddOrderOpen, setIsAddOrderOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const handleOrderAdded = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleShiftChange = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      
      <main className="container max-w-screen-xl mx-auto px-4 py-6">
        <div className="space-y-6">
          {/* Welcome */}
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Добро пожаловать, {session.user?.name}!
            </h1>
            <p className="text-muted-foreground">
              Управляйте сменами и отслеживайте заказы
            </p>
          </div>

          {/* Shift Control */}
          <ShiftControl onShiftChange={handleShiftChange} />

          {/* Statistics */}
          <ShiftStats refreshTrigger={refreshTrigger} />

          {/* Add Order Button */}
          <div className="flex justify-center">
            <Button
              onClick={() => setIsAddOrderOpen(true)}
              size="lg"
              className="w-full max-w-md"
            >
              <Plus className="mr-2 h-5 w-5" />
              Добавить заказ
            </Button>
          </div>

          {/* Orders List */}
          <OrderList refreshTrigger={refreshTrigger} />
        </div>
      </main>

      {/* Add Order Modal */}
      <AddOrderForm
        isOpen={isAddOrderOpen}
        onClose={() => setIsAddOrderOpen(false)}
        onOrderAdded={handleOrderAdded}
      />
    </div>
  );
}
