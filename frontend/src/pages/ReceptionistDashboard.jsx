import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../store/auth';
import ReceptionistLayout from '../components/ReceptionistLayout';
import {
  Stethoscope, UserPlus, Search, Users, Clock,
  CheckCircle, AlertCircle, X, Calendar, Phone, User
} from 'lucide-react';

export default function ReceptionistDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState('register');
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [registerForm, setRegisterForm] = useState({
    name: '', father_name: '', gender: 'Male',
    age: '', phone: '', address: ''
  });
  const [registeredPatient, setRegisteredPatient] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientHistory, setPatientHistory] = useState([]);

  const loadQueue = async () => {
    try {
      const { data } = await api.get('/staff/queue');
      setQueue(data.queue || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadQueue();
    const interval = setInterval(loadQueue, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    setRegisteredPatient(null);

    try {
      const { data } = await api.post('/staff/patients', registerForm);
      setRegisteredPatient(data.patient);
      setSuccess(`Patient registered! MR No: ${data.patient.mr_no}`);
      setRegisterForm({
        name: '', father_name: '', gender: 'Male',
        age: '', phone: '', address: ''
      });
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendToDoctor = async (mrNo) => {
    try {
      const { data } = await api.post('/staff/visits', { mr_no: mrNo });
      setSuccess(`Patient sent! Token #${data.visit.token_no}`);
      setRegisteredPatient(null);
      setSelectedPatient(null);
      setPatientHistory([]);
      setSearchResults([]);
      setSearchQuery('');
      setTab('queue');
      loadQueue();
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setSearchResults([]);
    setSelectedPatient(null);
    setPatientHistory([]);

    try {
      const { data } = await api.get(`/staff/patients/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchResults(data.patients || []);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setSearching(false);
    }
  };

  const handleViewPatient = async (mrNo) => {
    try {
      const { data } = await api.get(`/staff/patients/${mrNo}/history`);
      setSelectedPatient(data.patient);
      setPatientHistory(data.visits || []);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
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
      case 'register': return { title: 'Register Patient', subtitle: 'Add a new patient to the system' };
      case 'search': return { title: 'Search Patient', subtitle: 'Find existing patients and their records' };
      case 'queue': return { title: "Today's Queue", subtitle: `Patients waiting for ${user?.consultant_name || 'your doctor'}` };
      default: return { title: 'Reception', subtitle: '' };
    }
  };

  const pageInfo = getPageTitle();

  return (
    <ReceptionistLayout
      title={pageInfo.title}
      subtitle={pageInfo.subtitle}
      activeTab={tab}
      onTabChange={(k) => { setTab(k); if (k === 'queue') loadQueue(); }}
    >

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

      {/* ==============================
          TAB 1: REGISTER
      ============================== */}
      {tab === 'register' && (
        <div className="max-w-3xl">
          {registeredPatient ? (
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-2 border-emerald-200 rounded-xl p-10 text-center">
              <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/30">
                <CheckCircle className="w-9 h-9 text-white" strokeWidth={2.5} />
              </div>
              <h3 className="text-xl font-bold text-emerald-800 mb-1">
                Patient Registered Successfully
              </h3>
              <p className="text-emerald-700 text-sm mb-6">
                {registeredPatient.name} has been added to the system
              </p>

              <div className="bg-white rounded-xl p-6 mb-6 inline-block shadow-sm border border-emerald-100">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 font-semibold">
                  MR Number
                </p>
                <p className="text-4xl font-bold text-emerald-600 font-mono">
                  {registeredPatient.mr_no}
                </p>
              </div>

              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => handleSendToDoctor(registeredPatient.mr_no)}
                  className="inline-flex items-center gap-2 bg-medical-600 hover:bg-medical-700 text-white px-6 py-3 rounded-lg font-semibold text-sm transition shadow-sm hover:shadow-md"
                >
                  <Stethoscope className="w-4 h-4" />
                  Send to Doctor
                </button>
                <button
                  onClick={() => setRegisteredPatient(null)}
                  className="border border-slate-300 bg-white text-slate-700 px-6 py-3 rounded-lg hover:bg-slate-50 transition text-sm font-medium"
                >
                  Register Another
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                <div className="w-10 h-10 bg-medical-50 rounded-lg flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-medical-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">New Patient Registration</h3>
                  <p className="text-xs text-slate-500">Enter the patient's details to register</p>
                </div>
              </div>

              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-500/20 focus:border-medical-500 focus:bg-white transition text-sm"
                    placeholder="e.g. Ali Khan"
                    value={registerForm.name}
                    onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                    required
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                      Father Name
                    </label>
                    <input
                      type="text"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-500/20 focus:border-medical-500 focus:bg-white transition text-sm"
                      placeholder="e.g. Muhammad Khan"
                      value={registerForm.father_name}
                      onChange={(e) => setRegisterForm({ ...registerForm, father_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                      Phone
                    </label>
                    <input
                      type="text"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-500/20 focus:border-medical-500 focus:bg-white transition text-sm"
                      placeholder="0300-1234567"
                      value={registerForm.phone}
                      onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                      Gender
                    </label>
                    <select
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-500/20 focus:border-medical-500 focus:bg-white transition text-sm"
                      value={registerForm.gender}
                      onChange={(e) => setRegisterForm({ ...registerForm, gender: e.target.value })}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                      Age
                    </label>
                    <input
                      type="number"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-500/20 focus:border-medical-500 focus:bg-white transition text-sm"
                      placeholder="35"
                      value={registerForm.age}
                      onChange={(e) => setRegisterForm({ ...registerForm, age: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                    Address
                  </label>
                  <input
                    type="text"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-500/20 focus:border-medical-500 focus:bg-white transition text-sm"
                    placeholder="Karachi, Block 5"
                    value={registerForm.address}
                    onChange={(e) => setRegisterForm({ ...registerForm, address: e.target.value })}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-medical-600 hover:bg-medical-700 text-white py-3 rounded-lg font-semibold text-sm transition-all shadow-sm hover:shadow-md disabled:opacity-50 mt-2"
                >
                  {loading ? 'Registering...' : 'Register Patient'}
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* ==============================
          TAB 2: SEARCH
      ============================== */}
      {tab === 'search' && (
        <div>
          <div className="bg-white rounded-xl border border-slate-200 p-5 mb-4">
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

          {selectedPatient ? (
            <div>
              <button
                onClick={() => { setSelectedPatient(null); setPatientHistory([]); }}
                className="text-medical-600 hover:text-medical-800 text-xs font-medium mb-3 inline-flex items-center gap-1"
              >
                ← Back to results
              </button>

              <div className="bg-white rounded-xl p-5 mb-4 border border-slate-200">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
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

                  <button
                    onClick={() => handleSendToDoctor(selectedPatient.mr_no)}
                    className="inline-flex items-center gap-2 bg-medical-600 hover:bg-medical-700 text-white px-4 py-2 rounded-lg font-semibold text-xs transition shadow-sm"
                  >
                    <Stethoscope className="w-3.5 h-3.5" />
                    Send to Doctor
                  </button>
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
                Visit History ({patientHistory.length})
              </h4>

              {patientHistory.length === 0 ? (
                <div className="bg-white rounded-xl p-8 text-center text-slate-500 text-sm border border-slate-200">
                  No previous visits
                </div>
              ) : (
                <div className="space-y-2">
                  {patientHistory.map((v) => (
                    <div key={v.id} className="bg-white rounded-lg p-4 border border-slate-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded font-mono">
                            Token #{v.token_no}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusColor(v.status)}`}>
                            {v.status}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500">
                          {new Date(v.visit_date).toLocaleDateString('en-PK', {
                            day: 'numeric', month: 'short', year: 'numeric'
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">
                        <span className="font-medium">Doctor:</span> {v.consultant_name || '—'}
                      </p>
                      {v.diagnosis && (
                        <p className="text-xs text-slate-600 mt-1">
                          <span className="font-medium">Diagnosis:</span> {v.diagnosis}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : searchResults.length > 0 ? (
            <div className="space-y-2">
              {searchResults.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleViewPatient(p.mr_no)}
                  className="w-full text-left bg-white border border-slate-200 hover:border-medical-300 hover:bg-medical-50/50 rounded-lg p-4 transition group"
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
                          {p.phone && ` · ${p.phone}`}
                        </p>
                      </div>
                    </div>
                    <span className="text-medical-600 text-xs font-medium opacity-0 group-hover:opacity-100 transition">
                      View →
                    </span>
                  </div>
                </button>
              ))}
            </div>
          ) : searching ? (
            <div className="text-center py-16">
              <div className="inline-block w-8 h-8 border-3 border-medical-200 border-t-medical-600 rounded-full animate-spin"></div>
            </div>
          ) : searchQuery ? (
            <div className="bg-white rounded-xl border border-slate-200 text-center py-16 text-slate-500">
              <Search className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="text-sm">No patients found for "{searchQuery}"</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 text-center py-16 text-slate-400">
              <Search className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="text-sm">Enter name, MR number, or phone to search</p>
            </div>
          )}
        </div>
      )}

      {/* ==============================
          TAB 3: QUEUE
      ============================== */}
      {tab === 'queue' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-slate-500">
              Today's patient queue for <b className="text-slate-700">{user?.consultant_name}</b>
            </p>
            <button
              onClick={loadQueue}
              className="text-xs text-medical-600 hover:text-medical-800 font-medium"
            >
              🔄 Refresh
            </button>
          </div>

          {queue.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 text-center py-16">
              <Clock className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="text-sm text-slate-500">No patients in queue yet</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Token</th>
                    <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Patient</th>
                    <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">MR No</th>
                    <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Time</th>
                    <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {queue.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50/50">
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center justify-center w-9 h-9 bg-medical-50 text-medical-700 rounded-full font-bold text-xs border border-medical-100">
                          {v.token_no}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-slate-800 text-sm">{v.patient_name || 'Unknown'}</p>
                        <p className="text-[11px] text-slate-500">
                          {v.age ? `${v.age}Y` : ''} {v.gender || ''} {v.phone ? `· ${v.phone}` : ''}
                        </p>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-xs text-slate-600">{v.mr_no}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs text-slate-600">
                          {new Date(v.visit_date).toLocaleTimeString('en-PK', {
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusColor(v.status)}`}>
                          {v.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

    </ReceptionistLayout>
  );
}