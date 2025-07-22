
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

export const dynamic = "force-dynamic"

const prisma = new PrismaClient()

// Get detailed statistics for current shift
export async function GET() {
  try {
    const activeShift = await prisma.shift.findFirst({
      where: { isActive: true },
      include: {
        orders: {
          where: { status: 'completed' },
          include: {
            receipt: true
          },
          orderBy: { completedAt: 'desc' }
        }
      }
    })

    if (!activeShift) {
      return NextResponse.json({
        shift: null,
        statistics: null,
        paymentBreakdown: null,
        zoneBreakdown: null,
        ordersList: []
      })
    }

    const completedOrders = activeShift.orders

    // Calculate payment method breakdown
    const paymentBreakdown = {
      cash: {
        count: 0,
        amount: 0,
        earnings: 0
      },
      terminal: {
        count: 0,
        amount: 0,
        earnings: 0
      },
      transfer: {
        count: 0,
        amount: 0,
        earnings: 0
      },
      paid: {
        count: 0,
        amount: 0,
        earnings: 0
      }
    }

    // Calculate zone breakdown
    const zoneBreakdown = {
      purple: {
        count: 0,
        amount: 0,
        earnings: 0,
        displayName: 'Фиолетовая',
        color: '#8B5CF6'
      },
      blue: {
        count: 0,
        amount: 0,
        earnings: 0,
        displayName: 'Синяя',
        color: '#3B82F6'
      },
      red: {
        count: 0,
        amount: 0,
        earnings: 0,
        displayName: 'Красная',
        color: '#EF4444'
      },
      green: {
        count: 0,
        amount: 0,
        earnings: 0,
        displayName: 'Зеленая',
        color: '#10B981'
      }
    }

    // Process each completed order
    completedOrders.forEach(order => {
      const amount = order.confirmedAmount || order.orderAmount || 0
      const earnings = order.earnings || 0

      // Payment method statistics
      if (order.finalPaymentMethod) {
        const method = order.finalPaymentMethod as keyof typeof paymentBreakdown
        if (paymentBreakdown[method]) {
          paymentBreakdown[method].count += 1
          paymentBreakdown[method].amount += amount
          paymentBreakdown[method].earnings += earnings
        }
      }

      // Zone statistics
      if (order.zone) {
        const zone = order.zone as keyof typeof zoneBreakdown
        if (zoneBreakdown[zone]) {
          zoneBreakdown[zone].count += 1
          zoneBreakdown[zone].amount += amount
          zoneBreakdown[zone].earnings += earnings
        }
      }
    })

    // Calculate totals
    const totalOrders = completedOrders.length
    const totalAmount = completedOrders.reduce((sum, order) => 
      sum + (order.confirmedAmount || order.orderAmount || 0), 0
    )
    const totalEarnings = completedOrders.reduce((sum, order) => 
      sum + (order.earnings || 0), 0
    )

    // Calculate shift duration
    const shiftStart = activeShift.startTime
    const now = new Date()
    const durationMs = now.getTime() - shiftStart.getTime()
    const durationHours = Math.floor(durationMs / (1000 * 60 * 60))
    const durationMinutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60))

    const statistics = {
      totalOrders,
      totalAmount: Math.round(totalAmount * 100) / 100,
      totalEarnings: Math.round(totalEarnings * 100) / 100,
      shiftStart,
      shiftDuration: {
        hours: durationHours,
        minutes: durationMinutes,
        formatted: `${durationHours}ч ${durationMinutes}м`
      },
      averageOrderValue: totalOrders > 0 ? Math.round((totalAmount / totalOrders) * 100) / 100 : 0,
      averageEarningsPerOrder: totalOrders > 0 ? Math.round((totalEarnings / totalOrders) * 100) / 100 : 0
    }

    return NextResponse.json({
      shift: activeShift,
      statistics,
      paymentBreakdown,
      zoneBreakdown,
      ordersList: completedOrders.map(order => ({
        id: order.id,
        restaurantName: order.restaurantName,
        deliveryAddress: order.deliveryAddress,
        orderAmount: order.orderAmount,
        confirmedAmount: order.confirmedAmount,
        finalPaymentMethod: order.finalPaymentMethod,
        zone: order.zone,
        earnings: order.earnings,
        completedAt: order.completedAt,
        phoneNumber: order.phoneNumber
      }))
    })

  } catch (error) {
    console.error('Error fetching detailed statistics:', error)
    return NextResponse.json(
      { error: 'Ошибка получения статистики' },
      { status: 500 }
    )
  }
}
