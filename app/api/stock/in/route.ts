import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { productId, locationName, qty, refType } = body ?? {};

    if (!productId || !locationName || qty === undefined)
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });

    // Find or create location
    let location = await prisma.location.findUnique({
      where: { name: locationName },
    });

    if (!location) {
      location = await prisma.location.create({
        data: { name: locationName },
      });
    }

    // Get or create stock location
    let stockLocation = await prisma.stocklocation.findUnique({
      where: {
        productId_locationId: {
          productId: Number(productId),
          locationId: location.id,
        },
      },
    });

    if (!stockLocation) {
      stockLocation = await prisma.stocklocation.create({
        data: {
          productId: Number(productId),
          locationId: location.id,
          qty: Number(qty),
        },
      });
    } else {
      stockLocation = await prisma.stocklocation.update({
        where: {
          productId_locationId: {
            productId: Number(productId),
            locationId: location.id,
          },
        },
        data: {
          qty: stockLocation.qty + Number(qty),
        },
      });
    }

    // Record stock movement
    await prisma.stockmovement.create({
      data: {
        productId: Number(productId),
        type: 'IN',
        qty: Number(qty),
        refType: refType || 'MANUAL',
      },
    });

    return NextResponse.json({ success: true, stockLocation });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
