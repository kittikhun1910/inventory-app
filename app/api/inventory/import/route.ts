import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function POST(req: Request) {
  try {
    const items = await req.json();

    if (!Array.isArray(items)) {
      return NextResponse.json({ success: false, message: 'Expected an array' }, { status: 400 });
    }

    // Validate items
    const parsed = items.map((it: any) => ({
      sku: String(it.sku ?? '').trim(),
      name: String(it.name ?? '').trim(),
      price: Number(it.price ?? 0),
      location: String(it.location ?? '').trim(),
    }));

    const invalid = parsed.filter((it: any) => !it.sku || !it.name || Number.isNaN(it.price) || !it.location);
    if (invalid.length) {
      return NextResponse.json({ success: false, message: `${invalid.length} rows invalid` }, { status: 400 });
    }

    let importedCount = 0;

    // Process each item
    for (const item of parsed) {
      // Find or create location
      let locationRecord = await prisma.location.findUnique({
        where: { name: item.location },
      });

      if (!locationRecord) {
        locationRecord = await prisma.location.create({
          data: { name: item.location },
        });
      }

      // Find or create product
      let productRecord = await prisma.product.findUnique({
        where: { sku: item.sku },
      });

      if (!productRecord) {
        productRecord = await prisma.product.create({
          data: {
            sku: item.sku,
            name: item.name,
          },
        });
      } else {
        // Update product if it exists
        await prisma.product.update({
          where: { id: productRecord.id },
          data: {
            name: item.name,
          },
        });
      }

      // Create or update stock location
      const existingStock = await prisma.stockLocation.findUnique({
        where: {
          productId_locationId: {
            productId: productRecord.id,
            locationId: locationRecord.id,
          },
        },
      });

      if (!existingStock) {
        await prisma.stockLocation.create({
          data: {
            productId: productRecord.id,
            locationId: locationRecord.id,
            qty: 0,
          },
        });
      }

      importedCount++;
    }

    return NextResponse.json({ success: true, imported: importedCount });
  } catch (error: any) {
    console.error('Import error:', error);
    return NextResponse.json({ success: false, message: error.message ?? 'Import failed' }, { status: 500 });
  }
}
