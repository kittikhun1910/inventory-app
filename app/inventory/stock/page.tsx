'use client';

import { useState, useEffect } from 'react';
import { Plus, Upload, RotateCcw, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { fetchJSON } from '@/lib/api';
import SearchBar from '../components/SearchBar';
import AddProductModal from '../components/modals/AddProductModal';
import AddStockModal from '../components/modals/AddStockModal';
import ReduceStockModal from '../components/modals/ReduceStockModal';
import ImportExcelModal from '../components/modals/ImportExcelModal';

export default function StockPage() {
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

  const getStockAtLocation = (stocklocations: any[]) => {
    return (stocklocations || []).reduce((sum: number, sl: any) => sum + (sl.qty || 0), 0);
  };

  const getStockByLocation = (stocklocations: any[]) => {
    return (stocklocations || []).map(sl => ({
      location: sl.location.name,
      qty: sl.qty,
      locationId: sl.locationId
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/inventory"
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft size={20} />
                <span>Back to Dashboard</span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                View Store
              </Link>
            </div>
          </div>
          <div className="mt-4">
            <h1 className="text-3xl font-bold text-gray-900">Stock Management</h1>
            <p className="text-gray-600 mt-1">Manage product inventory and stock levels</p>
          </div>
        </div>

        {/* Action Bar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
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
        </div>

        {/* Stock Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">Product Inventory</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">SKU</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Product Name</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Selling Price</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Total Stock</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Min Stock</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500">Loading products...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500">No products found</td></tr>
                ) : (
                  filtered.map(p => {
                    const currentStock = getStockAtLocation(p.stocklocation);
                    const isLowStock = currentStock < p.minimumStock;
                    const stockByLocation = getStockByLocation(p.stocklocation);
                    return (
                      <tr key={p.id} className={`hover:bg-gray-50 transition-colors ${isLowStock ? 'bg-red-50' : ''}`}>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">{p.sku}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{p.name}</td>
                        <td className="px-6 py-4 text-sm text-center text-gray-900 font-medium">${p.sellingPrice || 0}</td>
                        <td className="px-6 py-4 text-sm text-center">
                          <div className="font-medium text-gray-900">{currentStock}</div>
                          {stockByLocation.length > 0 && (
                            <div className="text-xs text-gray-500 mt-1 space-y-1">
                              {stockByLocation.map((loc, idx) => (
                                <div key={idx} className="flex justify-between">
                                  <span>{loc.location}:</span>
                                  <span className={loc.qty === 0 ? 'text-red-600' : ''}>{loc.qty}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-center text-gray-600">{p.minimumStock}</td>
                        <td className="px-6 py-4 text-sm text-center">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            currentStock === 0
                              ? 'bg-red-100 text-red-700'
                              : isLowStock
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {currentStock === 0 ? 'Out of Stock' : isLowStock ? 'Low Stock' : 'In Stock'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button
                            onClick={() => { setSelectedProduct(p); setShowAddStock(true); }}
                            className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded text-xs font-medium transition-colors"
                          >
                            Add Stock
                          </button>
                          <button
                            onClick={() => { setSelectedProduct(p); setShowReduceStock(true); }}
                            className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded text-xs font-medium transition-colors"
                          >
                            Reduce Stock
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modals */}
        <AddProductModal open={showAddProduct} onClose={() => setShowAddProduct(false)} onCreated={load} />
        <AddStockModal open={showAddStock} onClose={() => setShowAddStock(false)} productId={selectedProduct?.id} onDone={load} />
        <ReduceStockModal open={showReduceStock} onClose={() => setShowReduceStock(false)} productId={selectedProduct?.id} onDone={load} />
        <ImportExcelModal open={showImport} onClose={() => setShowImport(false)} onDone={load} />
      </div>
    </div>
  );
}
