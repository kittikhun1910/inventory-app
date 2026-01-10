'use client';

import { useState } from 'react';
import { Package, TrendingUp, AlertTriangle, MapPin } from 'lucide-react';
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

export default function InventoryPage() {
  const [tab, setTab] = useState<typeof TABS[number]>('Stock');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Inventory Management</h1>
          <p className="text-gray-600">Manage products, stock levels, locations, and reorder points</p>
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