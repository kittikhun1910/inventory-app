'use client';

import { useEffect, useState } from 'react';
import { fetchJSON } from '@/lib/api';
import SearchBar from './SearchBar';
import AddProductModal from './modals/AddProductModal';
import AddStockModal from './modals/AddStockModal';
import ReduceStockModal from './modals/ReduceStockModal';
import ImportExcelModal from './modals/ImportExcelModal';

export default function StockTab() {
  const [products, setProducts] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddStock, setShowAddStock] = useState(false);
  const [showReduceStock, setShowReduceStock] = useState(false);
  const [showImport, setShowImport] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await fetchJSON('/api/products');
      setProducts(data || []);
    } catch (err: any) {
      console.error(err);
      alert('Failed to load products: ' + String(err?.message ?? err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const filtered = products.filter(p => p.sku?.toLowerCase().includes(q.toLowerCase()) || p.name?.toLowerCase().includes(q.toLowerCase()));

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
        <SearchBar value={q} onChange={setQ} />
        <button onClick={() => setShowAddProduct(true)}>Add Product</button>
        <button onClick={() => setShowImport(true)}>Import Excel</button>
        <button onClick={load}>Refresh</button>
      </div>

      <div style={{ border: '1px solid #eee', borderRadius: 8, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: '#fafafa' }}>
            <tr>
              <th style={{ padding: 8, textAlign: 'left' }}>SKU</th>
              <th style={{ padding: 8, textAlign: 'left' }}>Name</th>
              <th style={{ padding: 8, textAlign: 'left' }}>Barcode</th>
              <th style={{ padding: 8, textAlign: 'center' }}>Min</th>
              <th style={{ padding: 8, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ padding: 16 }}>Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: 16 }}>No products found</td></tr>
            ) : (
              filtered.map(p => (
                <tr key={p.id} style={{ borderTop: '1px solid #f3f4f6' }}>
                  <td style={{ padding: 8 }}>{p.sku}</td>
                  <td style={{ padding: 8 }}>{p.name}</td>
                  <td style={{ padding: 8 }}>{p.barcode || '-'}</td>
                  <td style={{ padding: 8, textAlign: 'center' }}>{p.minimumStock}</td>
                  <td style={{ padding: 8, textAlign: 'right' }}>
                    <button onClick={() => { setSelectedProduct(p); setShowAddStock(true); }}>Add Stock</button>
                    <button onClick={() => { setSelectedProduct(p); setShowReduceStock(true); }} style={{ marginLeft: 8 }}>Reduce</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AddProductModal open={showAddProduct} onClose={() => setShowAddProduct(false)} onCreated={load} />
      <AddStockModal open={showAddStock} onClose={() => setShowAddStock(false)} productId={selectedProduct?.id} onDone={load} />
      <ReduceStockModal open={showReduceStock} onClose={() => setShowReduceStock(false)} productId={selectedProduct?.id} onDone={load} />
      <ImportExcelModal open={showImport} onClose={() => setShowImport(false)} onDone={load} />
    </div>
  );
}