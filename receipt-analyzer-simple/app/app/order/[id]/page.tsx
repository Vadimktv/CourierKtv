
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { OrderDetails } from '@/components/order-details'

interface OrderPageProps {
  params: {
    id: string
  }
}

export default async function OrderPage({ params }: OrderPageProps) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    redirect('/')
  }

  return <OrderDetails orderId={params?.id ?? ''} />
}
