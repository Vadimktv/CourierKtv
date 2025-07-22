
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { paymentMethod } = body

    if (!paymentMethod) {
      return NextResponse.json({ error: 'Payment method is required' }, { status: 400 })
    }

    const order = await db.order.update({
      where: {
        id: params?.id ?? '',
        userId: session.user.id
      },
      data: {
        status: 'completed',
        paymentMethod
      }
    })

    // Update statistics
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const stats = await db.statistics.findUnique({
      where: { userId: session.user.id }
    })

    if (stats) {
      await db.statistics.update({
        where: { userId: session.user.id },
        data: {
          totalEarnings: stats.totalEarnings + order.earnings,
          todayEarnings: stats.todayEarnings + order.earnings,
          totalOrders: stats.totalOrders + 1,
          todayOrders: stats.todayOrders + 1,
          lastUpdated: new Date()
        }
      })
    } else {
      await db.statistics.create({
        data: {
          userId: session.user.id,
          totalEarnings: order.earnings,
          todayEarnings: order.earnings,
          totalOrders: 1,
          todayOrders: 1
        }
      })
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error('Error completing order:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
