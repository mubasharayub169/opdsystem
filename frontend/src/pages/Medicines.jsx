import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../api/axios';
import {
  Plus, Search, Pencil, Trash2, Pill, X,
  AlertCircle, Upload, CheckCircle
} from 'lucide-react';

const emptyForm = () => ({
  name: '',
  generic_name: '',
  category: ''
});

export default function Medicines() {
  const [medicines, setMedicines] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Bulk import
  const [showBulk, setShowBulk] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResult, setBulkResult] = useState(null);

  const loadMedicines = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/admin/medicines');
      const list = data.medicines || [];
      setMedicines(list);
      setFiltered(list);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadMedicines(); }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    const result = medicines.filter((m) =>
      m.name?.toLowerCase().includes(q) ||
      m.generic_name?.toLowerCase().includes(q) ||
      m.category?.toLowerCase().includes(q)
    );
    setFiltered(result);
  }, [search, medicines]);

  const openAddModal = () => {
    setEditing(null);
    setForm(emptyForm());
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = (med) => {
    setEditing(med);
    setForm({
      name: med.name || '',
      generic_name: med.generic_name || '',
      category: med.category || ''
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
      if (!form.name.trim()) {
        throw new Error('Medicine name required');
      }

      if (editing) {
        await api.put(`/admin/medicines/${editing.id}`, form);
        setSuccess('Medicine updated');
      } else {
        await api.post('/admin/medicines', form);
        setSuccess('Medicine added');
      }

      closeModal();
      loadMedicines();
      setTimeout(() => setSuccess(''), 2500);
    } catch (err) {
      setFormError(err.response?.data?.error || err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (med) => {
    if (!window.confirm(`Deactivate "${med.name}"?`)) return;
    try {
      await api.delete(`/admin/medicines/${med.id}`);
      setSuccess('Medicine deactivated');
      loadMedicines();
      setTimeout(() => setSuccess(''), 2500);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  };

  const handleBulkImport = async () => {
    setBulkLoading(true);
    setBulkResult(null);
    setFormError('');

    try {
      const lines = bulkText.split('\n').filter((l) => l.trim());
      const medicines = lines.map((line) => {
        const parts = line.split('|').map((p) => p.trim());
        return {
          name: parts[0] || '',
          generic_name: parts[1] || '',
          category: parts[2] || ''
        };
      });

      if (medicines.length === 0) {
        throw new Error('No valid lines found');
      }

      const { data } = await api.post('/admin/medicines/bulk', { medicines });

      setBulkResult(data);
      setBulkText('');
      loadMedicines();
    } catch (err) {
      setFormError(err.response?.data?.error || err.message);
    } finally {
      setBulkLoading(false);
    }
  };

  return (
    <Layout title="Medicines" subtitle="Manage medicine database for prescriptions">

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, generic, or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medical-500/20 focus:border-medical-500 transition text-slate-700 placeholder-slate-400"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowBulk(true)}
            className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 py-2.5 rounded-lg text-sm font-semibold transition"
          >
            <Upload className="w-4 h-4" />
            Bulk Import
          </button>

          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 bg-medical-600 hover:bg-medical-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition shadow-sm hover:shadow-md"
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            Add Medicine
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        <div className="bg-white rounded-lg border border-slate-200 px-4 py-3 flex items-center gap-3">
          <div className="w-10 h-10 bg-medical-50 rounded-lg flex items-center justify-center">
            <Pill className="w-5 h-5 text-medical-600" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wide">Total Medicines</p>
            <p className="text-xl font-bold text-slate-800 font-mono">{medicines.length}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 px-4 py-3 flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wide">Active</p>
            <p className="text-xl font-bold text-slate-800 font-mono">
              {medicines.filter((m) => m.is_active).length}
            </p>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {success && (
        <div className="bg-emerald-50 border-l-[3px] border-emerald-500 text-emerald-700 p-3.5 rounded-lg mb-4 flex items-start justify-between gap-2">
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span className="text-sm font-medium">{success}</span>
          </div>
          <button onClick={() => setSuccess('')} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border-l-[3px] border-red-500 text-red-700 p-3.5 rounded-lg mb-4 flex items-start justify-between gap-2">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span className="text-sm">{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-red-700 hover:text-red-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-16 text-center">
          <div className="inline-block w-8 h-8 border-3 border-medical-200 border-t-medical-600 rounded-full animate-spin"></div>
          <p className="text-slate-500 mt-4 text-sm">Loading medicines...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-16 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Pill className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-base font-semibold text-slate-700 mb-1">
            {search ? 'No results found' : 'No medicines yet'}
          </h3>
          <p className="text-sm text-slate-500 mb-4 max-w-md mx-auto">
            {search
              ? 'Try a different search term'
              : 'Add medicines one by one or use Bulk Import for quick setup'}
          </p>
          {!search && (
            <div className="flex gap-2 justify-center">
              <button
                onClick={openAddModal}
                className="inline-flex items-center gap-2 bg-medical-600 hover:bg-medical-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition"
              >
                <Plus className="w-4 h-4" />
                Add Medicine
              </button>
              <button
                onClick={() => setShowBulk(true)}
                className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 py-2.5 rounded-lg text-sm font-semibold transition"
              >
                <Upload className="w-4 h-4" />
                Bulk Import
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Medicine Name</th>
                  <th className="text-left px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Generic Name</th>
                  <th className="text-left px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Category</th>
                  <th className="text-left px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="text-right px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-medical-50 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Pill className="w-4 h-4 text-medical-600" />
                        </div>
                        <p className="font-semibold text-slate-800 text-sm">{m.name}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs text-slate-600">{m.generic_name || '—'}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      {m.category ? (
                        <span className="text-xs text-slate-700 bg-slate-100 px-2 py-1 rounded-md">
                          {m.category}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        m.is_active
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          m.is_active ? 'bg-emerald-500' : 'bg-red-500'
                        }`}></span>
                        {m.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(m)}
                          className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-medical-600 hover:bg-medical-50 rounded-md transition"
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(m)}
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
          ADD/EDIT MODAL
      ============================================================ */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-medical-50 rounded-lg flex items-center justify-center">
                  <Pill className="w-4 h-4 text-medical-600" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800">
                    {editing ? 'Edit Medicine' : 'Add New Medicine'}
                  </h2>
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
                    Medicine Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    autoFocus
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-500/20 focus:border-medical-500 focus:bg-white transition text-sm"
                    placeholder="e.g. Panadol 500mg"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                    Generic Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-500/20 focus:border-medical-500 focus:bg-white transition text-sm"
                    placeholder="e.g. Paracetamol"
                    value={form.generic_name}
                    onChange={(e) => setForm({ ...form, generic_name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                    Category
                  </label>
                  <input
                    type="text"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-500/20 focus:border-medical-500 focus:bg-white transition text-sm"
                    placeholder="e.g. Analgesic"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
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
                {saving ? 'Saving...' : (editing ? 'Update Medicine' : 'Add Medicine')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          BULK IMPORT MODAL
      ============================================================ */}
      {showBulk && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-medical-50 rounded-lg flex items-center justify-center">
                  <Upload className="w-4 h-4 text-medical-600" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800">Bulk Import Medicines</h2>
                  <p className="text-xs text-slate-500">Add multiple medicines at once</p>
                </div>
              </div>
              <button
                onClick={() => { setShowBulk(false); setBulkResult(null); setFormError(''); }}
                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {bulkResult ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6 text-center">
                  <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
                  <p className="font-bold text-emerald-800 mb-1">
                    Import Complete!
                  </p>
                  <p className="text-sm text-emerald-700 mb-4">{bulkResult.message}</p>
                  <button
                    onClick={() => { setShowBulk(false); setBulkResult(null); }}
                    className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <>
                  <div className="bg-medical-50 border border-medical-200 rounded-lg p-4 mb-4">
                    <p className="text-xs font-bold text-medical-800 uppercase tracking-wider mb-2">
                      Format
                    </p>
                    <p className="text-xs text-medical-700 mb-2">
                      Har line mein pipe (|) se separate karo:
                    </p>
                    <code className="text-xs font-mono bg-white p-2 rounded border border-medical-200 block">
                      Name | Generic | Category
                    </code>
                    <p className="text-[11px] text-medical-600 mt-2">
                      Example:<br />
                      Panadol 500mg | Paracetamol | Analgesic<br />
                      Augmentin 625mg | Amoxicillin | Antibiotic<br />
                      Brufen 400mg | Ibuprofen | NSAID
                    </p>
                  </div>

                  {formError && (
                    <div className="bg-red-50 border-l-[3px] border-red-500 text-red-700 p-3 rounded-lg mb-4 text-sm flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>{formError}</span>
                    </div>
                  )}

                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                    Paste Medicines (one per line)
                  </label>
                  <textarea
                    rows={12}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-500/20 focus:border-medical-500 focus:bg-white transition text-sm font-mono"
                    placeholder="Panadol 500mg | Paracetamol | Analgesic&#10;Augmentin 625mg | Amoxicillin | Antibiotic&#10;..."
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                  />
                  <p className="text-[11px] text-slate-500 mt-1.5">
                    {bulkText.split('\n').filter((l) => l.trim()).length} lines detected
                  </p>
                </>
              )}
            </div>

            {!bulkResult && (
              <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex gap-3">
                <button
                  onClick={() => { setShowBulk(false); setBulkText(''); setFormError(''); }}
                  className="flex-1 border border-slate-300 bg-white text-slate-700 py-2.5 rounded-lg hover:bg-slate-100 transition text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkImport}
                  disabled={bulkLoading || !bulkText.trim()}
                  className="flex-1 bg-medical-600 hover:bg-medical-700 text-white py-2.5 rounded-lg font-semibold transition text-sm shadow-sm disabled:opacity-50"
                >
                  {bulkLoading ? 'Importing...' : `Import ${bulkText.split('\n').filter(l => l.trim()).length} Medicines`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </Layout>
  );
}