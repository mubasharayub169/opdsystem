import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/auth';
import { Activity, LogOut, Stethoscope, Building2, Calendar, Users, HelpCircle, FileText, ListChecks, BookOpen, BarChart3, Menu, X } from 'lucide-react';

export default function DoctorLayout({ children, title, subtitle, activeTab, onTabChange, queueCount = 0 }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/doctor/login');
  };

  const menuItems = [
    { key: 'queue', label: 'Patient Queue', icon: Users, badge: queueCount },
    { key: 'templates', label: 'Templates', icon: BookOpen },
    { key: 'completed', label: 'Completed Today', icon: ListChecks },
    { key: 'history', label: 'Patient History', icon: FileText },
    { key: 'reports', label: 'Daily Reports', icon: BarChart3 }
  ];

  const today = new Date().toLocaleDateString('en-PK', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  const handleTabClick = (key) => {
    onTabChange(key);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex bg-slate-50 overflow-hidden">
      
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden" onClick={() => setIsMobileMenuOpen(false)}></div>
      )}

      <aside className={`w-64 bg-white border-r border-slate-200 flex flex-col fixed h-screen z-50 transition-transform duration-300 ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="px-5 py-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-medical-500 to-medical-700 rounded-lg flex items-center justify-center shadow-sm">
              <Activity className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <div className="min-w-0">
              <h1 className="text-slate-800 font-bold text-sm leading-tight truncate">Future Technologies</h1>
              <p className="text-slate-500 text-[11px] truncate">Doctor Portal</p>
            </div>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-3 pt-4">
          <div className="bg-gradient-to-br from-medical-700 to-medical-800 rounded-lg p-3.5">
            <div className="flex items-center gap-2 mb-2">
              <Stethoscope className="w-3.5 h-3.5 text-white" />
              <span className="text-[10px] font-bold text-medical-100 uppercase tracking-wider">Doctor</span>
            </div>
            <p className="text-white font-bold text-xs leading-tight truncate">{user?.name || 'Doctor'}</p>
            {user?.room_no && (
              <div className="flex items-center gap-1 mt-2 pt-2 border-t border-white/10">
                <Building2 className="w-3 h-3 text-medical-200" />
                <span className="text-medical-100 text-[10px] font-medium">Room {user.room_no}</span>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 px-3 py-5 overflow-y-auto">
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider px-3 mb-2">Consultation</p>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => handleTabClick(item.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-all border-l-[3px] ${
                  isActive ? 'bg-medical-50 text-medical-700 font-semibold border-medical-600 pl-[9px]' : 'text-slate-600 hover:bg-slate-50 border-transparent pl-[9px]'
                }`}
              >
                <Icon className="w-[18px] h-[18px]" strokeWidth={2} />
                <span className="text-sm flex-1 text-left">{item.label}</span>
                {item.badge > 0 && (
                  <span className="bg-medical-600 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center">{item.badge}</span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-100">
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 bg-slate-50 hover:bg-red-50 text-slate-600 hover:text-red-600 py-2 rounded-md text-xs font-medium transition-all">
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </aside>

      <div className="flex-1 lg:ml-64 flex flex-col w-full h-screen overflow-hidden">
        <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
          <div className="px-4 lg:px-8 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-1.5 text-slate-600 bg-slate-50 rounded-md">
                <Menu className="w-5 h-5" />
              </button>
              <div className="text-sm font-bold text-slate-800">{title || 'Dashboard'}</div>
            </div>
            <div className="flex items-center gap-2 pl-2 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="w-6 h-6 bg-medical-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                {user?.name?.charAt(0)?.toUpperCase() || 'D'}
              </div>
              <span className="text-xs font-medium text-slate-700 hidden sm:inline">{user?.name?.replace('Dr. ', '')?.split(' ')[0]}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}