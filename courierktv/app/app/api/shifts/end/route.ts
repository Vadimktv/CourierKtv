
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

    // Find active shift
    const activeShift = await prisma.shift.findFirst({
      where: {
        userId: user.id,
        isActive: true,
      },
      include: {
        receipts: true,
      },
    });

    if (!activeShift) {
      return NextResponse.json(
        { message: 'Активная смена не найдена' },
        { status: 400 }
      );
    }

    // Calculate totals
    const totalEarnings = activeShift.receipts.reduce((sum, receipt) => {
      return sum + (receipt.earnings || 0);
    }, 0);

    const totalOrders = activeShift.receipts.length;

    // End shift
    const shift = await prisma.shift.update({
      where: { id: activeShift.id },
      data: {
        isActive: false,
        endTime: new Date(),
        totalEarnings,
        totalOrders,
      },
    });

    return NextResponse.json({ shift });
  } catch (error) {
    console.error('Error ending shift:', error);
    return NextResponse.json(
      { message: 'Ошибка завершения смены' },
      { status: 500 }
    );
  }
}
