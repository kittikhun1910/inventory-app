'use client';

import { useState, useEffect } from 'react';
import { MapPin, Package, Search, ShoppingCart, Filter, Grid, List, AlertTriangle, CheckCircle, Store, Warehouse, Eye, EyeOff } from 'lucide-react';
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
  const [locations, setLocations] = useState<Array<{id: number, name: string}>>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterStatus, setFilterStatus] = useState<'all' | 'in-stock' | 'low-stock' | 'out-of-stock'>('all');
  const [filterLocation, setFilterLocation] = useState<string>('all');

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <ShoppingCart className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Store Inventory</h1>
                <p className="text-sm text-gray-600">Find products and their locations</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <a
                href="/inventory"
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
              >
                Admin Panel
              </a>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Filters and Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filter:</span>
            </div>
            <div className="flex space-x-2">
              {[
                { key: 'all', label: 'All', icon: null },
                { key: 'in-stock', label: 'In Stock', icon: CheckCircle },
                { key: 'low-stock', label: 'Low Stock', icon: AlertTriangle },
                { key: 'out-of-stock', label: 'Out of Stock', icon: Package }
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setFilterStatus(key as any)}
                  className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                    filterStatus === key
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {Icon && <Icon className="h-3 w-3 inline mr-1" />}
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">View:</span>
            <div className="flex border border-gray-300 rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
        <div className="mt-3 text-sm text-gray-600">
          Showing {filteredProducts.length} of {products.length} products
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => {
              const totalStock = getTotalStock(product.stocklocation);
              return (
                <div
                  key={product.id}
                  className="group bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-xl hover:border-gray-300 transition-all duration-300 transform hover:-translate-y-1"
                >
                  {/* Status Banner */}
                  <div className={`h-2 ${
                    totalStock === 0 ? 'bg-red-500' :
                    totalStock < product.minimumStock ? 'bg-yellow-500' : 'bg-green-500'
                  }`} />

                  <div className="p-6">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                          {product.name}
                        </h3>
                        <div className="flex items-center space-x-3">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            SKU: {product.sku}
                          </span>
                          {product.barcode && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {product.barcode}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <div className="text-2xl font-bold text-green-600 mb-1">
                          ${product.sellingPrice}
                        </div>
                        <div className="text-xs text-gray-500">per unit</div>
                      </div>
                    </div>

                    {/* Stock Overview */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <Package className="h-5 w-5 text-gray-600" />
                          <span className="font-medium text-gray-900">Stock Overview</span>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          totalStock === 0 ? 'bg-red-100 text-red-800' :
                          totalStock < product.minimumStock ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {totalStock === 0 ? 'Out of Stock' :
                           totalStock < product.minimumStock ? 'Low Stock' : 'In Stock'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div className="bg-white rounded-lg p-3 border">
                          <div className={`text-2xl font-bold ${
                            totalStock === 0 ? 'text-red-600' :
                            totalStock < product.minimumStock ? 'text-yellow-600' : 'text-green-600'
                          }`}>
                            {totalStock}
                          </div>
                          <div className="text-xs text-gray-600">Total Units</div>
                        </div>
                        <div className="bg-white rounded-lg p-3 border">
                          <div className="text-2xl font-bold text-blue-600">
                            {product.minimumStock}
                          </div>
                          <div className="text-xs text-gray-600">Min Required</div>
                        </div>
                      </div>
                    </div>

                    {/* Locations */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Warehouse className="h-5 w-5 text-gray-600" />
                        <span className="font-medium text-gray-900">Warehouse Locations</span>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                          {product.stocklocation.length} location{product.stocklocation.length !== 1 ? 's' : ''}
                        </span>
                      </div>

                      {product.stocklocation.length === 0 ? (
                        <div className="bg-gray-50 rounded-lg p-4 text-center">
                          <MapPin className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600">No warehouse locations assigned</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {product.stocklocation.map((sl) => (
                            <div key={sl.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                              <div className="flex items-center space-x-3">
                                <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                                  <Store className="h-4 w-4 text-blue-600" />
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">{sl.location.name}</p>
                                  <p className="text-xs text-gray-600">Warehouse</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className={`text-lg font-bold ${
                                  sl.qty === 0 ? 'text-red-600' :
                                  sl.qty < product.minimumStock ? 'text-yellow-600' : 'text-green-600'
                                }`}>
                                  {sl.qty}
                                </div>
                                <div className="text-xs text-gray-500">units</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Quick Actions for Admin */}
                    <div className="mt-6 pt-4 border-t border-gray-100">
                      <div className="flex space-x-2">
                        <Link
                          href={`/inventory/stock`}
                          className="flex-1 inline-flex items-center justify-center px-3 py-2 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View Details
                        </Link>
                        <button
                          onClick={() => window.open(`/inventory`, '_blank')}
                          className="flex-1 inline-flex items-center justify-center px-3 py-2 text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Package className="h-3 w-3 mr-1" />
                          Manage Stock
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // List view
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Product</th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Price</th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Stock</th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Locations</th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredProducts.map((product) => {
                    const totalStock = getTotalStock(product.stocklocation);
                    return (
                      <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-900">{product.name}</p>
                            <p className="text-sm text-gray-600">SKU: {product.sku}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="font-semibold text-green-600">${product.sellingPrice}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`font-medium ${
                            totalStock === 0 ? 'text-red-600' :
                            totalStock < product.minimumStock ? 'text-yellow-600' : 'text-green-600'
                          }`}>
                            {totalStock}
                          </span>
                          <div className="text-xs text-gray-500 mt-1">
                            Min: {product.minimumStock}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="text-sm text-gray-600">
                            {product.stocklocation.map((sl, idx) => (
                              <div key={idx}>
                                {sl.location.name}: {sl.qty}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            totalStock === 0 ? 'bg-red-100 text-red-700' :
                            totalStock < product.minimumStock ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {totalStock === 0 ? 'Out of Stock' :
                             totalStock < product.minimumStock ? 'Low Stock' : 'In Stock'}
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
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'No products found' : 'No products available'}
            </h3>
            <p className="text-gray-600">
              {searchTerm ? 'Try adjusting your search terms.' : 'Products will appear here once added to inventory.'}
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p>&copy; 2024 Inventory Management System. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
