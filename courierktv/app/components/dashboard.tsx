
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { BottomNavigation } from '@/components/bottom-navigation';
import { ShiftDashboard } from '@/components/shift-dashboard';
import { ReceiptProcessor } from '@/components/receipt-processor';
import { ShiftHistory } from '@/components/shift-history';
import { ZoneMap } from '@/components/zone-map';
import { Settings } from '@/components/settings';
import { Loader2 } from 'lucide-react';

export function Dashboard() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState('shift');
  const [showReceiptProcessor, setShowReceiptProcessor] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.email) {
      fetchUser();
    }
  }, [session]);

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/user/profile');
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const renderContent = () => {
    if (showReceiptProcessor) {
      return (
        <ReceiptProcessor 
          onClose={() => setShowReceiptProcessor(false)}
          onReceiptProcessed={() => {
            setShowReceiptProcessor(false);
            // Refresh data if needed
          }}
        />
      );
    }

    switch (activeTab) {
      case 'shift':
        return (
          <ShiftDashboard 
            user={user}
            onAddReceipt={() => setShowReceiptProcessor(true)}
          />
        );
      case 'history':
        return <ShiftHistory user={user} />;
      case 'zones':
        return <ZoneMap user={user} />;
      case 'settings':
        return <Settings user={user} onUserUpdate={setUser} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="pb-20">
        {renderContent()}
      </main>
      
      {!showReceiptProcessor && (
        <BottomNavigation 
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      )}
    </div>
  );
}
