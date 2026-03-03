import { useState, useEffect, useCallback } from 'react';
import { enrollFace, getFaceStatus } from '../../api/face';
import WebcamCapture from '../../components/WebcamCapture';
import { ScanFace, CheckCircle2, AlertCircle, ChevronRight, Loader2 } from 'lucide-react';

const PHOTOS_PER_STEP = 5;

const STEPS = [
  { label: 'Wajah Depan', guidance: 'Posisikan wajah lurus menghadap kamera', labelKey: 'front' },
  { label: 'Miring Kiri', guidance: 'Palingkan wajah sedikit ke kiri', labelKey: 'left' },
  { label: 'Miring Kanan', guidance: 'Palingkan wajah sedikit ke kanan', labelKey: 'right' },
];

export default function FaceEnroll() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0);
  const [photoIndex, setPhotoIndex] = useState(0); // 0-4 within each step
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [totalUploaded, setTotalUploaded] = useState(0);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await getFaceStatus();
      setStatus(res.data.data);
      if (res.data.data.enrolled) setDone(true);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  const handleCapture = useCallback(async (file, preview) => {
    if (!file) return;

    const currentStep = step;
    const currentPhotoIndex = photoIndex;
    setUploading(true);
    setError('');

    try {
      const label = `${STEPS[currentStep].labelKey}_${currentPhotoIndex + 1}`;
      await enrollFace(file, label);

      const newTotal = totalUploaded + 1;
      setTotalUploaded(newTotal);

      if (currentPhotoIndex + 1 < PHOTOS_PER_STEP) {
        // More photos in this step
        setTimeout(() => {
          setPhotoIndex(currentPhotoIndex + 1);
          setUploading(false);
        }, 600);
      } else if (currentStep + 1 < STEPS.length) {
        // Move to next step
        setTimeout(() => {
          setStep(currentStep + 1);
          setPhotoIndex(0);
          setUploading(false);
        }, 800);
      } else {
        // All done
        setDone(true);
        setUploading(false);
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Gagal mendaftarkan wajah');
      setUploading(false);
    }
  }, [step, photoIndex, totalUploaded]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="spinner" /></div>;

  if (done || status?.enrolled) {
    return (
      <div className="animate-fade-in-up">
        <div className="page-header"><h1 className="page-title">Face ID</h1></div>
        <div className="card text-center py-12">
          <CheckCircle2 size={56} className="mx-auto mb-4" style={{ color: 'var(--color-success)' }} />
          <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>Wajah Sudah Terdaftar</h2>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Wajah kamu sudah terdaftar di sistem ({STEPS.length * PHOTOS_PER_STEP} foto). Face verification akan digunakan saat absen harian.
          </p>
          <p className="text-xs mt-4" style={{ color: 'var(--color-text-muted)' }}>
            Perlu mendaftarkan ulang? Hubungi mentor atau admin.
          </p>
        </div>
      </div>
    );
  }

  const totalPhotos = STEPS.length * PHOTOS_PER_STEP;
  const currentGlobalPhoto = (step * PHOTOS_PER_STEP) + photoIndex + 1;
  const progressPercent = (totalUploaded / totalPhotos) * 100;

  return (
    <div className="animate-fade-in-up">
      <div className="page-header">
        <h1 className="page-title">Daftarkan Wajah</h1>
        <p className="page-subtitle">Kamera otomatis mengambil {PHOTOS_PER_STEP} foto per posisi ({totalPhotos} total)</p>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs mb-1.5">
          <span style={{ color: 'var(--color-text-muted)' }}>Progress</span>
          <span className="font-semibold" style={{ color: 'var(--color-primary)' }}>{totalUploaded}/{totalPhotos}</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--color-surface-alt)' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%`, background: 'var(--color-primary)' }}
          />
        </div>
      </div>

      {/* Step indicators */}
      <div className="flex items-center justify-center gap-2 mb-6">
        {STEPS.map((s, i) => {
          const stepDone = i < step || (i === step && photoIndex >= PHOTOS_PER_STEP);
          const isCurrent = i === step;
          return (
            <div key={i} className="flex items-center gap-2">
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                style={
                  isCurrent
                    ? { background: 'var(--color-primary)', color: 'white' }
                    : stepDone
                      ? { background: 'rgba(16,185,129,0.15)', color: 'var(--color-success)', border: '1px solid var(--color-success)' }
                      : { background: 'var(--color-surface-alt)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }
                }
              >
                {stepDone ? <CheckCircle2 size={12} /> : isCurrent ? <span>{photoIndex + 1}/{PHOTOS_PER_STEP}</span> : <span>{i + 1}</span>}
                {s.label}
              </div>
              {i < 2 && <ChevronRight size={14} style={{ color: 'var(--color-text-muted)' }} />}
            </div>
          );
        })}
      </div>

      {/* Webcam area */}
      <div className="card">
        {uploading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 size={32} className="animate-spin" style={{ color: 'var(--color-primary)' }} />
            <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
              Menyimpan foto {photoIndex + 1}/{PHOTOS_PER_STEP} ({STEPS[step].label})...
            </p>
          </div>
        ) : (
          <WebcamCapture
            onCapture={handleCapture}
            guidanceText={`${STEPS[step].guidance} — foto ${photoIndex + 1} dari ${PHOTOS_PER_STEP}`}
            disabled={uploading}
            autoCapture
            autoDelay={photoIndex === 0 ? 3000 : 800}
            key={`${step}-${photoIndex}`}
          />
        )}
      </div>

      {error && (
        <div className="mt-4 p-3 rounded-xl text-sm flex items-center gap-2 animate-fade-in-up" style={{ background: 'rgba(239,68,68,0.08)', color: 'var(--color-danger)' }}>
          <AlertCircle size={16} className="flex-shrink-0" /> {error}
        </div>
      )}
    </div>
  );
}
