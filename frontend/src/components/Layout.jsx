import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../store/auth';
import {
  LayoutDashboard, Stethoscope, Users, Settings, LogOut,
  Activity, Bell, Search, ChevronDown, HelpCircle, Calendar,
  Lock, Pill, Menu, X
} from 'lucide-react';

export default function Layout({ children, title, subtitle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/doctors', label: 'Doctors', icon: Stethoscope },
    { path: '/receptionists', label: 'Receptionists', icon: Users },
    { path: '/medicines', label: 'Medicines', icon: Pill },
    { path: '/change-password', label: 'Change Password', icon: Lock },
    { path: '/settings', label: 'Settings', icon: Settings }
  ];

  const today = new Date().toLocaleDateString('en-PK', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  return (
    <div className="min-h-screen flex bg-slate-50 overflow-hidden">
      
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
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
              <p className="text-slate-500 text-[11px] truncate">Hospital Management</p>
            </div>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-5 overflow-y-auto">
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider px-3 mb-2">Main Menu</p>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-all duration-150 border-l-[3px] ${
                  isActive ? 'bg-medical-50 text-medical-700 font-semibold border-medical-600 pl-[9px]' : 'text-slate-600 hover:bg-slate-50 border-transparent pl-[9px]'
                }`}
              >
                <Icon className="w-[18px] h-[18px]" strokeWidth={2} />
                <span className="text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-100">
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 bg-slate-50 hover:bg-red-50 text-slate-600 hover:text-red-600 py-2 rounded-md text-xs font-medium transition-all">
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Area */}
      <div className="flex-1 lg:ml-64 flex flex-col w-full h-screen overflow-hidden">
        <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
          <div className="px-4 lg:px-8 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-1.5 text-slate-600 bg-slate-50 rounded-md">
                <Menu className="w-5 h-5" />
              </button>
              <div className="text-xs text-slate-400 font-medium hidden md:block">Hospital</div>
              <div className="hidden md:block w-px h-4 bg-slate-200"></div>
              <div className="text-sm font-bold text-slate-800">{title || 'Dashboard'}</div>
            </div>

            <div className="flex items-center gap-3">
              <button className="relative w-8 h-8 lg:w-9 lg:h-9 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center">
                <Bell className="w-4 h-4 text-slate-600" />
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full ring-2 ring-white"></span>
              </button>
              <div className="flex items-center gap-2 pl-2 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="w-6 h-6 bg-medical-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {user?.name?.charAt(0)?.toUpperCase() || 'A'}
                </div>
                <span className="text-xs font-medium text-slate-700 hidden sm:inline">{user?.name?.split(' ')[0]}</span>
              </div>
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