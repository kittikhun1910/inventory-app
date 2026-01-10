'use client';

import { useEffect, useState } from 'react';
import { MapPin, Check, X } from 'lucide-react';
import { fetchJSON, postJSON, putJSON, deleteJSON } from '@/lib/api';

export default function LocationsTab() {
  const [locations, setLocations] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);

  async function load() {
    setLoading(true);
    try {
      const data = await fetchJSON('/api/locations');
      setLocations(data || []);
    } catch (err: any) {
      console.error('Failed to load locations:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await postJSON('/api/locations', { name });
      setName('');
      await load();
    } catch (err: any) {
      console.error('Error creating location:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveEdit = async () => {
    if (!editing || !editing.name.trim()) return;
    setLoading(true);
    try {
      await putJSON('/api/locations', { id: editing.id, name: editing.name });
      setEditing(null);
      await load();
    } catch (err: any) {
      console.error('Error updating location:', err);
    } finally {
      setLoading(false);
    }
  };

  const doDelete = async (loc: any) => {
    if (!confirm('Delete location "' + loc.name + '"?')) return;
    setLoading(true);
    try {
      await deleteJSON('/api/locations?id=' + encodeURIComponent(loc.id));
      await load();
    } catch (err: any) {
      console.error('Error deleting location:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2 items-center mb-4">
        <MapPin className="text-blue-600" size={24} />
        <h2 className="text-2xl font-bold text-gray-900">Locations Management</h2>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="Enter location name (e.g., Warehouse A, Store 1)"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && create()}
            disabled={loading}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={create}
            disabled={loading || !name.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            Add Location
          </button>
        </div>
      </div>

      {loading && !locations.length ? (
        <div className="text-center py-12 text-gray-500">Loading locations...</div>
      ) : locations.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center text-gray-600">
          <MapPin size={32} className="mx-auto mb-2 text-gray-400" />
          <p>No locations yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Location Name</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {locations.map(loc => (
                <tr key={loc.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    {editing?.id === loc.id ? (
                      <input
                        type="text"
                        value={editing.name}
                        onChange={e => setEditing({ ...editing, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <span className="text-gray-900 font-medium">{loc.name}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {editing?.id === loc.id ? (
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={saveEdit}
                          disabled={loading}
                          className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 disabled:opacity-50 font-medium text-sm"
                        >
                          <Check size={16} />
                          Save
                        </button>
                        <button
                          onClick={() => setEditing(null)}
                          disabled={loading}
                          className="flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 font-medium text-sm"
                        >
                          <X size={16} />
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => setEditing({ id: loc.id, name: loc.name })}
                          disabled={loading}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50 font-medium text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => doDelete(loc)}
                          disabled={loading}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50 font-medium text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}