
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST() {
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

    // Check if user already has an active shift
    const activeShift = await prisma.shift.findFirst({
      where: {
        userId: user.id,
        isActive: true,
      },
    });

    if (activeShift) {
      return NextResponse.json(
        { message: 'У вас уже есть активная смена' },
        { status: 400 }
      );
    }

    // Create new shift
    const shift = await prisma.shift.create({
      data: {
        userId: user.id,
        isActive: true,
      },
    });

    return NextResponse.json({ shift });
  } catch (error) {
    console.error('Error starting shift:', error);
    return NextResponse.json(
      { message: 'Ошибка начала смены' },
      { status: 500 }
    );
  }
}
