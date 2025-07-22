
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Создаем демо аккаунт
  const hashedPassword = await bcrypt.hash('johndoe123', 12)
  
  const demoUser = await prisma.user.upsert({
    where: { email: 'john@doe.com' },
    update: {},
    create: {
      name: 'Иван Иванов',
      email: 'john@doe.com',
      password: hashedPassword,
      role: 'courier'
    }
  })

  // Создаем статистику для демо пользователя
  await prisma.statistics.upsert({
    where: { userId: demoUser.id },
    update: {},
    create: {
      userId: demoUser.id,
      totalEarnings: 12500,
      todayEarnings: 1200,
      totalOrders: 45,
      todayOrders: 3
    }
  })

  // Создаем несколько демо заказов
  await prisma.order.createMany({
    data: [
      {
        userId: demoUser.id,
        address: 'Геленджикский проспект, 15',
        phone: '+7999999999,12345',
        amount: 1250.50,
        zone: 'Зона 1',
        earnings: 187,
        status: 'completed',
        paymentMethod: 'cash'
      },
      {
        userId: demoUser.id,
        address: 'улица Красная, 23',
        phone: '+7888888888,67890',
        amount: 890.00,
        zone: 'Зона 2',
        earnings: 160,
        status: 'completed',
        paymentMethod: 'card'
      },
      {
        userId: demoUser.id,
        address: 'Туристическая улица, 7',
        phone: '+7777777777,11111',
        amount: 1560.75,
        zone: 'Зона 3',
        earnings: 312,
        status: 'active'
      }
    ]
  })

  console.log('Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
