'use client';

import { useEffect, useState } from 'react';
import { fetchJSON, postJSON, putJSON, deleteJSON } from '@/lib/api';

export default function LocationsTab() {
  const [locations, setLocations] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [editing, setEditing] = useState<any | null>(null);

  async function load() {
    try {
      const data = await fetchJSON('/api/locations');
      setLocations(data || []);
    } catch (err: any) {
      alert('Failed to load locations: ' + String(err?.message ?? err));
    }
  }

  useEffect(() => { load(); }, []);

  const create = async () => {
    try {
      await postJSON('/api/locations', { name });
      setName('');
      load();
      alert('Created');
    } catch (err: any) { alert('Error: ' + String(err?.message ?? err)); }
  };

  const saveEdit = async () => {
    if (!editing) return;
    try {
      await putJSON('/api/locations', { id: editing.id, name: editing.name });
      setEditing(null);
      load();
      alert('Updated');
    } catch (err: any) { alert('Error: ' + String(err?.message ?? err)); }
  };

  const doDelete = async (loc: any) => {
    if (!confirm('Delete location ' + loc.name + '?')) return;
    try {
      await deleteJSON('/api/locations?id=' + encodeURIComponent(loc.id));
      load();
      alert('Deleted');
    } catch (err: any) { alert('Error: ' + String(err?.message ?? err)); }
  };

  return (
    <div>
      <div style={{ marginBottom: 12, display: 'flex', gap: 8 }}>
        <input placeholder="New location name" value={name} onChange={e => setName(e.target.value)} />
        <button onClick={create}>Create</button>
      </div>

      <div style={{ border: '1px solid #eee', borderRadius: 8 }}>
        <table style={{ width: '100%' }}>
          <thead style={{ background: '#fafafa' }}>
            <tr><th style={{ padding: 8 }}>ID</th><th style={{ padding: 8 }}>Name</th><th style={{ padding: 8 }}>Actions</th></tr>
          </thead>
          <tbody>
            {locations.map(loc => (
              <tr key={loc.id} style={{ borderTop: '1px solid #f3f4f6' }}>
                <td style={{ padding: 8 }}>{loc.id}</td>
                <td style={{ padding: 8 }}>
                  {editing?.id === loc.id ? (
                    <input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} />
                  ) : loc.name}
                </td>
                <td style={{ padding: 8 }}>
                  {editing?.id === loc.id ? (
                    <>
                      <button onClick={saveEdit}>Save</button>
                      <button onClick={() => setEditing(null)} style={{ marginLeft: 8 }}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => setEditing({ id: loc.id, name: loc.name })}>Edit</button>
                      <button onClick={() => doDelete(loc)} style={{ marginLeft: 8 }}>Delete</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}