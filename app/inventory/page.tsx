'use client';

import { useState } from 'react';
import StockTab from './components/StockTab';
import LocationsTab from './components/LocationsTab';
import BestsellersTab from './components/BestsellersTab';
import ReorderTab from './components/ReorderTab';

const TABS = ['Stock', 'Bestsellers', 'Reorder', 'Locations'] as const;

export default function InventoryPage() {
  const [tab, setTab] = useState<typeof TABS[number]>('Stock');

  return (
    <div style={{ padding: 20 }}>
      <h1 style={{ marginBottom: 12 }}>Inventory</h1>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '8px 12px', background: t === tab ? '#111827' : '#f3f4f6', color: t === tab ? '#fff' : '#111827', borderRadius: 6, border: '1px solid #e5e7eb' }}>
            {t}
          </button>
        ))}
      </div>

      <div>
        {tab === 'Stock' && <StockTab />}
        {tab === 'Bestsellers' && <BestsellersTab />}
        {tab === 'Reorder' && <ReorderTab />}
        {tab === 'Locations' && <LocationsTab />}
      </div>
    </div>
  );
}