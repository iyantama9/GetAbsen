import { useState, useEffect } from 'react';
import api from '../../api/client';
import { Save, Clock as ClockIcon, MapPin, Link2, Cloud, BookOpen, CalendarDays, CheckCircle2 } from 'lucide-react';

export default function Settings() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    try { const res = await api.get('/admin/settings'); setSettings(res.data.data); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    setSaving(true); setMessage('');
    try { await api.put('/admin/settings', settings); setMessage('saved'); setTimeout(() => setMessage(''), 3000); }
    catch { setMessage('error'); }
    finally { setSaving(false); }
  };

  const updateSetting = (key, value) => setSettings(prev => ({ ...prev, [key]: value }));

  if (loading) return <div className="flex items-center justify-center h-64"><div className="spinner" /></div>;

  const integrations = [
    { Icon: BookOpen, name: 'Notion API', desc: 'Sync absensi ke Notion database', status: 'Via .env' },
    { Icon: CalendarDays, name: 'Google Calendar', desc: 'Sync planner ke Google Calendar', status: 'Via .env' },
    { Icon: Cloud, name: 'Cloudflare R2', desc: 'Evidence file storage', status: 'Via .env' },
  ];

  return (
    <div className="animate-fade-in-up">
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Konfigurasi sistem absensi</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn btn-primary">
          {saving ? <span className="spinner" style={{ width: '1rem', height: '1rem', borderWidth: '2px', borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} />
            : message === 'saved' ? <><CheckCircle2 size={16} /> Tersimpan!</>
            : <><Save size={16} /> Simpan</>}
        </button>
      </div>

      {message === 'error' && (
        <div className="mb-5 p-3 rounded-xl text-sm flex items-center gap-2 animate-fade-in-up" style={{ background: 'rgba(239,68,68,0.08)', color: 'var(--color-danger)' }}>
          Gagal menyimpan settings
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-primary-100)' }}>
              <ClockIcon size={18} style={{ color: 'var(--color-primary)' }} />
            </div>
            <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Jam Absensi</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Jam Mulai</label>
              <input type="time" value={settings.absen_start_time || '10:00'} onChange={(e) => updateSetting('absen_start_time', e.target.value)} className="input" />
            </div>
            <div>
              <label className="label">Jam Selesai</label>
              <input type="time" value={settings.absen_end_time || '17:00'} onChange={(e) => updateSetting('absen_end_time', e.target.value)} className="input" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.1)' }}>
              <MapPin size={18} style={{ color: '#059669' }} />
            </div>
            <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Lokasi Kantor</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Latitude</label>
              <input type="text" value={settings.office_latitude || ''} onChange={(e) => updateSetting('office_latitude', e.target.value)} className="input" placeholder="-6.2088" />
            </div>
            <div>
              <label className="label">Longitude</label>
              <input type="text" value={settings.office_longitude || ''} onChange={(e) => updateSetting('office_longitude', e.target.value)} className="input" placeholder="106.8456" />
            </div>
          </div>
        </div>
      </div>

      <div className="card mt-5">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.1)' }}>
            <Link2 size={18} style={{ color: '#3B82F6' }} />
          </div>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Integrations</h2>
        </div>
        <div className="space-y-2">
          {integrations.map(({ Icon, name, desc, status }) => (
            <div key={name} className="flex items-center justify-between p-3 rounded-xl transition-all hover:bg-gray-50 cursor-default" style={{ background: 'var(--color-bg)' }}>
              <div className="flex items-center gap-3 min-w-0">
                <Icon size={18} style={{ color: 'var(--color-text-muted)' }} className="flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text)' }}>{name}</p>
                  <p className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>{desc}</p>
                </div>
              </div>
              <span className="badge flex-shrink-0" style={{ background: 'rgba(245,158,11,0.1)', color: '#D97706' }}>{status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
