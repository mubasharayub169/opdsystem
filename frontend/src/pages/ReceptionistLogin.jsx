import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../store/auth';
import { Activity, Lock, User, ArrowRight, ShieldCheck, ArrowLeft, Users, Calendar, ClipboardList } from 'lucide-react';

export default function ReceptionistLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      const { data } = await api.post('/auth/receptionist/login', {
        username,
        password
      });

      if (!data.token || !data.user) {
        throw new Error('Invalid response from server');
      }

      if (data.user.role !== 'receptionist') {
        throw new Error('This is not a receptionist account');
      }

      login(data.token, data.user);
      setTimeout(() => navigate('/receptionist'), 100);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50">

      {/* LEFT — Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-medical-800 via-medical-700 to-medical-900 relative overflow-hidden">

        {/* Decorative pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="grid2" width="8" height="8" patternUnits="userSpaceOnUse">
                <path d="M 8 0 L 0 0 0 8" fill="none" stroke="white" strokeWidth="0.3"/>
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#grid2)"/>
          </svg>
        </div>

        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-medical-400/10 rounded-full blur-3xl"></div>

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">

          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center shadow-lg">
              <Activity className="w-6 h-6 text-medical-700" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg leading-tight">
                Future Technologies
              </h1>
              <p className="text-medical-200 text-xs">
                Hospital Management System
              </p>
            </div>
          </div>

          {/* Message */}
          <div>
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 rounded-full px-3.5 py-1.5 mb-6">
              <Users className="w-3.5 h-3.5 text-medical-200" />
              <span className="text-white text-xs font-semibold tracking-wide">
                Receptionist Portal
              </span>
            </div>

            <h2 className="text-white text-4xl font-bold leading-tight mb-4">
              Patient
              <br />
              <span className="text-medical-200">Reception Desk</span>
            </h2>
            <p className="text-medical-100 text-base mb-8 max-w-md leading-relaxed">
              Register patients, manage queues, and streamline
              your doctor's reception workflow.
            </p>

            <div className="space-y-3">
              {[
                { icon: ClipboardList, text: 'Instant patient registration' },
                { icon: Calendar, text: 'Real-time queue management' },
                { icon: Users, text: 'Patient records & history access' }
              ].map((f, i) => {
                const Icon = f.icon;
                return (
                  <div key={i} className="flex items-center gap-3 text-medical-100">
                    <div className="w-6 h-6 bg-white/15 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-sm">{f.text}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <p className="text-medical-300 text-xs">
              © 2026 Future Technologies
            </p>
            <div className="flex items-center gap-2 text-medical-200 text-xs">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
              <span>System Online</span>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT — Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">

          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm mb-8 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Admin Login
          </Link>

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-gradient-to-br from-medical-500 to-medical-700 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-slate-800 font-bold text-base">Future Technologies</h1>
              <p className="text-slate-500 text-xs">Hospital Management</p>
            </div>
          </div>

          {/* Header */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 bg-medical-50 border border-medical-100 rounded-full px-3 py-1 mb-4">
              <Users className="w-3.5 h-3.5 text-medical-600" />
              <span className="text-medical-700 text-[11px] font-semibold uppercase tracking-wider">
                Receptionist
              </span>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-1">
              Sign in to your account
            </h2>
            <p className="text-sm text-slate-500">
              Access the patient registration desk
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border-l-[3px] border-red-500 text-red-700 p-3.5 rounded-lg mb-5 text-sm flex items-start gap-2">
              <span className="text-red-500 font-bold">!</span>
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wide">
                Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-500/20 focus:border-medical-500 transition text-sm text-slate-800 placeholder-slate-400"
                  placeholder="Enter username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wide">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-500/20 focus:border-medical-500 transition text-sm text-slate-800 placeholder-slate-400"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-medical-600 hover:bg-medical-700 text-white py-3 rounded-lg font-semibold text-sm transition-all shadow-sm hover:shadow-md disabled:opacity-50 flex items-center justify-center gap-2 group mt-2"
            >
              {loading ? (
                'Signing in...'
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-[11px] text-slate-400 mt-8">
            Powered by <span className="font-semibold text-slate-500">Future Technologies</span>
          </p>
        </div>
      </div>
    </div>
  );
}