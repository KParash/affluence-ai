import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { api } from '../lib/api';
import { motion } from 'framer-motion';
import { Search, ExternalLink } from 'lucide-react';

const formatCurrency = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

const platformColors = { Instagram: '#E1306C', YouTube: '#FF0000', Twitter: '#1DA1F2', Twitch: '#9146FF', TikTok: '#000' };

export default function Influencers() {
  const [influencers, setInfluencers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.getInfluencers().then(d => setInfluencers(d.influencers)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const filtered = influencers.filter(i => i.name?.toLowerCase().includes(search.toLowerCase()) || i.referral_code?.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <Layout><div className="loading-screen" style={{ minHeight: 'auto', padding: 48 }}><div className="spinner" /></div></Layout>;

  return (
    <Layout>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title">Influencers</h1>
          <p className="page-subtitle">Manage and monitor your affiliate partners</p>
        </div>
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search influencers..." style={{ paddingLeft: 36, width: 280 }} id="search-influencers" />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
        {filtered.map((inf, i) => {
          const convRate = inf.total_clicks > 0 ? ((inf.total_sales / inf.total_clicks) * 100).toFixed(1) : '0.0';
          return (
            <motion.div key={inf.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="card" style={{ cursor: 'default' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700 }}>
                    {inf.name?.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{inf.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{inf.email}</div>
                  </div>
                </div>
                <span className={`badge ${inf.status === 'active' ? 'badge-success' : 'badge-neutral'}`}>{inf.status}</span>
              </div>

              <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                <span className="badge badge-info" style={{ background: `${platformColors[inf.platform] || '#6366F1'}20`, color: platformColors[inf.platform] || '#6366F1' }}>{inf.platform}</span>
                <span className="badge badge-neutral">{inf.niche}</span>
                <span className="badge badge-neutral">{(inf.followers / 1000).toFixed(0)}K followers</span>
              </div>

              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--accent-secondary)', background: 'rgba(124,58,237,0.08)', padding: '6px 12px', borderRadius: 'var(--radius-sm)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                <ExternalLink size={12} />
                ref={inf.referral_code}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', padding: '8px 12px' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Revenue</div>
                  <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: 14 }}>{formatCurrency(inf.total_revenue)}</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', padding: '8px 12px' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Sales</div>
                  <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: 14 }}>{inf.total_sales}</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', padding: '8px 12px' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Clicks</div>
                  <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: 14 }}>{inf.total_clicks}</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', padding: '8px 12px' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Conv. Rate</div>
                  <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: 14, color: parseFloat(convRate) > 10 ? 'var(--success)' : parseFloat(convRate) < 3 ? 'var(--danger)' : 'var(--text-primary)' }}>{convRate}%</div>
                </div>
              </div>

              <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Commission: {(inf.commission_rate * 100).toFixed(0)}%</span>
                <span style={{ fontSize: 12, color: 'var(--success)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>Earned: {formatCurrency(inf.total_earnings)}</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </Layout>
  );
}
