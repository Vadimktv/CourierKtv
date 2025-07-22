
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, role = 'courier' } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Все поля обязательны' }, { status: 400 })
    }

    // Проверяем, существует ли пользователь
    const existingUser = await db.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json({ error: 'Пользователь с таким email уже существует' }, { status: 400 })
    }

    // Хэшируем пароль
    const hashedPassword = await bcrypt.hash(password, 12)

    // Создаем пользователя
    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role
      }
    })

    // Создаем статистику для пользователя
    await db.statistics.create({
      data: {
        userId: user.id,
        totalEarnings: 0,
        todayEarnings: 0,
        totalOrders: 0,
        todayOrders: 0
      }
    })

    return NextResponse.json({ 
      message: 'Пользователь успешно создан',
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json({ error: 'Ошибка при регистрации' }, { status: 500 })
  }
}
