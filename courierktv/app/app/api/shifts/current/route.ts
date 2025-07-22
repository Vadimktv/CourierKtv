
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

    // Find active shift
    const activeShift = await prisma.shift.findFirst({
      where: {
        userId: user.id,
        isActive: true,
      },
      include: {
        receipts: {
          include: {
            zone: true,
          },
        },
      },
    });

    // Calculate statistics
    let stats = {
      totalEarnings: 0,
      totalOrders: 0,
      paymentMethods: {
        cash: 0,
        card: 0,
        transfer: 0,
        terminal: 0,
      },
      zones: {} as Record<string, number>,
    };

    if (activeShift?.receipts) {
      activeShift.receipts.forEach((receipt) => {
        stats.totalEarnings += receipt.earnings || 0;
        stats.totalOrders += 1;

        // Payment method stats
        if (receipt.paymentMethod === 'cash') {
          stats.paymentMethods.cash += receipt.totalAmount;
        } else if (receipt.paymentMethod === 'card') {
          stats.paymentMethods.card += receipt.totalAmount;
        } else if (receipt.paymentMethod === 'transfer') {
          stats.paymentMethods.transfer += receipt.totalAmount;
        } else if (receipt.paymentMethod === 'terminal') {
          stats.paymentMethods.terminal += receipt.totalAmount;
        }

        // Zone stats
        if (receipt.zone) {
          if (!stats.zones[receipt.zone.name]) {
            stats.zones[receipt.zone.name] = 0;
          }
          stats.zones[receipt.zone.name] += receipt.earnings || 0;
        }
      });
    }

    return NextResponse.json({
      shift: activeShift,
      stats,
    });
  } catch (error) {
    console.error('Error fetching current shift:', error);
    return NextResponse.json(
      { message: 'Ошибка загрузки текущей смены' },
      { status: 500 }
    );
  }
}
