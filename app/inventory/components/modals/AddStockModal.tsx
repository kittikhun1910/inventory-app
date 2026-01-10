'use client';

import { useState } from 'react';
import { postJSON } from '@/lib/api';

export default function AddStockModal({ open, onClose, productId, onDone }: { open: boolean; onClose: () => void; productId?: number; onDone?: () => void }) {
  const [qty, setQty] = useState(0);
  const [locationName, setLocationName] = useState('Main');
  const [refType, setRefType] = useState('MANUAL');
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await postJSON('/api/stock/in', { sku: undefined, productId, locationName, qty, refType });
      onDone?.();
      onClose();
      alert('Stock increased');
    } catch (err: any) {
      alert('Error: ' + String(err?.message ?? err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)' }}>
      <form onSubmit={submit} style={{ background: '#fff', padding: 20, borderRadius: 6, minWidth: 360 }}>
        <h3>Add Stock</h3>
        <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
          <input type="number" required value={qty} onChange={e => setQty(Number(e.target.value))} placeholder="Quantity" />
          <input value={locationName} onChange={e => setLocationName(e.target.value)} placeholder="Location name" />
          <select value={refType} onChange={e => setRefType(e.target.value)}>
            <option value="MANUAL">MANUAL</option>
            <option value="IMPORT">IMPORT</option>
          </select>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Add'}</button>
          </div>
        </div>
      </form>
    </div>
  );
}