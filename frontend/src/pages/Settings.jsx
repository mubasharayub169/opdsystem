import { useAuth } from '../store/auth';
import Layout from '../components/Layout';
import {
  User, Shield, Bell, Database, Mail, Phone,
  MapPin, Activity, Clock, Server, Lock,
  CheckCircle, Globe, FileText, Settings as SettingsIcon
} from 'lucide-react';

export default function Settings() {
  const { user } = useAuth();

  const systemInfo = [
    { label: 'System Name', value: 'Future Technologies HMS', icon: Activity },
    { label: 'Version', value: 'v1.0.0', icon: FileText },
    { label: 'Environment', value: 'Production', icon: Server },
    { label: 'Timezone', value: 'Asia/Karachi (PKT)', icon: Globe }
  ];

  const services = [
    { name: 'Database (MySQL)', status: 'Online', icon: Database },
    { name: 'API Server', status: 'Online', icon: Server },
    { name: 'Real-time (Socket.IO)', status: 'Active', icon: Activity },
    { name: 'Authentication', status: 'Online', icon: Lock }
  ];

  return (
    <Layout title="Settings" subtitle="System configuration and information">

      <div className="max-w-4xl mx-auto space-y-6">

        {/* ============================================================
            Logged In User
        ============================================================ */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 bg-medical-50 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-medical-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Your Account</h3>
              <p className="text-xs text-slate-500">Currently logged-in user information</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Name
              </p>
              <p className="text-sm font-semibold text-slate-800">{user?.name || '—'}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Role
              </p>
              <p className="text-sm font-semibold text-slate-800 capitalize">
                {user?.role || '—'}
              </p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Username
              </p>
              <p className="text-sm font-semibold text-slate-800 font-mono">
                {user?.username || '—'}
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between p-3 bg-medical-50 border border-medical-200 rounded-lg">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-medical-600" />
              <div>
                <p className="text-xs font-semibold text-medical-800">Password Security</p>
                <p className="text-[11px] text-medical-700">
                  Change your password from the Change Password page
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================
            Hospital Info
        ============================================================ */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 bg-violet-50 rounded-lg flex items-center justify-center">
              <MapPin className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Organization</h3>
              <p className="text-xs text-slate-500">Hospital / facility details</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between py-2.5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-100 rounded-md flex items-center justify-center">
                  <Activity className="w-4 h-4 text-slate-600" />
                </div>
                <span className="text-sm text-slate-600">Hospital Name</span>
              </div>
              <span className="text-sm font-semibold text-slate-800">
                Future Technologies Hospital
              </span>
            </div>

            <div className="flex items-center justify-between py-2.5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-100 rounded-md flex items-center justify-center">
                  <Mail className="w-4 h-4 text-slate-600" />
                </div>
                <span className="text-sm text-slate-600">Email</span>
              </div>
              <span className="text-sm font-semibold text-slate-800">
                info@futuretech.pk
              </span>
            </div>

            <div className="flex items-center justify-between py-2.5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-100 rounded-md flex items-center justify-center">
                  <Phone className="w-4 h-4 text-slate-600" />
                </div>
                <span className="text-sm text-slate-600">Phone</span>
              </div>
              <span className="text-sm font-semibold text-slate-800">
                +92 XXX-XXXXXXX
              </span>
            </div>

            <div className="flex items-center justify-between py-2.5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-100 rounded-md flex items-center justify-center">
                  <Clock className="w-4 h-4 text-slate-600" />
                </div>
                <span className="text-sm text-slate-600">Working Hours</span>
              </div>
              <span className="text-sm font-semibold text-slate-800">
                09:00 AM - 05:00 PM
              </span>
            </div>
          </div>
        </div>

        {/* ============================================================
            System Info
        ============================================================ */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
              <SettingsIcon className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">System Information</h3>
              <p className="text-xs text-slate-500">Application details</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {systemInfo.map((info) => {
              const Icon = info.icon;
              return (
                <div
                  key={info.label}
                  className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100"
                >
                  <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center border border-slate-200">
                    <Icon className="w-4 h-4 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      {info.label}
                    </p>
                    <p className="text-sm font-semibold text-slate-800">
                      {info.value}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ============================================================
            Services Status
        ============================================================ */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Services Status</h3>
              <p className="text-xs text-slate-500">All systems operational</p>
            </div>
          </div>

          <div className="space-y-2">
            {services.map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.name}
                  className="flex items-center justify-between p-3 border border-slate-100 rounded-lg hover:bg-slate-50/50 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-50 rounded-md flex items-center justify-center">
                      <Icon className="w-4 h-4 text-emerald-600" />
                    </div>
                    <span className="text-sm font-medium text-slate-700">
                      {s.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span className="text-xs font-semibold text-emerald-700">
                      {s.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ============================================================
            About
        ============================================================ */}
        <div className="bg-gradient-to-r from-medical-700 to-medical-800 rounded-xl p-6 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
          <div className="relative z-10">
            <div className="w-12 h-12 bg-white/10 backdrop-blur border border-white/20 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <p className="text-white font-bold text-sm mb-1">
              Future Technologies
            </p>
            <p className="text-medical-100 text-xs mb-3">
              Hospital Management System v1.0.0
            </p>
            <p className="text-medical-200 text-[11px]">
              © 2026 Future Technologies. All rights reserved.
            </p>
          </div>
        </div>

      </div>
    </Layout>
  );
}