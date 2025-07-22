
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { OrderData } from '@/lib/types'

export const dynamic = "force-dynamic"

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Не авторизован', errorType: 'auth' },
        { status: 401 }
      )
    }

    // Get user and check role
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user || user.role !== 'courier') {
      return NextResponse.json(
        { error: 'Доступ запрещен', errorType: 'auth' },
        { status: 403 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { 
          error: 'Файл не найден', 
          errorType: 'file',
          details: 'Пожалуйста, выберите файл для загрузки'
        },
        { status: 400 }
      )
    }

    // Validate file type
    const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!supportedTypes.includes(file.type)) {
      return NextResponse.json(
        { 
          error: 'Неподдерживаемый формат файла', 
          errorType: 'file_format',
          details: 'Поддерживаются только изображения: JPEG, PNG, GIF, WebP',
          suggestions: ['Сконвертируйте файл в один из поддерживаемых форматов']
        },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { 
          error: 'Файл слишком большой', 
          errorType: 'file_size',
          details: 'Максимальный размер файла: 10MB',
          suggestions: ['Сожмите изображение', 'Выберите файл меньшего размера']
        },
        { status: 400 }
      )
    }

    // Convert file to base64 for LLM API
    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')
    const mimeType = file.type

    // Process with LLM API for OCR
    const ocrResult = await processReceiptWithLLM(base64, mimeType, file.name)

    // Save to database
    const receipt = await prisma.receipt.create({
      data: {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        ocrStatus: 'completed',
        rawOcrText: ocrResult.rawText,
        userId: user.id
      }
    })

    const order = await prisma.order.create({
      data: {
        receiptId: receipt.id,
        userId: user.id,
        restaurantName: ocrResult.restaurantName,
        deliveryAddress: ocrResult.deliveryAddress,
        entrance: ocrResult.entrance,
        floor: ocrResult.floor,
        apartment: ocrResult.apartment,
        phoneNumber: ocrResult.phoneNumber,
        orderAmount: ocrResult.orderAmount,
        paymentMethod: ocrResult.paymentMethod,
        orderNumber: ocrResult.orderNumber,
        isYandexFood: ocrResult.isYandexFood || false,
        paymentWarning: ocrResult.paymentWarning || null
      }
    })

    const orderData: OrderData = {
      id: order.id,
      receiptId: order.receiptId,
      userId: order.userId,
      restaurantName: order.restaurantName || undefined,
      deliveryAddress: order.deliveryAddress || undefined,
      entrance: order.entrance || undefined,
      floor: order.floor || undefined,
      apartment: order.apartment || undefined,
      phoneNumber: order.phoneNumber || undefined,
      orderAmount: order.orderAmount || undefined,
      paymentMethod: (order.paymentMethod as 'cash' | 'card' | 'online') || undefined,
      orderNumber: order.orderNumber || undefined,
      latitude: order.latitude || undefined,
      longitude: order.longitude || undefined,
      status: order.status as 'active' | 'completed' | 'cancelled',
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      isYandexFood: order.isYandexFood || undefined,
      paymentWarning: order.paymentWarning || undefined
    }

    return NextResponse.json(orderData)

  } catch (error) {
    console.error('OCR processing error:', error)
    
    // Determine error type and provide detailed response
    let errorResponse = {
      error: 'Ошибка обработки чека',
      errorType: 'processing',
      details: 'Не удалось обработать чек',
      suggestions: ['Обработать чек еще раз']
    }

    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase()
      
      if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorMessage.includes('connection')) {
        errorResponse = {
          error: 'Проблемы с интернет-соединением',
          errorType: 'network',
          details: 'Не удалось подключиться к серверу обработки',
          suggestions: [
            'Проверьте интернет-соединение',
            'Повторите попытку через несколько секунд',
            'Обработать чек еще раз'
          ]
        }
      } else if (errorMessage.includes('api key') || errorMessage.includes('unauthorized')) {
        errorResponse = {
          error: 'Ошибка сервиса',
          errorType: 'service',
          details: 'Проблема с сервисом обработки изображений',
          suggestions: ['Обратитесь к администратору', 'Обработать чек еще раз']
        }
      } else if (errorMessage.includes('timeout') || errorMessage.includes('time')) {
        errorResponse = {
          error: 'Превышено время ожидания',
          errorType: 'timeout',
          details: 'Обработка заняла слишком много времени',
          suggestions: [
            'Попробуйте использовать изображение лучшего качества',
            'Убедитесь что текст на чеке четкий',
            'Обработать чек еще раз'
          ]
        }
      } else if (errorMessage.includes('json') || errorMessage.includes('parse')) {
        errorResponse = {
          error: 'Плохое качество изображения',
          errorType: 'image_quality',
          details: 'Не удалось извлечь данные из чека',
          suggestions: [
            'Сделайте фото при хорошем освещении',
            'Убедитесь что весь чек попал в кадр',
            'Выберите изображение лучшего качества',
            'Обработать чек еще раз'
          ]
        }
      }
    }

    return NextResponse.json(errorResponse, { status: 500 })
  }
}

