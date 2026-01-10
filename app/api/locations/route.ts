import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const locations = await prisma.location.findMany();
    return NextResponse.json(locations);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { name } = body ?? {};
    if (!name) return NextResponse.json({ error: '"name" is required' }, { status: 400 });

    const location = await prisma.location.create({ data: { name: String(name) } });
    return NextResponse.json(location, { status: 201 });
  } catch (err: any) {
    if (err?.code === 'P2002')
      return NextResponse.json({ error: 'Location with this name already exists' }, { status: 409 });

    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { id, name } = body ?? {};

    if (!id || !name)
      return NextResponse.json({ error: 'Both "id" and "name" are required' }, { status: 400 });

    const location = await prisma.location.update({ where: { id: Number(id) }, data: { name: String(name) } });
    return NextResponse.json(location);
  } catch (err: any) {
    if (err?.code === 'P2025')
      return NextResponse.json({ error: 'Location not found' }, { status: 404 });

    if (err?.code === 'P2002')
      return NextResponse.json({ error: 'Location with this name already exists' }, { status: 409 });

    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    const name = url.searchParams.get('name');

    if (!id && !name)
      return NextResponse.json({ error: 'Provide "id" or "name" query parameter to delete' }, { status: 400 });

    const loc = id
      ? await prisma.location.findUnique({ where: { id: Number(id) } })
      : await prisma.location.findUnique({ where: { name: String(name) } });

    if (!loc) return NextResponse.json({ error: 'Location not found' }, { status: 404 });

    const existingStock = await prisma.stockLocation.findFirst({ where: { locationId: loc.id } });
    if (existingStock)
      return NextResponse.json({ error: 'Cannot delete location with stock present' }, { status: 400 });

    await prisma.location.delete({ where: { id: loc.id } });
    return NextResponse.json({ success: true, deletedId: loc.id });
  } catch (err: any) {
    if (err?.code === 'P2025')
      return NextResponse.json({ error: 'Location not found' }, { status: 404 });

    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}