import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { api } from '../lib/api';
import { useAuth } from '../lib/AuthContext';
import { motion } from 'framer-motion';
import { Copy, Check, DollarSign, MousePointerClick, ShoppingBag, TrendingUp } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const formatCurrency = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

export default function InfluencerDashboard() {
  const { influencer } = useAuth();
  const [stats, setStats] = useState(null);
  const [payments, setPayments] = useState(null);
  const [insights, setInsights] = useState([]);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!influencer) return;
    Promise.all([
      api.getInfluencerStats(influencer.id),
      api.getPayments(),
      api.getInsights(influencer.id),
    ]).then(([s, p, i]) => {
      setStats(s);
      setPayments(p);
      setInsights(i.insights || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, [influencer]);

  const copyLink = () => {
    navigator.clipboard.writeText(`https://store.affluenceai.com?ref=${influencer?.referral_code}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading || !stats) return (
    <Layout><div className="loading-screen" style={{ minHeight: 'auto', padding: 48 }}><div className="spinner" /></div></Layout>
  );

  const { influencer: inf, stats: s, salesTimeline } = stats;

  return (
    <Layout>
      <div className="page-header">
        <h1 className="page-title">Welcome, {inf.name} 👋</h1>
        <p className="page-subtitle">Your affiliate performance at a glance</p>
      </div>

      {/* Affiliate Link */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ marginBottom: 24, background: 'linear-gradient(135deg, rgba(124,58,237,0.08), rgba(236,72,153,0.05))' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>Your Affiliate Link</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--accent-secondary)' }}>
              https://store.affluenceai.com?ref=<strong>{inf.referral_code}</strong>
            </div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={copyLink}>
            {copied ? <><Check size={16} /> Copied!</> : <><Copy size={16} /> Copy Link</>}
          </button>
        </div>
      </motion.div>

      {/* KPIs */}
      <div className="grid grid-4" style={{ marginBottom: 24 }}>
        {[
          { label: 'Total Earnings', value: formatCurrency(s.total_commission), icon: <DollarSign size={20} />, color: '#10B981' },
          { label: 'Total Sales', value: s.total_sales, icon: <ShoppingBag size={20} />, color: '#7C3AED' },
          { label: 'Total Clicks', value: s.total_clicks, icon: <MousePointerClick size={20} />, color: '#3B82F6' },
          { label: 'Conversion Rate', value: `${s.conversion_rate}%`, icon: <TrendingUp size={20} />, color: '#F59E0B' },
        ].map((kpi, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="kpi-card">
            <div className="kpi-icon" style={{ background: `${kpi.color}15`, color: kpi.color }}>{kpi.icon}</div>
            <div className="kpi-label">{kpi.label}</div>
            <div className="kpi-value">{kpi.value}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-2" style={{ marginBottom: 24 }}>
        {/* Earnings Chart */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card">
          <div className="card-header"><div className="card-title">Earnings (Last 30 Days)</div></div>
          <div className="chart-container">
            <ResponsiveContainer>
              <AreaChart data={salesTimeline}>
                <defs>
                  <linearGradient id="earningsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={d => d?.slice(5)} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip />
                <Area type="monotone" dataKey="revenue" stroke="#10B981" fill="url(#earningsGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* AI Insights */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="card">
          <div className="card-header"><div className="card-title">🤖 AI Performance Insights</div></div>
          {insights.length === 0 ? (
            <div className="empty-state"><div className="empty-state-icon">🧠</div><div>No insights yet</div></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {insights.map((insight, i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '12px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{insight.icon} {insight.title}</span>
                    <span className={`badge ${insight.type === 'success' ? 'badge-success' : insight.type === 'warning' ? 'badge-warning' : 'badge-info'}`} style={{ fontSize: 11 }}>{insight.confidence}%</span>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{insight.text}</p>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Payment History */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="card">
        <div className="card-header"><div className="card-title">Payment History</div></div>
        {payments?.payments?.length === 0 ? (
          <div className="empty-state">No payments yet</div>
        ) : (
          <div className="table-container">
            <table>
              <thead><tr><th>Period</th><th>Amount</th><th>Status</th><th>Paid At</th><th>Transaction Ref</th></tr></thead>
              <tbody>
                {payments?.payments?.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontSize: 13 }}>{p.period_start} — {p.period_end}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{formatCurrency(p.amount)}</td>
                    <td><span className={`badge ${p.status === 'paid' ? 'badge-success' : p.status === 'approved' ? 'badge-info' : p.status === 'pending' ? 'badge-warning' : 'badge-danger'}`}>{p.status}</span></td>
                    <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{p.paid_at || '—'}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)' }}>{p.transaction_ref || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </Layout>
  );
}