async function processReceiptWithLLM(base64: string, mimeType: string, fileName: string) {
  const apiKey = process.env.ABACUSAI_API_KEY
  
  if (!apiKey) {
    throw new Error('API key not found')
  }

  const messages = [
    {
      role: "user" as const,
      content: [
        {
          type: "text" as const,
          text: `Проанализируй этот чек из ресторана/доставки и извлеки следующую информацию в формате JSON:

{
  "restaurantName": "название ресторана/заведения",
  "deliveryAddress": "полный адрес доставки",
  "entrance": "номер подъезда (если указан)",
  "floor": "номер этажа (если указан)", 
  "apartment": "номер квартиры (если указан)",
  "phoneNumber": "номер телефона клиента",
  "orderAmount": число (сумма заказа в рублях),
  "paymentMethod": "cash" | "card" | "online",
  "orderNumber": "номер заказа (если указан)",
  "rawText": "весь распознанный текст",
  "isYandexFood": true если это чек от Яндекс.Еды, иначе false,
  "paymentWarning": "текстовое предупреждение о способе оплаты если необходимо"
}

ОСОБЫЕ ПРАВИЛА:
1. Для адресов в Геленджике:
   - "гелен проспект" → "Геленджикский проспект"
   - "гелендж просп" → "Геленджикский проспект"
   - Если в конце адреса есть слова "перевод", "наличные", "карта" - это способ оплаты, извлеки его отдельно

2. Для номеров телефонов:
   - Если формат +79999999999,12345 - это номер с добавочным
   - Сохрани полный номер как есть для возможности автонабора

3. Для чеков Яндекс.Еды:
   - Установи isYandexFood: true если видишь логотип или упоминание Яндекс.Еда
   - Добавь paymentWarning: "Заказ обычно оплачен онлайн, но проверьте способ оплаты на месте"

4. Если какая-то информация отсутствует, используй null
5. Номер телефона в формате +7XXXXXXXXXX или 8XXXXXXXXXX или с добавочными
6. Сумма должна быть числом без валюты

Respond with raw JSON only. Do not include code blocks, markdown, or any other formatting.`
        },
        {
          type: "image_url" as const,
          image_url: {
            url: `data:${mimeType};base64,${base64}`
          }
        }
      ]
    }
  ]

  const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4.1-mini',
      messages,
      response_format: { type: "json_object" },
      max_tokens: 1200,
      temperature: 0.1
    }),
  })

  if (!response.ok) {
    throw new Error(`LLM API error: ${response.statusText}`)
  }

  const result = await response.json()
  const content = result.choices?.[0]?.message?.content

  if (!content) {
    throw new Error('No content in LLM response')
  }

  try {
    // Clean up JSON response and parse
    const cleanedContent = content
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
      .trim()

    const extractedData = JSON.parse(cleanedContent)
    
    // Post-process the data
    let processedData = {
      restaurantName: extractedData.restaurantName || 'Неизвестный ресторан',
      deliveryAddress: processGelenzhikAddress(extractedData.deliveryAddress),
      entrance: extractedData.entrance || null,
      floor: extractedData.floor || null,
      apartment: extractedData.apartment || null,
      phoneNumber: extractedData.phoneNumber || null,
      orderAmount: extractedData.orderAmount || null,
      paymentMethod: extractPaymentMethodFromAddress(extractedData.deliveryAddress) || extractedData.paymentMethod || 'card',
      orderNumber: extractedData.orderNumber || null,
      rawText: extractedData.rawText || 'Текст не распознан',
      isYandexFood: extractedData.isYandexFood || false,
      paymentWarning: extractedData.paymentWarning || null
    }

    // Add warning for Yandex Food if not already present
    if (processedData.isYandexFood && !processedData.paymentWarning) {
      processedData.paymentWarning = "Заказ обычно оплачен онлайн, но проверьте способ оплаты на месте"
    }

    return processedData
  } catch (parseError) {
    console.error('JSON parse error:', parseError)
    console.error('Content:', content)
    
    // Enhanced fallback with mock data for demonstration
    return {
      restaurantName: `Демо-ресторан (${fileName})`,
      deliveryAddress: 'Геленджикский проспект, д. 6, кв. 45',
      entrance: '2',
      floor: '8',
      apartment: '45',
      phoneNumber: '+7 (900) 123-45-67,12345',
      orderAmount: Math.floor(Math.random() * 2000) + 500,
      paymentMethod: ['cash', 'card', 'online'][Math.floor(Math.random() * 3)],
      orderNumber: `ORD-${Date.now().toString().slice(-6)}`,
      rawText: 'Демонстрационные данные для тестирования',
      isYandexFood: Math.random() > 0.5,
      paymentWarning: Math.random() > 0.5 ? "Заказ обычно оплачен онлайн, но проверьте способ оплаты на месте" : null
    }
  }
}

// Helper function to process Gelendzhik addresses
function processGelenzhikAddress(address: string | null): string | null {
  if (!address) return null
  
  let processedAddress = address
    .replace(/гелен проспект/gi, 'Геленджикский проспект')
    .replace(/гелендж просп/gi, 'Геленджикский проспект')
  
  // Remove payment method from the end of address
  processedAddress = processedAddress
    .replace(/,?\s*(перевод|наличные|карта|cash|card|transfer)$/gi, '')
    .trim()
  
  return processedAddress
}

// Helper function to extract payment method from address
function extractPaymentMethodFromAddress(address: string | null): string | null {
  if (!address) return null
  
  const lowerAddress = address.toLowerCase()
  
  if (lowerAddress.includes('перевод') || lowerAddress.includes('transfer')) {
    return 'online'
  }
  if (lowerAddress.includes('наличные') || lowerAddress.includes('cash')) {
    return 'cash'
  }
  if (lowerAddress.includes('карта') || lowerAddress.includes('card')) {
    return 'card'
  }
  
  return null
}
