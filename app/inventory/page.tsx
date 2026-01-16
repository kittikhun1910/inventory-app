'use client';

import { useState, useEffect } from 'react';
import { Package, TrendingUp, AlertTriangle, MapPin, Boxes, BarChart3, Menu, X, Home } from 'lucide-react';
import Link from 'next/link';
import { fetchJSON } from '@/lib/api';

interface DashboardStats {
  totalProducts: number;
  totalLocations: number;
  lowStockItems: number;
  totalInventoryValue: number;
}

export default function InventoryDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalLocations: 0,
    lowStockItems: 0,
    totalInventoryValue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentProducts, setRecentProducts] = useState<any[]>([]);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
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

        // Get recent products (last 5)
        const sortedProducts = productsData.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setRecentProducts(sortedProducts.slice(0, 5));
      }

      setStats({
        totalProducts: productsData?.length || 0,
        totalLocations: locations?.length || 0,
        lowStockItems: lowStockCount,
        totalInventoryValue: totalValue,
      });
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }

  const StatCard = ({ icon: Icon, title, value, subtitle, color, link }: {
    icon: any;
    title: string;
    value: string | number;
    subtitle?: string;
    color: string;
    link?: string;
  }) => (
    <Link href={link || '#'} className={`block bg-white rounded-xl border border-slate-200 p-4 lg:p-6 ${color} hover:shadow-md hover:border-slate-300 transition-all`}>
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm text-slate-600 mb-1 truncate">{title}</p>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 truncate">{value}</p>
          {subtitle && <p className="text-xs text-slate-500 mt-1 truncate">{subtitle}</p>}
        </div>
        <div className="ml-3 flex-shrink-0">
          <Icon size={28} className="text-slate-400 sm:w-8 sm:h-8" />
        </div>
      </div>
    </Link>
  );

  const QuickActionCard = ({ icon: Icon, title, description, link, color }: {
    icon: any;
    title: string;
    description: string;
    link: string;
    color: string;
  }) => (
    <Link href={link} className="block bg-white rounded-xl border border-slate-200 p-4 lg:p-6 hover:shadow-md hover:border-slate-300 transition-all group">
      <div className="flex items-start space-x-3 sm:space-x-4">
        <div className={`p-2.5 sm:p-3 rounded-lg flex-shrink-0 ${color.includes('blue') ? 'bg-blue-100 group-hover:bg-blue-200' : color.includes('green') ? 'bg-green-100 group-hover:bg-green-200' : 'bg-slate-100 group-hover:bg-slate-200'} transition-colors`}>
          <Icon size={20} className={`sm:w-6 sm:h-6 ${color.includes('blue') ? 'text-blue-600' : color.includes('green') ? 'text-green-600' : 'text-slate-600'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-900 mb-1 text-sm sm:text-base truncate group-hover:text-blue-600 transition-colors">{title}</h3>
          <p className="text-xs sm:text-sm text-slate-600 line-clamp-2">{description}</p>
        </div>
      </div>
    </Link>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 lg:h-20">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Boxes className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 flex-shrink-0" />
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900 truncate">แดชบอร์ด</h1>
                <p className="text-xs sm:text-sm text-slate-600 hidden sm:block">จัดการสินค้าคงคลัง</p>
              </div>
            </div>
            
            {/* Desktop Actions */}
            <div className="hidden lg:flex items-center space-x-4">
              <Link
                href="/"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors inline-flex items-center space-x-2"
              >
                <Home className="h-4 w-4" />
                <span>ดูร้านค้า</span>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              {showMobileMenu ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Menu Dropdown */}
          {showMobileMenu && (
            <div className="lg:hidden pb-4 animate-slide-down">
              <Link
                href="/"
                className="flex items-center justify-center space-x-2 w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                onClick={() => setShowMobileMenu(false)}
              >
                <Home className="h-4 w-4" />
                <span>ดูร้านค้า</span>
              </Link>
            </div>
          )}
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
          <StatCard
            icon={Boxes}
            title="สินค้าทั้งหมด"
            value={loading ? '...' : stats.totalProducts}
            subtitle="สินค้าคงคลังที่ใช้งานอยู่"
            color=""
            link="/inventory/stock"
          />
          <StatCard
            icon={MapPin}
            title="สถานที่ตั้งทั้งหมด"
            value={loading ? '...' : stats.totalLocations}
            subtitle="ที่ตั้งคลังสินค้าที่กำหนดไว้"
            color=""
            link="/inventory/locations"
          />
          <StatCard
            icon={AlertTriangle}
            title="สินค้าคงคลังต่ำ"
            value={loading ? '...' : stats.lowStockItems}
            subtitle="รายการที่ต้องสั่งซื้อเพิ่ม"
            color={stats.lowStockItems > 0 ? 'bg-yellow-50 border-yellow-200' : ''}
            link="/inventory/reports"
          />
          <StatCard
            icon={BarChart3}
            title="มูลค่าสินค้าคงคลัง"
            value={loading ? '...' : `$${(stats.totalInventoryValue / 1000).toFixed(1)}K`}
            subtitle="มูลค่ารวมของสินค้าคงคลัง"
            color=""
            link="/inventory/reports"
          />
        </div>

        {/* Quick Actions */}
        <div className="mb-6 lg:mb-8">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-4">การดำเนินการด่วน</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            <QuickActionCard
              icon={Package}
              title="จัดการสต็อก"
              description="เพิ่ม, แก้ไข และติดตามสินค้าคงคลัง"
              link="/inventory/stock"
              color="hover:shadow-md"
            />
            <QuickActionCard
              icon={MapPin}
              title="ที่ตั้งคลังสินค้า"
              description="กำหนดค่าสถานที่จัดเก็บและโซน"
              link="/inventory/locations"
              color="hover:shadow-md"
            />
            <QuickActionCard
              icon={TrendingUp}
              title="รายงานและการวิเคราะห์"
              description="ดูสถิติและประสิทธิภาพสินค้าคงคลัง"
              link="/inventory/reports"
              color="hover:shadow-md"
            />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Recent Products */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="border-b border-slate-200 bg-slate-50 px-4 sm:px-6 py-3 sm:py-4">
              <h2 className="text-base sm:text-lg font-semibold text-slate-900">ผลิตภัณฑ์ล่าสุด</h2>
            </div>
            <div className="divide-y divide-slate-200">
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-blue-600"></div>
                </div>
              ) : recentProducts.length === 0 ? (
                <div className="text-center py-8 px-4 sm:px-6">
                  <Package className="mx-auto h-12 w-12 text-slate-400 mb-2" />
                  <p className="text-slate-600 text-sm sm:text-base">ยังไม่มีสินค้า</p>
                  <Link
                    href="/inventory/stock"
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-2 inline-block"
                  >
                    เพิ่มสินค้าแรกของคุณ →
                  </Link>
                </div>
              ) : (
                recentProducts.map(product => (
                  <div key={product.id} className="px-4 sm:px-6 py-3 sm:py-4 hover:bg-slate-50 transition-colors">
                    <div className="flex justify-between items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-slate-900 text-sm sm:text-base truncate">{product.name}</h3>
                        <p className="text-xs sm:text-sm text-slate-600 truncate">SKU: {product.sku}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-medium text-slate-900">
                          ${product.sellingPrice || 0}
                        </p>
                        <p className="text-xs text-slate-500 whitespace-nowrap">
                          {product.stocklocation?.reduce((sum: number, sl: any) => sum + sl.qty, 0) || 0} in stock
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="border-t border-slate-200 bg-slate-50 px-4 sm:px-6 py-3">
              <Link
                href="/inventory/stock"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                ดูสินค้าทั้งหมด →
              </Link>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="border-b border-slate-200 bg-slate-50 px-4 sm:px-6 py-3 sm:py-4">
              <h2 className="text-base sm:text-lg font-semibold text-slate-900">สถิติด่วน</h2>
            </div>
            <div className="p-4 sm:p-6 space-y-4">
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-blue-600"></div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-slate-600">สต็อกเฉลี่ยต่อสินค้า</span>
                    <span className="font-medium text-slate-900 text-sm sm:text-base">
                      {stats.totalProducts > 0
                        ? Math.round(stats.totalInventoryValue / stats.totalProducts / 10) * 10
                        : 0} หน่วย
                    </span>
                  </div>
                  <div className="h-px bg-slate-200"></div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-slate-600">ประสิทธิภาพสต็อก</span>
                    <span className="font-medium text-green-600 text-sm sm:text-base">
                      {stats.totalProducts > 0
                        ? Math.round((1 - stats.lowStockItems / stats.totalProducts) * 100)
                        : 0}%
                    </span>
                  </div>
                  <div className="h-px bg-slate-200"></div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-slate-600">การใช้งานสถานที่</span>
                    <span className="font-medium text-blue-600 text-sm sm:text-base">
                      {stats.totalLocations > 0
                        ? Math.round((stats.totalProducts / stats.totalLocations) * 10) / 10
                        : 0} สินค้า/สถานที่
                    </span>
                  </div>
                </>
              )}
              <div className="border-t border-slate-200 pt-4 mt-4">
                <Link
                  href="/inventory/reports"
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  ดูสถิติรายละเอียด →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
