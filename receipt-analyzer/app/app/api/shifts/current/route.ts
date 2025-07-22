
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'

export const dynamic = "force-dynamic"

const prisma = new PrismaClient()

// Get current active shift
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
      },
      include: {
        orders: {
          where: { status: 'completed' },
          orderBy: { completedAt: 'desc' }
        }
      }
    })

    if (!activeShift) {
      // Create new shift if none exists
      const newShift = await prisma.shift.create({
        data: { 
          isActive: true,
          userId: user.id
        },
        include: {
          orders: true
        }
      })
      return NextResponse.json(newShift)
    }

    return NextResponse.json(activeShift)
  } catch (error) {
    console.error('Error fetching current shift:', error)
    return NextResponse.json(
      { error: 'Ошибка получения текущей смены' },
      { status: 500 }
    )
  }
}

// End current shift
export async function POST() {
  try {
    const activeShift = await prisma.shift.findFirst({
      where: { isActive: true }
    })

    if (!activeShift) {
      return NextResponse.json(
        { error: 'Нет активной смены' },
        { status: 404 }
      )
    }

    const endedShift = await prisma.shift.update({
      where: { id: activeShift.id },
      data: {
        isActive: false,
        endTime: new Date()
      },
      include: {
        orders: {
          where: { status: 'completed' },
          orderBy: { completedAt: 'desc' }
        }
      }
    })

    return NextResponse.json(endedShift)
  } catch (error) {
    console.error('Error ending shift:', error)
    return NextResponse.json(
      { error: 'Ошибка завершения смены' },
      { status: 500 }
    )
  }
}
