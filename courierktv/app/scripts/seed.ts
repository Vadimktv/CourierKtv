
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create demo user
  const hashedPassword = await bcrypt.hash('johndoe123', 12);
  
  // Create cities
  const gelendzhik = await prisma.city.upsert({
    where: { name: 'Геленджик' },
    update: {},
    create: {
      name: 'Геленджик',
      region: 'Краснодарский край',
    },
  });

  const moscow = await prisma.city.upsert({
    where: { name: 'Москва' },
    update: {},
    create: {
      name: 'Москва',
      region: 'Московская область',
    },
  });

  const spb = await prisma.city.upsert({
    where: { name: 'Санкт-Петербург' },
    update: {},
    create: {
      name: 'Санкт-Петербург',
      region: 'Ленинградская область',
    },
  });

  // Create zones for Gelendzhik
  const purpleZone = await prisma.zone.upsert({
    where: { id: 'purple-zone-gelendzhik' },
    update: {},
    create: {
      id: 'purple-zone-gelendzhik',
      name: 'Фиолетовая зона',
      color: '#8A2BE2',
      rate: 400,
      cityId: gelendzhik.id,
      coordinates: {
        type: 'Polygon',
        coordinates: [[[38.065, 44.570], [38.095, 44.570], [38.095, 44.540], [38.065, 44.540], [38.065, 44.570]]]
      }
    },
  });

  const greenZone = await prisma.zone.upsert({
    where: { id: 'green-zone-gelendzhik' },
    update: {},
    create: {
      id: 'green-zone-gelendzhik',
      name: 'Зеленая зона',
      color: '#32CD32',
      rate: 200,
      cityId: gelendzhik.id,
      coordinates: {
        type: 'Polygon',
        coordinates: [[[38.095, 44.570], [38.125, 44.570], [38.125, 44.540], [38.095, 44.540], [38.095, 44.570]]]
      }
    },
  });

  const redZone = await prisma.zone.upsert({
    where: { id: 'red-zone-gelendzhik' },
    update: {},
    create: {
      id: 'red-zone-gelendzhik',
      name: 'Красная зона',
      color: '#FF4136',
      rate: 100,
      cityId: gelendzhik.id,
      coordinates: {
        type: 'Polygon',
        coordinates: [[[38.040, 44.570], [38.065, 44.570], [38.065, 44.540], [38.040, 44.540], [38.040, 44.570]]]
      }
    },
  });

  const blueZone = await prisma.zone.upsert({
    where: { id: 'blue-zone-gelendzhik' },
    update: {},
    create: {
      id: 'blue-zone-gelendzhik',
      name: 'Синяя зона',
      color: '#0074D9',
      rate: 150,
      cityId: gelendzhik.id,
      coordinates: {
        type: 'Polygon',
        coordinates: [[[38.010, 44.570], [38.040, 44.570], [38.040, 44.540], [38.010, 44.540], [38.010, 44.570]]]
      }
    },
  });

  // Create demo user
  const demoUser = await prisma.user.upsert({
    where: { email: 'john@doe.com' },
    update: {},
    create: {
      email: 'john@doe.com',
      name: 'Иван Курьеров',
      password: hashedPassword,
      cityId: gelendzhik.id,
    },
  });

  // Add some Russian cities
  const cities = [
    { name: 'Новосибирск', region: 'Новосибирская область' },
    { name: 'Екатеринбург', region: 'Свердловская область' },
    { name: 'Казань', region: 'Республика Татарстан' },
    { name: 'Нижний Новгород', region: 'Нижегородская область' },
    { name: 'Самара', region: 'Самарская область' },
    { name: 'Омск', region: 'Омская область' },
    { name: 'Челябинск', region: 'Челябинская область' },
    { name: 'Ростов-на-Дону', region: 'Ростовская область' },
    { name: 'Уфа', region: 'Республика Башкортостан' },
    { name: 'Красноярск', region: 'Красноярский край' },
    { name: 'Воронеж', region: 'Воронежская область' },
    { name: 'Пермь', region: 'Пермский край' },
    { name: 'Волгоград', region: 'Волгоградская область' },
    { name: 'Краснодар', region: 'Краснодарский край' },
    { name: 'Саратов', region: 'Саратовская область' },
  ];

  for (const city of cities) {
    await prisma.city.upsert({
      where: { name: city.name },
      update: {},
      create: city,
    });
  }

  // Create some settings
  await prisma.settings.upsert({
    where: { key: 'telegram_bot_token' },
    update: {},
    create: {
      key: 'telegram_bot_token',
      value: '8063129404:AAEuKevvt21X2_q2MhK5Pcuw6JD6rTtk8mQ',
      description: 'Telegram Bot Token for integration',
    },
  });

  console.log('✅ Database seeded successfully!');
  console.log('🔑 Demo user: john@doe.com / johndoe123');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
