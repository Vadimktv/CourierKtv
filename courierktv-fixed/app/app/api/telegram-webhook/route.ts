
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Базовая настройка для Telegram бота
const TELEGRAM_BOT_TOKEN = '8063129404:AAEuKevvt21X2_q2MhK5Pcuw6JD6rTtk8mQ';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Логируем входящие сообщения для отладки
    console.log('Telegram webhook received:', body);
    
    // Здесь можно добавить логику обработки команд бота
    // Например, отправка статистики смены, уведомления и т.д.
    
    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Telegram webhook endpoint', 
    botToken: TELEGRAM_BOT_TOKEN ? 'configured' : 'not configured' 
  });
}
