
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Простая имитация OCR для демонстрации
const mockReceiptData = [
  {
    address: "Геленджикский проспект, 15",
    phone: "+7999999999,12345",
    amount: 1250.50,
    zone: "Зона 1"
  },
  {
    address: "улица Красная, 23",
    phone: "+7888888888,67890",
    amount: 890.00,
    zone: "Зона 2"
  },
  {
    address: "Туристическая улица, 7",
    phone: "+7777777777,11111",
    amount: 1560.75,
    zone: "Зона 3"
  }
]

function processAddress(address: string): string {
  // Простая обработка сокращений
  const replacements: { [key: string]: string } = {
    'гелен проспект': 'Геленджикский проспект',
    'кр.': 'Красная',
    'тур.': 'Туристическая',
    'ул.': 'улица',
    'пр.': 'проспект'
  }

  let processed = address.toLowerCase()
  for (const [short, full] of Object.entries(replacements)) {
    processed = processed.replace(short, full)
  }
  
  return processed.charAt(0).toUpperCase() + processed.slice(1)
}

function calculateEarnings(amount: number, zone: string): number {
  const zoneRates: { [key: string]: number } = {
    'Зона 1': 0.15, // 15%
    'Зона 2': 0.18, // 18%
    'Зона 3': 0.20, // 20%
    'Зона 4': 0.22  // 22%
  }
  
  const rate = zoneRates[zone] || 0.15
  return Math.round(amount * rate)
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Имитация обработки изображения
    await new Promise(resolve => setTimeout(resolve, 1500))

    // Выбираем случайные данные для демонстрации
    const mockData = mockReceiptData[Math.floor(Math.random() * mockReceiptData.length)]
    
    const processedAddress = processAddress(mockData.address)
    const earnings = calculateEarnings(mockData.amount, mockData.zone)

    const result = {
      address: processedAddress,
      phone: mockData.phone,
      amount: mockData.amount,
      zone: mockData.zone,
      earnings: earnings,
      success: true
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error analyzing receipt:', error)
    return NextResponse.json({ 
      error: 'Ошибка при обработке чека',
      success: false 
    }, { status: 500 })
  }
}
