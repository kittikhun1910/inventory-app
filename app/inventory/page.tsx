'use client';

import { useState, useEffect } from 'react';
import { Package, TrendingUp, AlertTriangle, MapPin, Boxes, BarChart3, Plus, Upload, Settings } from 'lucide-react';
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
    <Link href={link || '#'} className={`block bg-white rounded-lg border border-gray-200 p-6 ${color} hover:shadow-md transition-all`}>
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <Icon size={32} className="text-gray-400" />
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
    <Link href={link} className={`block bg-white rounded-lg border border-gray-200 p-6 ${color} hover:shadow-md transition-all`}>
      <div className="flex items-start space-x-4">
        <div className={`p-3 rounded-lg ${color.includes('blue') ? 'bg-blue-100' : color.includes('green') ? 'bg-green-100' : 'bg-gray-100'}`}>
          <Icon size={24} className={color.includes('blue') ? 'text-blue-600' : color.includes('green') ? 'text-green-600' : 'text-gray-600'} />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
    </Link>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">แดชบอร์ดสินค้าคงคลัง</h1>
              <p className="text-gray-600">จัดการสินค้าคงคลังในร้านของคุณอย่างมีประสิทธิภาพ</p>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                ดูร้านค้า
              </Link>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={Boxes}
            title="สินค้าทั้งหมด"
            value={loading ? '...' : stats.totalProducts}
            subtitle="สินค้าคงคลังที่ใช้งานอยู่"
            color="hover:shadow-md transition-shadow"
            link="/inventory/stock"
          />
          <StatCard
            icon={MapPin}
            title="สถานที่ตั้งทั้งหมด"
            value={loading ? '...' : stats.totalLocations}
            subtitle="ที่ตั้งคลังสินค้าที่กำหนดไว้"
            color="hover:shadow-md transition-shadow"
            link="/inventory/locations"
          />
          <StatCard
            icon={AlertTriangle}
            title="สินค้าคงคลังต่ำ"
            value={loading ? '...' : stats.lowStockItems}
            subtitle="รายการที่ต้องสั่งซื้อเพิ่ม"
            color={stats.lowStockItems > 0 ? 'bg-yellow-50 border-yellow-200 hover:shadow-md' : 'hover:shadow-md transition-shadow'}
            link="/inventory/reports"
          />
          <StatCard
            icon={BarChart3}
            title="มูลค่าสินค้าคงคลัง"
            value={loading ? '...' : `$${(stats.totalInventoryValue / 1000).toFixed(1)}K`}
            subtitle="มูลค่ารวมของสินค้าคงคลัง"
            color="hover:shadow-md transition-shadow"
            link="/inventory/reports"
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
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

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Products */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">ผลิตภัณฑ์ล่าสุด</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              ) : recentProducts.length === 0 ? (
                <div className="text-center py-8 px-6">
                  <Package className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-gray-600">ยังไม่มีสินค้า</p>
                  <Link
                    href="/inventory/stock"
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-2 inline-block"
                  >
                    เพิ่มสินค้าแรกของคุณ →
                  </Link>
                </div>
              ) : (
                recentProducts.map(product => (
                  <div key={product.id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium text-gray-900">{product.name}</h3>
                        <p className="text-sm text-gray-600">SKU: {product.sku}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          ${product.sellingPrice || 0}
                        </p>
                        <p className="text-xs text-gray-500">
                          {product.stocklocation?.reduce((sum: number, sl: any) => sum + sl.qty, 0) || 0} in stock
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="border-t border-gray-200 bg-gray-50 px-6 py-3">
              <Link
                href="/inventory/stock"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                ดูสินค้าทั้งหมด →
              </Link>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">สถิติด่วน</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">สต็อกเฉลี่ยต่อสินค้า</span>
                <span className="font-medium text-gray-900">
                  {stats.totalProducts > 0
                    ? Math.round(stats.totalInventoryValue / stats.totalProducts / 10) * 10
                    : 0} หน่วย
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">ประสิทธิภาพสต็อก</span>
                <span className="font-medium text-green-600">
                  {stats.totalProducts > 0
                    ? Math.round((1 - stats.lowStockItems / stats.totalProducts) * 100)
                    : 0}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">การใช้งานสถานที่</span>
                <span className="font-medium text-blue-600">
                  {stats.totalLocations > 0
                    ? Math.round((stats.totalProducts / stats.totalLocations) * 10) / 10
                    : 0} สินค้า/สถานที่
                </span>
              </div>
              <div className="border-t border-gray-200 pt-4 mt-4">
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
