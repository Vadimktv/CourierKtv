
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Создаем город Геленджик
  const gelendzhik = await prisma.city.upsert({
    where: { name: 'Геленджик' },
    update: {},
    create: {
      name: 'Геленджик',
    },
  });

  console.log('🏙️ Created city:', gelendzhik.name);

  // Создаем зоны Геленджика
  const zones = [
    { name: 'Фиолетовая', color: '#8B5CF6', rate: 400 },
    { name: 'Зеленая', color: '#10B981', rate: 200 },
    { name: 'Красная', color: '#EF4444', rate: 100 },
    { name: 'Синяя', color: '#3B82F6', rate: 150 },
  ];

  for (const zone of zones) {
    const createdZone = await prisma.zone.upsert({
      where: { 
        cityId_name: {
          cityId: gelendzhik.id,
          name: zone.name
        }
      },
      update: {
        color: zone.color,
        rate: zone.rate,
      },
      create: {
        name: zone.name,
        color: zone.color,
        rate: zone.rate,
        cityId: gelendzhik.id,
      },
    });
    console.log(`🎯 Created zone: ${createdZone.name} (${createdZone.rate}₽)`);
  }

  // Создаем демо пользователя
  const hashedPassword = await bcrypt.hash('johndoe123', 12);
  const demoUser = await prisma.user.upsert({
    where: { email: 'john@doe.com' },
    update: {
      password: hashedPassword,
      cityId: gelendzhik.id,
    },
    create: {
      email: 'john@doe.com',
      name: 'Джон Доу',
      password: hashedPassword,
      cityId: gelendzhik.id,
    },
  });

  console.log('👤 Created demo user:', demoUser.email);

  console.log('✅ Database seeded successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error seeding database:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
