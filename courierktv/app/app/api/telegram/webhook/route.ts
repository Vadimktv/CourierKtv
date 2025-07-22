
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Basic Telegram webhook handler
    // In a real implementation, this would handle:
    // - User registration via Telegram
    // - Receipt image processing
    // - Bot commands

    console.log('Telegram webhook received:', body);

    // Handle different types of updates
    if (body.message) {
      const message = body.message;
      const chatId = message.chat.id;
      const userId = message.from.id;
      const text = message.text;

      // Handle /start command
      if (text === '/start') {
        // Send welcome message and instructions
        await sendTelegramMessage(chatId, 
          'Добро пожаловать в CourierKtv! 🚚\n\n' +
          'Для подключения к вашему аккаунту:\n' +
          '1. Зарегистрируйтесь в веб-приложении\n' +
          '2. Перейдите в настройки\n' +
          '3. Следуйте инструкциям по подключению Telegram'
        );
      }
      
      // Handle photo uploads
      if (message.photo) {
        // In real implementation, process the receipt photo
        await sendTelegramMessage(chatId, 
          'Фото получено! Обрабатываем чек...\n' +
          'Результат будет доступен в веб-приложении.'
        );
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error handling Telegram webhook:', error);
    return NextResponse.json(
      { message: 'Ошибка обработки webhook' },
      { status: 500 }
    );
  }
}

async function sendTelegramMessage(chatId: number, text: string) {
  const BOT_TOKEN = '8063129404:AAEuKevvt21X2_q2MhK5Pcuw6JD6rTtk8mQ';
  
  try {
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML',
      }),
    });

    return response.json();
  } catch (error) {
    console.error('Error sending Telegram message:', error);
  }
}
