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

    // Get stock location
    let stockLocation = await prisma.stocklocation.findUnique({
      where: {
        productId_locationId: {
          productId: Number(productId),
          locationId: location.id,
        },
      },
    });

    // If stock location doesn't exist, create it with 0 qty
    if (!stockLocation) {
      stockLocation = await prisma.stocklocation.create({
        data: {
          productId: Number(productId),
          locationId: location.id,
          qty: 0,
        },
      });
    }

    const newQty = stockLocation.qty - Number(qty);
    if (newQty < 0) {
      return NextResponse.json({ 
        error: `Insufficient stock in ${locationName}. Available: ${stockLocation.qty}, Requested: ${qty}` 
      }, { status: 400 });
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
