'use client';

import { useState } from 'react';
import { postJSON } from '@/lib/api';

export default function AddProductModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated?: () => void }) {
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [barcode, setBarcode] = useState('');
  const [minimumStock, setMinimumStock] = useState(0);
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await postJSON('/api/products', { sku, name, barcode: barcode || undefined, minimumStock });
      onCreated?.();
      onClose();
      alert('Product created');
    } catch (err: any) {
      alert('Error: ' + String(err?.message ?? err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)' }}>
      <form onSubmit={submit} style={{ background: '#fff', padding: 20, borderRadius: 6, minWidth: 360 }}>
        <h3>Add product</h3>
        <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
          <input required value={sku} onChange={e => setSku(e.target.value)} placeholder="SKU" />
          <input required value={name} onChange={e => setName(e.target.value)} placeholder="Name" />
          <input value={barcode} onChange={e => setBarcode(e.target.value)} placeholder="Barcode" />
          <input type="number" value={minimumStock} onChange={e => setMinimumStock(Number(e.target.value))} placeholder="Minimum stock" />
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Create'}</button>
          </div>
        </div>
      </form>
    </div>
  );
}