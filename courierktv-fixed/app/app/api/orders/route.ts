
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
    const { address, phone, amount, paymentMethod, zoneId, receiptImage } = body;

    if (!address || !amount || !paymentMethod) {
      return NextResponse.json(
        { error: 'Адрес, сумма и способ оплаты обязательны' },
        { status: 400 }
      );
    }

    // Получаем активную смену
    const activeShift = await prisma.shift.findFirst({
      where: {
        userId: session.user.id,
        endTime: null
      }
    });

    if (!activeShift) {
      return NextResponse.json(
        { error: 'Нет активной смены. Начните смену сначала.' },
        { status: 400 }
      );
    }

    // Создаем заказ
    const order = await prisma.order.create({
      data: {
        userId: session.user.id,
        shiftId: activeShift.id,
        address,
        phone: phone || null,
        amount: parseFloat(amount),
        paymentMethod,
        zoneId: zoneId || null,
        receiptImage: receiptImage || null
      },
      include: {
        zone: true
      }
    });

    return NextResponse.json({ order });
  } catch (error) {
    console.error('Order creation error:', error);
    return NextResponse.json(
      { error: 'Ошибка при создании заказа' },
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

    // Получаем заказы текущей смены
    const activeShift = await prisma.shift.findFirst({
      where: {
        userId: session.user.id,
        endTime: null
      }
    });

    if (!activeShift) {
      return NextResponse.json({ orders: [] });
    }

    const orders = await prisma.order.findMany({
      where: {
        shiftId: activeShift.id
      },
      include: {
        zone: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Orders fetch error:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении заказов' },
      { status: 500 }
    );
  }
}
