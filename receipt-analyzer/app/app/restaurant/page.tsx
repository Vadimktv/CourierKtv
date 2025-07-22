
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { RestaurantDashboard } from '@/components/restaurant/dashboard';

export const dynamic = "force-dynamic";

export default async function RestaurantPage() {
  const session = await getServerSession();
  
  // Redirect to home if not authenticated
  if (!session?.user) {
    redirect('/');
  }
  
  // Check if user has restaurant role
  if (session.user.role !== 'restaurant') {
    redirect('/');
  }

  return (
    <main className="min-h-screen bg-background">
      <RestaurantDashboard />
    </main>
  );
}
