
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Начинаем seeding базы данных...');

  // Create demo courier user
  const courierUser = await prisma.user.upsert({
    where: { email: 'john@doe.com' },
    update: {},
    create: {
      email: 'john@doe.com',
      password: await bcrypt.hash('johndoe123', 12),
      name: 'Иван Курьеров',
      role: 'courier',
      phone: '+7 (900) 123-45-67',
      city: 'Москва',
    },
  });

  // Create demo restaurant user
  const restaurantUser = await prisma.user.upsert({
    where: { email: 'restaurant@demo.com' },
    update: {},
    create: {
      email: 'restaurant@demo.com',
      password: await bcrypt.hash('restaurant123', 12),
      name: 'РОНІ DARK KITCHEN',
      role: 'restaurant',
      phone: '+7 (495) 123-45-67',
      city: 'Москва',
    },
  });

  console.log('✅ Создали пользователей');

  // Create delivery zones
  const zones = [
    { name: 'purple', displayName: 'Фиолетовая', rate: 120, color: '#8B5CF6' },
    { name: 'blue', displayName: 'Синяя', rate: 100, color: '#3B82F6' },
    { name: 'red', displayName: 'Красная', rate: 140, color: '#EF4444' },
    { name: 'green', displayName: 'Зеленая', rate: 110, color: '#10B981' },
  ];

  for (const zone of zones) {
    await prisma.deliveryZone.upsert({
      where: { name: zone.name },
      update: zone,
      create: zone,
    });
  }

  console.log('✅ Создали зоны доставки');

  // Create demo receipt and order for courier
  const demoReceipt = await prisma.receipt.create({
    data: {
      fileName: 'demo-receipt.jpg',
      fileSize: 150000,
      fileType: 'image/jpeg',
      ocrStatus: 'completed',
      rawOcrText: 'Демонстрационные данные чека для тестирования',
      userId: courierUser.id,
    },
  });

  const demoOrder = await prisma.order.create({
    data: {
      receiptId: demoReceipt.id,
      userId: courierUser.id,
      restaurantName: 'РОНІ DARK KITCHEN',
      deliveryAddress: 'ул. Ленина, д. 10, кв. 25',
      entrance: '2',
      floor: '5',
      apartment: '25',
      phoneNumber: '+7 (900) 555-33-22',
      orderAmount: 1200,
      paymentMethod: 'online',
      orderNumber: 'ORD-123456',
      status: 'completed',
      completedAt: new Date(),
      finalPaymentMethod: 'paid',
      confirmedAmount: 1200,
      zone: 'red',
      earnings: 140,
    },
  });

  // Create demo shift for courier
  const demoShift = await prisma.shift.create({
    data: {
      userId: courierUser.id,
      isActive: true,
      totalOrders: 1,
      totalEarnings: 140,
      redCount: 1,
      redEarnings: 140,
    },
  });

  // Update order with shift
  await prisma.order.update({
    where: { id: demoOrder.id },
    data: { shiftId: demoShift.id },
  });

  console.log('✅ Создали демонстрационные данные');

  console.log('🎉 Seeding завершен успешно!');
  console.log('');
  console.log('📝 Демо-аккаунты:');
  console.log('👤 Курьер: john@doe.com / johndoe123');
  console.log('🏪 Ресторан: restaurant@demo.com / restaurant123');
}

main()
  .catch((e) => {
    console.error('❌ Ошибка seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
