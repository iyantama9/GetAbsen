import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, ArrowRight } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password, rememberMe);
      if (user.role === 'INTERN') navigate('/absen');
      else navigate('/mentor/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login gagal. Periksa email dan password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: 'var(--color-bg)' }}>
      <div className="relative w-full max-w-[400px] animate-scale-in">
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{
              background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))',
              boxShadow: '6px 6px 14px rgba(108,60,225,0.35), -4px -4px 10px rgba(255,255,255,0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
            }}
          >
            <ClipboardCheck className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--color-text)', letterSpacing: '-0.03em' }}>
            Get<span style={{ color: 'var(--color-primary)' }}>Absen</span>
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>Intern Attendance System</p>
        </div>

        <div className="card p-6 sm:p-8">
          <h2 className="text-base font-semibold mb-5" style={{ color: 'var(--color-text)' }}>Welcome back</h2>

          {error && (
            <div className="mb-4 p-3 rounded-xl text-sm flex items-center gap-2 animate-fade-in-up" style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--color-danger)', boxShadow: 'var(--shadow-clay-inset)' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="label">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
                <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@getcore.id" className="input pl-10" required autoFocus />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="label">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
                <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="input pl-10" required />
              </div>
            </div>

            {/* Stay Signed In */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-2 accent-[var(--color-primary)]"
                style={{ accentColor: 'var(--color-primary)' }}
              />
              <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Tetap masuk</span>
            </label>

            <button type="submit" disabled={loading} className="btn btn-primary w-full py-2.5 text-sm mt-2 group">
              {loading ? <span className="spinner" style={{ width: '1rem', height: '1rem', borderWidth: '2px', borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} />
                : <><span>Login</span><ArrowRight size={16} className="transition-transform group-hover:translate-x-1" /></>}
            </button>
          </form>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: 'var(--color-text-muted)' }}>© {new Date().getFullYear()} Getcore.ID</p>
      </div>
    </div>
  );
}

function ClipboardCheck(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><path d="m9 14 2 2 4-4" />
    </svg>
  );
}
