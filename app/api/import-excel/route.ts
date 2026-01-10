import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

function getCell(obj: any, key: string) {
  if (!obj) return undefined;
  const foundKey = Object.keys(obj).find(k => k.toLowerCase() === key.toLowerCase());
  return foundKey ? obj[foundKey] : undefined;
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });

    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) return NextResponse.json({ error: 'No sheets found' }, { status: 400 });

    const sheet = workbook.Sheets[sheetName];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet);

    const results: { row: number; sku?: string; success: boolean; message?: string }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const skuRaw = getCell(row, 'sku');
      const qtyRaw = getCell(row, 'qty') ?? getCell(row, 'quantity');
      const locationRaw = getCell(row, 'location') ?? getCell(row, 'locationName');
      const nameRaw = getCell(row, 'name');
      const barcodeRaw = getCell(row, 'barcode');
      const minStockRaw = getCell(row, 'minimumStock') ?? getCell(row, 'minimum_stock');

      const sku = skuRaw ? String(skuRaw).trim() : '';
      const qty = qtyRaw !== undefined ? Math.floor(Number(qtyRaw)) : NaN;
      const locationName = locationRaw ? String(locationRaw).trim() : 'Main';

      if (!sku) {
        results.push({ row: i + 1, success: false, message: 'Missing SKU' });
        continue;
      }

      if (!Number.isFinite(qty) || qty <= 0) {
        results.push({ row: i + 1, sku, success: false, message: 'Invalid or missing qty (>0 required)' });
        continue;
      }

      try {
        // Process each row in its own transaction so one bad row doesn't stop others
        await prisma.$transaction(async (tx) => {
          const upserted = await (tx as any).product.upsert({
            where: { sku: String(sku) },
            create: {
              sku: String(sku),
              name: nameRaw ? String(nameRaw) : String(sku),
              barcode: barcodeRaw ? String(barcodeRaw) : undefined,
              minimumStock: minStockRaw ? Number(minStockRaw) || 0 : 0,
            },
            update: {
              name: nameRaw ? String(nameRaw) : undefined,
              barcode: barcodeRaw ? String(barcodeRaw) : undefined,
              minimumStock: minStockRaw ? Number(minStockRaw) || 0 : undefined,
            },
          });

          // Ensure location exists
          let location = await (tx as any).location.findUnique({ where: { name: locationName } });
          if (!location) {
            location = await (tx as any).location.create({ data: { name: locationName } });
          }

          // Update stock location
          const existing = await (tx as any).stockLocation.findFirst({ where: { productId: upserted.id, locationId: location.id } });
          if (existing) {
            await (tx as any).stockLocation.update({ where: { id: existing.id }, data: { qty: existing.qty + qty } });
          } else {
            await (tx as any).stockLocation.create({ data: { productId: upserted.id, locationId: location.id, qty } });
          }

          // Create stock movement
          await (tx as any).stockMovement.create({ data: { productId: upserted.id, type: 'IN', qty, refType: 'IMPORT' } });
        });

        results.push({ row: i + 1, sku, success: true });
      } catch (err: any) {
        console.error('Row import error', i + 1, err);
        results.push({ row: i + 1, sku, success: false, message: String(err?.message ?? err) });
      }
    }

    const imported = results.filter(r => r.success).length;
    return NextResponse.json({ success: true, total: rows.length, imported, results });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to import file', details: String(err?.message ?? err) }, { status: 500 });
  }
}