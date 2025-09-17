
import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { parsePhoneNumber, getZoneByAddress, extractAddressComponents } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { message: 'Не авторизован' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { city: true },
    });

    if (!user) {
      return NextResponse.json(
        { message: 'Пользователь не найден' },
        { status: 404 }
      );
    }

    // Get current active shift
    const activeShift = await prisma.shift.findFirst({
      where: {
        userId: user.id,
        isActive: true,
      },
    });

    if (!activeShift) {
      return NextResponse.json(
        { message: 'Нет активной смены. Начните смену перед добавлением чеков' },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const dataString = formData.get('data') as string | null;
    const imageFile = formData.get('image') as File | null;

    if (!dataString) {
      return NextResponse.json(
        { message: 'Не переданы данные чека' },
        { status: 400 }
      );
    }

    const data = JSON.parse(dataString);

    const {
      restaurant,
      fullAddress,
      phoneNumber,
      totalAmount,
      paymentMethod,
      hasHandwrittenSum,
    } = data;

    const numericAmount = typeof totalAmount === 'string' ? parseFloat(totalAmount) : totalAmount;

    if (!fullAddress || numericAmount === null || Number.isNaN(numericAmount) || !paymentMethod) {
      return NextResponse.json(
        { message: 'Заполните все обязательные поля' },
        { status: 400 }
      );
    }

    let imageUrl: string | null = null;
    let originalFileName: string | null = null;

    if (imageFile && imageFile.size > 0) {
      const arrayBuffer = await imageFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'receipts');
      await fs.mkdir(uploadDir, { recursive: true });

      const sanitizedName = imageFile.name
        .replace(/[^A-Za-z0-9._-]/g, '_')
        .slice(-80);
      const fileName = `${Date.now()}-${sanitizedName || 'receipt'}`;
      const filePath = path.join(uploadDir, fileName);
      await fs.writeFile(filePath, buffer);

      imageUrl = `/uploads/receipts/${fileName}`;
      originalFileName = imageFile.name;
    }

    // Parse phone number
    const phoneData = parsePhoneNumber(phoneNumber || '');

    // Extract address components
    const addressComponents = extractAddressComponents(fullAddress);

    // Get zones for the user's city
    const zones = await prisma.zone.findMany({
      where: { cityId: user.cityId || undefined },
    });

    // Determine zone and calculate earnings
    let zoneId = null;
    let zoneRate = 0;
    let earnings = 0;

    if (zones.length > 0) {
      const zone = getZoneByAddress(fullAddress, zones);
      if (zone) {
        zoneId = zone.id;
        zoneRate = zone.rate;
        earnings = zone.rate;
      }
    }

    // Create receipt
    const receipt = await prisma.receipt.create({
      data: {
        userId: user.id,
        shiftId: activeShift.id,
        zoneId,
        restaurant,
        fullAddress,
        street: addressComponents.street,
        houseNumber: addressComponents.houseNumber,
        building: addressComponents.building,
        entrance: addressComponents.entrance,
        floor: addressComponents.floor,
        apartment: addressComponents.apartment,
        phoneNumber: phoneData.main,
        additionalNumber: phoneData.additional,
        totalAmount: numericAmount,
        paymentMethod,
        hasHandwrittenSum: hasHandwrittenSum || false,
        zoneRate,
        earnings,
        status: 'processed',
        imageUrl,
        originalFileName,
      },
      include: {
        zone: true,
      },
    });

    return NextResponse.json(receipt);
  } catch (error) {
    console.error('Error creating receipt:', error);
    return NextResponse.json(
      { message: 'Ошибка сохранения чека' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { message: 'Не авторизован' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { message: 'Пользователь не найден' },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const shiftId = searchParams.get('shiftId');

    const receipts = await prisma.receipt.findMany({
      where: {
        userId: user.id,
        ...(shiftId ? { shiftId } : {}),
      },
      include: {
        zone: true,
        shift: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(receipts);
  } catch (error) {
    console.error('Error fetching receipts:', error);
    return NextResponse.json(
      { message: 'Ошибка загрузки чеков' },
      { status: 500 }
    );
  }
}
