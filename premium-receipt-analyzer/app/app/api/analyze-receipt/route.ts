
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

interface ReceiptData {
  restaurantName?: string
  address?: string
  entrance?: string
  floor?: string
  apartment?: string
  phoneNumber?: string
  totalAmount?: string
  paymentMethod?: string
  notes?: string
}

async function analyzeReceiptWithLLM(imageBuffer: Buffer, filename: string): Promise<ReceiptData> {
  try {
    const base64Image = imageBuffer.toString('base64')
    const dataUri = `data:image/jpeg;base64,${base64Image}`

    const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        response_format: { type: "json_object" },
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Проанализируй этот чек доставки и извлеки следующие данные в JSON формате:
                {
                  "restaurantName": "название ресторана/заведения",
                  "address": "полный адрес доставки (улица, дом)",
                  "entrance": "номер подъезда",
                  "floor": "этаж",
                  "apartment": "номер квартиры",
                  "phoneNumber": "номер телефона клиента",
                  "totalAmount": "общая сумма заказа",
                  "paymentMethod": "способ оплаты (наличные/карта/онлайн)",
                  "notes": "дополнительные заметки"
                }

                Извлекай только данные, которые есть на чеке. Если какой-то информации нет, оставь поле пустым или null.
                Номер телефона форматируй в виде +7XXXXXXXXXX.
                Сумму указывай с валютой (например, "1250 ₽").
                
                Respond with raw JSON only. Do not include code blocks, markdown, or any other formatting.`
              },
              {
                type: 'image_url',
                image_url: {
                  url: dataUri
                }
              }
            ]
          }
        ],
        max_tokens: 1000,
        temperature: 0.1
      })
    })

    if (!response.ok) {
      throw new Error(`LLM API error: ${response.status}`)
    }

    const result = await response.json()
    const content = result.choices?.[0]?.message?.content

    if (!content) {
      throw new Error('No content in LLM response')
    }

    // Parse and sanitize JSON response
    let parsedData
    try {
      // Remove any markdown code blocks if present
      const cleanedContent = content.replace(/```json\s*|\s*```/g, '').trim()
      parsedData = JSON.parse(cleanedContent)
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      throw new Error('Failed to parse LLM response as JSON')
    }

    return parsedData as ReceiptData
  } catch (error) {
    console.error('LLM analysis error:', error)
    throw new Error('Failed to analyze receipt with LLM')
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Unsupported file type' },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Create receipt record
    const receipt = await prisma.receipt.create({
      data: {
        filename: file.name,
        originalUrl: `uploaded/${file.name}`,
        status: 'processing',
      }
    })

    try {
      // Analyze with LLM
      const analysisData = await analyzeReceiptWithLLM(buffer, file.name)

      // Create order from analysis
      const order = await prisma.order.create({
        data: {
          receiptId: receipt.id,
          restaurantName: analysisData.restaurantName || null,
          address: analysisData.address || null,
          entrance: analysisData.entrance || null,
          floor: analysisData.floor || null,
          apartment: analysisData.apartment || null,
          phoneNumber: analysisData.phoneNumber || null,
          totalAmount: analysisData.totalAmount || null,
          paymentMethod: analysisData.paymentMethod || null,
          notes: analysisData.notes || null,
        }
      })

      // Update receipt status
      await prisma.receipt.update({
        where: { id: receipt.id },
        data: {
          status: 'completed',
          processedData: analysisData as any,
        }
      })

      return NextResponse.json({
        success: true,
        order: {
          id: order.id,
          restaurantName: order.restaurantName,
          address: order.address,
          entrance: order.entrance,
          floor: order.floor,
          apartment: order.apartment,
          phoneNumber: order.phoneNumber,
          totalAmount: order.totalAmount,
          paymentMethod: order.paymentMethod,
          notes: order.notes,
        }
      })

    } catch (analysisError) {
      // Update receipt status to error
      await prisma.receipt.update({
        where: { id: receipt.id },
        data: { status: 'error' }
      })

      console.error('Analysis error:', analysisError)
      return NextResponse.json(
        { success: false, error: 'Failed to analyze receipt' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
