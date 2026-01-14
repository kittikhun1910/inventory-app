'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, TrendingUp, AlertTriangle, BarChart3, Package, ShoppingCart, Calendar, Download, Filter, RefreshCw, DollarSign, Activity, Zap } from 'lucide-react';
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

interface StockMovement {
  id: number;
  type: 'IN' | 'OUT';
  qty: number;
  refType: 'MANUAL' | 'IMPORT' | 'SALE';
  createdAt: string;
  product: Product;
}

interface ReportStats {
  totalProducts: number;
  lowStockItems: number;
  totalValue: number;
  outOfStockItems: number;
}

type TimeRange = 'today' | 'week' | 'month' | 'custom';

export default function ReportsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ReportStats>({
    totalProducts: 0,
    lowStockItems: 0,
    totalValue: 0,
    outOfStockItems: 0,
  });
  const [timeRange, setTimeRange] = useState<TimeRange>('week');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  useEffect(() => {
    loadData();
  }, [timeRange, customStartDate, customEndDate]);

  async function loadData() {
    setLoading(true);
    try {
      const [productsData, movementsData] = await Promise.all([
        fetchJSON('/api/products'),
        loadMovements()
      ]);

      setProducts(productsData || []);
      setMovements(movementsData || []);

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

  async function loadMovements() {
    const params = new URLSearchParams();

    if (timeRange === 'custom' && customStartDate && customEndDate) {
      params.append('startDate', customStartDate);
      params.append('endDate', customEndDate);
    } else {
      const now = new Date();
      let startDate: Date;

      switch (timeRange) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        default:
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      }

      params.append('startDate', startDate.toISOString().split('T')[0]);
      params.append('endDate', now.toISOString().split('T')[0]);
    }

    return await fetchJSON(`/api/stock-movements?${params.toString()}`);
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

  // Calculate movement summaries
  const itemsReceived = movements.filter(m => m.type === 'IN');
  const itemsSold = movements.filter(m => m.type === 'OUT' && m.refType === 'SALE');
  const totalReceived = itemsReceived.reduce((sum, m) => sum + m.qty, 0);
  const totalSold = itemsSold.reduce((sum, m) => sum + m.qty, 0);
  const salesRevenue = itemsSold.reduce((sum, m) => sum + (m.qty * m.product.sellingPrice), 0);

  // Product performance
  const productPerformance = products.map(product => {
    const productMovements = movements.filter(m => m.product.id === product.id);
    const sold = productMovements.filter(m => m.type === 'OUT' && m.refType === 'SALE').reduce((sum, m) => sum + m.qty, 0);
    const received = productMovements.filter(m => m.type === 'IN').reduce((sum, m) => sum + m.qty, 0);
    const currentStock = product.stocklocation.reduce((sum, sl) => sum + sl.qty, 0);

    return {
      ...product,
      sold,
      received,
      currentStock,
      revenue: sold * product.sellingPrice,
      turnover: currentStock > 0 ? sold / currentStock : 0,
    };
  }).sort((a, b) => b.revenue - a.revenue);

  const formatCurrency = (amount: number) => `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString();

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
              <button
                onClick={loadData}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                Refresh
              </button>
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
            <p className="text-gray-600 mt-1">Comprehensive inventory reports and business insights</p>
          </div>
        </div>

        {/* Time Range Filter */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-gray-600" />
              <span className="font-medium text-gray-900">Report Period:</span>
            </div>
            <div className="flex space-x-2">
              {[
                { key: 'today', label: 'Today' },
                { key: 'week', label: 'This Week' },
                { key: 'month', label: 'This Month' },
                { key: 'custom', label: 'Custom Range' }
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setTimeRange(key as TimeRange)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    timeRange === key
                      ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-2 border-transparent'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {timeRange === 'custom' && (
              <div className="flex items-center space-x-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">End Date</label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Key Metrics Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Items Received</p>
                <p className="text-2xl font-bold text-blue-600">{totalReceived}</p>
                <p className="text-xs text-gray-500 mt-1">{itemsReceived.length} transactions</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Items Sold</p>
                <p className="text-2xl font-bold text-green-600">{totalSold}</p>
                <p className="text-xs text-gray-500 mt-1">{itemsSold.length} sales</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Sales Revenue</p>
                <p className="text-2xl font-bold text-emerald-600">{formatCurrency(salesRevenue)}</p>
                <p className="text-xs text-gray-500 mt-1">Total sales value</p>
              </div>
              <DollarSign className="h-8 w-8 text-emerald-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg. Sale Price</p>
                <p className="text-2xl font-bold text-purple-600">
                  {itemsSold.length > 0 ? formatCurrency(salesRevenue / totalSold) : '$0.00'}
                </p>
                <p className="text-xs text-gray-500 mt-1">Per unit sold</p>
              </div>
              <Activity className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Daily/Weekly/Monthly Summary */}
          <div className="xl:col-span-2 space-y-8">
            {/* Stock Movement Summary */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="border-b border-gray-200 bg-blue-50 px-6 py-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-600" />
                  Stock Movement Summary
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Product</th>
                      <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Type</th>
                      <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Quantity</th>
                      <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Reference</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                        </td>
                      </tr>
                    ) : movements.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-gray-600">
                          No stock movements found for this period
                        </td>
                      </tr>
                    ) : (
                      movements.slice(0, 20).map(movement => (
                        <tr key={movement.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {formatDate(movement.createdAt)}
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-medium text-gray-900">{movement.product.name}</p>
                              <p className="text-sm text-gray-600">SKU: {movement.product.sku}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              movement.type === 'IN'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {movement.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center font-medium text-gray-900">
                            {movement.qty}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              movement.refType === 'SALE'
                                ? 'bg-blue-100 text-blue-800'
                                : movement.refType === 'IMPORT'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {movement.refType}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Product Performance */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="border-b border-gray-200 bg-purple-50 px-6 py-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                  Product Performance Summary
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Product</th>
                      <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Sold</th>
                      <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Received</th>
                      <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Revenue</th>
                      <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Turnover</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mx-auto"></div>
                        </td>
                      </tr>
                    ) : productPerformance.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-gray-600">
                          No product data available
                        </td>
                      </tr>
                    ) : (
                      productPerformance.slice(0, 10).map(product => (
                        <tr key={product.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-medium text-gray-900">{product.name}</p>
                              <p className="text-sm text-gray-600">SKU: {product.sku}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="font-medium text-red-600">{product.sold}</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="font-medium text-blue-600">{product.received}</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="font-medium text-green-600">{formatCurrency(product.revenue)}</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`font-medium ${
                              product.turnover > 0.5 ? 'text-green-600' :
                              product.turnover > 0.2 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {(product.turnover * 100).toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Sidebar Reports */}
          <div className="space-y-8">
            {/* Low Stock Alert */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="border-b border-gray-200 bg-yellow-50 px-6 py-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  Low Stock Alerts
                </h3>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {loading ? (
                  <div className="flex justify-center items-center py-6">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-600"></div>
                  </div>
                ) : lowStockProducts.length === 0 ? (
                  <div className="text-center py-6 px-4">
                    <AlertTriangle className="mx-auto h-6 w-6 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">All products sufficiently stocked</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {lowStockProducts.slice(0, 5).map(product => {
                      const currentStock = product.stocklocation.reduce((sum, sl) => sum + sl.qty, 0);
                      return (
                        <div key={product.id} className="px-4 py-3 hover:bg-gray-50">
                          <div className="flex justify-between items-center">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                              <p className="text-xs text-gray-600">{product.sku}</p>
                            </div>
                            <div className="text-right ml-2">
                              <p className="text-sm font-medium text-red-600">
                                {currentStock}/{product.minimumStock}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {lowStockProducts.length > 5 && (
                      <div className="px-4 py-3 bg-gray-50 text-center">
                        <Link href="#low-stock" className="text-sm text-blue-600 hover:text-blue-700">
                          +{lowStockProducts.length - 5} more...
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Out of Stock */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="border-b border-gray-200 bg-red-50 px-6 py-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-red-600" />
                  Out of Stock
                </h3>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {loading ? (
                  <div className="flex justify-center items-center py-6">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600"></div>
                  </div>
                ) : outOfStockProducts.length === 0 ? (
                  <div className="text-center py-6 px-4">
                    <ShoppingCart className="mx-auto h-6 w-6 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">No products out of stock</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {outOfStockProducts.slice(0, 5).map(product => (
                      <div key={product.id} className="px-4 py-3 hover:bg-gray-50">
                        <div className="flex justify-between items-center">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                            <p className="text-xs text-gray-600">{product.sku}</p>
                          </div>
                          <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded ml-2">
                            OOS
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Top Performers */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="border-b border-gray-200 bg-green-50 px-6 py-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Top Sellers
                </h3>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {loading ? (
                  <div className="flex justify-center items-center py-6">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600"></div>
                  </div>
                ) : productPerformance.filter(p => p.sold > 0).length === 0 ? (
                  <div className="text-center py-6 px-4">
                    <TrendingUp className="mx-auto h-6 w-6 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">No sales data yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {productPerformance.filter(p => p.sold > 0).slice(0, 5).map((product, index) => (
                      <div key={product.id} className="px-4 py-3 hover:bg-gray-50">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center justify-center w-6 h-6 bg-green-100 rounded-full">
                            <span className="text-xs font-bold text-green-700">#{index + 1}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                            <p className="text-xs text-gray-600">{product.sold} sold • {formatCurrency(product.revenue)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
