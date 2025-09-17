import { NextRequest, NextResponse } from 'next/server';
import { analyzeReceiptText } from '@/lib/receipt-parser';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const textField = formData.get('text');
    const file = formData.get('file') as File | null;

    let rawText = typeof textField === 'string' ? textField : '';

    if (!rawText && file) {
      const mime = file.type || '';
      if (mime.startsWith('text/') || file.name.toLowerCase().endsWith('.txt')) {
        rawText = await file.text();
      }
    }

    rawText = rawText.replace(/\u0000/g, ' ').trim();

    if (!rawText) {
      return NextResponse.json(
        {
          message:
            'Не удалось распознать текст чека. Добавьте текст вручную и попробуйте снова.',
        },
        { status: 400 }
      );
    }

    const analysis = analyzeReceiptText(rawText);

    return NextResponse.json({
      ...analysis,
      fileName: file?.name ?? null,
      mimeType: file?.type ?? null,
      source: typeof textField === 'string' && textField.trim().length > 0 ? 'text' : 'file',
    });
  } catch (error) {
    console.error('Receipt analysis error:', error);
    return NextResponse.json(
      { message: 'Не удалось обработать чек. Попробуйте еще раз.' },
      { status: 500 }
    );
  }
}
