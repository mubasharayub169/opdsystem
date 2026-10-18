import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../store/auth';
import MedicineAutocomplete from '../components/MedicineAutocomplete';
import {
  ArrowLeft, Save, Plus, Trash2, Activity, FileText, Pill,
  History, AlertCircle, X, CheckCircle, Stethoscope,
  Printer, BookmarkPlus, BookOpen, HeartPulse
} from 'lucide-react';

export default function Prescription() {
  const { visitId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [visit, setVisit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);

  // Templates
  const [templates, setTemplates] = useState([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateSaving, setTemplateSaving] = useState(false);

  const [form, setForm] = useState({
    complaints: '',
    diagnosis: '',
    bp: '',
    pulse: '',
    temperature: '',
    weight: '',
    spo2: '',
    advice: '',
    followUpDate: ''
  });

  const [medicines, setMedicines] = useState([
    { medicine_name: '', dosage: '', duration: '', instructions: '' }
  ]);

  useEffect(() => {
    const loadVisit = async () => {
      try {
        const { data } = await api.get(`/doctor/visits/${visitId}`);
        setVisit(data.visit);
        await api.post(`/doctor/visits/${visitId}/start`);
      } catch (err) {
        setError(err.response?.data?.error || err.message);
      } finally {
        setLoading(false);
      }
    };
    loadVisit();
    loadTemplates();
  }, [visitId]);

  const loadTemplates = async () => {
    try {
      const { data } = await api.get('/doctor/templates');
      setTemplates(data.templates || []);
    } catch (err) {
      console.error('Templates load failed:', err);
    }
  };

  const updateMed = (i, field, value) => {
    const copy = [...medicines];
    copy[i][field] = value;
    setMedicines(copy);
  };

  const addMed = () => {
    setMedicines([
      ...medicines,
      { medicine_name: '', dosage: '', duration: '', instructions: '' }
    ]);
  };

  const removeMed = (i) => {
    if (medicines.length === 1) return;
    setMedicines(medicines.filter((_, idx) => idx !== i));
  };

  const loadHistory = async () => {
    try {
      const { data } = await api.get(`/doctor/patients/${visit.mr_no}/history`);
      setHistory(data.visits || []);
      setShowHistory(true);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  };

  // ============================================================
  // APPLY TEMPLATE
  // ============================================================
  const applyTemplate = (tpl) => {
    if (tpl.diagnosis) setForm((f) => ({ ...f, diagnosis: tpl.diagnosis }));
    if (tpl.advice) setForm((f) => ({ ...f, advice: tpl.advice }));
    if (tpl.medicines && tpl.medicines.length > 0) {
      setMedicines(
        tpl.medicines.map((m) => ({
          medicine_name: m.medicine_name || '',
          dosage: m.dosage || '',
          duration: m.duration || '',
          instructions: m.instructions || ''
        }))
      );
    }
    setShowTemplates(false);
    setSuccess(`Template "${tpl.template_name}" applied`);
    setTimeout(() => setSuccess(''), 3000);
  };

  // ============================================================
  // SAVE AS TEMPLATE
  // ============================================================
  const saveAsTemplate = async () => {
    if (!templateName.trim()) {
      setError('Please enter a template name');
      return;
    }
    const validMeds = medicines.filter((m) => m.medicine_name.trim());
    if (validMeds.length === 0 && !form.diagnosis.trim()) {
      setError('Add diagnosis or medicines before saving template');
      return;
    }

    setTemplateSaving(true);
    setError('');

    try {
      await api.post('/doctor/templates', {
        template_name: templateName.trim(),
        diagnosis: form.diagnosis,
        advice: form.advice,
        medicines: validMeds
      });
      setTemplateName('');
      setShowSaveTemplate(false);
      setSuccess('Template saved successfully');
      loadTemplates();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setTemplateSaving(false);
    }
  };

  // ============================================================
  // DELETE TEMPLATE
  // ============================================================
  const deleteTemplate = async (id, name, e) => {
    e.stopPropagation();
    if (!window.confirm(`Delete template "${name}"?`)) return;
    try {
      await api.delete(`/doctor/templates/${id}`);
      loadTemplates();
      setSuccess('Template deleted');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  };

  // ============================================================
  // SAVE PRESCRIPTION
  // ============================================================
  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await api.post('/doctor/prescriptions', {
        visitId: parseInt(visitId),
        mrNo: visit.mr_no,
        ...form,
        medicines: medicines.filter((m) => m.medicine_name.trim())
      });
      setSuccess('Prescription saved successfully!');
      setTimeout(() => navigate('/doctor'), 1500);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // PRINT
  // ============================================================
  const handlePrint = () => {
    const validMeds = medicines.filter((m) => m.medicine_name.trim());
    const today = new Date().toLocaleDateString('en-PK', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    const medicinesRows = validMeds
      .map(
        (m, i) => `
        <tr>
          <td class="idx">${i + 1}</td>
          <td class="med-name">${m.medicine_name}</td>
          <td class="dosage">${m.dosage || ''}</td>
          <td class="duration">${m.duration || ''}</td>
        </tr>`
      )
      .join('');

    const vitalsList = [
      form.bp && `BP: ${form.bp}`,
      form.pulse && `Pulse: ${form.pulse}`,
      form.temperature && `Temp: ${form.temperature}°F`,
      form.weight && `Weight: ${form.weight}kg`,
      form.spo2 && `SpO₂: ${form.spo2}%`
    ]
      .filter(Boolean)
      .join('  |  ');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />
        <title>Rx - ${visit.patient_name}</title>
        <style>
          @page { size: A4 portrait; margin: 0; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          html, body {
            width: 210mm; height: 297mm;
            font-family: 'Arial', 'Helvetica', sans-serif;
            color: #1e293b; background: white;
          }
          .print-area {
            position: absolute;
            top: 72mm; left: 75mm; right: 12mm; bottom: 55mm;
          }
          .patient-line { font-size: 11px; margin-bottom: 8mm; line-height: 1.6; }
          .patient-line .field { display: inline-block; margin-right: 8mm; }
          .patient-line .label { color: #475569; font-weight: 600; font-size: 10px; }
          .patient-line .value {
            color: #0f172a; font-weight: 700;
            border-bottom: 1px dotted #94a3b8;
            padding: 0 4px 1px 4px; min-width: 40px; display: inline-block;
          }
          .section { margin-bottom: 5mm; }
          .section-label {
            font-size: 9px; font-weight: 700; color: #0f172a;
            text-transform: uppercase; letter-spacing: 0.5px;
            margin-bottom: 1.5mm; padding-bottom: 1mm;
            border-bottom: 1px solid #cbd5e1;
          }
          .section-body { font-size: 11px; line-height: 1.6; color: #1e293b; white-space: pre-wrap; }
          .vitals-inline { font-size: 10px; color: #0f172a; font-weight: 600; padding: 2mm 0; }
          .rx-section { margin-top: 4mm; }
          .rx-symbol {
            font-family: 'Georgia', serif; font-size: 22px;
            font-weight: 800; color: #0f172a; margin-bottom: 2mm; line-height: 1;
          }
          .medicines-table { width: 100%; border-collapse: collapse; font-size: 11px; }
          .medicines-table thead th {
            text-align: left; font-size: 9px; font-weight: 700;
            color: #475569; text-transform: uppercase; letter-spacing: 0.5px;
            padding: 1.5mm 2mm; border-bottom: 1.5px solid #0f172a;
          }
          .medicines-table thead th:first-child { width: 6%; text-align: center; }
          .medicines-table thead th:nth-child(3) { width: 18%; text-align: center; }
          .medicines-table thead th:nth-child(4) { width: 18%; text-align: center; }
          .medicines-table tbody td {
            padding: 2.5mm 2mm; border-bottom: 1px dotted #cbd5e1;
            vertical-align: top; font-size: 11px;
          }
          .medicines-table tbody td.idx {
            text-align: center; font-weight: 700; color: #0f172a;
            font-family: 'Courier New', monospace;
          }
          .medicines-table tbody td.med-name { font-weight: 700; color: #0f172a; }
          .medicines-table tbody td.dosage,
          .medicines-table tbody td.duration {
            text-align: center; font-family: 'Courier New', monospace;
            color: #1e293b; font-weight: 600;
          }
          .followup { margin-top: 4mm; font-size: 11px; }
          .followup .label { font-weight: 700; color: #0f172a; }
          .followup .value {
            font-weight: 700; color: #0f172a;
            border-bottom: 1px dotted #94a3b8; padding: 0 4px 1px 4px;
          }
          @media print {
            body { width: 210mm; height: 297mm; }
            .print-area { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="print-area">
          <div class="patient-line">
            <span class="field"><span class="label">Name:</span> <span class="value">${visit.patient_name || ''}</span></span>
            <span class="field"><span class="label">Age:</span> <span class="value">${visit.age || ''}</span></span>
            <span class="field"><span class="label">Sex:</span> <span class="value">${visit.gender || ''}</span></span>
            <span class="field"><span class="label">MR#:</span> <span class="value">${visit.mr_no || ''}</span></span>
            <span class="field"><span class="label">Date:</span> <span class="value">${today}</span></span>
          </div>

          ${vitalsList ? `<div class="section"><div class="section-label">Vitals</div><div class="vitals-inline">${vitalsList}</div></div>` : ''}
          ${form.complaints ? `<div class="section"><div class="section-label">General Status / Complaints</div><div class="section-body">${form.complaints}</div></div>` : ''}
          ${form.diagnosis ? `<div class="section"><div class="section-label">Diagnosis</div><div class="section-body">${form.diagnosis}</div></div>` : ''}

          ${validMeds.length > 0 ? `
            <div class="rx-section">
              <div class="rx-symbol">℞</div>
              <table class="medicines-table">
                <thead><tr><th>#</th><th>Medicine</th><th>Dosage</th><th>Duration</th></tr></thead>
                <tbody>${medicinesRows}</tbody>
              </table>
            </div>` : ''}

          ${form.advice ? `<div class="section" style="margin-top: 5mm;"><div class="section-label">Advice</div><div class="section-body">${form.advice}</div></div>` : ''}
          ${form.followUpDate ? `<div class="followup"><span class="label">Follow-up:</span> <span class="value">${new Date(form.followUpDate).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })}</span></div>` : ''}
        </div>
        <script>window.onload = function() { setTimeout(function() { window.print(); }, 300); };</script>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank', 'width=900,height=700');
    printWindow.document.write(html);
    printWindow.document.close();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="inline-block w-10 h-10 border-4 border-medical-200 border-t-medical-600 rounded-full animate-spin"></div>
          <p className="text-slate-500 mt-4 text-sm">Loading patient details...</p>
        </div>
      </div>
    );
  }

  if (!visit) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-slate-700 font-semibold">Visit not found</p>
          <button
            onClick={() => navigate('/doctor')}
            className="mt-4 text-medical-600 hover:text-medical-800 font-medium text-sm"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <button
            onClick={() => navigate('/doctor')}
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium text-sm transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Queue
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTemplates(true)}
              className="inline-flex items-center gap-1.5 bg-white hover:bg-medical-50 border border-slate-200 hover:border-medical-300 text-slate-700 hover:text-medical-700 px-3 py-2 rounded-lg text-xs font-semibold transition"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Templates
              {templates.length > 0 && (
                <span className="bg-medical-100 text-medical-700 text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[16px] text-center">
                  {templates.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setShowSaveTemplate(true)}
              className="inline-flex items-center gap-1.5 bg-white hover:bg-medical-50 border border-slate-200 hover:border-medical-300 text-slate-700 hover:text-medical-700 px-3 py-2 rounded-lg text-xs font-semibold transition"
            >
              <BookmarkPlus className="w-3.5 h-3.5" />
              Save as Template
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 bg-white hover:bg-medical-50 border border-slate-200 hover:border-medical-300 text-slate-700 hover:text-medical-700 px-3 py-2 rounded-lg text-xs font-semibold transition"
            >
              <Printer className="w-3.5 h-3.5" />
              Print
            </button>

            <div className="w-px h-6 bg-slate-200 mx-1"></div>

            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-slate-800">{user?.name}</p>
              <p className="text-[11px] text-slate-500">{user?.specialization}</p>
            </div>
            <div className="w-9 h-9 bg-gradient-to-br from-medical-500 to-medical-700 rounded-lg flex items-center justify-center shadow-sm">
              <Stethoscope className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-6 space-y-4">

        {/* Patient Header */}
        <div className="bg-gradient-to-r from-medical-700 via-medical-600 to-medical-700 rounded-xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/10 backdrop-blur rounded-xl flex flex-col items-center justify-center text-white font-bold border border-white/20 flex-shrink-0">
                <span className="text-[10px] opacity-80 uppercase tracking-wider">Token</span>
                <span className="text-2xl font-mono leading-none">{visit.token_no}</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{visit.patient_name}</h2>
                <p className="text-medical-100 text-xs mt-1">
                  MR: <span className="font-mono font-semibold">{visit.mr_no}</span>
                  {visit.age && ` · ${visit.age}Y`}
                  {visit.gender && `/${visit.gender}`}
                  {visit.phone && ` · 📞 ${visit.phone}`}
                </p>
              </div>
            </div>

            <button
              onClick={loadHistory}
              className="inline-flex items-center gap-2 bg-white/10 backdrop-blur hover:bg-white/20 border border-white/20 text-white px-4 py-2 rounded-lg font-medium text-xs transition"
            >
              <History className="w-3.5 h-3.5" />
              View History
            </button>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="bg-red-50 border-l-[3px] border-red-500 text-red-700 p-3.5 rounded-lg flex items-start justify-between gap-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span className="text-sm">{error}</span>
            </div>
            <button onClick={() => setError('')}><X className="w-4 h-4" /></button>
          </div>
        )}

        {success && (
          <div className="bg-emerald-50 border-l-[3px] border-emerald-500 text-emerald-700 p-3.5 rounded-lg flex items-start gap-2">
            <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span className="text-sm font-medium">{success}</span>
          </div>
        )}

        {/* Vitals */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-medical-50 rounded-lg flex items-center justify-center">
              <HeartPulse className="w-4 h-4 text-medical-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Vitals</h3>
              <p className="text-[11px] text-slate-500">Current measurements</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { key: 'bp', label: 'Blood Pressure', ph: '120/80', unit: 'mmHg' },
              { key: 'pulse', label: 'Pulse', ph: '72', unit: 'bpm' },
              { key: 'temperature', label: 'Temperature', ph: '98.6', unit: '°F' },
              { key: 'weight', label: 'Weight', ph: '70', unit: 'kg' },
              { key: 'spo2', label: 'SpO₂', ph: '98', unit: '%' }
            ].map((v) => (
              <div key={v.key}>
                <label className="block text-[10px] font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
                  {v.label}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-500/20 focus:border-medical-500 focus:bg-white transition text-sm font-mono"
                    placeholder={v.ph}
                    value={form[v.key]}
                    onChange={(e) => setForm({ ...form, [v.key]: e.target.value })}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-medium">
                    {v.unit}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Clinical Notes */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-medical-50 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-medical-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Clinical Notes</h3>
              <p className="text-[11px] text-slate-500">Complaints and diagnosis</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                Chief Complaints
              </label>
              <textarea
                rows={4}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-500/20 focus:border-medical-500 focus:bg-white transition text-sm resize-none"
                placeholder="Patient's chief complaints..."
                value={form.complaints}
                onChange={(e) => setForm({ ...form, complaints: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                Diagnosis
              </label>
              <textarea
                rows={4}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-500/20 focus:border-medical-500 focus:bg-white transition text-sm resize-none"
                placeholder="Medical diagnosis..."
                value={form.diagnosis}
                onChange={(e) => setForm({ ...form, diagnosis: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Medicines */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 relative z-20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-medical-50 rounded-lg flex items-center justify-center">
                <Pill className="w-4 h-4 text-medical-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Medicines (Rx)</h3>
                <p className="text-[11px] text-slate-500">Prescribed medications</p>
              </div>
            </div>
            <button
              onClick={addMed}
              className="inline-flex items-center gap-1.5 bg-medical-600 hover:bg-medical-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Medicine
            </button>
          </div>

          <div className="hidden md:grid grid-cols-12 gap-2 mb-2 px-1">
            <div className="col-span-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">#</div>
            <div className="col-span-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Medicine</div>
            <div className="col-span-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Dosage</div>
            <div className="col-span-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Duration</div>
            <div className="col-span-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Instructions</div>
            <div className="col-span-1"></div>
          </div>

          <div className="space-y-2">
            {medicines.map((m, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-start">
                <div className="col-span-1 flex items-center justify-center h-10 text-slate-400 font-mono text-xs font-bold">
                  {String(i + 1).padStart(2, '0')}
                </div>
                
                {/* Medicine Autocomplete with Relative z-index */}
                <div className="col-span-11 md:col-span-4 relative z-[100]">
                  <MedicineAutocomplete
                    value={m.medicine_name}
                    onChange={(val) => updateMed(i, 'medicine_name', val)}
                    placeholder="e.g. Panadol 500mg"
                  />
                </div>

                <div className="col-span-4 md:col-span-2">
                  <input
                    type="text"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-500/20 focus:border-medical-500 focus:bg-white transition text-sm text-center font-mono"
                    placeholder="1+0+1"
                    value={m.dosage}
                    onChange={(e) => updateMed(i, 'dosage', e.target.value)}
                  />
                </div>
                <div className="col-span-4 md:col-span-2">
                  <input
                    type="text"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-500/20 focus:border-medical-500 focus:bg-white transition text-sm"
                    placeholder="5 days"
                    value={m.duration}
                    onChange={(e) => updateMed(i, 'duration', e.target.value)}
                  />
                </div>
                <div className="col-span-3 md:col-span-2">
                  <input
                    type="text"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-500/20 focus:border-medical-500 focus:bg-white transition text-sm"
                    placeholder="After meal"
                    value={m.instructions}
                    onChange={(e) => updateMed(i, 'instructions', e.target.value)}
                  />
                </div>
                <div className="col-span-1 flex items-center justify-center">
                  <button
                    onClick={() => removeMed(i)}
                    disabled={medicines.length === 1}
                    className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Advice & Follow-up */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 relative z-10">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                Advice
              </label>
              <textarea
                rows={3}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-500/20 focus:border-medical-500 focus:bg-white transition text-sm resize-none"
                placeholder="Rest, drink plenty of water..."
                value={form.advice}
                onChange={(e) => setForm({ ...form, advice: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                Follow-up Date
              </label>
              <input
                type="date"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-500/20 focus:border-medical-500 focus:bg-white transition text-sm"
                value={form.followUpDate}
                onChange={(e) => setForm({ ...form, followUpDate: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 sticky bottom-4 z-30">
          <button
            onClick={() => navigate('/doctor')}
            className="flex-1 md:flex-none md:w-40 bg-white border border-slate-300 text-slate-700 py-3 rounded-lg font-semibold text-sm hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 md:flex-none md:w-40 bg-white border border-slate-300 text-slate-700 py-3 rounded-lg font-semibold text-sm hover:bg-slate-50 transition inline-flex items-center justify-center gap-2"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-medical-600 hover:bg-medical-700 text-white py-3 rounded-lg font-semibold text-sm transition-all shadow-sm hover:shadow-md disabled:opacity-50 inline-flex items-center justify-center gap-2"
          >
            {saving ? 'Saving...' : (<><Save className="w-4 h-4" />Save Prescription</>)}
          </button>
        </div>

      </main>

      {/* ============================================================
          TEMPLATES MODAL
      ============================================================ */}
      {showTemplates && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-medical-50 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-medical-600" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800">Prescription Templates</h2>
                  <p className="text-[11px] text-slate-500">Click a template to apply it</p>
                </div>
              </div>
              <button onClick={() => setShowTemplates(false)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {templates.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <BookOpen className="w-7 h-7 text-slate-400" />
                  </div>
                  <p className="text-sm font-semibold text-slate-700 mb-1">No templates yet</p>
                  <p className="text-xs text-slate-500 mb-4">Fill this prescription, then click "Save as Template"</p>
                  <button onClick={() => { setShowTemplates(false); setShowSaveTemplate(true); }} className="inline-flex items-center gap-1.5 bg-medical-600 hover:bg-medical-700 text-white px-4 py-2 rounded-lg text-xs font-semibold transition">
                    <BookmarkPlus className="w-3.5 h-3.5" />
                    Save Current as Template
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {templates.map((tpl) => (
                    <div key={tpl.id} className="border border-slate-200 rounded-lg p-4 hover:border-medical-300 hover:bg-medical-50/30 transition group">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <button onClick={() => applyTemplate(tpl)} className="flex-1 text-left">
                          <h4 className="font-bold text-slate-800 text-sm">{tpl.template_name}</h4>
                          {tpl.diagnosis && <p className="text-xs text-slate-500 mt-0.5 line-clamp-1"><span className="font-medium text-slate-600">Dx:</span> {tpl.diagnosis}</p>}
                        </button>
                        <button onClick={(e) => deleteTemplate(tpl.id, tpl.template_name, e)} className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition" title="Delete">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {tpl.medicines && tpl.medicines.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {tpl.medicines.slice(0, 4).map((m, i) => (
                            <span key={i} className="text-[10px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">{m.medicine_name}</span>
                          ))}
                          {tpl.medicines.length > 4 && <span className="text-[10px] font-medium text-medical-600 bg-medical-50 px-2 py-0.5 rounded">+{tpl.medicines.length - 4} more</span>}
                        </div>
                      )}
                      <button onClick={() => applyTemplate(tpl)} className="mt-3 w-full text-xs font-semibold text-medical-600 hover:text-medical-800 py-1.5 border border-medical-200 hover:bg-medical-50 rounded-md transition">Apply Template</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          SAVE TEMPLATE MODAL
      ============================================================ */}
      {showSaveTemplate && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-medical-50 rounded-lg flex items-center justify-center">
                  <BookmarkPlus className="w-4 h-4 text-medical-600" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800">Save as Template</h2>
                  <p className="text-[11px] text-slate-500">Current prescription will be saved</p>
                </div>
              </div>
              <button onClick={() => setShowSaveTemplate(false)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                Template Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                autoFocus
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-500/20 focus:border-medical-500 focus:bg-white transition text-sm"
                placeholder="e.g. Viral Fever Prescription"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && saveAsTemplate()}
              />
              <div className="mt-4 bg-slate-50 rounded-lg p-3 border border-slate-200">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Will be saved:</p>
                <div className="space-y-0.5 text-xs text-slate-600">
                  <p>• Diagnosis: <span className="font-medium">{form.diagnosis || '—'}</span></p>
                  <p>• Medicines: <span className="font-medium">{medicines.filter(m => m.medicine_name.trim()).length}</span></p>
                  <p>• Advice: <span className="font-medium">{form.advice ? 'Yes' : '—'}</span></p>
                </div>
              </div>
            </div>
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button onClick={() => setShowSaveTemplate(false)} className="flex-1 border border-slate-300 bg-white text-slate-700 py-2.5 rounded-lg hover:bg-slate-100 transition text-sm font-medium">Cancel</button>
              <button onClick={saveAsTemplate} disabled={templateSaving} className="flex-1 bg-medical-600 hover:bg-medical-700 text-white py-2.5 rounded-lg font-semibold transition text-sm shadow-sm disabled:opacity-50">
                {templateSaving ? 'Saving...' : 'Save Template'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          HISTORY MODAL
      ============================================================ */}
      {showHistory && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-medical-50 rounded-lg flex items-center justify-center">
                  <History className="w-4 h-4 text-medical-600" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800">Patient History</h2>
                  <p className="text-[11px] text-slate-500">{visit.patient_name} — MR: {visit.mr_no}</p>
                </div>
              </div>
              <button onClick={() => setShowHistory(false)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {history.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <History className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                  <p className="text-sm">No previous visits</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {history.map((h) => (
                    <div key={h.id} className="border border-slate-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded font-mono">Token #{h.token_no}</span>
                          <span className="text-xs text-slate-500">{h.consultant_name}</span>
                        </div>
                        <span className="text-[11px] text-slate-500">{new Date(h.visit_date).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                      {h.complaints && <p className="text-xs text-slate-600 mb-1"><b className="text-slate-700">Complaints:</b> {h.complaints}</p>}
                      {h.diagnosis && <p className="text-xs text-slate-600 mb-1"><b className="text-slate-700">Diagnosis:</b> {h.diagnosis}</p>}
                      {(h.bp || h.pulse || h.temperature) && (
                        <p className="text-xs text-slate-600 mb-2">
                          <b className="text-slate-700">Vitals:</b> {h.bp && `BP ${h.bp}`} {h.pulse && `· Pulse ${h.pulse}`} {h.temperature && `· Temp ${h.temperature}`}
                        </p>
                      )}
                      {h.medicines && h.medicines.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-slate-100">
                          <p className="text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Medicines</p>
                          <ul className="text-xs text-slate-600 space-y-0.5">
                            {h.medicines.map((m) => (
                              <li key={m.id}>• {m.medicine_name} {m.dosage && `— ${m.dosage}`} {m.duration && ` × ${m.duration}`}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {h.advice && <p className="text-xs text-slate-600 mt-2"><b className="text-slate-700">Advice:</b> {h.advice}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}