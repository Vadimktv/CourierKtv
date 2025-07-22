
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'Файл не найден' }, { status: 400 });
    }

    const startTime = Date.now();
    
    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer();
    const base64String = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = file.type || 'image/jpeg';
    const dataUri = `data:${mimeType};base64,${base64String}`;

    // Prepare AI request
    const aiResponse = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Проанализируй этот чек и извлеки следующую информацию в формате JSON:
                {
                  "restaurant": "название ресторана/заведения",
                  "orderDate": "дата заказа в формате YYYY-MM-DD",
                  "orderTime": "время заказа",
                  "fullAddress": "полный адрес доставки",
                  "street": "улица",
                  "houseNumber": "номер дома",
                  "building": "корпус/строение (если есть)",
                  "entrance": "подъезд (если есть)",
                  "floor": "этаж (если есть)", 
                  "apartment": "квартира (если есть)",
                  "phoneNumber": "номер телефона клиента",
                  "totalAmount": сумма_к_оплате_числом,
                  "paymentMethod": "cash" или "card"
                }
                
                Внимательно изучи весь текст на чеке. Если какая-то информация отсутствует, используй null для строк и 0 для чисел. Верни только JSON без дополнительных объяснений.`
              },
              {
                type: 'image_url',
                image_url: { url: dataUri }
              }
            ]
          }
        ],
        response_format: { type: "json_object" }
      })
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API Error:', errorText);
      throw new Error(`AI API Error: ${aiResponse.status} ${errorText}`);
    }

    const aiResult = await aiResponse.json();
    let extractedData;
    
    try {
      const content = aiResult.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('Нет контента в ответе AI');
      }
      
      // Clean up the JSON response
      const cleanedContent = content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      extractedData = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      throw new Error('Ошибка парсинга ответа AI');
    }

    // Validate required fields
    if (!extractedData.restaurant || !extractedData.phoneNumber || !extractedData.fullAddress) {
      throw new Error('Не удалось извлечь основные данные из чека');
    }

    // Save to database
    const order = await prisma.order.create({
      data: {
        originalFileName: file.name,
        restaurant: extractedData.restaurant || 'Неизвестно',
        orderDate: extractedData.orderDate ? new Date(extractedData.orderDate + 'T00:00:00') : null,
        orderTime: extractedData.orderTime || null,
        fullAddress: extractedData.fullAddress,
        street: extractedData.street || null,
        houseNumber: extractedData.houseNumber || null,
        building: extractedData.building || null,
        entrance: extractedData.entrance || null,
        floor: extractedData.floor || null,
        apartment: extractedData.apartment || null,
        phoneNumber: extractedData.phoneNumber,
        totalAmount: parseFloat(extractedData.totalAmount) || 0,
        paymentMethod: extractedData.paymentMethod === 'cash' ? 'cash' : 'card',
        status: 'processed',
        extractedData: extractedData
      }
    });

    // Log processing history
    await prisma.processingHistory.create({
      data: {
        fileName: file.name,
        status: 'success',
        processingTimeMs: Date.now() - startTime,
        orderId: order.id
      }
    });

    return NextResponse.json({ 
      success: true, 
      order: order,
      processingTime: Date.now() - startTime
    });

  } catch (error: any) {
    console.error('Processing error:', error);
    
    // Log error to processing history
    try {
      await prisma.processingHistory.create({
        data: {
          fileName: 'unknown',
          status: 'error',
          errorMessage: error.message,
          processingTimeMs: 0
        }
      });
    } catch (dbError) {
      console.error('Failed to log error:', dbError);
    }

    return NextResponse.json({ 
      error: error.message || 'Ошибка обработки чека' 
    }, { status: 500 });
  }
}
