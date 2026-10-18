import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../store/auth';
import DoctorLayout from '../components/DoctorLayout';
import {
  BookOpen, Plus, Pencil, Trash2, X, AlertCircle,
  CheckCircle, Pill, FileText, Search, BookmarkPlus,
  Stethoscope, ClipboardList
} from 'lucide-react';

const emptyMed = () => ({
  medicine_name: '',
  dosage: '',
  duration: '',
  instructions: ''
});

const emptyForm = () => ({
  template_name: '',
  diagnosis: '',
  advice: '',
  medicines: [emptyMed()]
});

export default function Templates() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState([]);
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

  const [expandedId, setExpandedId] = useState(null);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/doctor/templates');
      const list = data.templates || [];
      setTemplates(list);
      setFiltered(list);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTemplates(); }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    const result = templates.filter((t) =>
      t.template_name?.toLowerCase().includes(q) ||
      t.diagnosis?.toLowerCase().includes(q) ||
      (t.medicines || []).some((m) => m.medicine_name?.toLowerCase().includes(q))
    );
    setFiltered(result);
  }, [search, templates]);

  const openAddModal = () => {
    setEditing(null);
    setForm(emptyForm());
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = (tpl) => {
    setEditing(tpl);
    setForm({
      template_name: tpl.template_name || '',
      diagnosis: tpl.diagnosis || '',
      advice: tpl.advice || '',
      medicines:
        tpl.medicines && tpl.medicines.length > 0
          ? tpl.medicines.map((m) => ({
              medicine_name: m.medicine_name || '',
              dosage: m.dosage || '',
              duration: m.duration || '',
              instructions: m.instructions || ''
            }))
          : [emptyMed()]
    });
    setFormError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
    setFormError('');
  };

  const updateMed = (i, field, value) => {
    const copy = [...form.medicines];
    copy[i][field] = value;
    setForm({ ...form, medicines: copy });
  };

  const addMed = () => {
    setForm({ ...form, medicines: [...form.medicines, emptyMed()] });
  };

  const removeMed = (i) => {
    if (form.medicines.length === 1) return;
    setForm({
      ...form,
      medicines: form.medicines.filter((_, idx) => idx !== i)
    });
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setFormError('');

    try {
      if (!form.template_name.trim()) {
        throw new Error('Template name is required');
      }

      const validMeds = form.medicines.filter((m) => m.medicine_name.trim());
      if (validMeds.length === 0 && !form.diagnosis.trim()) {
        throw new Error('Add at least a diagnosis or one medicine');
      }

      const payload = {
        template_name: form.template_name.trim(),
        diagnosis: form.diagnosis || null,
        advice: form.advice || null,
        medicines: validMeds
      };

      if (editing) {
        await api.put(`/doctor/templates/${editing.id}`, payload);
        setSuccess('Template updated successfully');
      } else {
        await api.post('/doctor/templates', payload);
        setSuccess('Template created successfully');
      }

      closeModal();
      loadTemplates();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setFormError(err.response?.data?.error || err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (tpl) => {
    if (!window.confirm(`Delete template "${tpl.template_name}"?`)) return;
    try {
      await api.delete(`/doctor/templates/${tpl.id}`);
      setSuccess('Template deleted');
      loadTemplates();
      setTimeout(() => setSuccess(''), 2500);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  };

  return (
    <DoctorLayout
      title="Prescription Templates"
      subtitle="Create and manage quick prescription templates"
      activeTab="templates"
      onTabChange={(k) => {
        if (k === 'templates') return;
        if (k === 'queue') window.location.href = '/doctor';
        if (k === 'completed') window.location.href = '/doctor';
        if (k === 'history') window.location.href = '/doctor';
      }}
    >

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search templates by name, diagnosis, or medicine..."
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
          New Template
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        <div className="bg-white rounded-lg border border-slate-200 px-4 py-3 flex items-center gap-3">
          <div className="w-10 h-10 bg-medical-50 rounded-lg flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-medical-600" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wide">Total Templates</p>
            <p className="text-xl font-bold text-slate-800 font-mono">{templates.length}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 px-4 py-3 flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
            <Pill className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wide">Total Medicines</p>
            <p className="text-xl font-bold text-slate-800 font-mono">
              {templates.reduce((sum, t) => sum + (t.medicines?.length || 0), 0)}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 px-4 py-3 flex items-center gap-3">
          <div className="w-10 h-10 bg-violet-50 rounded-lg flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wide">With Diagnosis</p>
            <p className="text-xl font-bold text-slate-800 font-mono">
              {templates.filter((t) => t.diagnosis).length}
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

      {/* Templates Grid */}
      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-16 text-center">
          <div className="inline-block w-8 h-8 border-3 border-medical-200 border-t-medical-600 rounded-full animate-spin"></div>
          <p className="text-slate-500 mt-4 text-sm">Loading templates...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-16 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-base font-semibold text-slate-700 mb-1">
            {search ? 'No templates found' : 'No templates yet'}
          </h3>
          <p className="text-sm text-slate-500 mb-4 max-w-md mx-auto">
            {search
              ? 'Try a different search term'
              : 'Create reusable prescription templates to speed up your consultations'}
          </p>
          {!search && (
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-2 bg-medical-600 hover:bg-medical-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition"
            >
              <Plus className="w-4 h-4" />
              Create First Template
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((tpl) => {
            const expanded = expandedId === tpl.id;
            return (
              <div
                key={tpl.id}
                className="bg-white rounded-xl border border-slate-200 hover:border-medical-300 transition overflow-hidden"
              >
                {/* Header */}
                <div className="p-4 border-b border-slate-100">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 bg-medical-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-5 h-5 text-medical-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-slate-800 text-sm truncate">
                          {tpl.template_name}
                        </h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {tpl.medicines?.length || 0} medicine{(tpl.medicines?.length || 0) !== 1 ? 's' : ''}
                          {tpl.diagnosis ? ' · has diagnosis' : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => openEditModal(tpl)}
                        className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-medical-600 hover:bg-medical-50 rounded-md transition"
                        title="Edit"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(tpl)}
                        className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md transition"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Diagnosis Preview */}
                {tpl.diagnosis && (
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Diagnosis
                    </p>
                    <p className="text-xs text-slate-700 line-clamp-2">
                      {tpl.diagnosis}
                    </p>
                  </div>
                )}

                {/* Medicines Preview */}
                {tpl.medicines && tpl.medicines.length > 0 && (
                  <div className="px-4 py-3">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Medicines ({tpl.medicines.length})
                    </p>
                    <div className="space-y-1">
                      {(expanded ? tpl.medicines : tpl.medicines.slice(0, 3)).map((m, i) => (
                        <div key={i} className="flex items-center justify-between text-xs py-1">
                          <span className="text-slate-700 font-medium truncate">
                            {i + 1}. {m.medicine_name}
                          </span>
                          <span className="text-slate-500 text-[11px] font-mono ml-2 flex-shrink-0">
                            {m.dosage && `${m.dosage}`}
                            {m.duration && ` × ${m.duration}`}
                          </span>
                        </div>
                      ))}
                      {!expanded && tpl.medicines.length > 3 && (
                        <button
                          onClick={() => setExpandedId(tpl.id)}
                          className="text-[11px] text-medical-600 hover:text-medical-800 font-medium mt-1"
                        >
                          + {tpl.medicines.length - 3} more
                        </button>
                      )}
                      {expanded && tpl.medicines.length > 3 && (
                        <button
                          onClick={() => setExpandedId(null)}
                          className="text-[11px] text-medical-600 hover:text-medical-800 font-medium mt-1"
                        >
                          Show less
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Advice Preview */}
                {tpl.advice && (
                  <div className="px-4 pb-3">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Advice
                    </p>
                    <p className="text-xs text-slate-600 line-clamp-2">{tpl.advice}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ============================================================
          ADD/EDIT MODAL
      ============================================================ */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-hidden flex flex-col">

            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-medical-50 rounded-lg flex items-center justify-center">
                  <BookmarkPlus className="w-4 h-4 text-medical-600" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800">
                    {editing ? 'Edit Template' : 'Create New Template'}
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Reusable prescription for quick consultations
                  </p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
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

              <div className="space-y-5">

                {/* Template Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                    Template Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    autoFocus
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-500/20 focus:border-medical-500 focus:bg-white transition text-sm"
                    placeholder="e.g. Viral Fever, Common Cold, Diabetes Follow-up"
                    value={form.template_name}
                    onChange={(e) => setForm({ ...form, template_name: e.target.value })}
                    required
                  />
                </div>

                {/* Diagnosis */}
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                      Diagnosis
                    </label>
                  </div>
                  <textarea
                    rows={2}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-500/20 focus:border-medical-500 focus:bg-white transition text-sm resize-none"
                    placeholder="e.g. Acute Viral Fever"
                    value={form.diagnosis}
                    onChange={(e) => setForm({ ...form, diagnosis: e.target.value })}
                  />
                </div>

                {/* Medicines */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Pill className="w-3.5 h-3.5 text-slate-500" />
                      <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                        Medicines
                      </label>
                    </div>
                    <button
                      type="button"
                      onClick={addMed}
                      className="inline-flex items-center gap-1 text-[11px] text-medical-600 hover:text-medical-800 font-semibold"
                    >
                      <Plus className="w-3 h-3" />
                      Add Medicine
                    </button>
                  </div>

                  <div className="space-y-2">
                    {form.medicines.map((m, i) => (
                      <div
                        key={i}
                        className="grid grid-cols-12 gap-2 items-start bg-slate-50/50 p-2 rounded-lg border border-slate-100"
                      >
                        <div className="col-span-1 flex items-center justify-center h-10 text-slate-400 font-mono text-xs font-bold">
                          {String(i + 1).padStart(2, '0')}
                        </div>
                        <div className="col-span-11 md:col-span-4">
                          <input
                            type="text"
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-500/20 focus:border-medical-500 transition text-xs"
                            placeholder="Medicine name"
                            value={m.medicine_name}
                            onChange={(e) => updateMed(i, 'medicine_name', e.target.value)}
                          />
                        </div>
                        <div className="col-span-4 md:col-span-2">
                          <input
                            type="text"
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-500/20 focus:border-medical-500 transition text-xs text-center font-mono"
                            placeholder="1+0+1"
                            value={m.dosage}
                            onChange={(e) => updateMed(i, 'dosage', e.target.value)}
                          />
                        </div>
                        <div className="col-span-4 md:col-span-2">
                          <input
                            type="text"
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-500/20 focus:border-medical-500 transition text-xs"
                            placeholder="5 days"
                            value={m.duration}
                            onChange={(e) => updateMed(i, 'duration', e.target.value)}
                          />
                        </div>
                        <div className="col-span-3 md:col-span-2">
                          <input
                            type="text"
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-500/20 focus:border-medical-500 transition text-xs"
                            placeholder="After meal"
                            value={m.instructions}
                            onChange={(e) => updateMed(i, 'instructions', e.target.value)}
                          />
                        </div>
                        <div className="col-span-1 flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => removeMed(i)}
                            disabled={form.medicines.length === 1}
                            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Advice */}
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Stethoscope className="w-3.5 h-3.5 text-slate-500" />
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                      Advice
                    </label>
                  </div>
                  <textarea
                    rows={2}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-500/20 focus:border-medical-500 focus:bg-white transition text-sm resize-none"
                    placeholder="e.g. Rest, drink plenty of water, avoid cold drinks"
                    value={form.advice}
                    onChange={(e) => setForm({ ...form, advice: e.target.value })}
                  />
                </div>
              </div>
            </form>

            {/* Footer */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button
                type="button"
                onClick={closeModal}
                className="flex-1 md:flex-none md:w-32 border border-slate-300 bg-white text-slate-700 py-2.5 rounded-lg hover:bg-slate-100 transition text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex-1 bg-medical-600 hover:bg-medical-700 text-white py-2.5 rounded-lg font-semibold transition text-sm shadow-sm disabled:opacity-50"
              >
                {saving
                  ? 'Saving...'
                  : editing
                  ? 'Update Template'
                  : 'Create Template'}
              </button>
            </div>
          </div>
        </div>
      )}

    </DoctorLayout>
  );
}