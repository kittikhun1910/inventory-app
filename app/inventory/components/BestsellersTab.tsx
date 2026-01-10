'use client';

import { useEffect, useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { fetchJSON } from '@/lib/api';

export default function BestsellersTab() {
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'in' | 'out'>('out');

  async function load() {
    setLoading(true);
    try {
      const data = await fetchJSON('/api/stock-movements');
      setMovements(data || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  // Aggregate sales by product (OUT movements)
  const salesData = movements
    .filter(m => filter === 'all' || m.type === (filter === 'out' ? 'OUT' : 'IN'))
    .reduce((acc: any[], m: any) => {
      const existing = acc.find(item => item.productId === m.productId);
      if (existing) {
        existing.totalQty += m.qty;
        existing.count += 1;
      } else {
        acc.push({ 
          productId: m.productId, 
          productName: m.product?.name || 'Unknown',
          productSku: m.product?.sku || 'N/A',
          totalQty: m.qty,
          count: 1,
        });
      }
      return acc;
    }, [])
    .sort((a, b) => b.totalQty - a.totalQty)
    .slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="flex gap-2 items-center mb-4">
        <TrendingUp className="text-blue-600" size={24} />
        <h2 className="text-2xl font-bold text-gray-900">Sales Analytics</h2>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setFilter('out')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'out'
              ? 'bg-red-100 text-red-700'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Sales (Out)
        </button>
        <button
          onClick={() => setFilter('in')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'in'
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Purchases (In)
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'all'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : salesData.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No data available</div>
      ) : (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Product</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">SKU</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Total Qty</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Transactions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {salesData.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.productName}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{item.productSku}</td>
                  <td className="px-6 py-4 text-sm text-center text-gray-900 font-semibold">{item.totalQty}</td>
                  <td className="px-6 py-4 text-sm text-center text-gray-600">{item.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}