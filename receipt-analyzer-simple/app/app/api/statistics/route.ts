
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let statistics = await db.statistics.findUnique({
      where: { userId: session.user.id }
    })

    if (!statistics) {
      statistics = await db.statistics.create({
        data: {
          userId: session.user.id,
          totalEarnings: 0,
          todayEarnings: 0,
          totalOrders: 0,
          todayOrders: 0
        }
      })
    }

    return NextResponse.json(statistics)
  } catch (error) {
    console.error('Error fetching statistics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
