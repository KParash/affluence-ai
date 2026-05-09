import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Login() {
  const [email, setEmail] = useState('admin@affluenceai.com');
  const [password, setPassword] = useState('password123');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>
      {/* Left: Branding */}
      <div style={{ flex: 1, background: 'linear-gradient(135deg, #0A0A0F 0%, #1A1A2E 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: 48, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%, -50%)', width: 500, height: 500, background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div style={{ fontSize: 32, fontWeight: 900, marginBottom: 16 }}>
            <span style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--accent-gradient)', display: 'inline-block', marginRight: 12 }} />
            <span style={{ background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AffluenceAI</span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 16, maxWidth: 360, lineHeight: 1.7 }}>
            Track influencer sales, manage payments, and unlock AI-powered insights — all in one powerful platform.
          </p>
          <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Demo Accounts:</div>
            {[
              { label: 'Admin', email: 'admin@affluenceai.com' },
              { label: 'Finance', email: 'finance@affluenceai.com' },
              { label: 'Influencer', email: 'priya@example.com' },
            ].map(a => (
              <button key={a.email} className="btn btn-ghost btn-sm" style={{ justifyContent: 'flex-start', fontFamily: 'var(--font-mono)', fontSize: 12 }}
                onClick={() => { setEmail(a.email); setPassword('password123'); }}>
                {a.label}: {a.email}
              </button>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right: Form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48, background: 'var(--bg-secondary)' }}>
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
          style={{ width: '100%', maxWidth: 400 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Welcome back</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>Sign in to your account</p>

          {error && <div style={{ background: 'var(--danger-bg)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--danger)', padding: '10px 16px', borderRadius: 'var(--radius-md)', fontSize: 13, marginBottom: 16 }}>{error}</div>}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="input-group">
              <label className="input-label">Email</label>
              <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your email" required id="login-email" />
            </div>
            <div className="input-group">
              <label className="input-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input className="input" type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" required id="login-password" style={{ paddingRight: 44 }} />
                <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-lg" disabled={loading} id="login-submit" style={{ width: '100%' }}>
              {loading ? <span className="spinner" /> : <>Sign In <ArrowRight size={18} /></>}
            </button>
          </form>

          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: 14, marginTop: 24 }}>
            Don't have an account? <Link to="/signup" style={{ fontWeight: 600 }}>Sign up</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
