
import { promises as fs } from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function processReceiptImage(imagePath: string): Promise<any> {
  try {
    console.log(`Обработка чека: ${imagePath}`);
    
    // Read image file
    const imageBuffer = await fs.readFile(imagePath);
    const base64String = imageBuffer.toString('base64');
    const mimeType = 'image/jpeg';
    const dataUri = `data:${mimeType};base64,${base64String}`;

    // Call LLM API to extract data
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
      throw new Error(`AI API Error: ${aiResponse.status}`);
    }

    const aiResult = await aiResponse.json();
    const content = aiResult.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('Нет контента в ответе AI');
    }
    
    // Clean up and parse JSON
    const cleanedContent = content
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    
    const extractedData = JSON.parse(cleanedContent);
    
    console.log(`Извлеченные данные: ${extractedData.restaurant} - ${extractedData.totalAmount}₽`);
    
    return extractedData;
    
  } catch (error) {
    console.error(`Ошибка обработки ${imagePath}:`, error);
    return null;
  }
}

async function seedDatabase() {
  try {
    console.log('🌱 Начинаем заполнение базы данных...');
    
    // Clear existing data
    await prisma.processingHistory.deleteMany();
    await prisma.order.deleteMany();
    console.log('Очистили существующие данные');

    // Get sample receipt files
    const sampleReceiptsDir = path.join(process.cwd(), 'public', 'sample-receipts');
    const files = await fs.readdir(sampleReceiptsDir);
    const imageFiles = files.filter(file => file.match(/\.(jpeg|jpg|png)$/i));
    
    console.log(`Найдено ${imageFiles.length} изображений чеков`);

    let successCount = 0;
    let errorCount = 0;

    // Process each image
    for (const file of imageFiles) {
      const imagePath = path.join(sampleReceiptsDir, file);
      const startTime = Date.now();
      
      try {
        const extractedData = await processReceiptImage(imagePath);
        
        if (extractedData && extractedData.restaurant && extractedData.phoneNumber && extractedData.fullAddress) {
          // Save to database
          const order = await prisma.order.create({
            data: {
              originalFileName: file,
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

          // Log success to processing history
          await prisma.processingHistory.create({
            data: {
              fileName: file,
              status: 'success',
              processingTimeMs: Date.now() - startTime,
              orderId: order.id
            }
          });

          successCount++;
          console.log(`✅ Успешно обработан: ${file}`);
          
          // Small delay to avoid overwhelming the API
          await new Promise(resolve => setTimeout(resolve, 1000));
          
        } else {
          throw new Error('Не удалось извлечь основные данные');
        }
        
      } catch (error) {
        console.error(`❌ Ошибка обработки ${file}:`, error);
        
        // Log error to processing history
        await prisma.processingHistory.create({
          data: {
            fileName: file,
            status: 'error',
            errorMessage: error instanceof Error ? error.message : 'Неизвестная ошибка',
            processingTimeMs: Date.now() - startTime
          }
        });
        
        errorCount++;
      }
    }

    console.log('\n🎉 Заполнение базы данных завершено!');
    console.log(`✅ Успешно обработано: ${successCount} чеков`);
    console.log(`❌ Ошибок: ${errorCount} чеков`);
    
    // Display summary statistics
    const totalOrders = await prisma.order.count();
    const totalAmount = await prisma.order.aggregate({
      _sum: { totalAmount: true }
    });
    
    console.log(`\n📊 Статистика:`);
    console.log(`- Всего заказов: ${totalOrders}`);
    console.log(`- Общая сумма: ${totalAmount._sum.totalAmount?.toLocaleString('ru-RU')}₽`);
    
  } catch (error) {
    console.error('Ошибка заполнения базы данных:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedDatabase()
  .catch((error) => {
    console.error('Критическая ошибка:', error);
    process.exit(1);
  });
