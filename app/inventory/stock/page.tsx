'use client';

import { useState, useEffect } from 'react';
import { Plus, Upload, RotateCcw, ArrowLeft, Menu, X } from 'lucide-react';
import Link from 'next/link';
import { fetchJSON } from '@/lib/api';
import SearchBar from '../components/SearchBar';
import Pagination from '../components/Pagination';
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
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [showMobileActions, setShowMobileActions] = useState(false);

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

  useEffect(() => {
    setCurrentPage(1);
  }, [q]);

  const filtered = products.filter(p => p.sku?.toLowerCase().includes(q.toLowerCase()) || p.name?.toLowerCase().includes(q.toLowerCase()));

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProducts = filtered.slice(startIndex, endIndex);

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
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 lg:h-20">
            <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
              <Link
                href="/inventory"
                className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 transition-colors flex-shrink-0"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900 truncate">จัดการสต็อก</h1>
                <p className="text-xs sm:text-sm text-slate-600 hidden sm:block truncate">จัดการสินค้าคงคลังและระดับสต็อก</p>
              </div>
            </div>
            
            {/* Desktop Actions */}
            <div className="hidden lg:flex items-center space-x-3 flex-shrink-0">
              <Link
                href="/"
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors text-sm"
              >
                ดูร้านค้า
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMobileActions(!showMobileActions)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors flex-shrink-0"
            >
              {showMobileActions ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Search Bar - Always visible */}
        <div className="mb-4">
          <SearchBar value={q} onChange={setQ} />
        </div>

        {/* Mobile Actions Menu */}
        {showMobileActions && (
          <div className="lg:hidden mb-4 bg-white rounded-lg shadow-sm border border-slate-200 p-4 animate-slide-down space-y-2">
            <button
              onClick={() => { setShowAddProduct(true); setShowMobileActions(false); }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              <Plus size={18} /> เพิ่มสินค้า
            </button>
            <button
              onClick={() => { setShowImport(true); setShowMobileActions(false); }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
            >
              <Upload size={18} /> นำเข้า Excel
            </button>
            <button
              onClick={() => { load(); setShowMobileActions(false); }}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-600 hover:bg-slate-700 disabled:bg-slate-400 text-white rounded-lg font-medium transition-colors"
            >
              <RotateCcw size={18} /> รีเฟรชข้อมูล
            </button>
            <Link
              href="/"
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
              onClick={() => setShowMobileActions(false)}
            >
              ดูร้านค้า
            </Link>
          </div>
        )}

        {/* Desktop Action Bar */}
        <div className="hidden lg:block bg-white rounded-lg shadow-sm border border-slate-200 p-4 mb-6">
          <div className="flex flex-wrap gap-3 items-center">
            <button
              onClick={() => setShowAddProduct(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              <Plus size={18} /> เพิ่มสินค้า
            </button>
            <button
              onClick={() => setShowImport(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
            >
              <Upload size={18} /> นำเข้า Excel
            </button>
            <button
              onClick={load}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-600 hover:bg-slate-700 disabled:bg-slate-400 text-white rounded-lg font-medium transition-colors"
            >
              <RotateCcw size={18} /> รีเฟรชข้อมูล
            </button>
          </div>
        </div>

        {/* Results Info */}
        <div className="mb-4 text-sm text-slate-600">
          แสดง {paginatedProducts.length} จาก {filtered.length} สินค้า
          {q && <span className="ml-2 text-blue-600 font-medium">(ค้นหา: "{q}")</span>}
        </div>

        {/* Stock Table - Desktop */}
        <div className="hidden md:block bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-slate-700">SKU</th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-slate-700">ชื่อสินค้า</th>
                  <th className="px-4 lg:px-6 py-3 text-center text-xs font-semibold text-slate-700">ราคาขาย</th>
                  <th className="px-4 lg:px-6 py-3 text-center text-xs font-semibold text-slate-700">สต็อกทั้งหมด</th>
                  <th className="px-4 lg:px-6 py-3 text-center text-xs font-semibold text-slate-700">สต็อกขั้นต่ำ</th>
                  <th className="px-4 lg:px-6 py-3 text-center text-xs font-semibold text-slate-700">สถานะ</th>
                  <th className="px-4 lg:px-6 py-3 text-right text-xs font-semibold text-slate-700">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {loading ? (
                  <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-500">กำลังโหลดสินค้า...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-500">ไม่พบสินค้า</td></tr>
                ) : (
                  paginatedProducts.map(p => {
                    const currentStock = getStockAtLocation(p.stocklocation);
                    const isLowStock = currentStock < p.minimumStock;
                    const stockByLocation = getStockByLocation(p.stocklocation);
                    return (
                      <tr key={p.id} className={`hover:bg-slate-50 transition-colors ${isLowStock ? 'bg-red-50' : ''}`}>
                        <td className="px-4 lg:px-6 py-3 text-sm font-semibold text-slate-900">{p.sku}</td>
                        <td className="px-4 lg:px-6 py-3 text-sm text-slate-700">{p.name}</td>
                        <td className="px-4 lg:px-6 py-3 text-sm text-center text-slate-900 font-medium">${p.sellingPrice || 0}</td>
                        <td className="px-4 lg:px-6 py-3 text-sm text-center">
                          <div className="font-medium text-slate-900">{currentStock}</div>
                          {stockByLocation.length > 0 && (
                            <div className="text-xs text-slate-500 mt-1 space-y-1">
                              {stockByLocation.map((loc, idx) => (
                                <div key={idx} className="flex justify-between">
                                  <span>{loc.location}:</span>
                                  <span className={loc.qty === 0 ? 'text-red-600' : ''}>{loc.qty}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="px-4 lg:px-6 py-3 text-sm text-center text-slate-600">{p.minimumStock}</td>
                        <td className="px-4 lg:px-6 py-3 text-sm text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            currentStock === 0
                              ? 'bg-red-100 text-red-700'
                              : isLowStock
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {currentStock === 0 ? 'หมด' : isLowStock ? 'เหลือน้อย' : 'มีสินค้า'}
                          </span>
                        </td>
                        <td className="px-4 lg:px-6 py-3 text-right space-x-2">
                          <button
                            onClick={() => { setSelectedProduct(p); setShowAddStock(true); }}
                            className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-xs font-medium transition-colors"
                          >
                            เพิ่ม
                          </button>
                          <button
                            onClick={() => { setSelectedProduct(p); setShowReduceStock(true); }}
                            className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-medium transition-colors"
                          >
                            ลด
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

        {/* Mobile Cards */}
        <div className="md:hidden space-y-4 mb-6">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-blue-600"></div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-500">ไม่พบสินค้า</div>
          ) : (
            paginatedProducts.map(p => {
              const currentStock = getStockAtLocation(p.stocklocation);
              const isLowStock = currentStock < p.minimumStock;
              const stockByLocation = getStockByLocation(p.stocklocation);
              return (
                <div key={p.id} className={`bg-white rounded-lg shadow-sm border overflow-hidden ${isLowStock ? 'border-yellow-300 bg-yellow-50' : 'border-slate-200'}`}>
                  {/* Status Bar */}
                  <div className={`h-1.5 ${
                    currentStock === 0 ? 'bg-red-500' :
                    isLowStock ? 'bg-yellow-500' : 'bg-green-500'
                  }`} />
                  
                  <div className="p-4">
                    {/* Header */}
                    <div className="mb-3">
                      <h3 className="text-base font-bold text-slate-900 mb-1">{p.name}</h3>
                      <p className="text-sm text-slate-600">SKU: {p.sku}</p>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="bg-slate-50 rounded-lg p-3">
                        <div className="text-xs text-slate-600 mb-1">ราคาขาย</div>
                        <div className="text-lg font-bold text-green-600">${p.sellingPrice || 0}</div>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-3">
                        <div className="text-xs text-slate-600 mb-1">สถานะ</div>
                        <div className={`text-xs font-semibold ${
                          currentStock === 0 ? 'text-red-700' :
                          isLowStock ? 'text-yellow-700' : 'text-green-700'
                        }`}>
                          {currentStock === 0 ? 'หมด' : isLowStock ? 'เหลือน้อย' : 'มีสินค้า'}
                        </div>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-3">
                        <div className="text-xs text-slate-600 mb-1">สต็อกทั้งหมด</div>
                        <div className={`text-lg font-bold ${
                          currentStock === 0 ? 'text-red-600' :
                          isLowStock ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                          {currentStock}
                        </div>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-3">
                        <div className="text-xs text-slate-600 mb-1">สต็อกขั้นต่ำ</div>
                        <div className="text-lg font-bold text-blue-600">{p.minimumStock}</div>
                      </div>
                    </div>

                    {/* Locations */}
                    {stockByLocation.length > 0 && (
                      <div className="bg-slate-50 rounded-lg p-3 mb-3">
                        <div className="text-xs font-medium text-slate-700 mb-2">สต็อกตามสถานที่:</div>
                        <div className="space-y-1">
                          {stockByLocation.map((loc, idx) => (
                            <div key={idx} className="flex justify-between text-xs">
                              <span className="text-slate-600">{loc.location}</span>
                              <span className={`font-medium ${loc.qty === 0 ? 'text-red-600' : 'text-slate-900'}`}>{loc.qty}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => { setSelectedProduct(p); setShowAddStock(true); }}
                        className="px-3 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        เพิ่มสต็อก
                      </button>
                      <button
                        onClick={() => { setSelectedProduct(p); setShowReduceStock(true); }}
                        className="px-3 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        ลดสต็อก
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {!loading && filtered.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalItems={filtered.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(newItemsPerPage) => {
              setItemsPerPage(newItemsPerPage);
              setCurrentPage(1);
            }}
          />
        )}

        {/* Modals */}
        <AddProductModal open={showAddProduct} onClose={() => setShowAddProduct(false)} onCreated={load} />
        <AddStockModal open={showAddStock} onClose={() => setShowAddStock(false)} productId={selectedProduct?.id} onDone={load} />
        <ReduceStockModal open={showReduceStock} onClose={() => setShowReduceStock(false)} productId={selectedProduct?.id} onDone={load} />
        <ImportExcelModal open={showImport} onClose={() => setShowImport(false)} onDone={load} />
      </div>
    </div>
  );
}
