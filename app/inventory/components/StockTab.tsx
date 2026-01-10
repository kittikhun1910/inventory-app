'use client';

import { useEffect, useState } from 'react';
import { Plus, Upload, RotateCcw } from 'lucide-react';
import { fetchJSON } from '@/lib/api';
import SearchBar from './SearchBar';
import AddProductModal from './modals/AddProductModal';
import AddStockModal from './modals/AddStockModal';
import ReduceStockModal from './modals/ReduceStockModal';
import ImportExcelModal from './modals/ImportExcelModal';

export default function StockTab() {
  const [products, setProducts] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddStock, setShowAddStock] = useState(false);
  const [showReduceStock, setShowReduceStock] = useState(false);
  const [showImport, setShowImport] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await fetchJSON('/api/products');
      setProducts(data || []);
    } catch (err: any) {
      console.error(err);
      alert('Failed to load products: ' + String(err?.message ?? err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const filtered = products.filter(p => p.sku?.toLowerCase().includes(q.toLowerCase()) || p.name?.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-64">
          <SearchBar value={q} onChange={setQ} />
        </div>
        <button 
          onClick={() => setShowAddProduct(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          <Plus size={18} /> Add Product
        </button>
        <button 
          onClick={() => setShowImport(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
        >
          <Upload size={18} /> Import Excel
        </button>
        <button 
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
        >
          <RotateCcw size={18} /> Refresh
        </button>
      </div>

      <div className="border border-gray-200 rounded-lg overflow-x-auto shadow-sm">
        <table className="w-full border-collapse">
          <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 min-w-24">SKU</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 min-w-48">Product Name</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 min-w-32">Barcode</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 min-w-20">Min Stock</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 min-w-40">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-500">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-500">No products found</td></tr>
            ) : (
              filtered.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4 text-sm font-semibold text-gray-900 whitespace-nowrap">{p.sku}</td>
                  <td className="px-4 py-4 text-sm text-gray-700">{p.name}</td>
                  <td className="px-4 py-4 text-sm text-gray-600">{p.barcode || '-'}</td>
                  <td className="px-4 py-4 text-sm text-center text-gray-600 whitespace-nowrap">{p.minimumStock}</td>
                  <td className="px-4 py-4 text-right space-x-2 whitespace-nowrap">
                    <button 
                      onClick={() => { setSelectedProduct(p); setShowAddStock(true); }}
                      className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded text-xs font-medium transition-colors"
                    >
                      + Stock
                    </button>
                    <button 
                      onClick={() => { setSelectedProduct(p); setShowReduceStock(true); }}
                      className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded text-xs font-medium transition-colors"
                    >
                      - Stock
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AddProductModal open={showAddProduct} onClose={() => setShowAddProduct(false)} onCreated={load} />
      <AddStockModal open={showAddStock} onClose={() => setShowAddStock(false)} productId={selectedProduct?.id} onDone={load} />
      <ReduceStockModal open={showReduceStock} onClose={() => setShowReduceStock(false)} productId={selectedProduct?.id} onDone={load} />
      <ImportExcelModal open={showImport} onClose={() => setShowImport(false)} onDone={load} />
    </div>
  );
}