import { useState, useEffect } from 'react';
import api from '../../api/client';
import { Filter, CheckCircle2, FileText, Thermometer, MapPin, Clock } from 'lucide-react';

export default function AttendanceView() {
  const [interns, setInterns] = useState([]);
  const [selectedIntern, setSelectedIntern] = useState('');
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => { api.get('/users', { params: { role: 'INTERN' } }).then(res => setInterns(res.data.data)); }, []);
  useEffect(() => { fetchAttendances(); }, [selectedIntern, dateRange]);

  const fetchAttendances = async () => {
    setLoading(true);
    try {
      const params = { ...dateRange };
      if (selectedIntern) params.targetUserId = selectedIntern;
      const res = await api.get('/attendance', { params });
      setAttendances(res.data.data);
    } catch {} finally { setLoading(false); }
  };

  return (
    <div className="animate-fade-in-up">
      <div className="page-header">
        <h1 className="page-title">Absensi Intern</h1>
        <p className="page-subtitle">Lihat riwayat absensi semua intern</p>
      </div>

      <div className="card mb-5">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={14} style={{ color: 'var(--color-text-muted)' }} />
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Filter</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="label">Intern</label>
            <select value={selectedIntern} onChange={(e) => setSelectedIntern(e.target.value)} className="input">
              <option value="">Semua Intern</option>
              {interns.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Dari</label>
            <input type="date" value={dateRange.startDate} onChange={(e) => setDateRange(p => ({ ...p, startDate: e.target.value }))} className="input" />
          </div>
          <div>
            <label className="label">Sampai</label>
            <input type="date" value={dateRange.endDate} onChange={(e) => setDateRange(p => ({ ...p, endDate: e.target.value }))} className="input" />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40"><div className="spinner" /></div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Nama</th>
                  <th>Status</th>
                  <th className="hidden sm:table-cell">Check-in</th>
                  <th className="hidden md:table-cell">Jarak</th>
                  <th className="hidden lg:table-cell">Alasan</th>
                </tr>
              </thead>
              <tbody>
                {attendances.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-8" style={{ color: 'var(--color-text-muted)' }}>Tidak ada data</td></tr>
                ) : attendances.map(a => (
                  <tr key={a.id}>
                    <td style={{ color: 'var(--color-text)' }}>{new Date(a.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</td>
                    <td className="font-medium" style={{ color: 'var(--color-text)' }}>{a.user?.name}</td>
                    <td>
                      <span className={`badge ${a.status === 'HADIR' ? 'badge-hadir' : a.status === 'IZIN' ? 'badge-izin' : 'badge-sakit'}`}>
                        {a.status === 'HADIR' ? <CheckCircle2 size={11} /> : a.status === 'IZIN' ? <FileText size={11} /> : <Thermometer size={11} />}
                        {a.status}
                      </span>
                    </td>
                    <td className="hidden sm:table-cell">
                      {a.checkInTime ? <span className="flex items-center gap-1"><Clock size={12} />{new Date(a.checkInTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span> : '-'}
                    </td>
                    <td className="hidden md:table-cell">{a.distanceKm != null ? <span className="flex items-center gap-1"><MapPin size={12} />{a.distanceKm} km</span> : '-'}</td>
                    <td className="hidden lg:table-cell">{a.reason || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
