import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ClipboardList, BookOpen, CalendarDays, LayoutDashboard, Users, Settings, Bot, LogOut, ChevronLeft, ChevronRight, Menu, X, BarChart3 } from 'lucide-react';

const internLinks = [
  { to: '/absen', label: 'Absen', Icon: ClipboardList },
  { to: '/logbook', label: 'Logbook', Icon: BookOpen },
  { to: '/planner', label: 'Planner', Icon: CalendarDays },
];

const mentorLinks = [
  { to: '/mentor/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { to: '/mentor/attendance', label: 'Absensi', Icon: ClipboardList },
  { to: '/mentor/intern-progress', label: 'Progress Intern', Icon: BarChart3 },
  { to: '/mentor/ai-chat', label: 'AI Chat', Icon: Bot },
];

const adminLinks = [
  { to: '/admin/users', label: 'Users', Icon: Users },
  { to: '/admin/settings', label: 'Settings', Icon: Settings },
];

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getLinks = () => {
    if (user?.role === 'INTERN') return internLinks;
    if (user?.role === 'MENTOR') return [...mentorLinks];
    if (user?.role === 'SUPERUSER') return [...mentorLinks, ...adminLinks];
    return [];
  };

  const sidebarContent = (
    <div className="flex flex-col h-full" style={{ background: 'var(--color-sidebar)' }}>
      {/* Header */}
      <div className={`flex items-center border-b border-white/10 ${collapsed ? 'justify-center p-4' : 'justify-between px-5 py-4'}`}>
        {!collapsed && (
          <h1 className="text-lg font-bold text-white tracking-tight">
            Get<span className="text-purple-400">Absen</span>
          </h1>
        )}
        <button
          onClick={onToggle}
          className="hidden lg:flex w-8 h-8 items-center justify-center rounded-lg hover:bg-white/10 transition-colors text-white/60 hover:text-white"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
        <button
          onClick={onMobileClose}
          className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors text-white/60 hover:text-white"
        >
          <X size={16} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {!collapsed && (
          <p className="text-[10px] font-semibold uppercase tracking-widest text-purple-300/60 px-3 py-2">Menu</p>
        )}
        {getLinks().map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            title={label}
            onClick={onMobileClose}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-200
              ${collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5'}
              ${isActive ? 'bg-purple-500/20 text-white shadow-sm' : 'text-purple-300/80 hover:text-white hover:bg-white/8'}`
            }
          >
            <Icon size={18} className="flex-shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/10 p-2">
        {!collapsed ? (
          <>
            <div className="flex items-center gap-3 px-3 py-2 mb-1">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {user?.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                <p className="text-[11px] text-purple-300/60 capitalize">{user?.role?.toLowerCase()}</p>
              </div>
            </div>
            <button onClick={handleLogout} className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm font-medium text-red-300/80 hover:text-red-300 hover:bg-white/8 transition-all">
              <LogOut size={16} /> <span>Logout</span>
            </button>
          </>
        ) : (
          <button onClick={handleLogout} title="Logout" className="flex items-center justify-center w-full py-2.5 rounded-lg text-red-300/80 hover:text-red-300 hover:bg-white/8 transition-all">
            <LogOut size={16} />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden animate-fade-in" onClick={onMobileClose} />
      )}

      {/* Mobile sidebar */}
      <aside className={`fixed left-0 top-0 h-screen w-64 z-50 lg:hidden transform transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className={`hidden lg:block fixed left-0 top-0 h-screen z-40 transition-all duration-300 ${collapsed ? 'w-[72px]' : 'w-64'}`}>
        {sidebarContent}
      </aside>
    </>
  );
}

export function MobileHeader({ onMenuOpen }) {
  return (
    <div className="lg:hidden fixed top-0 left-0 right-0 z-30 flex items-center gap-3 px-4 py-3 bg-white/90 backdrop-blur-md border-b border-gray-200/60">
      <button onClick={onMenuOpen} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-600">
        <Menu size={20} />
      </button>
      <h1 className="text-base font-bold text-gray-900">
        Get<span className="text-purple-600">Absen</span>
      </h1>
    </div>
  );
}
