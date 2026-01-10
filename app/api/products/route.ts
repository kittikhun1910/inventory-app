import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  const products = await prisma.product.findMany({
    include: {
      stocklocation: {
        include: {
          location: true,
        },
      },
    },
  });
  return NextResponse.json(products);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { sku, name, barcode, sellingPrice, minimumStock } = body ?? {};

    if (!sku || !name)
      return NextResponse.json({ error: 'Both "sku" and "name" are required' }, { status: 400 });

    const product = await prisma.product.create({
      data: {
        sku: String(sku),
        name: String(name),
        barcode: barcode ? String(barcode) : undefined,
        minimumStock: Number(minimumStock) || 0,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (err: any) {
    if (err?.code === 'P2002')
      return NextResponse.json({ error: 'Product with this SKU already exists' }, { status: 409 });

    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, sku, name, barcode, sellingPrice, minimumStock } = body ?? {};

    if (!id) return NextResponse.json({ error: '"id" is required' }, { status: 400 });

    const data: any = {};
    if (sku !== undefined) data.sku = String(sku);
    if (name !== undefined) data.name = String(name);
    if (Object.prototype.hasOwnProperty.call(body, 'barcode')) data.barcode = barcode ? String(barcode) : null;
    if (minimumStock !== undefined) data.minimumStock = Number(minimumStock) || 0;

    const product = await prisma.product.update({ where: { id: Number(id) }, data });
    return NextResponse.json(product);
  } catch (err: any) {
    if (err?.code === 'P2025')
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });

    if (err?.code === 'P2002')
      return NextResponse.json({ error: 'SKU already in use' }, { status: 409 });

    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    const sku = url.searchParams.get('sku');

    if (!id && !sku)
      return NextResponse.json({ error: 'Provide "id" or "sku" query parameter to delete' }, { status: 400 });

    let product;
    if (id) {
      product = await prisma.product.delete({ where: { id: Number(id) } });
    } else {
      product = await prisma.product.delete({ where: { sku: String(sku) } });
    }

    return NextResponse.json({ success: true, deleted: product });
  } catch (err: any) {
    if (err?.code === 'P2025')
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });

    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
