import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get('file') as File;

  if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });

  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return NextResponse.json({ error: 'No sheets found' }, { status: 400 });
  const sheet = workbook.Sheets[sheetName];
  const data: any[] = XLSX.utils.sheet_to_json(sheet);

  for (const row of data) {
    await prisma.product.upsert({
      where: { sku: String(row.sku) },
      create: {
        sku: String(row.sku),
        name: String(row.name),
        barcode: row.barcode ? String(row.barcode) : undefined,
        minimumStock: Number(row.minimumStock) || 0,
      },
      update: {
        name: String(row.name),
        barcode: row.barcode ? String(row.barcode) : undefined,
        minimumStock: Number(row.minimumStock) || 0,
      },
    });
  }

  return NextResponse.json({ success: true, imported: data.length });
}
