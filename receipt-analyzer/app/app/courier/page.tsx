
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { ReceiptAnalyzer } from '@/components/receipt-analyzer';

export const dynamic = "force-dynamic";

export default async function CourierPage() {
  const session = await getServerSession();
  
  // Redirect to home if not authenticated
  if (!session?.user) {
    redirect('/');
  }
  
  // Check if user has courier role (basic check, more detailed check will be in middleware)
  if (session.user.role !== 'courier') {
    redirect('/');
  }

  return (
    <main className="min-h-screen bg-background">
      <ReceiptAnalyzer />
    </main>
  );
}
