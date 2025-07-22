
import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { AuthPage } from '@/components/auth-page';
import { Dashboard } from '@/components/dashboard';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return <AuthPage />;
  }

  return <Dashboard />;
}
