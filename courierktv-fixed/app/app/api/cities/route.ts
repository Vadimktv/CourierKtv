
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cities = await prisma.city.findMany({
      orderBy: { name: 'asc' }
    });

    return NextResponse.json(cities);
  } catch (error) {
    console.error('Cities fetch error:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении списка городов' },
      { status: 500 }
    );
  }
}
