
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cityId = searchParams.get('cityId');

    if (!cityId) {
      return NextResponse.json(
        { message: 'City ID обязателен' },
        { status: 400 }
      );
    }

    const zones = await prisma.zone.findMany({
      where: { cityId },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(zones);
  } catch (error) {
    console.error('Error fetching zones:', error);
    return NextResponse.json(
      { message: 'Ошибка загрузки зон' },
      { status: 500 }
    );
  }
}
