
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getZoneByAddress } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { message: 'Не авторизован' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { city: true },
    });

    if (!user) {
      return NextResponse.json(
        { message: 'Пользователь не найден' },
        { status: 404 }
      );
    }

    const { address } = await request.json();

    if (!address) {
      return NextResponse.json(
        { message: 'Адрес обязателен' },
        { status: 400 }
      );
    }

    // Get zones for the user's city
    const zones = await prisma.zone.findMany({
      where: { cityId: user.cityId || undefined },
    });

    let zone = null;
    if (zones.length > 0) {
      zone = getZoneByAddress(address, zones);
    }

    return NextResponse.json({
      address,
      zone,
      city: user.city,
    });
  } catch (error) {
    console.error('Error searching zone:', error);
    return NextResponse.json(
      { message: 'Ошибка поиска зоны' },
      { status: 500 }
    );
  }
}
