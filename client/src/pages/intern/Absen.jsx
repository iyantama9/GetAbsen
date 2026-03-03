import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAttendances, submitAttendance } from '../../api/attendance';
import { verifyFace, getFaceStatus } from '../../api/face';
import useGeolocation from '../../hooks/useGeolocation';
import api from '../../api/client';
import Modal from '../../components/Modal';
import FileUpload from '../../components/FileUpload';
import WebcamCapture from '../../components/WebcamCapture';
import { MapPin, Check, FileText, Thermometer, Paperclip, Clock, ChevronLeft, ChevronRight, AlertTriangle, Unlock, ScanFace, ShieldAlert, CheckCircle2, XCircle } from 'lucide-react';

export default function Absen() {
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [status, setStatus] = useState('HADIR');
  const [reason, setReason] = useState('');
  const [evidence, setEvidence] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [pageOffset, setPageOffset] = useState(0);
  const [viewMode, setViewMode] = useState(false);
  const [reopenedDates, setReopenedDates] = useState([]);
  const [faceVerifyOpen, setFaceVerifyOpen] = useState(false);
  const [faceVerifying, setFaceVerifying] = useState(false);
  const [faceError, setFaceError] = useState('');
  const [faceAttempts, setFaceAttempts] = useState(0);
  const [faceBlocked, setFaceBlocked] = useState(false);
  const [faceEnrolled, setFaceEnrolled] = useState(null);
  const [faceResult, setFaceResult] = useState(null); // 'success' | 'fail' | null
  const navigate = useNavigate();
  const { location, error: geoError, loading: geoLoading, requestLocation } = useGeolocation();

  useEffect(() => {
    api.get('/admin/attendance/reopened').then(res => setReopenedDates(res.data.data)).catch(() => {});
    getFaceStatus().then(res => setFaceEnrolled(res.data.data?.enrolled || false)).catch(() => setFaceEnrolled(false));
  }, []);

  const getWorkingDays = useCallback((offset = 0) => {
    const days = [];
    const today = new Date();
    const start = new Date(today);
    // Move back by (offset * 12) working days from the base start
    start.setDate(today.getDate() - today.getDay() + 1 - 7);
    // Additional offset for pagination
    let skipDays = offset * 12;
    let tempDate = new Date(start);
    while (skipDays > 0) {
      tempDate.setDate(tempDate.getDate() - 1);
      const dow = tempDate.getDay();
      if (dow !== 0 && dow !== 6) skipDays--;
    }
    if (offset > 0) start.setTime(tempDate.getTime());

    let count = 0;
    let d = new Date(start);
    while (count < 12) {
      const dow = d.getDay();
      if (dow !== 0 && dow !== 6) {
        days.push(new Date(d));
        count++;
      }
      d.setDate(d.getDate() + 1);
    }
    return days;
  }, []);

  const workingDays = getWorkingDays(pageOffset);

  // Local timezone date formatter (avoids UTC shift from toISOString)
  const toLocalDateStr = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const fetchAttendances = useCallback(async () => {
    try {
      const startDate = toLocalDateStr(workingDays[0]);
      const endDate = toLocalDateStr(workingDays[workingDays.length - 1]);
      const res = await getAttendances({ startDate, endDate });
      setAttendances(res.data.data);
    } catch {} finally { setLoading(false); }
  }, [workingDays]);

  useEffect(() => { setLoading(true); fetchAttendances(); }, [pageOffset]);

  const getAttendanceForDate = (date) => {
    const dateStr = toLocalDateStr(date);
    return attendances.find(a => toLocalDateStr(new Date(a.date)) === dateStr);
  };

  const isReopened = (date) => reopenedDates.includes(toLocalDateStr(date));

  const openModal = (date) => {
    const att = getAttendanceForDate(date);
    const today = isToday(date);
    const past = isPast(date) && !today;
    const reopened = isReopened(date);

    // If already has attendance, open in view mode
    if (att) {
      setSelectedDate(date);
      setViewMode(true);
      setModalOpen(true);
      return;
    }

    // If past and reopened — allow submission
    if (past && reopened) {
      setSelectedDate(date);
      setViewMode(false);
      setStatus('HADIR'); setReason(''); setEvidence(null); setError('');
      setModalOpen(true);
      return;
    }

    // If past and not reopened — show warning
    if (past) {
      setSelectedDate(date);
      setViewMode(true);
      setModalOpen(true);
      return;
    }

    // Future date — no action
    if (!today) return;

    // Today — open submit form
    setSelectedDate(date);
    setViewMode(false);
    setStatus('HADIR'); setReason(''); setEvidence(null); setError('');
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    setError('');
    if (status === 'HADIR' && !location) { setError('Klik "Ambil Lokasi" terlebih dahulu.'); return; }
    if (!evidence) { setError('Upload evidence/bukti terlebih dahulu.'); return; }

    // Face verification is mandatory
    if (faceEnrolled === false) {
      setError('Wajah belum terdaftar. Daftarkan wajah di menu Face ID terlebih dahulu.');
      return;
    }

    if (faceBlocked) {
      setError('Face verification gagal 5x. Hubungi mentor untuk approval.');
      return;
    }

    setFaceVerifyOpen(true);
  };

  const doSubmitAttendance = async () => {
    setSubmitting(true);
    try {
      await submitAttendance({ date: toLocalDateStr(selectedDate), status, latitude: location?.latitude, longitude: location?.longitude, reason, evidence });
      await fetchAttendances();
      setModalOpen(false); setFaceVerifyOpen(false);
      setFaceAttempts(0);
    } catch (err) { setError(err.response?.data?.error || 'Gagal submit'); }
    finally { setSubmitting(false); }
  };

  const handleFaceVerify = async (file) => {
    if (!file) return;
    setFaceVerifying(true);
    setFaceError('');
    setFaceResult(null);
    try {
      const res = await verifyFace(file);
      const data = res.data.data;
      if (data.match) {
        setFaceResult('success');
        setFaceVerifying(false);
        // Show success feedback for 2 seconds, then submit
        await new Promise(r => setTimeout(r, 2000));
        setFaceResult(null);
        setFaceVerifyOpen(false);
        await doSubmitAttendance();
      } else {
        const attempts = faceAttempts + 1;
        setFaceAttempts(attempts);
        setFaceResult('fail');
        setFaceVerifying(false);
        if (attempts >= 5) {
          await new Promise(r => setTimeout(r, 2000));
          setFaceBlocked(true);
          setFaceVerifyOpen(false);
          setFaceResult(null);
          setError('Face verification gagal 5x. Hubungi mentor untuk approval.');
        } else {
          setFaceError(`Wajah tidak cocok (similarity: ${(data.similarity * 100).toFixed(1)}%). Kesempatan: ${5 - attempts} lagi`);
          await new Promise(r => setTimeout(r, 2500));
          setFaceResult(null);
          setFaceError('');
        }
      }
    } catch (err) {
      setFaceError(err.response?.data?.error || 'Gagal verifikasi wajah');
      setFaceVerifying(false);
    }
  };

  const fmt = (date) => {
    const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return { day: days[date.getDay()], date: date.getDate(), month: months[date.getMonth()], year: date.getFullYear() };
  };
  const isToday = (d) => d.toDateString() === new Date().toDateString();
  const isPast = (d) => d < new Date(new Date().setHours(0, 0, 0, 0));
  const isFuture = (d) => d > new Date(new Date().setHours(23, 59, 59, 999));

  // Period label
  const periodLabel = workingDays.length > 0
    ? `${fmt(workingDays[0]).date} ${fmt(workingDays[0]).month} – ${fmt(workingDays[workingDays.length - 1]).date} ${fmt(workingDays[workingDays.length - 1]).month} ${fmt(workingDays[workingDays.length - 1]).year}`
    : '';

  if (loading) return <div className="flex items-center justify-center h-64"><div className="spinner" /></div>;

  return (
    <div className="animate-fade-in-up">
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="page-title">Absensi Harian</h1>
          <div className="flex items-center gap-1.5 mt-1">
            <Clock size={14} style={{ color: 'var(--color-text-muted)' }} />
            <p className="page-subtitle">10.00 - 17.00 WIB</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--color-text-muted)' }}>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500" /> Hadir</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500/20 border border-amber-500" /> Izin</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500" /> Sakit</span>
        </div>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setPageOffset(prev => prev + 1)}
          className="btn btn-ghost flex items-center gap-1 text-sm"
        >
          <ChevronLeft size={16} /> Sebelumnya
        </button>
        <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{periodLabel}</span>
        <button
          onClick={() => setPageOffset(prev => Math.max(0, prev - 1))}
          disabled={pageOffset === 0}
          className="btn btn-ghost flex items-center gap-1 text-sm"
          style={pageOffset === 0 ? { opacity: 0.4, pointerEvents: 'none' } : {}}
        >
          Berikutnya <ChevronRight size={16} />
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 stagger-children">
        {workingDays.map((date, i) => {
          const f = fmt(date);
          const att = getAttendanceForDate(date);
          const today = isToday(date);
          const past = isPast(date) && !today;
          const future = isFuture(date);

          return (
            <button key={i} onClick={() => openModal(date)} className={`card card-interactive text-left animate-fade-in-up ${today ? 'ring-2 ring-purple-500/30' : ''}`}
              style={today ? { borderColor: 'var(--color-primary)' } : past && !att ? { opacity: 0.65 } : future ? { opacity: 0.5 } : {}}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>{f.day}</span>
                {today && <span className="text-[10px] px-2 py-0.5 rounded-full font-bold tracking-wide animate-pulse" style={{ background: 'var(--color-primary)', color: 'white' }}>NOW</span>}
              </div>
              <p className="text-xl sm:text-2xl font-bold tabular-nums" style={{ color: 'var(--color-text)' }}>{f.date}</p>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{f.month} {f.year}</p>
              {att ? (
                <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--color-border-light)' }}>
                  <span className={`badge ${att.status === 'HADIR' ? 'badge-hadir' : att.status === 'IZIN' ? 'badge-izin' : 'badge-sakit'}`}>
                    {att.status === 'HADIR' ? <Check size={12} /> : att.status === 'IZIN' ? <FileText size={12} /> : <Thermometer size={12} />}
                    {att.status.charAt(0) + att.status.slice(1).toLowerCase()}
                  </span>
                  {att.distanceKm != null && <p className="text-[10px] mt-1.5 flex items-center gap-1" style={{ color: 'var(--color-text-muted)' }}><MapPin size={10} />{att.distanceKm} km</p>}
                </div>
              ) : today ? (
                <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--color-border-light)' }}>
                  <span className="text-xs font-medium" style={{ color: 'var(--color-primary)' }}>Tap untuk absen →</span>
                </div>
              ) : past && isReopened(date) ? (
                <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--color-border-light)' }}>
                  <span className="text-xs font-medium flex items-center gap-1" style={{ color: '#059669' }}>
                    <Unlock size={11} /> Dibuka kembali
                  </span>
                </div>
              ) : past ? (
                <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--color-border-light)' }}>
                  <span className="text-xs font-medium flex items-center gap-1" style={{ color: 'var(--color-danger)' }}>
                    <AlertTriangle size={11} /> Terlewat
                  </span>
                </div>
              ) : null}
            </button>
          );
        })}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={viewMode ? 'Detail Absensi' : 'Submit Absensi'}>
        {selectedDate && viewMode ? (
          // View mode — for past dates or existing attendance
          <div className="space-y-4">
            <div className="p-3 rounded-xl text-center" style={{ background: 'var(--color-surface-alt)' }}>
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Tanggal</p>
              <p className="text-base font-semibold" style={{ color: 'var(--color-text)' }}>{fmt(selectedDate).day}, {fmt(selectedDate).date} {fmt(selectedDate).month} {fmt(selectedDate).year}</p>
            </div>
            {(() => {
              const att = getAttendanceForDate(selectedDate);
              if (att) {
                return (
                  <div className="space-y-3">
                    <div className="flex items-center justify-center">
                      <span className={`badge text-sm px-4 py-1.5 ${att.status === 'HADIR' ? 'badge-hadir' : att.status === 'IZIN' ? 'badge-izin' : 'badge-sakit'}`}>
                        {att.status === 'HADIR' ? <Check size={14} /> : att.status === 'IZIN' ? <FileText size={14} /> : <Thermometer size={14} />}
                        {att.status}
                      </span>
                    </div>
                    {att.checkInTime && (
                      <div className="text-center text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        Check-in: {new Date(att.checkInTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}
                    {att.distanceKm != null && (
                      <div className="text-center text-sm flex items-center justify-center gap-1" style={{ color: 'var(--color-text-secondary)' }}>
                        <MapPin size={13} /> {att.distanceKm} km dari kantor
                      </div>
                    )}
                    {att.reason && (
                      <div className="p-3 rounded-xl" style={{ background: 'var(--color-surface-alt)' }}>
                        <p className="text-xs mb-1 font-semibold" style={{ color: 'var(--color-text-muted)' }}>Alasan</p>
                        <p className="text-sm" style={{ color: 'var(--color-text)' }}>{att.reason}</p>
                      </div>
                    )}
                    {att.evidences?.length > 0 && (
                      <div>
                        <p className="text-xs mb-1.5 font-semibold" style={{ color: 'var(--color-text-muted)' }}>Evidence</p>
                        {att.evidences.map(ev => (
                          <a key={ev.id} href={ev.fileUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs hover:underline" style={{ color: 'var(--color-primary)' }}>
                            <Paperclip size={12} /> Lihat file
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }
              // Past date with no attendance
              return (
                <div className="text-center py-4">
                  <AlertTriangle size={32} className="mx-auto mb-2" style={{ color: 'var(--color-danger)' }} />
                  <p className="text-sm font-semibold" style={{ color: 'var(--color-danger)' }}>Absen Terlewat</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>Ini sudah bukan jadwal absen. Tidak bisa submit absensi untuk tanggal ini.</p>
                </div>
              );
            })()}
          </div>
        ) : selectedDate && !viewMode ? (
          // Submit mode — only for today
          <div className="space-y-4">
            <div className="p-3 rounded-xl text-center" style={{ background: 'var(--color-surface-alt)' }}>
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Tanggal</p>
              <p className="text-base font-semibold" style={{ color: 'var(--color-text)' }}>{fmt(selectedDate).day}, {fmt(selectedDate).date} {fmt(selectedDate).month} {fmt(selectedDate).year}</p>
            </div>

            {error && <div className="p-3 rounded-xl text-sm flex items-center gap-2 animate-fade-in-up" style={{ background: 'rgba(239,68,68,0.08)', color: 'var(--color-danger)' }}><span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />{error}</div>}

            <div>
              <label className="label">Status Kehadiran</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'HADIR', label: 'Hadir', Icon: Check, color: '#059669', bg: 'rgba(16,185,129,0.1)' },
                  { value: 'IZIN', label: 'Izin', Icon: FileText, color: '#D97706', bg: 'rgba(245,158,11,0.1)' },
                  { value: 'SAKIT', label: 'Sakit', Icon: Thermometer, color: '#DC2626', bg: 'rgba(239,68,68,0.1)' },
                ].map(s => (
                  <button key={s.value} type="button" onClick={() => setStatus(s.value)}
                    className="flex flex-col items-center gap-1.5 py-3 rounded-xl text-xs font-semibold transition-all border cursor-pointer"
                    style={status === s.value ? { background: s.bg, color: s.color, borderColor: s.color } : { background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
                  >
                    <s.Icon size={18} />
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {status === 'HADIR' && (
              <div>
                <label className="label">Geolocation</label>
                <button type="button" onClick={requestLocation} disabled={geoLoading} className="btn btn-secondary w-full">
                  <MapPin size={16} />
                  {geoLoading ? 'Mengambil lokasi...' : location ? 'Lokasi didapat' : 'Ambil Lokasi'}
                </button>
                {location && <p className="text-[11px] mt-1.5" style={{ color: 'var(--color-success)' }}>{location.latitude.toFixed(6)}, {location.longitude.toFixed(6)} (±{Math.round(location.accuracy)}m)</p>}
                {geoError && <p className="text-[11px] mt-1.5" style={{ color: 'var(--color-danger)' }}>⚠ {geoError}</p>}
              </div>
            )}

            {status !== 'HADIR' && (
              <div>
                <label className="label">Alasan</label>
                <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Sertakan alasan..." className="input min-h-[72px] resize-none" rows={3} />
              </div>
            )}

            <div>
              <label className="label">Bukti (wajib)</label>
              <FileUpload onFileSelect={setEvidence} />
              {evidence && <p className="text-xs mt-1.5 flex items-center gap-1" style={{ color: 'var(--color-success)' }}><Paperclip size={12} />{evidence.name}</p>}
              {!evidence && <p className="text-[11px] mt-1" style={{ color: 'var(--color-text-muted)' }}>Upload bukti untuk mengaktifkan tombol submit</p>}
            </div>

            <button onClick={handleSubmit} disabled={submitting || !evidence || faceBlocked} className="btn btn-primary w-full py-2.5 flex items-center justify-center gap-2">
              {submitting ? <span className="spinner" style={{ width: '1rem', height: '1rem', borderWidth: '2px', borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} /> : <><ScanFace size={18} /> Verifikasi Wajah</>}
            </button>
            {faceEnrolled === false && (
              <p className="text-xs text-center mt-2" style={{ color: 'var(--color-text-muted)' }}>
                Belum daftar wajah? <a href="/face-enroll" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>Daftar di sini</a>
              </p>
            )}
          </div>
        ) : null}
      </Modal>

      {/* Face Verification Modal */}
      <Modal isOpen={faceVerifyOpen} onClose={() => { setFaceVerifyOpen(false); setFaceResult(null); }} title="Verifikasi Wajah">
        <div className="space-y-4">
          {faceResult === 'success' ? (
            <div className="flex flex-col items-center py-10 gap-3 animate-fade-in-up">
              <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.1)' }}>
                <CheckCircle2 size={44} style={{ color: '#059669' }} />
              </div>
              <p className="text-lg font-bold" style={{ color: '#059669' }}>Wajah Terverifikasi ✓</p>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Mengirim absensi...</p>
            </div>
          ) : faceResult === 'fail' ? (
            <div className="flex flex-col items-center py-10 gap-3 animate-fade-in-up">
              <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.1)' }}>
                <XCircle size={44} style={{ color: '#DC2626' }} />
              </div>
              <p className="text-lg font-bold" style={{ color: '#DC2626' }}>Wajah Tidak Cocok</p>
              {faceError && <p className="text-xs text-center" style={{ color: 'var(--color-text-muted)' }}>{faceError}</p>}
            </div>
          ) : faceVerifying ? (
            <div className="flex flex-col items-center py-10 gap-3">
              <div className="spinner" />
              <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>Memverifikasi wajah...</p>
            </div>
          ) : (
            <>
              <div className="p-3 rounded-xl text-center" style={{ background: 'var(--color-surface-alt)' }}>
                <ScanFace size={28} className="mx-auto mb-2" style={{ color: 'var(--color-primary)' }} />
                <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>Verifikasi identitas</p>
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>Posisikan wajah — kamera akan otomatis memindai</p>
              </div>

              <WebcamCapture
                onCapture={(file) => { if (file) handleFaceVerify(file); }}
                guidanceText="Pastikan wajah terlihat jelas"
                disabled={faceVerifying}
                autoCapture
                autoDelay={800}
                key={`verify-${faceAttempts}`}
              />
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
