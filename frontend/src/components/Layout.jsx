import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../store/auth';
import {
  LayoutDashboard,
  Stethoscope,
  Users,
  Settings,
  LogOut,
  Activity,
  Bell,
  Search,
  ChevronDown,
  HelpCircle,
  Calendar,
  Lock,
  Pill
} from 'lucide-react';

export default function Layout({ children, title, subtitle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="min-h-screen flex bg-slate-50">

      {/* ============================================================
          SIDEBAR
      ============================================================ */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col fixed h-screen">

        {/* Logo */}
        <div className="px-5 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-medical-500 to-medical-700 rounded-lg flex items-center justify-center shadow-sm">
              <Activity className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <div className="min-w-0">
              <h1 className="text-slate-800 font-bold text-sm leading-tight truncate">
                Future Technologies
              </h1>
              <p className="text-slate-500 text-[11px] truncate">
                Hospital Management
              </p>
            </div>
          </div>
        </div>

        {/* Menu */}
        <nav className="flex-1 px-3 py-5 overflow-y-auto">
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider px-3 mb-2">
            Main Menu
          </p>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-all duration-150 border-l-[3px] ${
                  isActive
                    ? 'bg-medical-50 text-medical-700 font-semibold border-medical-600 pl-[9px]'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-transparent pl-[9px]'
                }`}
              >
                <Icon className="w-[18px] h-[18px]" strokeWidth={2} />
                <span className="text-sm">{item.label}</span>
              </Link>
            );
          })}

          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider px-3 mt-6 mb-2">
            Support
          </p>
          <Link
            to="#"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition border-l-[3px] border-transparent pl-[9px]"
          >
            <HelpCircle className="w-[18px] h-[18px]" strokeWidth={2} />
            <span className="text-sm">Help & Support</span>
          </Link>
        </nav>

        {/* User Card */}
        <div className="p-3 border-t border-slate-100">
          <div className="bg-slate-50 rounded-lg p-3">
            <div className="flex items-center gap-3 mb-2.5">
              <div className="w-9 h-9 bg-gradient-to-br from-medical-500 to-medical-700 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {user?.name?.charAt(0)?.toUpperCase() || 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-slate-800 font-semibold text-xs truncate">
                  {user?.name}
                </p>
                <p className="text-slate-500 text-[11px] capitalize truncate">
                  {user?.role}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 text-slate-600 hover:text-red-600 py-2 rounded-md text-xs font-medium transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* ============================================================
          MAIN AREA
      ============================================================ */}
      <div className="flex-1 ml-64 flex flex-col">

        {/* Top Bar */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
          <div className="px-8 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-xs text-slate-400 font-medium">
                Hospital
              </div>
              <div className="w-px h-4 bg-slate-200"></div>
              <div className="text-xs text-slate-600 font-medium">
                {title || 'Dashboard'}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                <Calendar className="w-3.5 h-3.5" />
                <span className="font-medium">{today}</span>
              </div>

              <div className="relative hidden lg:block">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search patients, doctors..."
                  className="pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs w-64 focus:outline-none focus:ring-2 focus:ring-medical-500/20 focus:border-medical-500 focus:bg-white transition text-slate-700 placeholder-slate-400"
                />
              </div>

              <button className="relative w-9 h-9 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center transition">
                <Bell className="w-4 h-4 text-slate-600" />
                <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full ring-2 ring-white"></span>
              </button>

              <button className="flex items-center gap-2 pl-2 pr-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition">
                <div className="w-6 h-6 bg-gradient-to-br from-medical-500 to-medical-700 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {user?.name?.charAt(0)?.toUpperCase() || 'A'}
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </button>
            </div>
          </div>
        </header>

        {/* Page Header */}
        {(title || subtitle) && (
          <div className="bg-white border-b border-slate-100 px-8 py-5">
            <h1 className="text-xl font-bold text-slate-800">{title}</h1>
            {subtitle && (
              <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
            )}
          </div>
        )}

        {/* Content */}
        <main className="flex-1 p-8">
          {children}
        </main>

        {/* Footer */}
        <footer className="px-8 py-4 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>© 2026 Future Technologies. All rights reserved.</span>
            <span>v1.0.0</span>
          </div>
        </footer>
      </div>
    </div>
  );
}