
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'

export const dynamic = "force-dynamic"

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
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

    const { orderId, finalPaymentMethod, confirmedAmount, zone } = await request.json()

    // Check that the order belongs to the current user
    const order = await prisma.order.findFirst({
      where: { 
        id: orderId,
        userId: user.id
      }
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Заказ не найден или доступ запрещен' },
        { status: 404 }
      )
    }

    // Get zone rate
    const zoneData = await prisma.deliveryZone.findUnique({
      where: { name: zone }
    })

    if (!zoneData) {
      return NextResponse.json(
        { error: 'Зона не найдена' },
        { status: 404 }
      )
    }

    const earnings = zoneData.rate

    // Get or create active shift for the current user
    let activeShift = await prisma.shift.findFirst({
      where: { 
        isActive: true,
        userId: user.id
      }
    })

    if (!activeShift) {
      activeShift = await prisma.shift.create({
        data: { 
          isActive: true,
          userId: user.id
        }
      })
    }

    // Complete the order
    const completedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'completed',
        completedAt: new Date(),
        finalPaymentMethod,
        confirmedAmount,
        zone,
        earnings,
        shiftId: activeShift.id
      }
    })

    // Update shift statistics
    const zoneCountField = `${zone}Count` as 'purpleCount' | 'blueCount' | 'redCount' | 'greenCount'
    const zoneEarningsField = `${zone}Earnings` as 'purpleEarnings' | 'blueEarnings' | 'redEarnings' | 'greenEarnings'

    await prisma.shift.update({
      where: { id: activeShift.id },
      data: {
        totalOrders: { increment: 1 },
        totalEarnings: { increment: earnings },
        [zoneCountField]: { increment: 1 },
        [zoneEarningsField]: { increment: earnings }
      }
    })

    return NextResponse.json(completedOrder)
  } catch (error) {
    console.error('Error completing order:', error)
    return NextResponse.json(
      { error: 'Ошибка завершения заказа' },
      { status: 500 }
    )
  }
}
