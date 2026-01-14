'use client';

import { useEffect, useState } from 'react';
import { Plus, Upload, RotateCcw } from 'lucide-react';
import { fetchJSON } from '@/lib/api';
import SearchBar from './SearchBar';
import Pagination from './Pagination';
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
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

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
    setCurrentPage(1); // Reset to first page when search changes
  }, [q]);

  const filtered = products.filter(p => p.sku?.toLowerCase().includes(q.toLowerCase()) || p.name?.toLowerCase().includes(q.toLowerCase()));

  // Paginate the filtered results
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
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-64">
          <SearchBar value={q} onChange={setQ} />
        </div>
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
          <Upload size={18} /> นำเข้าไฟล์ด้วย Excel
        </button>
        <button 
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
        >
          <RotateCcw size={18} /> รีเฟรช
        </button>
      </div>

      <div className="border border-gray-200 rounded-lg overflow-x-auto shadow-sm">
        <table className="w-full border-collapse">
          <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 min-w-24">SKU</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 min-w-48">ชื่อผลิตภัณฑ์</th>
              {/* <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 min-w-32">บาร์โค้ด</th> */}
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 min-w-24">ราคาขาย</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 min-w-24">สต๊อกปัจจุบัน</th>
              {/* <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 min-w-24">สต๊อกขั้นต่ำ</th> */}
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 min-w-24">สถานะ</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 min-w-40">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-500">กำลังโหลด....</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-500">ไม่พบสินค้า</td></tr>
            ) : (
              paginatedProducts.map(p => {
                const currentStock = getStockAtLocation(p.stocklocation);
                const isLowStock = currentStock < p.minimumStock;
                const stockByLocation = getStockByLocation(p.stocklocation);
                return (
                  <tr key={p.id} className={`hover:bg-gray-50 transition-colors ${isLowStock ? 'bg-red-50' : ''}`}>
                    <td className="px-4 py-4 text-sm font-semibold text-gray-900 whitespace-nowrap">{p.sku}</td>
                    <td className="px-4 py-4 text-sm text-gray-700">{p.name}</td>
                    {/* <td className="px-4 py-4 text-sm text-gray-600">{p.barcode || '-'}</td> */}
                    <td className="px-4 py-4 text-sm text-center text-gray-900 font-medium">${p.sellingPrice || 0}</td>
                    <td className="px-4 py-4 text-sm text-center text-gray-600 font-medium">
                      <div>{currentStock}</div>
                      {stockByLocation.length > 0 && (
                        <div className="text-xs text-gray-500 mt-1">
                          {stockByLocation.map((loc, idx) => (
                            <div key={idx}>{loc.location}: {loc.qty}</div>
                          ))}
                        </div>
                      )}
                    </td>
                    {/* <td className="px-4 py-4 text-sm text-center text-gray-600">{p.minimumStock}</td> */}
                    <td className="px-4 py-4 text-sm text-center">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        currentStock === 0
                          ? 'bg-red-100 text-red-700'
                          : isLowStock
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {currentStock === 0 ? 'หมด' : isLowStock ? 'ต่ำ' : 'ปกติ'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => { setSelectedProduct(p); setShowAddStock(true); }}
                        className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded text-xs font-medium transition-colors"
                      >
                        เพิ่มสต๊อก
                      </button>
                      <button
                        onClick={() => { setSelectedProduct(p); setShowReduceStock(true); }}
                        className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded text-xs font-medium transition-colors"
                      >
                        ลดสต๊อก
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
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
            setCurrentPage(1); // Reset to first page when changing items per page
          }}
        />
      )}

      <AddProductModal open={showAddProduct} onClose={() => setShowAddProduct(false)} onCreated={load} />
      <AddStockModal open={showAddStock} onClose={() => setShowAddStock(false)} productId={selectedProduct?.id} onDone={load} />
      <ReduceStockModal open={showReduceStock} onClose={() => setShowReduceStock(false)} productId={selectedProduct?.id} onDone={load} />
      <ImportExcelModal open={showImport} onClose={() => setShowImport(false)} onDone={load} />
    </div>
  );
}
