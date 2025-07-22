
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'

export const dynamic = "force-dynamic"

const prisma = new PrismaClient()

// Get all completed orders for current shift and user
export async function GET() {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Не авторизован' },
        { status: 401 }
      )
    }

    // Get user and check role
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user || user.role !== 'courier') {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      )
    }

    const activeShift = await prisma.shift.findFirst({
      where: { 
        isActive: true,
        userId: user.id
      }
    })

    if (!activeShift) {
      return NextResponse.json([])
    }

    const orders = await prisma.order.findMany({
      where: { 
        status: 'completed',
        shiftId: activeShift.id,
        userId: user.id
      },
      include: {
        receipt: true
      },
      orderBy: { completedAt: 'desc' }
    })

    return NextResponse.json(orders)
  } catch (error) {
    console.error('Error fetching completed orders:', error)
    return NextResponse.json(
      { error: 'Ошибка получения завершенных заказов' },
      { status: 500 }
    )
  }
}
