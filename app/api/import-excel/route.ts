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
      const nameRaw = getCell(row, 'name') ?? getCell(row, 'product name') ?? getCell(row, 'productName');
      const priceRaw = getCell(row, 'price') ?? getCell(row, 'selling price') ?? getCell(row, 'sellingPrice');
      const locationRaw = getCell(row, 'location') ?? getCell(row, 'locationName');
      const barcodeRaw = getCell(row, 'barcode');
      const minStockRaw = getCell(row, 'minimumStock') ?? getCell(row, 'minimum_stock') ?? getCell(row, 'minimum stock') ?? getCell(row, 'min stock');
      const qtyRaw = getCell(row, 'qty') ?? getCell(row, 'quantity');

      const sku = skuRaw ? String(skuRaw).trim() : '';
      const name = nameRaw ? String(nameRaw).trim() : '';
      const locationName = locationRaw ? String(locationRaw).trim() : 'Main';
      const qty = qtyRaw !== undefined ? Math.floor(Number(qtyRaw)) : 0;
      const sellingPrice = priceRaw ? Number(priceRaw) : 0;
      const minimumStock = minStockRaw !== undefined ? Math.floor(Number(minStockRaw)) : 0;

      if (!sku) {
        results.push({ row: i + 1, success: false, message: 'Missing SKU' });
        continue;
      }

      if (!name) {
        results.push({ row: i + 1, sku, success: false, message: 'Missing product name' });
        continue;
      }

      try {
        // Upsert product
        const product = await prisma.product.upsert({
          where: { sku },
          create: {
            sku,
            name,
            barcode: barcodeRaw ? String(barcodeRaw) : undefined,
            sellingPrice,
            minimumStock,
          },
          update: {
            name,
            barcode: barcodeRaw ? String(barcodeRaw) : undefined,
            sellingPrice,
            minimumStock,
          },
        });

        // Upsert location
        const location = await prisma.location.upsert({
          where: { name: locationName },
          create: { name: locationName },
          update: {},
        });

        // Upsert stock location
        await prisma.stocklocation.upsert({
          where: {
            productId_locationId: {
              productId: product.id,
              locationId: location.id,
            },
          },
          create: {
            productId: product.id,
            locationId: location.id,
            qty,
          },
          update: {
            qty: { increment: qty },
          },
        });

        // Record stock movement
        if (qty > 0) {
          await prisma.stockmovement.create({
            data: {
              productId: product.id,
              type: 'IN',
              qty,
              refType: 'IMPORT',
            },
          });
        }

        results.push({ row: i + 1, sku, success: true });
      } catch (err: any) {
        console.error(`Row ${i + 1} error:`, err);
        results.push({ 
          row: i + 1, 
          sku, 
          success: false, 
          message: err?.message || String(err) 
        });
      }
    }

    const imported = results.filter(r => r.success).length;
    return NextResponse.json({ success: true, total: rows.length, imported, results });
  } catch (err: any) {
    console.error('Import error:', err);
    return NextResponse.json({ 
      error: 'Failed to import file', 
      details: err?.message || String(err) 
    }, { status: 500 });
  }
}