
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

export const dynamic = "force-dynamic"

const prisma = new PrismaClient()

// Generate shift report
export async function POST() {
  try {
    const activeShift = await prisma.shift.findFirst({
      where: { isActive: true },
      include: {
        orders: {
          where: { status: 'completed' },
          include: {
            receipt: true
          },
          orderBy: { completedAt: 'asc' }
        }
      }
    })

    if (!activeShift) {
      return NextResponse.json(
        { error: 'Нет активной смены для генерации отчета' },
        { status: 404 }
      )
    }

    const completedOrders = activeShift.orders

    // Generate detailed report
    const report = {
      shiftId: activeShift.id,
      date: new Date().toLocaleDateString('ru-RU'),
      startTime: activeShift.startTime.toLocaleTimeString('ru-RU', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      endTime: new Date().toLocaleTimeString('ru-RU', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      duration: (() => {
        const durationMs = Date.now() - activeShift.startTime.getTime()
        const hours = Math.floor(durationMs / (1000 * 60 * 60))
        const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60))
        return `${hours}ч ${minutes}м`
      })(),
      
      summary: {
        totalOrders: completedOrders.length,
        totalAmount: completedOrders.reduce((sum, order) => 
          sum + (order.confirmedAmount || order.orderAmount || 0), 0
        ),
        totalEarnings: completedOrders.reduce((sum, order) => 
          sum + (order.earnings || 0), 0
        )
      },

      paymentBreakdown: (() => {
        const breakdown = {
          cash: { count: 0, amount: 0, label: 'Наличные' },
          terminal: { count: 0, amount: 0, label: 'Терминал' },
          transfer: { count: 0, amount: 0, label: 'Переводы' },
          paid: { count: 0, amount: 0, label: 'Оплаченные' }
        }

        completedOrders.forEach(order => {
          const amount = order.confirmedAmount || order.orderAmount || 0
          const method = order.finalPaymentMethod as keyof typeof breakdown
          if (breakdown[method]) {
            breakdown[method].count += 1
            breakdown[method].amount += amount
          }
        })

        return breakdown
      })(),

      zoneBreakdown: (() => {
        const breakdown = {
          purple: { count: 0, earnings: 0, label: 'Фиолетовая зона' },
          blue: { count: 0, earnings: 0, label: 'Синяя зона' },
          red: { count: 0, earnings: 0, label: 'Красная зона' },
          green: { count: 0, earnings: 0, label: 'Зеленая зона' }
        }

        completedOrders.forEach(order => {
          const earnings = order.earnings || 0
          const zone = order.zone as keyof typeof breakdown
          if (breakdown[zone]) {
            breakdown[zone].count += 1
            breakdown[zone].earnings += earnings
          }
        })

        return breakdown
      })(),

      ordersList: completedOrders.map((order, index) => ({
        number: index + 1,
        time: order.completedAt?.toLocaleTimeString('ru-RU', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        restaurant: order.restaurantName || 'Неизвестно',
        address: order.deliveryAddress || 'Не указан',
        amount: order.confirmedAmount || order.orderAmount || 0,
        paymentMethod: (() => {
          switch (order.finalPaymentMethod) {
            case 'cash': return 'Наличные'
            case 'terminal': return 'Терминал'
            case 'transfer': return 'Перевод'
            case 'paid': return 'Оплачен'
            default: return 'Неизвестно'
          }
        })(),
        zone: (() => {
          switch (order.zone) {
            case 'purple': return 'Фиолетовая'
            case 'blue': return 'Синяя'
            case 'red': return 'Красная'
            case 'green': return 'Зеленая'
            default: return 'Неизвестно'
          }
        })(),
        earnings: order.earnings || 0
      })),

      generatedAt: new Date().toISOString()
    }

    return NextResponse.json(report)

  } catch (error) {
    console.error('Error generating shift report:', error)
    return NextResponse.json(
      { error: 'Ошибка генерации отчета' },
      { status: 500 }
    )
  }
}
