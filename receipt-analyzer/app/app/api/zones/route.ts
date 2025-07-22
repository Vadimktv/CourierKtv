
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

export const dynamic = "force-dynamic"

const prisma = new PrismaClient()

// Get all delivery zones
export async function GET() {
  try {
    const zones = await prisma.deliveryZone.findMany({
      orderBy: { name: 'asc' }
    })

    return NextResponse.json(zones)
  } catch (error) {
    console.error('Error fetching zones:', error)
    return NextResponse.json(
      { error: 'Ошибка получения зон' },
      { status: 500 }
    )
  }
}

// Update zone rates
export async function PUT(request: NextRequest) {
  try {
    const { zones } = await request.json()

    const updates = zones.map((zone: any) =>
      prisma.deliveryZone.update({
        where: { name: zone.name },
        data: { rate: zone.rate }
      })
    )

    await Promise.all(updates)

    const updatedZones = await prisma.deliveryZone.findMany({
      orderBy: { name: 'asc' }
    })

    return NextResponse.json(updatedZones)
  } catch (error) {
    console.error('Error updating zones:', error)
    return NextResponse.json(
      { error: 'Ошибка обновления зон' },
      { status: 500 }
    )
  }
}
