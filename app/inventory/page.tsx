'use client';

import { useState, useEffect } from 'react';
import { Package, TrendingUp, AlertTriangle, MapPin, Boxes, BarChart3 } from 'lucide-react';
import { fetchJSON } from '@/lib/api';
import StockTab from './components/StockTab';
import LocationsTab from './components/LocationsTab';
import BestsellersTab from './components/BestsellersTab';
import ReorderTab from './components/ReorderTab';

const TABS = ['Stock', 'Bestsellers', 'Reorder', 'Locations'] as const;

const TAB_ICONS = {
  Stock: Package,
  Bestsellers: TrendingUp,
  Reorder: AlertTriangle,
  Locations: MapPin,
};

interface DashboardStats {
  totalProducts: number;
  totalLocations: number;
  lowStockItems: number;
  totalInventoryValue: number;
}

export default function InventoryPage() {
  const [tab, setTab] = useState<typeof TABS[number]>('Stock');
  const [products, setProducts] = useState<any[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalLocations: 0,
    lowStockItems: 0,
    totalInventoryValue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    setLoading(true);
    try {
      const [productsData, locations] = await Promise.all([
        fetchJSON('/api/products'),
        fetchJSON('/api/locations'),
      ]);

      let lowStockCount = 0;
      let totalValue = 0;

      if (productsData && Array.isArray(productsData)) {
        productsData.forEach((p: any) => {
          const currentStock = (p.stocklocation || []).reduce((sum: number, sl: any) => sum + (sl.qty || 0), 0);
          if (currentStock < p.minimumStock) {
            lowStockCount++;
          }
          totalValue += (currentStock * (p.sellingPrice || 0));
        });
      }

      setProducts(productsData || []);
      setStats({
        totalProducts: productsData?.length || 0,
        totalLocations: locations?.length || 0,
        lowStockItems: lowStockCount,
        totalInventoryValue: totalValue,
      });
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setLoading(false);
    }
  }

  async function loadAndDisplayProducts() {
    setLoading(true);
    try {
      const products = await fetchJSON('/api/products');
      // For displaying in the page, we'll reuse the products fetch
      return products || [];
    } catch (err) {
      console.error('Failed to load products:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }

  const getStockAtLocation = (stocklocations: any[]) => {
    return stocklocations?.reduce((sum: number, sl: any) => sum + (sl.qty || 0), 0) || 0;
  };

  const StatCard = ({ icon: Icon, title, value, color }: { icon: any; title: string; value: string | number; color: string }) => (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${color}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <Icon size={32} className="text-gray-400" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Inventory Management System</h1>
          <p className="text-gray-600 text-lg">Real-time inventory tracking, analytics, and warehouse management</p>
        </div>

        {/* Dashboard Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={Boxes}
            title="Total Products"
            value={loading ? '...' : stats.totalProducts}
            color="hover:shadow-md transition-shadow"
          />
          <StatCard
            icon={MapPin}
            title="Locations"
            value={loading ? '...' : stats.totalLocations}
            color="hover:shadow-md transition-shadow"
          />
          <StatCard
            icon={AlertTriangle}
            title="Low Stock Items"
            value={loading ? '...' : stats.lowStockItems}
            color={stats.lowStockItems > 0 ? 'bg-red-50 border-red-200' : 'hover:shadow-md transition-shadow'}
          />
          <StatCard
            icon={BarChart3}
            title="Inventory Value"
            value={loading ? '...' : `$${(stats.totalInventoryValue / 1000).toFixed(1)}K`}
            color="hover:shadow-md transition-shadow"
          />
        </div>

        {/* All Products Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">All Products</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">SKU</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Product Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Barcode</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Selling Price</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Current Stock</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Min Stock</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Loading products...</td></tr>
                ) : products.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">No products found</td></tr>
                ) : (
                  products.map(p => {
                    const currentStock = getStockAtLocation(p.stocklocation);
                    const isLowStock = currentStock < p.minimumStock;
                    return (
                      <tr key={p.id} className={`hover:bg-gray-50 transition-colors ${isLowStock ? 'bg-red-50' : ''}`}>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900">{p.sku}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{p.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{p.barcode || '-'}</td>
                        <td className="px-4 py-3 text-sm text-center text-gray-900 font-medium">${p.sellingPrice || 0}</td>
                        <td className="px-4 py-3 text-sm text-center text-gray-600 font-medium">{currentStock}</td>
                        <td className="px-4 py-3 text-sm text-center text-gray-600">{p.minimumStock}</td>
                        <td className="px-4 py-3 text-sm text-center">
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
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="flex flex-wrap border-b border-gray-200">
            {TABS.map(t => {
              const Icon = TAB_ICONS[t];
              return (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`flex-1 px-6 py-4 font-medium border-b-2 transition-colors flex items-center justify-center gap-2 ${
                    t === tab
                      ? 'bg-blue-50 border-b-blue-500 text-blue-700'
                      : 'bg-white border-b-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon size={18} />
                  {t}
                </button>
              );
            })}
          </div>

          <div className="p-6">
            {tab === 'Stock' && <StockTab />}
            {tab === 'Bestsellers' && <BestsellersTab />}
            {tab === 'Reorder' && <ReorderTab />}
            {tab === 'Locations' && <LocationsTab />}
          </div>
        </div>
      </div>
    </div>
  );
}