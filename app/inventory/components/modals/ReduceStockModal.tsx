'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { postJSON } from '@/lib/api';

export default function ReduceStockModal({ open, onClose, productId, onDone }: { open: boolean; onClose: () => void; productId?: number; onDone?: () => void }) {
  const [qty, setQty] = useState(0);
  const [locationName, setLocationName] = useState('Main');
  const [refType, setRefType] = useState('SALE');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await postJSON('/api/stock/out', { sku: undefined, productId, locationName, qty, refType });
      onDone?.();
      setQty(0);
      setLocationName('Main');
      setRefType('SALE');
      onClose();
    } catch (err: any) {
      setError(err?.message ?? 'Failed to reduce stock');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Reduce Stock</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={submit} className="p-6 space-y-4">
          {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Quantity *</label>
            <input 
              type="number" 
              required 
              value={qty} 
              onChange={e => setQty(Number(e.target.value))} 
              placeholder="0" 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
            <input 
              value={locationName} 
              onChange={e => setLocationName(e.target.value)} 
              placeholder="e.g., Main" 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Reference Type</label>
            <select 
              value={refType} 
              onChange={e => setRefType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="SALE">Sale</option>
              <option value="MANUAL">Manual</option>
            </select>
          </div>
          
          <div className="flex gap-3 justify-end pt-4">
            <button 
              type="button" 
              onClick={onClose} 
              disabled={loading}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-100 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg font-medium transition-colors"
            >
              {loading ? 'Reducing...' : 'Reduce Stock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}