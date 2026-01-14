import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const type = url.searchParams.get('type'); // Optional: filter by 'IN' or 'OUT'
    const refType = url.searchParams.get('refType'); // Optional: filter by 'MANUAL', 'IMPORT', 'SALE'
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const productId = url.searchParams.get('productId');

    const where: any = {};
    if (type) where.type = type.toUpperCase();
    if (refType) where.refType = refType.toUpperCase();
    if (productId) where.productId = parseInt(productId);

    // Date filtering
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // End of day
        where.createdAt.lte = end;
      }
    }

    const movements = await prisma.stockmovement.findMany({
      where,
      include: { product: true },
      orderBy: { createdAt: 'desc' },
      take: 1000, // Increased limit for reporting
    });

    return NextResponse.json(movements);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { productId, type, qty, refType = 'MANUAL' } = body;

    if (!productId || !type || !qty) {
      return NextResponse.json(
        { error: 'productId, type, and qty are required' },
        { status: 400 }
      );
    }

    // Validate type and refType
    const validTypes = ['IN', 'OUT'];
    const validRefTypes = ['MANUAL', 'IMPORT', 'SALE'];

    if (!validTypes.includes(type.toUpperCase())) {
      return NextResponse.json({ error: 'Invalid type. Must be IN or OUT' }, { status: 400 });
    }

    if (!validRefTypes.includes(refType.toUpperCase())) {
      return NextResponse.json({ error: 'Invalid refType. Must be MANUAL, IMPORT, or SALE' }, { status: 400 });
    }

    // Create the stock movement record
    const movement = await prisma.stockmovement.create({
      data: {
        productId: parseInt(productId),
        type: type.toUpperCase(),
        qty: parseInt(qty),
        refType: refType.toUpperCase(),
      },
      include: { product: true },
    });

    return NextResponse.json(movement, { status: 201 });
  } catch (err: any) {
    console.error(err);
    if (err?.code === 'P2025') {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
