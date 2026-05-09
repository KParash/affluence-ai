import { Link } from 'react-router-dom';
import { ArrowRight, BarChart3, Shield, Zap, Brain, CreditCard, TrendingUp, Users, Star } from 'lucide-react';
import { motion } from 'framer-motion';

const features = [
  { icon: <BarChart3 size={24} />, title: 'Real-Time Analytics', desc: 'Track clicks, conversions, and revenue with beautiful interactive dashboards updated in real time.' },
  { icon: <CreditCard size={24} />, title: 'Payment Management', desc: 'Automate commission calculations, manage payment lifecycle from pending to paid, and export reports.' },
  { icon: <Users size={24} />, title: 'Influencer Tracking', desc: 'Generate unique affiliate links, track performance per influencer, and identify your top performers.' },
  { icon: <Brain size={24} />, title: 'AI-Powered Insights', desc: 'Predict future sales, detect fraud, and get AI-generated performance recommendations.' },
  { icon: <Shield size={24} />, title: 'Fraud Detection', desc: 'Z-score anomaly detection flags suspicious click patterns, duplicate IPs, and conversion anomalies.' },
  { icon: <Zap size={24} />, title: 'Lightning Fast', desc: 'Built for speed with optimized queries, efficient data processing, and instant dashboard rendering.' },
];

const stats = [
  { value: '₹14L+', label: 'Revenue Tracked' },
  { value: '10+', label: 'Active Influencers' },
  { value: '3,600+', label: 'Clicks Tracked' },
  { value: '878+', label: 'Sales Recorded' },
];

export default function Landing() {
  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh' }}>
      {/* Nav */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 48px', borderBottom: '1px solid var(--border-subtle)', position: 'sticky', top: 0, background: 'rgba(10,10,15,0.8)', backdropFilter: 'blur(20px)', zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 22, fontWeight: 800 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--accent-gradient)', display: 'inline-block' }} />
          <span style={{ background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AffluenceAI</span>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link to="/login" className="btn btn-ghost">Login</Link>
          <Link to="/signup" className="btn btn-primary">Get Started <ArrowRight size={16} /></Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ textAlign: 'center', padding: '100px 24px 80px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-50%', left: '50%', transform: 'translateX(-50%)', width: 800, height: 800, background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 30, padding: '6px 16px', fontSize: 13, fontWeight: 600, color: 'var(--accent-secondary)', marginBottom: 24 }}>
            <Star size={14} /> AI-Powered Influencer Platform
          </div>
          <h1 style={{ fontSize: 'clamp(36px, 5vw, 64px)', fontWeight: 900, lineHeight: 1.1, maxWidth: 800, margin: '0 auto 24px', letterSpacing: '-0.02em' }}>
            Track Influencer Sales.{' '}
            <span style={{ background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Maximize ROI.
            </span>
          </h1>
          <p style={{ fontSize: 18, color: 'var(--text-secondary)', maxWidth: 600, margin: '0 auto 40px', lineHeight: 1.7 }}>
            The all-in-one platform to track affiliate sales, manage payments, and get AI-powered insights that help brands maximize influencer marketing ROI.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/signup" className="btn btn-primary btn-lg">Start Free Trial <ArrowRight size={18} /></Link>
            <Link to="/login" className="btn btn-secondary btn-lg">View Demo Dashboard</Link>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, maxWidth: 700, margin: '80px auto 0', padding: '32px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)' }}>
          {stats.map((s, i) => (
            <div key={i}>
              <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-mono)', background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{s.value}</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Features */}
      <section style={{ padding: '80px 48px', maxWidth: 1200, margin: '0 auto' }}>
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
          <h2 style={{ fontSize: 36, fontWeight: 800, textAlign: 'center', marginBottom: 12 }}>
            Everything You Need to{' '}
            <span style={{ background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Scale</span>
          </h2>
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: 16, marginBottom: 48, maxWidth: 500, margin: '0 auto 48px' }}>
            From tracking to payments to AI insights — all under one roof.
          </p>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
          {features.map((f, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.1 }}
              className="card" style={{ cursor: 'default' }}>
              <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-md)', background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-secondary)', marginBottom: 16 }}>
                {f.icon}
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{f.title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* AI Section */}
      <section style={{ padding: '80px 48px', background: 'linear-gradient(180deg, transparent, rgba(124,58,237,0.03), transparent)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(236,72,153,0.1)', border: '1px solid rgba(236,72,153,0.3)', borderRadius: 20, padding: '4px 14px', fontSize: 12, fontWeight: 600, color: 'var(--accent-pink)', marginBottom: 16 }}>
              <Brain size={14} /> AI-POWERED
            </div>
            <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 16 }}>Intelligent Insights That Drive Growth</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 32, lineHeight: 1.7 }}>
              Our AI engine analyzes historical data to predict future sales, identify top-performing patterns, and detect fraudulent activity — all automatically.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { icon: <TrendingUp size={18} />, title: 'Sales Prediction', desc: '7/30 day forecasts with confidence intervals' },
                { icon: <BarChart3 size={18} />, title: 'Performance Insights', desc: 'AI detects patterns like "best on weekends"' },
                { icon: <Shield size={18} />, title: 'Fraud Detection', desc: 'Z-score analysis flags suspicious activity' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-secondary)', flexShrink: 0 }}>{item.icon}</div>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 2 }}>{item.title}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', padding: 32, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'var(--accent-gradient)' }} />
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>AI Insight Preview</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { icon: '📅', text: 'Priya Sharma performs 2.3x better on Saturdays', conf: 87 },
                { icon: '⚠️', text: 'Aditya Joshi: Abnormal click spike detected (Z-score: 4.2)', conf: 94 },
                { icon: '📈', text: 'Revenue trending upward with strong momentum', conf: 78 },
                { icon: '🎯', text: 'Sneha Reddy: 18.2% conversion rate — star performer', conf: 92 },
              ].map((insight, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: 10 }} whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }} transition={{ delay: 0.3 + i * 0.15 }}
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span style={{ fontSize: 18 }}>{insight.icon}</span>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{insight.text}</span>
                  </div>
                  <span className="badge badge-info" style={{ fontSize: 11, flexShrink: 0 }}>{insight.conf}%</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '80px 48px', textAlign: 'center' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          style={{ maxWidth: 600, margin: '0 auto', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', padding: '56px 48px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'var(--accent-gradient)' }} />
          <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12 }}>Ready to Maximize Your Influencer ROI?</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 32, fontSize: 15 }}>
            Join brands already using AffluenceAI to track, manage, and optimize their affiliate programs.
          </p>
          <Link to="/signup" className="btn btn-primary btn-lg">Get Started Free <ArrowRight size={18} /></Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '32px 48px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
        <span>© 2024 AffluenceAI. All rights reserved.</span>
        <span>Built with ❤️ for influencer marketing</span>
      </footer>
    </div>
  );
}
