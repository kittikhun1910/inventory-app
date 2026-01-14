'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, TrendingUp, AlertTriangle, BarChart3, Package, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { fetchJSON } from '@/lib/api';

interface Product {
  id: number;
  sku: string;
  name: string;
  sellingPrice: number;
  minimumStock: number;
  stocklocation: Array<{
    qty: number;
    location: { name: string };
  }>;
}

interface ReportStats {
  totalProducts: number;
  lowStockItems: number;
  totalValue: number;
  outOfStockItems: number;
}

export default function ReportsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ReportStats>({
    totalProducts: 0,
    lowStockItems: 0,
    totalValue: 0,
    outOfStockItems: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const productsData = await fetchJSON('/api/products');
      setProducts(productsData || []);

      // Calculate stats
      let lowStockCount = 0;
      let outOfStockCount = 0;
      let totalValue = 0;

      (productsData || []).forEach((p: Product) => {
        const currentStock = p.stocklocation.reduce((sum, sl) => sum + sl.qty, 0);
        if (currentStock === 0) {
          outOfStockCount++;
        } else if (currentStock < p.minimumStock) {
          lowStockCount++;
        }
        totalValue += currentStock * (p.sellingPrice || 0);
      });

      setStats({
        totalProducts: productsData?.length || 0,
        lowStockItems: lowStockCount,
        totalValue,
        outOfStockItems: outOfStockCount,
      });
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  }

  const lowStockProducts = products.filter(p => {
    const currentStock = p.stocklocation.reduce((sum, sl) => sum + sl.qty, 0);
    return currentStock > 0 && currentStock < p.minimumStock;
  });

  const outOfStockProducts = products.filter(p => {
    const currentStock = p.stocklocation.reduce((sum, sl) => sum + sl.qty, 0);
    return currentStock === 0;
  });

  const topStockedProducts = products
    .map(p => ({
      ...p,
      totalStock: p.stocklocation.reduce((sum, sl) => sum + sl.qty, 0),
    }))
    .sort((a, b) => b.totalStock - a.totalStock)
    .slice(0, 10);

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
            <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="text-gray-600 mt-1">Inventory insights and recommendations</p>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Products</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Low Stock Items</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.lowStockItems}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Out of Stock</p>
                <p className="text-2xl font-bold text-red-600">{stats.outOfStockItems}</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-red-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Inventory Value</p>
                <p className="text-2xl font-bold text-green-600">${(stats.totalValue / 1000).toFixed(1)}K</p>
              </div>
              <BarChart3 className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Low Stock Alert */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="border-b border-gray-200 bg-yellow-50 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                Low Stock Alerts ({lowStockProducts.length})
              </h2>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-600"></div>
                </div>
              ) : lowStockProducts.length === 0 ? (
                <div className="text-center py-8 px-6">
                  <AlertTriangle className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-gray-600">All products are sufficiently stocked</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {lowStockProducts.map(product => {
                    const currentStock = product.stocklocation.reduce((sum, sl) => sum + sl.qty, 0);
                    return (
                      <div key={product.id} className="px-6 py-4 hover:bg-gray-50">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium text-gray-900">{product.name}</h3>
                            <p className="text-sm text-gray-600">SKU: {product.sku}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-red-600">
                              {currentStock} / {product.minimumStock}
                            </p>
                            <p className="text-xs text-gray-500">Current / Min</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Out of Stock */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="border-b border-gray-200 bg-red-50 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-red-600" />
                Out of Stock ({outOfStockProducts.length})
              </h2>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600"></div>
                </div>
              ) : outOfStockProducts.length === 0 ? (
                <div className="text-center py-8 px-6">
                  <ShoppingCart className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-gray-600">No products are out of stock</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {outOfStockProducts.map(product => (
                    <div key={product.id} className="px-6 py-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-gray-900">{product.name}</h3>
                          <p className="text-sm text-gray-600">SKU: {product.sku}</p>
                        </div>
                        <div className="text-right">
                          <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded">
                            Out of Stock
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Top Stocked Products */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden lg:col-span-2">
            <div className="border-b border-gray-200 bg-green-50 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Top Stocked Products
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Product</th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Total Stock</th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Value</th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Locations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto"></div>
                      </td>
                    </tr>
                  ) : topStockedProducts.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-600">
                        No products found
                      </td>
                    </tr>
                  ) : (
                    topStockedProducts.map(product => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-900">{product.name}</p>
                            <p className="text-sm text-gray-600">SKU: {product.sku}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="font-medium text-gray-900">{product.totalStock}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="font-medium text-green-600">
                            ${(product.totalStock * product.sellingPrice).toFixed(2)}
                          </span>
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
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
