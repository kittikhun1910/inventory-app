'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { fetchJSON } from '@/lib/api';

export default function ReorderTab() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await fetchJSON('/api/products');
      // Filter products with stock below minimum
      const lowStock = data.filter((p: any) => {
        const totalStock = (p.stocklocation || []).reduce((sum: number, sl: any) => sum + (sl.qty || 0), 0);
        return totalStock < p.minimumStock;
      });
      setProducts(lowStock || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex gap-2 items-center mb-4">
        <AlertTriangle className="text-yellow-600" size={24} />
        <h2 className="text-2xl font-bold text-gray-900">การแจ้งเตือนการสั่งซื้อซ้ำ</h2>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">กำลังโหลด...</div>
      ) : products.length === 0 ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700">
          ✓ ทุกสินค้ามีสต๊อกมากกว่าระดับขั้นต่ำ
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-sm text-gray-600 mb-4">
            {products.length} สินค้าที่มีสต๊อกต่ำกว่าระดับขั้นต่ำ
          </div>
          
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">SKU</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">ชื่อผลิตภัณฑ์</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">สต๊อกปัจจุบัน</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">ระดับขั้นต่ำ</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">ขาดแคลน</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {products.map((product) => {
                  const currentStock = (product.stocklocation || []).reduce((sum: number, sl: any) => sum + (sl.qty || 0), 0);
                  const shortage = product.minimumStock - currentStock;
                  return (
                    <tr key={product.id} className="hover:bg-red-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{product.sku}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{product.name}</td>
                      <td className="px-6 py-4 text-sm text-center">
                        <span className={`px-2 py-1 rounded font-semibold ${
                          currentStock === 0 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {currentStock}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-center text-gray-600">{product.minimumStock}</td>
                      <td className="px-6 py-4 text-sm text-center">
                        <span className="px-2 py-1 rounded bg-red-100 text-red-700 font-semibold">
                          {shortage}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}