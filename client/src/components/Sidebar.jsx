import { NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ClipboardList, BookOpen, CalendarDays, LayoutDashboard, Users, Settings, Bot, LogOut, ChevronLeft, ChevronRight, Menu, X, BarChart3, Pencil, Camera } from 'lucide-react';
import api from '../api/client';
import Modal from './Modal';

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
  const { user, logout, checkAuth } = useAuth();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [form, setForm] = useState({ name: '', department: '' });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const openProfile = () => {
    setForm({ name: user?.name || '', department: user?.department || '' });
    setAvatarFile(null);
    setAvatarPreview(null);
    setMessage('');
    setProfileOpen(true);
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setMessage('');
    try {
      const fd = new FormData();
      if (form.name) fd.append('name', form.name);
      fd.append('department', form.department);
      if (avatarFile) fd.append('avatar', avatarFile);
      await api.put('/auth/profile', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      await checkAuth();
      setMessage('saved');
      setTimeout(() => { setProfileOpen(false); setMessage(''); }, 1200);
    } catch {
      setMessage('error');
    } finally {
      setSaving(false);
    }
  };

  const getLinks = () => {
    if (user?.role === 'INTERN') return internLinks;
    if (user?.role === 'MENTOR') return [...mentorLinks];
    if (user?.role === 'SUPERUSER') return [...mentorLinks, ...adminLinks];
    return [];
  };

  const UserAvatar = ({ size = 32, className = '' }) => (
    user?.avatarUrl
      ? <img src={user.avatarUrl} alt={user.name} className={`rounded-full object-cover flex-shrink-0 ${className}`} style={{ width: size, height: size }} />
      : <div className={`rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold flex-shrink-0 ${className}`} style={{ width: size, height: size, fontSize: size * 0.38 }}>
          {user?.name?.charAt(0)?.toUpperCase() || '?'}
        </div>
  );

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

      {/* Footer — Profile area */}
      <div className="border-t border-white/10 p-2">
        {!collapsed ? (
          <>
            <button
              onClick={openProfile}
              className="flex items-center gap-3 w-full px-3 py-2 mb-1 rounded-lg hover:bg-white/8 transition-all group cursor-pointer"
            >
              <UserAvatar size={32} />
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                <p className="text-[11px] text-purple-300/60">{user?.department || user?.role?.toLowerCase()}</p>
              </div>
              <Pencil size={12} className="text-purple-300/40 group-hover:text-purple-300 transition-colors flex-shrink-0" />
            </button>
            <button onClick={handleLogout} className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm font-medium text-red-300/80 hover:text-red-300 hover:bg-white/8 transition-all cursor-pointer">
              <LogOut size={16} /> <span>Logout</span>
            </button>
          </>
        ) : (
          <>
            <button onClick={openProfile} title="Edit Profile" className="flex items-center justify-center w-full py-2 rounded-lg hover:bg-white/8 transition-all mb-0.5 cursor-pointer">
              <UserAvatar size={28} />
            </button>
            <button onClick={handleLogout} title="Logout" className="flex items-center justify-center w-full py-2.5 rounded-lg text-red-300/80 hover:text-red-300 hover:bg-white/8 transition-all cursor-pointer">
              <LogOut size={16} />
            </button>
          </>
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

      {/* Profile Edit Modal */}
      <Modal isOpen={profileOpen} onClose={() => setProfileOpen(false)} title="Edit Profil">
        <div className="space-y-4">
          {/* Avatar */}
          <div className="flex justify-center">
            <label className="relative cursor-pointer group">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Preview" className="w-20 h-20 rounded-full object-cover" />
              ) : (
                <UserAvatar size={80} />
              )}
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera size={20} className="text-white" />
              </div>
              <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
            </label>
          </div>

          <div>
            <label className="label">Nama</label>
            <input value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} className="input" />
          </div>
          <div>
            <label className="label">Posisi / Department</label>
            <input value={form.department} onChange={(e) => setForm(p => ({ ...p, department: e.target.value }))} className="input" placeholder="e.g. AI Engineering" />
          </div>

          {message === 'saved' && (
            <div className="p-2.5 rounded-xl text-sm text-center animate-fade-in-up" style={{ background: 'rgba(16,185,129,0.08)', color: '#059669' }}>
              Profil berhasil diperbarui ✓
            </div>
          )}
          {message === 'error' && (
            <div className="p-2.5 rounded-xl text-sm text-center animate-fade-in-up" style={{ background: 'rgba(239,68,68,0.08)', color: 'var(--color-danger)' }}>
              Gagal menyimpan profil
            </div>
          )}

          <button onClick={handleSaveProfile} disabled={saving || !form.name} className="btn btn-primary w-full py-2.5">
            {saving ? <span className="spinner" style={{ width: '1rem', height: '1rem', borderWidth: '2px', borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} /> : 'Simpan Profil'}
          </button>
        </div>
      </Modal>
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
