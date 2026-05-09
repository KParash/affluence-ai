import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('influencer');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await register(email, password, name, role);
      navigate('/dashboard');
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>
      <div style={{ flex: 1, background: 'linear-gradient(135deg, #0A0A0F 0%, #1A1A2E 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: 48, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%,-50%)', width: 500, height: 500, background: 'radial-gradient(circle, rgba(236,72,153,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ fontSize: 32, fontWeight: 900, marginBottom: 16 }}>
            <span style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--accent-gradient)', display: 'inline-block', marginRight: 12 }} />
            <span style={{ background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AffluenceAI</span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 16, maxWidth: 360, lineHeight: 1.7 }}>
            Join the platform trusted by brands and influencers to track affiliate sales and optimize ROI.
          </p>
        </motion.div>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48, background: 'var(--bg-secondary)' }}>
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
          style={{ width: '100%', maxWidth: 400 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Create Account</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>Get started in under a minute</p>

          {error && <div style={{ background: 'var(--danger-bg)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--danger)', padding: '10px 16px', borderRadius: 'var(--radius-md)', fontSize: 13, marginBottom: 16 }}>{error}</div>}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="input-group">
              <label className="input-label">Full Name</label>
              <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" required id="signup-name" />
            </div>
            <div className="input-group">
              <label className="input-label">Email</label>
              <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Your email" required id="signup-email" />
            </div>
            <div className="input-group">
              <label className="input-label">Password</label>
              <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 6 characters" required minLength={6} id="signup-password" />
            </div>
            <div className="input-group">
              <label className="input-label">Role</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {[{v:'admin',l:'Brand Admin'},{v:'influencer',l:'Influencer'},{v:'finance',l:'Finance'}].map(r => (
                  <button key={r.v} type="button" onClick={() => setRole(r.v)}
                    className={`btn ${role === r.v ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                    style={{ flex: 1 }}>{r.l}</button>
                ))}
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-lg" disabled={loading} id="signup-submit" style={{ width: '100%' }}>
              {loading ? <span className="spinner" /> : <>Create Account <ArrowRight size={18} /></>}
            </button>
          </form>

          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: 14, marginTop: 24 }}>
            Already have an account? <Link to="/login" style={{ fontWeight: 600 }}>Sign in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
