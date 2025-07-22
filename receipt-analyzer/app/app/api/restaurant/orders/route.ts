
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Не авторизован' },
        { status: 401 }
      );
    }

    // Get user and check role
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user || user.role !== 'restaurant') {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      );
    }

    // For restaurants, show all orders (in a real app, this might be filtered by restaurant)
    const orders = await prisma.order.findMany({
      include: {
        receipt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ 
      orders: orders.map(order => ({
        id: order.id,
        receiptId: order.receiptId,
        userId: order.userId,
        restaurantName: order.restaurantName,
        deliveryAddress: order.deliveryAddress,
        entrance: order.entrance,
        floor: order.floor,
        apartment: order.apartment,
        phoneNumber: order.phoneNumber,
        orderAmount: order.orderAmount,
        paymentMethod: order.paymentMethod,
        orderNumber: order.orderNumber,
        latitude: order.latitude,
        longitude: order.longitude,
        status: order.status,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        completedAt: order.completedAt,
        finalPaymentMethod: order.finalPaymentMethod,
        confirmedAmount: order.confirmedAmount,
        zone: order.zone,
        earnings: order.earnings,
        shiftId: order.shiftId,
        courier: {
          name: order.user.name,
          phone: order.user.phone,
        }
      }))
    });

  } catch (error) {
    console.error('Restaurant orders fetch error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
