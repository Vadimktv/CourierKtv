
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const restaurant = url.searchParams.get('restaurant');

    const skip = (page - 1) * limit;

    const whereConditions: any = {};

    if (startDate) {
      whereConditions.createdAt = {
        ...whereConditions.createdAt,
        gte: new Date(startDate)
      };
    }

    if (endDate) {
      whereConditions.createdAt = {
        ...whereConditions.createdAt,
        lte: new Date(endDate + 'T23:59:59')
      };
    }

    if (restaurant) {
      whereConditions.restaurant = {
        contains: restaurant,
        mode: 'insensitive'
      };
    }

    const [orders, totalCount] = await Promise.all([
      prisma.order.findMany({
        where: whereConditions,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          processingHistory: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        }
      }),
      prisma.order.count({ where: whereConditions })
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error: any) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ 
      error: 'Ошибка получения заказов' 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const orderId = url.searchParams.get('id');

    if (!orderId) {
      return NextResponse.json({ error: 'ID заказа обязателен' }, { status: 400 });
    }

    await prisma.order.delete({
      where: { id: orderId }
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Error deleting order:', error);
    return NextResponse.json({ 
      error: 'Ошибка удаления заказа' 
    }, { status: 500 });
  }
}
