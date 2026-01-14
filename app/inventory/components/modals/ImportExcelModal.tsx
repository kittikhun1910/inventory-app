'use client';

import { useState } from 'react';
import { X, AlertCircle, CheckCircle } from 'lucide-react';
import { postForm } from '@/lib/api';

export default function ImportExcelModal({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone?: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  if (!open) return null;

  const submit = async (e: React.FormEvent) => {
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
      onDone?.();
    } catch (err: any) {
      setError(err?.message ?? 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setResult(null);
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-xl font-semibold text-gray-900">นำเข้าไฟล์ Excel</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={submit} className="p-6 space-y-4">
          {error && (
            <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="text-red-700 flex-shrink-0" size={20} />
              <div className="text-red-700 text-sm">{error}</div>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">เลือกไฟล์</label>
            <input 
              type="file" 
              accept=".xlsx,.xls,.csv" 
              onChange={e => setFile(e.target.files ? e.target.files[0] : null)}
              disabled={loading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-2">คอลัมน์ที่คาดหวัง: A: รหัสสินค้า (SKU), B: ชื่อสินค้า, C: ราคาขาย, D: สถานที่จัดเก็บ</p>
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
                  <p className="font-semibold text-green-900">นำเข้าไฟล์แล้ว</p>
                  <p className="text-sm text-green-700">นำเข้า {result.imported || 0} รายการ</p>
                </div>
              </div>
              
              {result.results && result.results.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Details</h4>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {result.results.map((r: any, idx: number) => (
                      <div key={idx} className={`text-sm flex gap-2 ${r.success ? 'text-green-700' : 'text-red-700'}`}>
                        {r.success ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                        <span>{`Row ${r.row}: ${r.success ? 'OK' : r.message}`}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <button 
                type="button" 
                onClick={handleClose}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                ปิด
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}