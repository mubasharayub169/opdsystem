import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../api/axios';
import {
  Plus, Search, Pencil, Trash2, Users, X,
  UserCheck, Building2, Stethoscope, AlertCircle, User
} from 'lucide-react';

export default function Receptionists() {
  const [receptionists, setReceptionists] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: '', username: '', password: '', consultant_id: ''
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [recRes, docRes] = await Promise.all([
        api.get('/admin/receptionists'),
        api.get('/admin/doctors')
      ]);
      const recs = recRes.data.receptionists || [];
      setReceptionists(recs);
      setFiltered(recs);
      setDoctors(docRes.data.doctors || []);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    const result = receptionists.filter((r) =>
      r.name?.toLowerCase().includes(q) ||
      r.username?.toLowerCase().includes(q) ||
      r.consultant_name?.toLowerCase().includes(q)
    );
    setFiltered(result);
  }, [search, receptionists]);

  const openAddModal = () => {
    setEditing(null);
    setForm({ name: '', username: '', password: '', consultant_id: '' });
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = (rec) => {
    setEditing(rec);
    setForm({
      name: rec.name || '',
      username: rec.username || '',
      password: '',
      consultant_id: rec.consultant_id || ''
    });
    setFormError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
    setFormError('');
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setFormError('');

    try {
      const payload = { ...form, consultant_id: parseInt(form.consultant_id) };
      if (editing) {
        if (!payload.password) delete payload.password;
        await api.put(`/admin/receptionists/${editing.id}`, payload);
      } else {
        await api.post('/admin/receptionists', payload);
      }
      closeModal();
      loadData();
    } catch (err) {
      setFormError(err.response?.data?.error || err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (rec) => {
    if (!window.confirm(`Deactivate ${rec.name}?`)) return;
    try {
      await api.delete(`/admin/receptionists/${rec.id}`);
      loadData();
    } catch (err) {
      alert('Delete failed: ' + (err.response?.data?.error || err.message));
    }
  };

  return (
    <Layout title="Receptionists" subtitle="Manage receptionists assigned to each doctor">

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, username, or doctor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medical-500/20 focus:border-medical-500 transition text-slate-700 placeholder-slate-400"
          />
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 bg-medical-600 hover:bg-medical-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition shadow-sm hover:shadow-md"
        >
          <Plus className="w-4 h-4" strokeWidth={2.5} />
          Add Receptionist
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        <div className="bg-white rounded-lg border border-slate-200 px-4 py-3 flex items-center gap-3">
          <div className="w-10 h-10 bg-violet-50 rounded-lg flex items-center justify-center">
            <Users className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wide">Total</p>
            <p className="text-xl font-bold text-slate-800 font-mono">{receptionists.length}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 px-4 py-3 flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
            <UserCheck className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wide">Active</p>
            <p className="text-xl font-bold text-slate-800 font-mono">
              {receptionists.filter(r => r.is_active).length}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 px-4 py-3 flex items-center gap-3">
          <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
            <User className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wide">Inactive</p>
            <p className="text-xl font-bold text-slate-800 font-mono">
              {receptionists.filter(r => !r.is_active).length}
            </p>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border-l-[3px] border-red-500 text-red-700 p-3.5 rounded-lg mb-4 text-sm flex items-start gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-16 text-center">
          <div className="inline-block w-8 h-8 border-3 border-medical-200 border-t-medical-600 rounded-full animate-spin"></div>
          <p className="text-slate-500 mt-4 text-sm">Loading receptionists...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-16 text-center">
          <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-7 h-7 text-slate-400" />
          </div>
          <h3 className="text-base font-semibold text-slate-700 mb-1">
            {search ? 'No results found' : 'No receptionists yet'}
          </h3>
          <p className="text-sm text-slate-500 mb-4">
            {search ? 'Try a different search term' : 'Add your first receptionist to get started'}
          </p>
          {!search && (
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-2 bg-medical-600 hover:bg-medical-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
            >
              <Plus className="w-4 h-4" />
              Add Receptionist
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Receptionist</th>
                  <th className="text-left px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Username</th>
                  <th className="text-left px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Assigned Doctor</th>
                  <th className="text-left px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Room</th>
                  <th className="text-left px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="text-right px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-violet-700 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {r.name?.charAt(0)?.toUpperCase() || 'R'}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 text-sm">{r.name}</p>
                          <p className="text-[11px] text-slate-500">ID: #{r.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-xs text-slate-700 bg-slate-100 px-2 py-1 rounded-md">
                        {r.username}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {r.consultant_name ? (
                        <div className="flex items-center gap-2">
                          <Stethoscope className="w-3.5 h-3.5 text-medical-600 flex-shrink-0" />
                          <div>
                            <p className="font-medium text-slate-700 text-xs">{r.consultant_name}</p>
                            <p className="text-[11px] text-slate-500">{r.consultant_specialization || '—'}</p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">Not assigned</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      {r.consultant_room ? (
                        <span className="inline-flex items-center gap-1.5 text-xs text-slate-700 bg-slate-100 px-2 py-1 rounded-md">
                          <Building2 className="w-3 h-3" />
                          {r.consultant_room}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        r.is_active
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          r.is_active ? 'bg-emerald-500' : 'bg-red-500'
                        }`}></span>
                        {r.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(r)}
                          className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-medical-600 hover:bg-medical-50 rounded-md transition"
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(r)}
                          className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md transition"
                          title="Deactivate"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">

            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-violet-50 rounded-lg flex items-center justify-center">
                  <UserCheck className="w-4 h-4 text-violet-600" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800">
                    {editing ? 'Edit Receptionist' : 'Add New Receptionist'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {editing ? 'Update receptionist details' : 'Create a new receptionist account'}
                  </p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
              {formError && (
                <div className="bg-red-50 border-l-[3px] border-red-500 text-red-700 p-3 rounded-lg mb-4 text-sm flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-500/20 focus:border-medical-500 focus:bg-white transition text-sm text-slate-800"
                    placeholder="e.g. Ayesha Bibi"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                    Assigned Doctor <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-500/20 focus:border-medical-500 focus:bg-white transition text-sm text-slate-800"
                    value={form.consultant_id}
                    onChange={(e) => setForm({ ...form, consultant_id: e.target.value })}
                    required
                  >
                    <option value="">-- Select a doctor --</option>
                    {doctors.filter(d => d.is_active).map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} {d.room_no ? `— ${d.room_no}` : ''} {d.specialization ? `(${d.specialization})` : ''}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-500 mt-1.5">
                    Receptionist will only manage this doctor's patients
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                    Username <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-500/20 focus:border-medical-500 focus:bg-white transition text-sm text-slate-800"
                    placeholder="e.g. ayesha"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                    Password {editing ? <span className="text-slate-400 text-[11px] font-normal normal-case">(leave blank to keep current)</span> : <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="password"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-500/20 focus:border-medical-500 focus:bg-white transition text-sm text-slate-800"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required={!editing}
                  />
                </div>
              </div>
            </form>

            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button
                type="button"
                onClick={closeModal}
                className="flex-1 border border-slate-300 bg-white text-slate-700 py-2.5 rounded-lg hover:bg-slate-100 transition text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex-1 bg-medical-600 hover:bg-medical-700 text-white py-2.5 rounded-lg font-semibold transition text-sm shadow-sm disabled:opacity-50"
              >
                {saving ? 'Saving...' : (editing ? 'Update Receptionist' : 'Create Receptionist')}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}