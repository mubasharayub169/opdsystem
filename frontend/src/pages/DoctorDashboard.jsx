import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../store/auth';
import DoctorLayout from '../components/DoctorLayout';
import { printPrescription } from '../utils/printPrescription';
import {
  Clock, RefreshCw, ArrowRight, Stethoscope, ListChecks,
  Search, AlertCircle, X, ChevronDown, ChevronUp,
  FileText, Pill, HeartPulse, Calendar, User,
  Printer, Loader, BarChart3
} from 'lucide-react';

export default function DoctorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('queue');
  const [queue, setQueue] = useState([]);
  const [completed, setCompleted] = useState([]);
  const [loading, setLoading] = useState(true);
  const [prevCount, setPrevCount] = useState(0);
  const [printingId, setPrintingId] = useState(null);

  // History search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientHistory, setPatientHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [expandedVisit, setExpandedVisit] = useState(null);

  // Daily Report
  const [reportDate, setReportDate] = useState(new Date().toISOString().slice(0, 10));
  const [reportData, setReportData] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);

  // ============================================================
  // LOAD QUEUE
  // ============================================================
  const loadQueue = async () => {
    try {
      const { data } = await api.get('/doctor/queue');
      const newQueue = data.queue || [];
      setQueue(newQueue);
      if (prevCount > 0 && newQueue.length > prevCount) playBeep();
      setPrevCount(newQueue.length);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadCompleted = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/doctor/completed');
      setCompleted(data.completed || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadReport = async (date = reportDate) => {
    try {
      setReportLoading(true);
      const { data } = await api.get(`/doctor/reports/daily?date=${date}`);
      setReportData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setReportLoading(false);
    }
  };

  const playBeep = () => {
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQBvT18AAAA=');
      audio.volume = 0.3;
      audio.play().catch(() => {});
    } catch {}
  };

  useEffect(() => {
    loadQueue();
    const interval = setInterval(loadQueue, 8000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (tab === 'completed') loadCompleted();
    if (tab === 'reports') loadReport();
  }, [tab]);

  // ============================================================
  // REPRINT PRESCRIPTION
  // ============================================================
  const handleReprint = async (visitId) => {
    setPrintingId(visitId);
    try {
      const { data } = await api.get(`/doctor/visits/${visitId}/prescription`);
      if (!data.prescription) {
        alert('No prescription found for this visit.');
        setPrintingId(null);
        return;
      }
      printPrescription({
        visit: data.visit,
        prescription: data.prescription,
        doctor: user
      });
    } catch (err) {
      alert('Failed to load prescription: ' + (err.response?.data?.error || err.message));
    } finally {
      setTimeout(() => setPrintingId(null), 1000);
    }
  };

  // ============================================================
  // HISTORY
  // ============================================================
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setSearchError('');
    setSearchResults([]);
    setSelectedPatient(null);
    setPatientHistory([]);
    setExpandedVisit(null);

    try {
      const { data } = await api.get(
        `/doctor/patients/search?q=${encodeURIComponent(searchQuery)}`
      );
      setSearchResults(data.patients || []);
    } catch (err) {
      setSearchError(err.response?.data?.error || err.message);
    } finally {
      setSearching(false);
    }
  };

  const handleViewPatient = async (mrNo) => {
    setLoadingHistory(true);
    setExpandedVisit(null);
    try {
      const { data } = await api.get(`/doctor/patients/${mrNo}/history`);
      setSelectedPatient(data.patient);
      setPatientHistory(data.visits || []);
      const firstWithRx = (data.visits || []).find(v => v.rx_id);
      if (firstWithRx) setExpandedVisit(firstWithRx.id);
    } catch (err) {
      setSearchError(err.response?.data?.error || err.message);
    } finally {
      setLoadingHistory(false);
    }
  };

  const statusColor = (status) => {
    switch (status) {
      case 'Waiting': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'InConsultation': return 'bg-medical-50 text-medical-700 border-medical-200';
      case 'Completed': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Cancelled': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getPageTitle = () => {
    switch (tab) {
      case 'queue': return {
        title: 'Patient Queue',
        subtitle: `${queue.length} patient${queue.length !== 1 ? 's' : ''} waiting for consultation`
      };
      case 'completed': return {
        title: 'Completed Today',
        subtitle: `${completed.length} patient${completed.length !== 1 ? 's' : ''} seen today`
      };
      case 'history': return {
        title: 'Patient History',
        subtitle: 'Search patients by MR number, name or phone'
      };
      case 'reports': return {
        title: 'Daily Reports',
        subtitle: 'View patient statistics for any date'
      };
      default: return { title: 'Dashboard', subtitle: '' };
    }
  };

  const pageInfo = getPageTitle();

  return (
    <DoctorLayout
      title={pageInfo.title}
      subtitle={pageInfo.subtitle}
      activeTab={tab}
      onTabChange={(k) => {
        if (k === 'templates') {
          navigate('/doctor/templates');
          return;
        }
        setTab(k);
      }}
      queueCount={queue.length}
    >

      {/* ============================================================
          TAB 1: QUEUE
      ============================================================ */}
      {tab === 'queue' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-slate-500">Auto-refreshes every 8 seconds</p>
            <button
              onClick={loadQueue}
              className="inline-flex items-center gap-1.5 text-xs text-medical-600 hover:text-medical-800 font-medium"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="bg-white rounded-xl border border-slate-200 p-16 text-center">
              <div className="inline-block w-8 h-8 border-3 border-medical-200 border-t-medical-600 rounded-full animate-spin"></div>
              <p className="text-slate-500 mt-4 text-sm">Loading queue...</p>
            </div>
          ) : queue.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-16 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-base font-semibold text-slate-700 mb-1">No patients waiting</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                Patients will appear here as receptionists send them to your queue.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {queue.map((v) => (
                <div
                  key={v.id}
                  className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 hover:border-medical-300 hover:shadow-sm transition"
                >
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-gradient-to-br from-medical-500 to-medical-700 rounded-xl flex flex-col items-center justify-center text-white font-bold flex-shrink-0 shadow-sm">
                      <span className="text-[9px] opacity-80 uppercase tracking-wider">Token</span>
                      <span className="text-xl leading-none font-mono">{v.token_no}</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-slate-800">
                        {v.patient_name || 'Unknown'}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        MR: <span className="font-mono">{v.mr_no}</span>
                        {v.age && ` · ${v.age}Y`}
                        {v.gender && `/${v.gender}`}
                        {v.phone && ` · 📞 ${v.phone}`}
                      </p>
                      <span className={`inline-flex items-center gap-1.5 mt-2 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusColor(v.status)}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          v.status === 'Waiting' ? 'bg-amber-500' : 'bg-medical-500'
                        }`}></span>
                        {v.status}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate(`/doctor/prescription/${v.id}`)}
                    className="inline-flex items-center gap-2 bg-medical-600 hover:bg-medical-700 text-white px-5 py-2.5 rounded-lg font-semibold text-sm transition shadow-sm hover:shadow-md group"
                  >
                    <Stethoscope className="w-4 h-4" />
                    Start Consultation
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================
          TAB 2: COMPLETED
      ============================================================ */}
      {tab === 'completed' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-slate-500">Patients you've completed today</p>
            <button
              onClick={loadCompleted}
              className="inline-flex items-center gap-1.5 text-xs text-medical-600 hover:text-medical-800 font-medium"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="bg-white rounded-xl border border-slate-200 p-16 text-center">
              <div className="inline-block w-8 h-8 border-3 border-medical-200 border-t-medical-600 rounded-full animate-spin"></div>
            </div>
          ) : completed.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-16 text-center">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <ListChecks className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-base font-semibold text-slate-700 mb-1">No completed consultations yet</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                Once you complete a consultation, the patient will appear here.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Token</th>
                    <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Patient</th>
                    <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">MR No</th>
                    <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Diagnosis</th>
                    <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Completed</th>
                    <th className="text-right px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {completed.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50/50">
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center justify-center w-9 h-9 bg-emerald-50 text-emerald-700 rounded-full font-bold text-xs border border-emerald-100">
                          {v.token_no}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-slate-800 text-sm">{v.patient_name || 'Unknown'}</p>
                        <p className="text-[11px] text-slate-500">
                          {v.age ? `${v.age}Y` : ''} {v.gender || ''}
                          {v.phone ? ` · ${v.phone}` : ''}
                        </p>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-xs text-slate-600">{v.mr_no}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs text-slate-600 line-clamp-1">
                          {v.diagnosis || '—'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs text-slate-600">
                          {v.completed_at
                            ? new Date(v.completed_at).toLocaleTimeString('en-PK', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : '—'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={() => handleReprint(v.id)}
                            disabled={printingId === v.id}
                            className="text-xs text-slate-600 hover:text-medical-700 font-semibold inline-flex items-center gap-1 disabled:opacity-50 transition"
                            title="Reprint prescription"
                          >
                            {printingId === v.id ? (
                              <>
                                <Loader className="w-3 h-3 animate-spin" />
                                Loading
                              </>
                            ) : (
                              <>
                                <Printer className="w-3.5 h-3.5" />
                                Print
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setTab('history');
                              setTimeout(() => {
                                setSearchQuery(v.mr_no);
                                handleViewPatient(v.mr_no);
                              }, 100);
                            }}
                            className="text-xs text-medical-600 hover:text-medical-800 font-semibold transition"
                          >
                            History
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ============================================================
          TAB 3: PATIENT HISTORY
      ============================================================ */}
      {tab === 'history' && (
        <div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-500/20 focus:border-medical-500 focus:bg-white transition text-sm"
                  placeholder="Search by name, MR number, or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={searching}
                className="bg-medical-600 hover:bg-medical-700 text-white px-5 py-2.5 rounded-lg font-semibold text-sm transition disabled:opacity-50"
              >
                {searching ? 'Searching...' : 'Search'}
              </button>
            </div>
          </div>

          {searchError && (
            <div className="bg-red-50 border-l-[3px] border-red-500 text-red-700 p-3.5 rounded-lg mb-4 flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span className="text-sm">{searchError}</span>
              </div>
              <button onClick={() => setSearchError('')}>
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {selectedPatient ? (
            <div>
              <button
                onClick={() => { setSelectedPatient(null); setPatientHistory([]); setExpandedVisit(null); }}
                className="text-medical-600 hover:text-medical-800 text-xs font-medium mb-3 inline-flex items-center gap-1"
              >
                ← Back to results
              </button>

              <div className="bg-white rounded-xl p-5 mb-4 border border-slate-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-medical-500 to-medical-700 rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                    {selectedPatient.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">
                      {selectedPatient.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      MR: <span className="font-mono font-semibold text-slate-700">{selectedPatient.mr_no}</span>
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm pt-4 border-t border-slate-100">
                  <div>
                    <p className="text-slate-500 text-[10px] uppercase tracking-wider font-semibold mb-0.5">Age</p>
                    <p className="font-semibold text-slate-800 text-sm">{selectedPatient.age || '—'}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-[10px] uppercase tracking-wider font-semibold mb-0.5">Gender</p>
                    <p className="font-semibold text-slate-800 text-sm">{selectedPatient.gender || '—'}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-[10px] uppercase tracking-wider font-semibold mb-0.5">Phone</p>
                    <p className="font-semibold text-slate-800 text-sm">{selectedPatient.phone || '—'}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-[10px] uppercase tracking-wider font-semibold mb-0.5">Father</p>
                    <p className="font-semibold text-slate-800 text-sm">{selectedPatient.father_name || '—'}</p>
                  </div>
                </div>
              </div>

              <h4 className="text-sm font-bold text-slate-800 mb-3">
                Consultation History ({patientHistory.length})
              </h4>

              {loadingHistory ? (
                <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                  <div className="inline-block w-6 h-6 border-2 border-medical-200 border-t-medical-600 rounded-full animate-spin"></div>
                </div>
              ) : patientHistory.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500 text-sm">
                  No previous consultations
                </div>
              ) : (
                <div className="space-y-3">
                  {patientHistory.map((h) => {
                    const isExpanded = expandedVisit === h.id;
                    const hasPrescription = !!h.rx_id;

                    return (
                      <div
                        key={h.id}
                        className={`bg-white rounded-xl border transition-all ${
                          isExpanded ? 'border-medical-300 shadow-sm' : 'border-slate-200'
                        }`}
                      >
                        <button
                          onClick={() => setExpandedVisit(isExpanded ? null : h.id)}
                          className="w-full text-left p-4 hover:bg-slate-50/50 transition"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 flex-wrap">
                              <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded font-mono">
                                Token #{h.token_no}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusColor(h.status)}`}>
                                {h.status}
                              </span>
                              {h.consultant_name && (
                                <span className="text-xs text-slate-500">· {h.consultant_name}</span>
                              )}
                              {hasPrescription && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                  <FileText className="w-3 h-3" />
                                  Prescription
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="text-[11px] text-slate-500">
                                {new Date(h.visit_date).toLocaleDateString('en-PK', {
                                  day: 'numeric', month: 'short', year: 'numeric'
                                })}
                              </span>
                              {hasPrescription && (
                                isExpanded
                                  ? <ChevronUp className="w-4 h-4 text-slate-400" />
                                  : <ChevronDown className="w-4 h-4 text-slate-400" />
                              )}
                            </div>
                          </div>

                          {!isExpanded && hasPrescription && h.diagnosis && (
                            <p className="text-xs text-slate-500 mt-2 line-clamp-1">
                              <span className="font-medium text-slate-600">Dx:</span> {h.diagnosis}
                            </p>
                          )}
                        </button>

                        {isExpanded && hasPrescription && (
                          <div className="border-t border-slate-100 p-4 space-y-4 bg-slate-50/30">

                            {(h.bp || h.pulse || h.temperature || h.weight || h.spo2) && (
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <HeartPulse className="w-3.5 h-3.5 text-medical-600" />
                                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                    Vitals
                                  </p>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                                  {h.bp && (
                                    <div className="bg-white rounded-lg px-3 py-2 border border-slate-200">
                                      <p className="text-[9px] text-slate-500 uppercase font-semibold">BP</p>
                                      <p className="text-sm font-bold text-slate-800 font-mono">{h.bp}</p>
                                    </div>
                                  )}
                                  {h.pulse && (
                                    <div className="bg-white rounded-lg px-3 py-2 border border-slate-200">
                                      <p className="text-[9px] text-slate-500 uppercase font-semibold">Pulse</p>
                                      <p className="text-sm font-bold text-slate-800 font-mono">{h.pulse}</p>
                                    </div>
                                  )}
                                  {h.temperature && (
                                    <div className="bg-white rounded-lg px-3 py-2 border border-slate-200">
                                      <p className="text-[9px] text-slate-500 uppercase font-semibold">Temp</p>
                                      <p className="text-sm font-bold text-slate-800 font-mono">{h.temperature}°F</p>
                                    </div>
                                  )}
                                  {h.weight && (
                                    <div className="bg-white rounded-lg px-3 py-2 border border-slate-200">
                                      <p className="text-[9px] text-slate-500 uppercase font-semibold">Weight</p>
                                      <p className="text-sm font-bold text-slate-800 font-mono">{h.weight} kg</p>
                                    </div>
                                  )}
                                  {h.spo2 && (
                                    <div className="bg-white rounded-lg px-3 py-2 border border-slate-200">
                                      <p className="text-[9px] text-slate-500 uppercase font-semibold">SpO₂</p>
                                      <p className="text-sm font-bold text-slate-800 font-mono">{h.spo2}%</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {h.complaints && (
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <FileText className="w-3.5 h-3.5 text-medical-600" />
                                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                    Chief Complaints
                                  </p>
                                </div>
                                <div className="bg-white rounded-lg px-3 py-2.5 border border-slate-200">
                                  <p className="text-xs text-slate-700 whitespace-pre-wrap">{h.complaints}</p>
                                </div>
                              </div>
                            )}

                            {h.diagnosis && (
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <Stethoscope className="w-3.5 h-3.5 text-medical-600" />
                                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                    Diagnosis
                                  </p>
                                </div>
                                <div className="bg-white rounded-lg px-3 py-2.5 border border-slate-200">
                                  <p className="text-xs text-slate-700 whitespace-pre-wrap">{h.diagnosis}</p>
                                </div>
                              </div>
                            )}

                            {h.medicines && h.medicines.length > 0 && (
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <Pill className="w-3.5 h-3.5 text-medical-600" />
                                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                    Medicines ({h.medicines.length})
                                  </p>
                                </div>
                                <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                                  <table className="w-full">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                      <tr>
                                        <th className="text-left px-3 py-2 text-[9px] font-bold text-slate-500 uppercase tracking-wider w-8">#</th>
                                        <th className="text-left px-3 py-2 text-[9px] font-bold text-slate-500 uppercase tracking-wider">Medicine</th>
                                        <th className="text-center px-3 py-2 text-[9px] font-bold text-slate-500 uppercase tracking-wider">Dosage</th>
                                        <th className="text-center px-3 py-2 text-[9px] font-bold text-slate-500 uppercase tracking-wider">Duration</th>
                                        <th className="text-left px-3 py-2 text-[9px] font-bold text-slate-500 uppercase tracking-wider">Instructions</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                      {h.medicines.map((m, i) => (
                                        <tr key={m.id} className="hover:bg-slate-50/50">
                                          <td className="px-3 py-2 text-xs text-slate-500 font-mono">
                                            {String(i + 1).padStart(2, '0')}
                                          </td>
                                          <td className="px-3 py-2">
                                            <p className="text-xs font-semibold text-slate-800">
                                              {m.medicine_name}
                                            </p>
                                          </td>
                                          <td className="px-3 py-2 text-center">
                                            <span className="text-xs font-mono text-slate-700">
                                              {m.dosage || '—'}
                                            </span>
                                          </td>
                                          <td className="px-3 py-2 text-center">
                                            <span className="text-xs text-slate-600">
                                              {m.duration || '—'}
                                            </span>
                                          </td>
                                          <td className="px-3 py-2">
                                            <span className="text-xs text-slate-600">
                                              {m.instructions || '—'}
                                            </span>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}

                            {h.advice && (
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <FileText className="w-3.5 h-3.5 text-medical-600" />
                                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                    Advice
                                  </p>
                                </div>
                                <div className="bg-white rounded-lg px-3 py-2.5 border border-slate-200">
                                  <p className="text-xs text-slate-700 whitespace-pre-wrap">{h.advice}</p>
                                </div>
                              </div>
                            )}

                            <div className="flex justify-end pt-3 border-t border-slate-200">
                              <button
                                onClick={() => handleReprint(h.id)}
                                disabled={printingId === h.id}
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-medical-600 hover:text-medical-800 bg-medical-50 hover:bg-medical-100 border border-medical-200 px-3 py-2 rounded-md transition disabled:opacity-50"
                              >
                                {printingId === h.id ? (
                                  <>
                                    <Loader className="w-3.5 h-3.5 animate-spin" />
                                    Loading...
                                  </>
                                ) : (
                                  <>
                                    <Printer className="w-3.5 h-3.5" />
                                    Reprint Prescription
                                  </>
                                )}
                              </button>
                            </div>

                            {h.follow_up_date && (
                              <div className="flex items-center gap-3 bg-medical-50 border border-medical-200 rounded-lg px-3 py-2.5">
                                <Calendar className="w-4 h-4 text-medical-600 flex-shrink-0" />
                                <div>
                                  <p className="text-[10px] font-bold text-medical-700 uppercase tracking-wider">
                                    Follow-up Date
                                  </p>
                                  <p className="text-xs font-semibold text-medical-800">
                                    {new Date(h.follow_up_date).toLocaleDateString('en-PK', {
                                      day: 'numeric', month: 'long', year: 'numeric'
                                    })}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {isExpanded && !hasPrescription && (
                          <div className="border-t border-slate-100 p-6 text-center bg-slate-50/30">
                            <FileText className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                            <p className="text-xs text-slate-500">
                              No prescription recorded for this visit
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : searchResults.length > 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-5 py-3 bg-slate-50 border-b border-slate-200">
                <p className="text-xs font-semibold text-slate-600">
                  {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
                </p>
              </div>
              <div className="divide-y divide-slate-100">
                {searchResults.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleViewPatient(p.mr_no)}
                    className="w-full text-left px-5 py-4 hover:bg-medical-50/50 transition group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-medical-100 rounded-full flex items-center justify-center text-medical-700 font-bold text-sm">
                          {p.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 text-sm">{p.name}</p>
                          <p className="text-[11px] text-slate-500">
                            MR: <span className="font-mono">{p.mr_no}</span>
                            {p.age && ` · ${p.age}Y`}
                            {p.gender && `/${p.gender}`}
                            {p.phone && ` · ${p.phone}`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {p.my_visits > 0 && (
                          <div className="text-right hidden md:block">
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                              My Visits
                            </p>
                            <p className="text-xs font-bold text-medical-600">
                              {p.my_visits}
                            </p>
                          </div>
                        )}
                        <span className="text-medical-600 text-xs font-medium opacity-0 group-hover:opacity-100 transition">
                          View →
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : searching ? (
            <div className="bg-white rounded-xl border border-slate-200 p-16 text-center">
              <div className="inline-block w-8 h-8 border-3 border-medical-200 border-t-medical-600 rounded-full animate-spin"></div>
            </div>
          ) : searchQuery && searchResults.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-16 text-center">
              <Search className="w-10 h-10 mx-auto mb-3 text-slate-300" />
              <p className="text-sm text-slate-500">No patients found for "{searchQuery}"</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-16 text-center">
              <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Search className="w-7 h-7 text-slate-400" />
              </div>
              <p className="text-sm font-semibold text-slate-700 mb-1">
                Search Patient History
              </p>
              <p className="text-xs text-slate-500">
                Enter name, MR number, or phone to find patients
              </p>
            </div>
          )}
        </div>
      )}

      {/* ============================================================
          TAB 4: REPORTS
      ============================================================ */}
      {tab === 'reports' && (
        <div>
          <div className="bg-white rounded-xl border border-slate-200 p-5 mb-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-800">Daily Patient Report</h3>
                <p className="text-xs text-slate-500 mt-0.5">Select a date to view the report</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medical-500/20 focus:border-medical-500"
                  value={reportDate}
                  onChange={(e) => {
                    setReportDate(e.target.value);
                    loadReport(e.target.value);
                  }}
                />
                <button
                  onClick={() => loadReport()}
                  className="bg-medical-600 hover:bg-medical-700 text-white p-2 rounded-lg transition"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {reportLoading ? (
              <div className="text-center py-8">
                <Loader className="w-6 h-6 text-medical-600 animate-spin mx-auto" />
              </div>
            ) : reportData ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Total Patients</p>
                  <p className="text-2xl font-bold text-slate-800 font-mono">{reportData.summary.total}</p>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1">Completed</p>
                  <p className="text-2xl font-bold text-emerald-700 font-mono">{reportData.summary.completed}</p>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-1">Waiting</p>
                  <p className="text-2xl font-bold text-amber-700 font-mono">{reportData.summary.waiting}</p>
                </div>
                <div className="bg-medical-50 border border-medical-200 rounded-lg p-3">
                  <p className="text-[10px] font-bold text-medical-600 uppercase tracking-wider mb-1">In Consultation</p>
                  <p className="text-2xl font-bold text-medical-700 font-mono">{reportData.summary.inConsultation}</p>
                </div>
              </div>
            ) : null}
          </div>

          {reportData && reportData.visits.length > 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Token</th>
                    <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Patient</th>
                    <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">MR No</th>
                    <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Diagnosis</th>
                    <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reportData.visits.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50/50">
                      <td className="px-5 py-3">
                        <span className="inline-flex items-center justify-center w-8 h-8 bg-slate-100 text-slate-700 rounded-full font-bold text-xs">
                          {v.token_no}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <p className="font-semibold text-slate-800 text-sm">{v.patient_name}</p>
                        <p className="text-[11px] text-slate-500">{v.age ? `${v.age}Y` : ''} {v.gender}</p>
                      </td>
                      <td className="px-5 py-3">
                        <span className="font-mono text-xs text-slate-600">{v.mr_no}</span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-xs text-slate-600 line-clamp-1">{v.diagnosis || '—'}</span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          v.status === 'Completed' ? 'bg-emerald-50 text-emerald-700' :
                          v.status === 'Waiting' ? 'bg-amber-50 text-amber-700' :
                          'bg-medical-50 text-medical-700'
                        }`}>
                          {v.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-500">
                        {v.completed_at ? new Date(v.completed_at).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : reportData ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
              No patients found for this date.
            </div>
          ) : null}
        </div>
      )}

    </DoctorLayout>
  );
}