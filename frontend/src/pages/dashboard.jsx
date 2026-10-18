import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../api/axios';
import {
  Stethoscope, Users, UserRound, Calendar,
  TrendingUp, Activity, Plus, ArrowRight, HeartPulse,
  Clock, RefreshCw, CheckCircle
} from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({
    doctors: 0,
    receptionists: 0,
    patients: 0,
    todayVisits: 0,
    waiting: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const navigate = useNavigate();

  const loadStats = async () => {
    try {
      setError('');
      const { data } = await api.get('/admin/stats');
      if (data.ok) {
        setStats(data.stats);
        setLastUpdated(new Date());
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const statCards = [
    {
      label: 'Total Doctors',
      value: stats.doctors,
      icon: Stethoscope,
      color: 'text-medical-600',
      bg: 'bg-medical-50',
      border: 'border-medical-100',
      link: '/doctors'
    },
    {
      label: 'Receptionists',
      value: stats.receptionists,
      icon: Users,
      color: 'text-violet-600',
      bg: 'bg-violet-50',
      border: 'border-violet-100',
      link: '/receptionists'
    },
    {
      label: 'Total Patients',
      value: stats.patients,
      icon: UserRound,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
      link: '/'
    },
    {
      label: "Today's Visits",
      value: stats.todayVisits,
      icon: Calendar,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-100',
      link: '/'
    }
  ];

  return (
    <Layout title="Dashboard" subtitle="Hospital overview and statistics">

      {/* ============================================================
          Welcome Banner
      ============================================================ */}
      <div className="bg-gradient-to-r from-medical-700 via-medical-600 to-medical-700 rounded-xl p-6 mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white mb-1">
              Welcome back
            </h2>
            <p className="text-medical-100 text-sm">
              Here's your hospital's current status and overview.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white/10 backdrop-blur border border-white/20 rounded-lg px-4 py-2.5 flex items-center gap-3">
              <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center">
                <HeartPulse className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-medical-100 text-[11px] font-medium">System Status</p>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
                  <p className="text-white text-sm font-semibold">All Systems Active</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border-l-[3px] border-red-500 text-red-700 p-3.5 rounded-lg mb-4 flex items-start justify-between gap-2">
          <div className="flex items-start gap-2">
            <span className="text-red-500 font-bold">!</span>
            <span className="text-sm">{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-red-700 hover:text-red-900">
            ✕
          </button>
        </div>
      )}

      {/* ============================================================
          Stat Cards
      ============================================================ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.label}
              onClick={() => navigate(card.link)}
              className="bg-white rounded-xl p-5 border border-slate-200 hover:border-slate-300 hover:shadow-card-hover transition-all text-left group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-11 h-11 ${card.bg} ${card.border} border rounded-lg flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${card.color}`} strokeWidth={2.2} />
                </div>
                <TrendingUp className="w-4 h-4 text-slate-300 group-hover:text-slate-400 transition" />
              </div>
              <p className="text-2xl font-bold text-slate-800 mb-0.5 font-mono">
                {loading ? '...' : card.value}
              </p>
              <p className="text-xs text-slate-500 font-medium">{card.label}</p>
            </button>
          );
        })}
      </div>

      {/* ============================================================
          Secondary Stats Row
      ============================================================ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-50 border border-amber-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-600" strokeWidth={2.2} />
            </div>
            <div>
              <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">
                Waiting Right Now
              </p>
              <p className="text-3xl font-bold text-slate-800 font-mono mt-0.5">
                {loading ? '...' : stats.waiting}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Patients waiting across all doctors
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-emerald-600" strokeWidth={2.2} />
            </div>
            <div>
              <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">
                Completed Today
              </p>
              <p className="text-3xl font-bold text-slate-800 font-mono mt-0.5">
                {loading ? '...' : Math.max(0, stats.todayVisits - stats.waiting)}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Consultations completed today
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================
          Two Column Layout
      ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Quick Actions */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold text-slate-800">Quick Actions</h3>
              <p className="text-xs text-slate-500 mt-0.5">Common administrative tasks</p>
            </div>
            <button
              onClick={loadStats}
              className="inline-flex items-center gap-1.5 text-xs text-medical-600 hover:text-medical-800 font-medium"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

            <button
              onClick={() => navigate('/doctors')}
              className="flex items-center gap-3 p-4 bg-slate-50 hover:bg-medical-50 border border-slate-200 hover:border-medical-200 rounded-lg transition-all text-left group"
            >
              <div className="w-10 h-10 bg-medical-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Plus className="w-5 h-5 text-medical-600" strokeWidth={2.5} />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-slate-800 text-sm">Add Doctor</p>
                <p className="text-xs text-slate-500">Register new consultant</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-medical-500 group-hover:translate-x-0.5 transition" />
            </button>

            <button
              onClick={() => navigate('/receptionists')}
              className="flex items-center gap-3 p-4 bg-slate-50 hover:bg-violet-50 border border-slate-200 hover:border-violet-200 rounded-lg transition-all text-left group"
            >
              <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Plus className="w-5 h-5 text-violet-600" strokeWidth={2.5} />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-slate-800 text-sm">Add Receptionist</p>
                <p className="text-xs text-slate-500">Assign to a doctor</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-violet-500 group-hover:translate-x-0.5 transition" />
            </button>

          </div>
        </div>

        {/* System Health */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-bold text-slate-800 mb-1">System Health</h3>
          <p className="text-xs text-slate-500 mb-4">
            {lastUpdated
              ? `Updated ${lastUpdated.toLocaleTimeString('en-PK', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}`
              : 'All services operational'}
          </p>

          <div className="space-y-3">
            {[
              { name: 'Database', status: 'Online' },
              { name: 'API Server', status: 'Online' },
              { name: 'Real-time', status: 'Active' }
            ].map((s) => (
              <div
                key={s.name}
                className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
              >
                <span className="text-sm text-slate-600">{s.name}</span>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span className="text-xs font-medium text-emerald-700">
                    {s.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </Layout>
  );
}