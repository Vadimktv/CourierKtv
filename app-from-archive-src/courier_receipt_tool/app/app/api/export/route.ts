
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const format = url.searchParams.get('format') || 'csv';
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

    const orders = await prisma.order.findMany({
      where: whereConditions,
      orderBy: { createdAt: 'desc' }
    });

    if (format === 'csv') {
      const csvHeaders = [
        'ID',
        'Дата создания',
        'Ресторан',
        'Дата заказа',
        'Время заказа',
        'Полный адрес',
        'Улица',
        'Дом',
        'Корпус',
        'Подъезд',
        'Этаж',
        'Квартира',
        'Телефон',
        'Сумма',
        'Способ оплаты',
        'Статус'
      ].join(',');

      const csvRows = orders.map(order => [
        order.id,
        order.createdAt.toISOString(),
        `"${order.restaurant}"`,
        order.orderDate?.toISOString().split('T')[0] || '',
        order.orderTime || '',
        `"${order.fullAddress}"`,
        order.street || '',
        order.houseNumber || '',
        order.building || '',
        order.entrance || '',
        order.floor || '',
        order.apartment || '',
        order.phoneNumber,
        order.totalAmount,
        order.paymentMethod,
        order.status
      ].join(','));

      const csvContent = [csvHeaders, ...csvRows].join('\n');
      
      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="orders_export_${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    }

    // Default JSON export
    return NextResponse.json(orders);

  } catch (error: any) {
    console.error('Error exporting data:', error);
    return NextResponse.json({ 
      error: 'Ошибка экспорта данных' 
    }, { status: 500 });
  }
}
