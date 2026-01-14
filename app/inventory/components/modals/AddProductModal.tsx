'use client';

import { useState } from 'react';
import { X, AlertCircle, CheckCircle } from 'lucide-react';
import { postJSON, postForm } from '@/lib/api';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';

export default function AddProductModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated?: () => void }) {
  const [mode, setMode] = useState<'manual' | 'excel'>('manual');
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [barcode, setBarcode] = useState('');
  const [minimumStock, setMinimumStock] = useState(0);
  const [sellingPrice, setSellingPrice] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<any>(null);

  if (!open) return null;

  const submitManual = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await postJSON('/api/products', { 
        sku, 
        name, 
        barcode: barcode || undefined,
        sellingPrice: sellingPrice || undefined,
        minimumStock 
      });
      toast.success(`✓ เพิ่มสินค้า ${name} สำเร็จ`, {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      onCreated?.();
      setSku('');
      setName('');
      setBarcode('');
      setMinimumStock(0);
      setSellingPrice(0);
      onClose();
    } catch (err: any) {
      const errorMsg = err?.message ?? 'เพิ่มสินค้าไม่สำเร็จ';
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
      toast.success(`✓ นำเข้า ${res.imported || 0} สินค้าสำเร็จ`, {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      onCreated?.();
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
    setSku('');
    setName('');
    setBarcode('');
    setMinimumStock(0);
    setSellingPrice(0);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-xl font-semibold text-gray-900">เพิ่มสินค้า</h2>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">SKU *</label>
              <input 
                required 
                value={sku} 
                onChange={e => setSku(e.target.value)} 
                placeholder="เช่น SKU-001" 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ชื่อสินค้า *</label>
              <input 
                required 
                value={name} 
                onChange={e => setName(e.target.value)} 
                placeholder="เช่น สินค้า A" 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">บาร์โค้ด</label>
              <input 
                value={barcode} 
                onChange={e => setBarcode(e.target.value)} 
                placeholder="ไม่จำเป็น" 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ราคาขาย</label>
              <input 
                type="number" 
                step="0.01"
                value={sellingPrice} 
                onChange={e => setSellingPrice(Number(e.target.value))} 
                placeholder="0" 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">สต๊อกขั้นต่ำ</label>
              <input 
                type="number" 
                value={minimumStock} 
                onChange={e => setMinimumStock(Number(e.target.value))} 
                placeholder="0" 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
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
                {loading ? 'Saving...' : 'สร้าง'}
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
                    <p className="font-semibold text-green-900">นำเข้าสินค้าแล้ว</p>
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