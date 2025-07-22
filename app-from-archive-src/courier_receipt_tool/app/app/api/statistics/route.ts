
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

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

    const [totalOrders, totalAmount, paymentMethods, restaurants, recentOrders] = await Promise.all([
      prisma.order.count({ where: whereConditions }),
      
      prisma.order.aggregate({
        where: whereConditions,
        _sum: { totalAmount: true }
      }),
      
      prisma.order.groupBy({
        by: ['paymentMethod'],
        where: whereConditions,
        _count: true,
        _sum: { totalAmount: true }
      }),
      
      prisma.order.groupBy({
        by: ['restaurant'],
        where: whereConditions,
        _count: true,
        _sum: { totalAmount: true },
        orderBy: { _count: { restaurant: 'desc' } },
        take: 10
      }),
      
      prisma.order.findMany({
        where: whereConditions,
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          restaurant: true,
          totalAmount: true,
          createdAt: true,
          fullAddress: true
        }
      })
    ]);

    const statistics = {
      totalOrders,
      totalAmount: totalAmount._sum.totalAmount || 0,
      averageOrderValue: totalOrders > 0 ? (totalAmount._sum.totalAmount || 0) / totalOrders : 0,
      paymentMethods: paymentMethods.map(pm => ({
        method: pm.paymentMethod,
        count: typeof pm._count === 'number' ? pm._count : 0,
        totalAmount: pm._sum?.totalAmount || 0
      })),
      topRestaurants: restaurants.map(r => ({
        name: r.restaurant,
        orderCount: typeof r._count === 'number' ? r._count : 0,
        totalAmount: r._sum?.totalAmount || 0
      })),
      recentOrders
    };

    return NextResponse.json(statistics);

  } catch (error: any) {
    console.error('Error fetching statistics:', error);
    return NextResponse.json({ 
      error: 'Ошибка получения статистики' 
    }, { status: 500 });
  }
}
