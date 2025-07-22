
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
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
    });

    if (!user) {
      return NextResponse.json(
        { message: 'Пользователь не найден' },
        { status: 404 }
      );
    }

    // Get completed shifts
    const shifts = await prisma.shift.findMany({
      where: {
        userId: user.id,
        isActive: false,
        endTime: { not: null },
      },
      include: {
        receipts: {
          include: {
            zone: true,
          },
        },
      },
      orderBy: {
        endTime: 'desc',
      },
    });

    return NextResponse.json(shifts);
  } catch (error) {
    console.error('Error fetching shift history:', error);
    return NextResponse.json(
      { message: 'Ошибка загрузки истории смен' },
      { status: 500 }
    );
  }
}
