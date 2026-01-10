import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { productId, locationName, qty, refType } = body ?? {};

    if (!productId || !locationName || qty === undefined)
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });

    // Find location
    const location = await prisma.location.findUnique({
      where: { name: locationName },
    });

    if (!location) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 });
    }

    // Get stock location
    const stockLocation = await prisma.stocklocation.findUnique({
      where: {
        productId_locationId: {
          productId: Number(productId),
          locationId: location.id,
        },
      },
    });

    if (!stockLocation) {
      return NextResponse.json({ error: 'Product not found in this location' }, { status: 404 });
    }

    const newQty = stockLocation.qty - Number(qty);
    if (newQty < 0) {
      return NextResponse.json({ error: 'Insufficient stock' }, { status: 400 });
    }

    // Update stock
    const updated = await prisma.stocklocation.update({
      where: {
        productId_locationId: {
          productId: Number(productId),
          locationId: location.id,
        },
      },
      data: {
        qty: newQty,
      },
    });

    // Record stock movement
    await prisma.stockmovement.create({
      data: {
        productId: Number(productId),
        type: 'OUT',
        qty: Number(qty),
        refType: refType || 'MANUAL',
      },
    });

    return NextResponse.json({ success: true, stockLocation: updated });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
