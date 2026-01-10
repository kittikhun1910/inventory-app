import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const type = url.searchParams.get('type'); // Optional: filter by 'IN' or 'OUT'

    const where: any = {};
    if (type) where.type = type.toUpperCase();

    const movements = await prisma.stockmovement.findMany({
      where,
      include: { product: true },
      orderBy: { createdAt: 'desc' },
      take: 500, // Limit to last 500 movements
    });

    return NextResponse.json(movements);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
