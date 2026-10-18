import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../api/axios';
import {
  Plus, Search, Pencil, Trash2, Stethoscope, X,
  Building2, Phone, AlertCircle, User
} from 'lucide-react';

export default function Doctors() {
  const [doctors, setDoctors] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: '', specialization: '', room_no: '',
    phone: '', username: '', password: ''
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const loadDoctors = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/admin/doctors');
      const docs = data.doctors || [];
      setDoctors(docs);
      setFiltered(docs);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDoctors(); }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    const result = doctors.filter((d) =>
      d.name?.toLowerCase().includes(q) ||
      d.specialization?.toLowerCase().includes(q) ||
      d.username?.toLowerCase().includes(q) ||
      d.room_no?.toLowerCase().includes(q)
    );
    setFiltered(result);
  }, [search, doctors]);

  const openAddModal = () => {
    setEditing(null);
    setForm({ name: '', specialization: '', room_no: '', phone: '', username: '', password: '' });
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = (doctor) => {
    setEditing(doctor);
    setForm({
      name: doctor.name || '',
      specialization: doctor.specialization || '',
      room_no: doctor.room_no || '',
      phone: doctor.phone || '',
      username: doctor.username || '',
      password: ''
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
      if (editing) {
        const payload = { ...form };
        if (!payload.password) delete payload.password;
        await api.put(`/admin/doctors/${editing.id}`, payload);
      } else {
        if (!form.password) throw new Error('Password required for new doctor');
        await api.post('/admin/doctors', form);
      }
      closeModal();
      loadDoctors();
    } catch (err) {
      setFormError(err.response?.data?.error || err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (doctor) => {
    if (!window.confirm(`Deactivate ${doctor.name}?`)) return;
    try {
      await api.delete(`/admin/doctors/${doctor.id}`);
      loadDoctors();
    } catch (err) {
      alert('Delete failed: ' + (err.response?.data?.error || err.message));
    }
  };

  return (
    <Layout title="Doctors" subtitle="Manage hospital doctors and consultants">

      {/* ============================================================
          Toolbar
      ============================================================ */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search doctors by name, specialization..."
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
          Add Doctor
        </button>
      </div>

      {/* ============================================================
          Stats Row
      ============================================================ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        <div className="bg-white rounded-lg border border-slate-200 px-4 py-3 flex items-center gap-3">
          <div className="w-10 h-10 bg-medical-50 rounded-lg flex items-center justify-center">
            <Stethoscope className="w-5 h-5 text-medical-600" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wide">Total Doctors</p>
            <p className="text-xl font-bold text-slate-800 font-mono">{doctors.length}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 px-4 py-3 flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
            <User className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wide">Active</p>
            <p className="text-xl font-bold text-slate-800 font-mono">
              {doctors.filter(d => d.is_active).length}
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
              {doctors.filter(d => !d.is_active).length}
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

      {/* ============================================================
          Table
      ============================================================ */}
      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-16 text-center">
          <div className="inline-block w-8 h-8 border-3 border-medical-200 border-t-medical-600 rounded-full animate-spin"></div>
          <p className="text-slate-500 mt-4 text-sm">Loading doctors...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-16 text-center">
          <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Stethoscope className="w-7 h-7 text-slate-400" />
          </div>
          <h3 className="text-base font-semibold text-slate-700 mb-1">
            {search ? 'No results found' : 'No doctors yet'}
          </h3>
          <p className="text-sm text-slate-500 mb-4">
            {search ? 'Try a different search term' : 'Add your first doctor to get started'}
          </p>
          {!search && (
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-2 bg-medical-600 hover:bg-medical-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
            >
              <Plus className="w-4 h-4" />
              Add Doctor
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Doctor</th>
                  <th className="text-left px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Specialization</th>
                  <th className="text-left px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Room</th>
                  <th className="text-left px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Contact</th>
                  <th className="text-left px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="text-right px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-medical-500 to-medical-700 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {d.name?.charAt(0)?.toUpperCase() || 'D'}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 text-sm">{d.name}</p>
                          <p className="text-[11px] text-slate-500 font-mono">@{d.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      {d.specialization ? (
                        <span className="text-xs text-slate-700 bg-slate-100 px-2 py-1 rounded-md">
                          {d.specialization}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      {d.room_no ? (
                        <span className="inline-flex items-center gap-1.5 text-xs text-slate-700 bg-slate-100 px-2 py-1 rounded-md">
                          <Building2 className="w-3 h-3" />
                          {d.room_no}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      {d.phone ? (
                        <span className="inline-flex items-center gap-1.5 text-xs text-slate-600">
                          <Phone className="w-3 h-3" />
                          {d.phone}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        d.is_active
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          d.is_active ? 'bg-emerald-500' : 'bg-red-500'
                        }`}></span>
                        {d.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(d)}
                          className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-medical-600 hover:bg-medical-50 rounded-md transition"
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(d)}
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

      {/* ============================================================
          Modal
      ============================================================ */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">

            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-medical-50 rounded-lg flex items-center justify-center">
                  <Stethoscope className="w-4 h-4 text-medical-600" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800">
                    {editing ? 'Edit Doctor' : 'Add New Doctor'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {editing ? 'Update doctor details' : 'Create a new doctor account'}
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

            {/* Body */}
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
                    placeholder="e.g. Dr. Ahmed Khan"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                    Specialization
                  </label>
                  <input
                    type="text"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-500/20 focus:border-medical-500 focus:bg-white transition text-sm text-slate-800"
                    placeholder="e.g. General Physician"
                    value={form.specialization}
                    onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                      Room No
                    </label>
                    <input
                      type="text"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-500/20 focus:border-medical-500 focus:bg-white transition text-sm text-slate-800"
                      placeholder="R-101"
                      value={form.room_no}
                      onChange={(e) => setForm({ ...form, room_no: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                      Phone
                    </label>
                    <input
                      type="text"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-500/20 focus:border-medical-500 focus:bg-white transition text-sm text-slate-800"
                      placeholder="0300-1234567"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                    Username <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-500/20 focus:border-medical-500 focus:bg-white transition text-sm text-slate-800"
                    placeholder="e.g. ahmed"
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

            {/* Footer */}
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
                {saving ? 'Saving...' : (editing ? 'Update Doctor' : 'Create Doctor')}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}