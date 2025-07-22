
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

export const dynamic = "force-dynamic"

const prisma = new PrismaClient()

// Initialize default zones
export async function POST() {
  try {
    const defaultZones = [
      {
        name: 'purple',
        displayName: 'Фиолетовая',
        rate: 400,
        color: '#8B5CF6'
      },
      {
        name: 'blue',
        displayName: 'Синяя',
        rate: 150,
        color: '#3B82F6'
      },
      {
        name: 'red',
        displayName: 'Красная',
        rate: 100,
        color: '#EF4444'
      },
      {
        name: 'green',
        displayName: 'Зеленая',
        rate: 200,
        color: '#10B981'
      }
    ]

    for (const zone of defaultZones) {
      await prisma.deliveryZone.upsert({
        where: { name: zone.name as any },
        update: {},
        create: zone as any
      })
    }

    const zones = await prisma.deliveryZone.findMany({
      orderBy: { name: 'asc' }
    })

    return NextResponse.json(zones)
  } catch (error) {
    console.error('Error seeding zones:', error)
    return NextResponse.json(
      { error: 'Ошибка инициализации зон' },
      { status: 500 }
    )
  }
}
