import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

const isPositiveNumber = (v: any) => typeof v === 'number' && Number.isFinite(v) && v > 0;

async function ensureProductId(productId: any, sku: any) {
  if (productId) return Number(productId);
  if (!sku) return null;
  const product = await prisma.product.findUnique({ where: { sku: String(sku) } });
  return product ? product.id : null;
}

async function ensureLocationId(locationId: any, locationName: any) {
  if (locationId) return Number(locationId);
  if (!locationName) return null;
  let location = await prisma.location.findUnique({ where: { name: String(locationName) } });
  if (!location) {
    location = await prisma.location.create({ data: { name: String(locationName) } });
  }
  return location.id;
}

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const pathname = url.pathname || '';

    if (pathname.endsWith('/in')) return await handleIn(req);
    if (pathname.endsWith('/out')) return await handleOut(req);

    return NextResponse.json({ error: 'Unknown stock action' }, { status: 404 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function handleIn(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { productId: pId, sku, locationId: lId, locationName, qty, refType } = body ?? {};

  if (!qty || !isPositiveNumber(Number(qty)))
    return NextResponse.json({ error: 'Valid "qty" (> 0) is required' }, { status: 400 });

  const productId = await ensureProductId(pId, sku);
  if (!productId) return NextResponse.json({ error: 'Product not found (provide "productId" or "sku")' }, { status: 400 });

  const locationId = await ensureLocationId(lId, locationName);
  if (!locationId) return NextResponse.json({ error: 'Location not found (provide "locationId" or "locationName")' }, { status: 400 });

  const q = Math.floor(Number(qty));
  const ref = refType ? String(refType).toUpperCase() : 'MANUAL';
  if (!['IMPORT', 'MANUAL'].includes(ref))
    return NextResponse.json({ error: 'refType must be "IMPORT" or "MANUAL" for stock in' }, { status: 400 });

  try {
    await prisma.$transaction(async (tx) => {
      const existing = await (tx as any).stockLocation.findFirst({ where: { productId, locationId } });
      if (existing) {
        await (tx as any).stockLocation.update({ where: { id: existing.id }, data: { qty: existing.qty + q } });
      } else {
        await (tx as any).stockLocation.create({ data: { productId, locationId, qty: q } });
      }

      await (tx as any).stockMovement.create({
        data: {
          productId,
          type: 'IN',
          qty: q,
          refType: ref as any,
        },
      });
    });

    const updated = await prisma.product.findUnique({
      where: { id: productId },
      include: { stocklocation: true, stockmovement: { orderBy: { createdAt: 'desc' } } },
    });

    return NextResponse.json({ success: true, product: updated });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to increase stock' }, { status: 500 });
  }
}

async function handleOut(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { productId: pId, sku, locationId: lId, locationName, qty, refType } = body ?? {};

  if (!qty || !isPositiveNumber(Number(qty)))
    return NextResponse.json({ error: 'Valid "qty" (> 0) is required' }, { status: 400 });

  const productId = await ensureProductId(pId, sku);
  if (!productId) return NextResponse.json({ error: 'Product not found (provide "productId" or "sku")' }, { status: 400 });

  const locationId = await ensureLocationId(lId, locationName);
  if (!locationId) return NextResponse.json({ error: 'Location not found (provide "locationId" or "locationName")' }, { status: 400 });

  const q = Math.floor(Number(qty));
  const ref = refType ? String(refType).toUpperCase() : 'MANUAL';
  if (!['SALE', 'MANUAL'].includes(ref))
    return NextResponse.json({ error: 'refType must be "SALE" or "MANUAL" for stock out' }, { status: 400 });

  try {
    await prisma.$transaction(async (tx) => {
      const existing = await (tx as any).stockLocation.findFirst({ where: { productId, locationId } });
      if (!existing || existing.qty < q) throw new Error('INSUFFICIENT');

      await (tx as any).stockLocation.update({ where: { id: existing.id }, data: { qty: existing.qty - q } });

      await (tx as any).stockMovement.create({
        data: {
          productId,
          type: 'OUT',
          qty: q,
          refType: ref as any,
        },
      });
    });

    const updated = await prisma.product.findUnique({
      where: { id: productId },
      include: { stocklocation: true, stockmovement: { orderBy: { createdAt: 'desc' } } },
    });

    return NextResponse.json({ success: true, product: updated });
  } catch (err: any) {
    console.error(err);
    if (err?.message === 'INSUFFICIENT')
      return NextResponse.json({ error: 'Insufficient stock at this location' }, { status: 400 });
    return NextResponse.json({ error: 'Failed to decrease stock' }, { status: 500 });
  }
}
