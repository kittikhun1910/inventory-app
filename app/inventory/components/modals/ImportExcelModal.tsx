'use client';

import { useState } from 'react';
import { postForm } from '@/lib/api';

export default function ImportExcelModal({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone?: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  if (!open) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return alert('Select a file');
    setLoading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await postForm('/api/import-excel', form);
      setResult(res);
      onDone?.();
    } catch (err: any) {
      alert('Error: ' + String(err?.message ?? err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)' }}>
      <form onSubmit={submit} style={{ background: '#fff', padding: 20, borderRadius: 6, minWidth: 420 }}>
        <h3>Import Excel</h3>
        <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
          <input type="file" accept=".xlsx,.xls" onChange={e => setFile(e.target.files ? e.target.files[0] : null)} />
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" disabled={loading}>{loading ? 'Importing...' : 'Import'}</button>
          </div>

          {result && (
            <div style={{ marginTop: 8 }}>
              <strong>Imported: {result.imported} / {result.total}</strong>
              <ul style={{ maxHeight: 200, overflow: 'auto' }}>
                {result.results.map((r: any) => (
                  <li key={r.row} style={{ color: r.success ? 'green' : 'red' }}>{`Row ${r.row}: ${r.success ? 'OK' : r.message}`}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}