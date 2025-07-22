
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cities = await prisma.city.findMany({
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(cities);
  } catch (error) {
    console.error('Error fetching cities:', error);
    return NextResponse.json(
      { message: 'Ошибка загрузки городов' },
      { status: 500 }
    );
  }
}
