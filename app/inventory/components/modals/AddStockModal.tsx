'use client';

import { useState, useEffect } from 'react';
import { X, AlertCircle, CheckCircle } from 'lucide-react';
import { postJSON, fetchJSON, postForm } from '@/lib/api';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';

export default function AddStockModal({ open, onClose, productId, onDone }: { open: boolean; onClose: () => void; productId?: number; onDone?: () => void }) {
  const [mode, setMode] = useState<'manual' | 'excel'>('manual');
  const [qty, setQty] = useState(0);
  const [locationName, setLocationName] = useState('');
  const [refType, setRefType] = useState('MANUAL');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [locations, setLocations] = useState<any[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    if (open && productId) {
      loadLocations();
    }
  }, [open, productId]);

  async function loadLocations() {
    try {
      const product = await fetchJSON(`/api/products`);
      const currentProduct = product.find((p: any) => p.id === productId);
      
      if (currentProduct && currentProduct.stocklocation) {
        const productLocations = currentProduct.stocklocation.map((sl: any) => sl.location);
        setLocations(productLocations || []);
        if (productLocations && productLocations.length > 0 && !locationName) {
          setLocationName(productLocations[0].name);
        }
      } else {
        setLocations([]);
        setLocationName('');
      }
    } catch (err) {
      console.error('Failed to load locations:', err);
      setLocations([]);
    }
  }

  if (!open) return null;

  const submitManual = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await postJSON('/api/stock/in', { sku: undefined, productId, locationName, qty, refType });
      toast.success(`✓ เพิ่ม ${qty} หน่วยไปยัง ${locationName}`, {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      onDone?.();
      setQty(0);
      setLocationName('');
      setRefType('MANUAL');
      onClose();
    } catch (err: any) {
      const errorMsg = err?.message ?? 'เพิ่มสต๊อกไม่สำเร็จ';
      setError(errorMsg);
      toast.error(`✗ Error: ${errorMsg}`, {
        position: 'top-right',
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const submitExcel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await postForm('/api/import-excel', form);
      setResult(res);
      toast.success(`✓ นำเข้า ${res.imported || 0} รายการสำเร็จ`, {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      onDone?.();
    } catch (err: any) {
      const errorMsg = err?.message ?? 'นำเข้าไม่สำเร็จ';
      setError(errorMsg);
      toast.error(`✗ Error: ${errorMsg}`, {
        position: 'top-right',
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setResult(null);
    setError('');
    setMode('manual');
    setQty(0);
    setLocationName('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-xl font-semibold text-gray-900">เพิ่มสต๊อก</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>
        
        {/* Mode Tabs */}
        <div className="flex border-b border-gray-200 sticky top-16 bg-white">
          <button
            onClick={() => { setMode('manual'); setError(''); setResult(null); }}
            className={`flex-1 px-4 py-3 font-medium transition-colors border-b-2 ${
              mode === 'manual'
                ? 'bg-blue-50 border-b-blue-500 text-blue-700'
                : 'border-b-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            เพิ่มแบบแมนวล
          </button>
          <button
            onClick={() => { setMode('excel'); setError(''); setResult(null); }}
            className={`flex-1 px-4 py-3 font-medium transition-colors border-b-2 ${
              mode === 'excel'
                ? 'bg-blue-50 border-b-blue-500 text-blue-700'
                : 'border-b-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            นำเข้า Excel
          </button>
        </div>

        {/* Manual Mode */}
        {mode === 'manual' && (
          <form onSubmit={submitManual} className="p-6 space-y-4">
            {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ปริมาณ *</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">สร้างสถานที่ตั้ง *</label>
              <select 
                value={locationName} 
                onChange={e => setLocationName(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">เลือกสถานที่ตั้ง...</option>
                {locations.map(loc => (
                  <option key={loc.id} value={loc.name}>{loc.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ประเภทอ้างอิง</label>
              <select 
                value={refType} 
                onChange={e => setRefType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="MANUAL">Manual</option>
                <option value="IMPORT">นำเข้า</option>
              </select>
            </div>
            
            <div className="flex gap-3 justify-end pt-4">
              <button 
                type="button" 
                onClick={handleClose} 
                disabled={loading}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-100 rounded-lg font-medium transition-colors"
              >
                ยกเลิก
              </button>
              <button 
                type="submit" 
                disabled={loading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors"
              >
                {loading ? 'Adding...' : 'Add Stock'}
              </button>
            </div>
          </form>
        )}

        {/* Excel Mode */}
        {mode === 'excel' && (
          <form onSubmit={submitExcel} className="p-6 space-y-4">
            {error && (
              <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="text-red-700 flex-shrink-0" size={20} />
                <div className="text-red-700 text-sm">{error}</div>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">เลือกไฟล์ Excel *</label>
              <input 
                type="file" 
                accept=".xlsx,.xls,.csv" 
                onChange={e => setFile(e.target.files ? e.target.files[0] : null)}
                disabled={loading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-2">
                คอลัมน์ที่คาดหวัง: A: รหัสสินค้า (SKU), B: ชื่อสินค้า, C: ราคาขาย, D: สถานที่, E: บาร์โค้ด, F: สต๊อกขั้นต่ำ, G: ปริมาณ
              </p>
            </div>
            
            {!result && (
              <div className="flex gap-3 justify-end pt-4">
                <button 
                  type="button" 
                  onClick={handleClose} 
                  disabled={loading}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-100 rounded-lg font-medium transition-colors"
                >
                  ยกเลิก
                </button>
                <button 
                  type="submit" 
                  disabled={loading || !file}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg font-medium transition-colors"
                >
                  {loading ? 'Importing...' : 'Import'}
                </button>
              </div>
            )}

            {result && (
              <div className="space-y-4">
                <div className="flex gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="text-green-700 flex-shrink-0" size={20} />
                  <div>
                    <p className="font-semibold text-green-900">นำเข้าสต๊อกแล้ว</p>
                    <p className="text-sm text-green-700">นำเข้า {result.imported || 0} รายการ</p>
                  </div>
                </div>
                <div className="flex gap-3 justify-end pt-4">
                  <button 
                    type="button" 
                    onClick={handleClose}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  >
                    ปิด
                  </button>
                </div>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
}