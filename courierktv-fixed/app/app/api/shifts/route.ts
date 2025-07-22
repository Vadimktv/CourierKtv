
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Не авторизован' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action } = body;

    if (action === 'start') {
      // Проверяем, есть ли активная смена
      const activeShift = await prisma.shift.findFirst({
        where: {
          userId: session.user.id,
          endTime: null
        }
      });

      if (activeShift) {
        return NextResponse.json(
          { error: 'Смена уже начата' },
          { status: 400 }
        );
      }

      // Создаем новую смену
      const shift = await prisma.shift.create({
        data: {
          userId: session.user.id,
          startTime: new Date()
        }
      });

      return NextResponse.json({ shift });
    } else if (action === 'end') {
      // Находим активную смену
      const activeShift = await prisma.shift.findFirst({
        where: {
          userId: session.user.id,
          endTime: null
        }
      });

      if (!activeShift) {
        return NextResponse.json(
          { error: 'Активная смена не найдена' },
          { status: 400 }
        );
      }

      // Завершаем смену
      const updatedShift = await prisma.shift.update({
        where: { id: activeShift.id },
        data: { endTime: new Date() }
      });

      return NextResponse.json({ shift: updatedShift });
    }

    return NextResponse.json(
      { error: 'Неверное действие' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Shift API error:', error);
    return NextResponse.json(
      { error: 'Ошибка при управлении сменой' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Не авторизован' },
        { status: 401 }
      );
    }

    // Получаем активную смену
    const activeShift = await prisma.shift.findFirst({
      where: {
        userId: session.user.id,
        endTime: null
      },
      include: {
        orders: true
      }
    });

    return NextResponse.json({ activeShift });
  } catch (error) {
    console.error('Shift fetch error:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении смены' },
      { status: 500 }
    );
  }
}
