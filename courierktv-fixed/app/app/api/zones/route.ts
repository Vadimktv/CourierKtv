
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Не авторизован' },
        { status: 401 }
      );
    }

    // Получаем пользователя с городом
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { city: true }
    });

    if (!user?.cityId) {
      return NextResponse.json(
        { error: 'Город пользователя не найден' },
        { status: 400 }
      );
    }

    // Получаем зоны города
    const zones = await prisma.zone.findMany({
      where: {
        cityId: user.cityId
      },
      orderBy: {
        rate: 'desc'
      }
    });

    return NextResponse.json({ zones });
  } catch (error) {
    console.error('Zones fetch error:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении зон' },
      { status: 500 }
    );
  }
}
