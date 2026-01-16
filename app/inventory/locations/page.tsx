'use client';

import { useEffect, useState } from 'react';
import { MapPin, Check, X, ArrowLeft, Plus, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { fetchJSON, postJSON, putJSON, deleteJSON } from '@/lib/api';

interface Location {
  id: number;
  name: string;
}

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<Location | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

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
      setShowAddForm(false);
      await load();
    } catch (err: any) {
      console.error('Error creating location:', err);
      alert('Failed to create location');
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
      alert('Failed to update location');
    } finally {
      setLoading(false);
    }
  };

  const doDelete = async (loc: Location) => {
    if (!confirm(`Delete location "${loc.name}"? This action cannot be undone.`)) return;
    setLoading(true);
    try {
      await deleteJSON('/api/locations?id=' + encodeURIComponent(loc.id));
      await load();
    } catch (err: any) {
      console.error('Error deleting location:', err);
      alert('Failed to delete location');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/inventory"
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft size={20} />
                <span>Back to Dashboard</span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                View Store
              </Link>
            </div>
          </div>
          <div className="mt-4">
            <h1 className="text-3xl font-bold text-gray-900">จัดการสถานที่เก็บสินค้า</h1>
            <p className="text-gray-600 mt-1">จัดการสถานที่เก็บสินค้าและร้านค้า</p>
          </div>
        </div>

        {/* Add Location Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          {!showAddForm ? (
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              <Plus size={18} />
              เพิ่มสถานที่ใหม่
            </button>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ชื่อสถานที่
                </label>
                <input
                  type="text"
                  placeholder="e.g., Warehouse A, Store 1, Main Office"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && create()}
                  disabled={loading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={create}
                  disabled={loading || !name.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
                >
                  เพิ่มสถานที่
                </button>
                <button
                  onClick={() => { setShowAddForm(false); setName(''); }}
                  disabled={loading}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Locations List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-gray-600" />
              สถานที่ทั้งหมด ({locations.length})
            </h2>
          </div>

          {loading && !locations.length ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : locations.length === 0 ? (
            <div className="text-center py-12 px-6">
              <MapPin className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">ยังไม่มีสถานที่</h3>
              <p className="text-gray-600 mb-4">สร้างสถานที่แรกของคุณเพื่อเริ่มจัดการสต็อกของคุณ</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                <Plus size={18} />
                เพิ่มสถานที่ใหม่
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {locations.map(loc => (
                <div key={loc.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      {editing?.id === loc.id ? (
                        <div className="flex items-center gap-3">
                          <input
                            type="text"
                            value={editing.name}
                            onChange={e => setEditing({ ...editing, name: e.target.value })}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            onKeyPress={e => e.key === 'Enter' && saveEdit()}
                          />
                          <button
                            onClick={saveEdit}
                            disabled={loading}
                            className="flex items-center gap-1 px-3 py-2 bg-green-100 text-green-700 rounded hover:bg-green-200 disabled:opacity-50 font-medium text-sm"
                          >
                            <Check size={16} />
                            บันทึก
                          </button>
                          <button
                            onClick={() => setEditing(null)}
                            disabled={loading}
                            className="flex items-center gap-1 px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 font-medium text-sm"
                          >
                            <X size={16} />
                            ยกเลิก
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <MapPin className="h-5 w-5 text-gray-400" />
                          <span className="text-gray-900 font-medium">{loc.name}</span>
                        </div>
                      )}
                    </div>
                    {editing?.id !== loc.id && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditing({ id: loc.id, name: loc.name })}
                          disabled={loading}
                          className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50 font-medium text-sm"
                          title="Edit location"
                        >
                          <Edit size={14} />
                          แก้ไข
                        </button>
                        <button
                          onClick={() => doDelete(loc)}
                          disabled={loading}
                          className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50 font-medium text-sm"
                          title="Delete location"
                        >
                          <Trash2 size={14} />
                          ลบ
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">สถานที่ทั้งหมด</p>
                <p className="text-2xl font-bold text-gray-900">{locations.length}</p>
              </div>
              <MapPin className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">สถานที่ใช้งาน</p>
                <p className="text-2xl font-bold text-green-600">{locations.length}</p>
              </div>
              <Check className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">อัปเดตล่าสุด</p>
                <p className="text-sm font-medium text-gray-900">เมื่อสักครู่ก่อน</p>
              </div>
              <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                <div className="h-3 w-3 bg-green-500 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
