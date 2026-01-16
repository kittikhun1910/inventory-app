'use client';

import { useState, useEffect } from 'react';
import { MapPin, Package, Search, ShoppingCart, Filter, Grid, List, AlertTriangle, CheckCircle, Store, Warehouse, Eye, Menu, X } from 'lucide-react';
import Link from 'next/link';
import { fetchJSON } from '@/lib/api';

interface Product {
  id: number;
  sku: string;
  name: string;
  barcode?: string;
  sellingPrice: number;
  minimumStock: number;
  stocklocation: Array<{
    id: number;
    qty: number;
    location: {
      id: number;
      name: string;
    };
  }>;
}

export default function StorePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterStatus, setFilterStatus] = useState<'all' | 'in-stock' | 'low-stock' | 'out-of-stock'>('all');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    try {
      const data = await fetchJSON('/api/products');
      setProducts(data || []);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    const totalStock = product.stocklocation.reduce((sum, sl) => sum + sl.qty, 0);

    switch (filterStatus) {
      case 'in-stock':
        return totalStock >= product.minimumStock && totalStock > 0;
      case 'low-stock':
        return totalStock > 0 && totalStock < product.minimumStock;
      case 'out-of-stock':
        return totalStock === 0;
      default:
        return true;
    }
  });

  const getTotalStock = (stocklocations: Product['stocklocation']) => {
    return stocklocations.reduce((sum, sl) => sum + sl.qty, 0);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile Header */}
      <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 lg:h-20">
            {/* Logo and Title */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              <ShoppingCart className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 flex-shrink-0" />
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900 truncate">สต๊อกสินค้า</h1>
                <p className="text-xs sm:text-sm text-slate-600 hidden sm:block">ค้นหาสินค้าและสถานที่จัดเก็บ</p>
              </div>
            </div>
            
            {/* Desktop Actions */}
            <div className="hidden lg:flex items-center space-x-4">
              <Link
                href="/inventory"
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
              >
                แผงควบคุมผู้ดูแลระบบ
              </Link>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="ค้นหาสินค้า..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-64 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              {showMobileMenu ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Search - Always visible on mobile */}
          <div className="lg:hidden pb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="ค้นหาสินค้า..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Mobile Menu Dropdown */}
          {showMobileMenu && (
            <div className="lg:hidden pb-4 animate-slide-down">
              <Link
                href="/inventory"
                className="block w-full px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors text-center"
                onClick={() => setShowMobileMenu(false)}
              >
                แผงควบคุมผู้ดูแลระบบ
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Filters and Controls */}
      <div className="sticky top-16 lg:top-20 z-30 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 lg:py-4">
          {/* Mobile Filter Toggle */}
          <div className="lg:hidden mb-3">
            <button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
            >
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4" />
                <span>ตัวกรอง ({filterStatus === 'all' ? 'ทั้งหมด' : filterStatus === 'in-stock' ? 'มีสินค้า' : filterStatus === 'low-stock' ? 'เหลือน้อย' : 'หมดสต็อก'})</span>
              </div>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">{filteredProducts.length}</span>
            </button>
          </div>

          {/* Desktop Filters */}
          <div className={`${showMobileFilters ? 'block' : 'hidden'} lg:block space-y-3 lg:space-y-0`}>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="hidden lg:flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-slate-500" />
                  <span className="text-sm font-medium text-slate-700">ตัวกรอง:</span>
                </div>
                <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
                  {[
                    { key: 'all', label: 'ทั้งหมด', icon: null },
                    { key: 'in-stock', label: 'มีสินค้า', icon: CheckCircle },
                    { key: 'low-stock', label: 'เหลือน้อย', icon: AlertTriangle },
                    { key: 'out-of-stock', label: 'หมดสต็อก', icon: Package }
                  ].map(({ key, label, icon: Icon }) => (
                    <button
                      key={key}
                      onClick={() => {
                        setFilterStatus(key as any);
                        setShowMobileFilters(false);
                      }}
                      className={`px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors flex items-center justify-center ${
                        filterStatus === key
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {Icon && <Icon className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />}
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* View Mode Toggle */}
              <div className="flex items-center justify-between lg:justify-end">
                <span className="text-sm text-slate-600">
                  {filteredProducts.length} จาก {products.length} สินค้า
                </span>
                <div className="flex border border-slate-300 rounded-lg overflow-hidden ml-3">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                  >
                    <Grid className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-blue-600"></div>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
            {filteredProducts.map((product) => {
              const totalStock = getTotalStock(product.stocklocation);
              return (
                <div
                  key={product.id}
                  className="group bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg hover:border-slate-300 transition-all duration-300"
                >
                  {/* Status Banner */}
                  <div className={`h-1.5 ${
                    totalStock === 0 ? 'bg-red-500' :
                    totalStock < product.minimumStock ? 'bg-yellow-500' : 'bg-green-500'
                  }`} />

                  <div className="p-4 lg:p-5">
                    {/* Header */}
                    <div className="mb-3">
                      <h3 className="text-base lg:text-lg font-bold text-slate-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {product.name}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                          {product.sku}
                        </span>
                        {product.barcode && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {product.barcode}
                          </span>
                        )}
                      </div>
                      <div className="mt-2 flex items-baseline">
                        <div className="text-xl lg:text-2xl font-bold text-green-600">
                          ${product.sellingPrice}
                        </div>
                        <div className="text-xs text-slate-500 ml-1">/ หน่วย</div>
                      </div>
                    </div>

                    {/* Stock Overview */}
                    <div className="bg-slate-50 rounded-lg p-3 mb-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-1.5">
                          <Package className="h-4 w-4 text-slate-600" />
                          <span className="text-xs font-medium text-slate-900">สต็อก</span>
                        </div>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          totalStock === 0 ? 'bg-red-100 text-red-800' :
                          totalStock < product.minimumStock ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {totalStock === 0 ? 'หมด' :
                           totalStock < product.minimumStock ? 'เหลือน้อย' : 'มีสินค้า'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-center">
                        <div className="bg-white rounded-lg p-2 border border-slate-200">
                          <div className={`text-lg lg:text-xl font-bold ${
                            totalStock === 0 ? 'text-red-600' :
                            totalStock < product.minimumStock ? 'text-yellow-600' : 'text-green-600'
                          }`}>
                            {totalStock}
                          </div>
                          <div className="text-xs text-slate-600">ทั้งหมด</div>
                        </div>
                        <div className="bg-white rounded-lg p-2 border border-slate-200">
                          <div className="text-lg lg:text-xl font-bold text-blue-600">
                            {product.minimumStock}
                          </div>
                          <div className="text-xs text-slate-600">ขั้นต่ำ</div>
                        </div>
                      </div>
                    </div>

                    {/* Locations */}
                    <div className="space-y-2">
                      <div className="flex items-center space-x-1.5">
                        <Warehouse className="h-4 w-4 text-slate-600" />
                        <span className="text-xs font-medium text-slate-900">
                          {product.stocklocation.length} สถานที่
                        </span>
                      </div>

                      {product.stocklocation.length === 0 ? (
                        <div className="bg-slate-50 rounded-lg p-3 text-center">
                          <MapPin className="h-6 w-6 text-slate-400 mx-auto mb-1" />
                          <p className="text-xs text-slate-600">ไม่มีสถานที่</p>
                        </div>
                      ) : (
                        <div className="space-y-1.5 max-h-24 overflow-y-auto">
                          {product.stocklocation.map((sl) => (
                            <div key={sl.id} className="flex items-center justify-between bg-slate-50 rounded-lg p-2">
                              <div className="flex items-center space-x-2 min-w-0">
                                <div className="flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full flex-shrink-0">
                                  <Store className="h-3 w-3 text-blue-600" />
                                </div>
                                <p className="text-xs font-medium text-slate-900 truncate">{sl.location.name}</p>
                              </div>
                              <div className={`text-sm font-bold ml-2 flex-shrink-0 ${
                                sl.qty === 0 ? 'text-red-600' :
                                sl.qty < product.minimumStock ? 'text-yellow-600' : 'text-green-600'
                              }`}>
                                {sl.qty}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <div className="grid grid-cols-2 gap-2">
                        <Link
                          href="/inventory/stock"
                          className="flex items-center justify-center px-3 py-2 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          ดู
                        </Link>
                        <Link
                          href="/inventory"
                          className="flex items-center justify-center px-3 py-2 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <Package className="h-3 w-3 mr-1" />
                          จัดการ
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // List view - Mobile optimized
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-[640px]">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">สินค้า</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700">ราคา</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700">สต็อก</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700">สถานที่</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700">สถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredProducts.map((product) => {
                    const totalStock = getTotalStock(product.stocklocation);
                    return (
                      <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-slate-900 text-sm">{product.name}</p>
                            <p className="text-xs text-slate-600">{product.sku}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="font-semibold text-green-600 text-sm">${product.sellingPrice}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`font-medium text-sm ${
                            totalStock === 0 ? 'text-red-600' :
                            totalStock < product.minimumStock ? 'text-yellow-600' : 'text-green-600'
                          }`}>
                            {totalStock}
                          </span>
                          <div className="text-xs text-slate-500 mt-0.5">
                            Min: {product.minimumStock}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-xs text-slate-600 space-y-0.5">
                            {product.stocklocation.map((sl, idx) => (
                              <div key={idx} className="flex justify-between">
                                <span>{sl.location.name}:</span>
                                <span className="font-medium ml-2">{sl.qty}</span>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                            totalStock === 0 ? 'bg-red-100 text-red-700' :
                            totalStock < product.minimumStock ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {totalStock === 0 ? 'หมด' :
                             totalStock < product.minimumStock ? 'เหลือน้อย' : 'มีสินค้า'}
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

        {!loading && filteredProducts.length === 0 && (
          <div className="text-center py-16 px-4">
            <Package className="mx-auto h-16 w-16 text-slate-400 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              {searchTerm || filterStatus !== 'all' ? 'ไม่พบสินค้า' : 'ยังไม่มีสินค้า'}
            </h3>
            <p className="text-slate-600 text-sm max-w-md mx-auto">
              {searchTerm || filterStatus !== 'all' ? 'ลองปรับเปลี่ยนตัวกรองหรือคำค้นหา' : 'สินค้าจะแสดงที่นี่เมื่อเพิ่มลงในระบบ'}
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12 lg:mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          <div className="text-center text-slate-600 text-sm">
            <p>&copy; {new Date().getFullYear()} ระบบบริหารจัดการสินค้าคงคลัง</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
