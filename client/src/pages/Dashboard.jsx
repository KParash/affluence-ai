import { useState, useEffect, useRef, useCallback } from 'react';
import Layout from '../components/Layout';
import { api } from '../lib/api';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, Users, MousePointerClick, ArrowUpRight, ArrowDownRight, RefreshCw, Filter } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, FunnelChart, Funnel, LabelList } from 'recharts';

const COLORS = ['#7C3AED', '#EC4899', '#3B82F6', '#10B981', '#F59E0B', '#6366F1', '#14B8A6', '#F97316', '#8B5CF6', '#EF4444'];

const formatCurrency = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '10px 14px', fontSize: 13 }}>
      <div style={{ color: 'var(--text-secondary)', marginBottom: 6 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />
          <span>{p.name}: {p.name.toLowerCase().includes('revenue') || p.name.toLowerCase().includes('commission') ? formatCurrency(p.value) : p.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const intervalRef = useRef(null);

  const fetchData = useCallback((showSpinner = false) => {
    if (showSpinner) setLoading(true);
    setRefreshing(true);
    api.getDashboard(days)
      .then(d => { setData(d); setLastRefresh(new Date()); })
      .catch(console.error)
      .finally(() => { setLoading(false); setRefreshing(false); });
  }, [days]);

  useEffect(() => {
    fetchData(true);
    // Auto-refresh every 30 seconds
    intervalRef.current = setInterval(() => fetchData(false), 30000);
    return () => clearInterval(intervalRef.current);
  }, [fetchData]);

  if (loading || !data) return (
    <Layout>
      <div className="loading-screen" style={{ minHeight: 'auto', padding: 48 }}>
        <div className="spinner" /><span style={{ color: 'var(--text-secondary)' }}>Loading dashboard...</span>
      </div>
    </Layout>
  );

  const { kpis, dailySales, topInfluencers, revenueSplit, recentSales } = data;

  const kpiCards = [
    { label: 'Total Revenue', value: formatCurrency(kpis.totalRevenue), change: kpis.revenueGrowth, icon: <DollarSign size={20} />, color: '#7C3AED' },
    { label: 'Total Sales', value: kpis.totalSales.toLocaleString(), change: null, icon: <TrendingUp size={20} />, color: '#10B981' },
    { label: 'Active Influencers', value: kpis.activeInfluencers, change: null, icon: <Users size={20} />, color: '#3B82F6' },
    { label: 'Conversion Rate', value: `${kpis.conversionRate}%`, change: null, icon: <MousePointerClick size={20} />, color: '#F59E0B' },
  ];

  return (
    <Layout>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Overview of your influencer program performance</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className={`btn btn-ghost btn-icon ${refreshing ? 'spinning' : ''}`} onClick={() => fetchData(false)} title="Refresh now" style={{ position: 'relative' }}>
            <RefreshCw size={16} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          </button>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Updated {lastRefresh.toLocaleTimeString()}</span>
          {[7, 30, 90].map(d => (
            <button key={d} className={`btn btn-sm ${days === d ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setDays(d)}>
              {d}D
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-4" style={{ marginBottom: 24 }}>
        {kpiCards.map((kpi, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="kpi-card">
            <div className="kpi-icon" style={{ background: `${kpi.color}15`, color: kpi.color }}>{kpi.icon}</div>
            <div className="kpi-label">{kpi.label}</div>
            <div className="kpi-value">{kpi.value}</div>
            {kpi.change !== null && (
              <div className={`kpi-change ${kpi.change >= 0 ? 'positive' : 'negative'}`}>
                {kpi.change >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {Math.abs(kpi.change)}% vs prev
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Charts Row 1: Revenue Over Time + Top Influencers */}
      <div className="grid grid-2" style={{ marginBottom: 24 }}>
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card">
          <div className="card-header">
            <div><div className="card-title">Revenue Over Time</div><div className="card-subtitle">Daily revenue for the last {days} days</div></div>
          </div>
          <div className="chart-container">
            <ResponsiveContainer>
              <AreaChart data={dailySales}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7C3AED" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#7C3AED" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={d => d?.slice(5)} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#7C3AED" fill="url(#revenueGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="card">
          <div className="card-header">
            <div><div className="card-title">Top Influencers</div><div className="card-subtitle">By revenue generated</div></div>
          </div>
          <div className="chart-container">
            <ResponsiveContainer>
              <BarChart data={topInfluencers.slice(0, 6)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#94A3B8' }} width={90} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="revenue" name="Revenue" radius={[0, 4, 4, 0]}>
                  {topInfluencers.slice(0, 6).map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Charts Row 2: Revenue Split + Recent Sales */}
      <div className="grid grid-2" style={{ marginBottom: 24 }}>
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="card">
          <div className="card-header">
            <div><div className="card-title">Revenue Split</div><div className="card-subtitle">Revenue distribution by influencer</div></div>
          </div>
          <div className="chart-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={revenueSplit.slice(0, 8)} cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={2} dataKey="revenue" nameKey="name">
                  {revenueSplit.slice(0, 8).map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginTop: 8 }}>
            {revenueSplit.slice(0, 6).map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[i] }} />
                {item.name}
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="card">
          <div className="card-header">
            <div><div className="card-title">Recent Sales</div><div className="card-subtitle">Latest transactions</div></div>
          </div>
          <div style={{ maxHeight: 340, overflow: 'auto' }}>
            <div className="table-container">
              <table>
                <thead><tr><th>Influencer</th><th>Product</th><th>Amount</th><th>Status</th></tr></thead>
                <tbody>
                  {recentSales.slice(0, 10).map(sale => (
                    <tr key={sale.id}>
                      <td style={{ fontWeight: 500 }}>{sale.influencer_name}</td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{sale.product_name || 'N/A'}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{formatCurrency(sale.amount)}</td>
                      <td><span className={`badge ${sale.status === 'completed' ? 'badge-success' : sale.status === 'refunded' ? 'badge-danger' : 'badge-warning'}`}>{sale.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Conversion Funnel */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }} className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <div><div className="card-title"><Filter size={16} style={{ display: 'inline', marginRight: 8, verticalAlign: 'text-bottom' }} />Conversion Funnel</div><div className="card-subtitle">Click → Unique Visitor → Sale → Commission pipeline</div></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, position: 'relative' }}>
          {[
            { label: 'Total Clicks', value: kpis.totalClicks, color: '#6366F1', pct: '100%' },
            { label: 'Unique Visitors', value: kpis.uniqueClicks || 0, color: '#3B82F6', pct: kpis.totalClicks > 0 ? `${((kpis.uniqueClicks || 0) / kpis.totalClicks * 100).toFixed(1)}%` : '0%' },
            { label: 'Conversions', value: kpis.totalSales, color: '#10B981', pct: kpis.totalClicks > 0 ? `${(kpis.totalSales / kpis.totalClicks * 100).toFixed(1)}%` : '0%' },
            { label: 'Revenue', value: formatCurrency(kpis.totalRevenue), color: '#7C3AED', pct: null },
          ].map((stage, i, arr) => {
            const maxVal = arr[0].value || 1;
            const width = typeof stage.value === 'number' ? Math.max(20, (stage.value / maxVal) * 100) : 60;
            return (
              <div key={i} style={{ textAlign: 'center', padding: '16px 8px', position: 'relative' }}>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 500 }}>{stage.label}</div>
                <div style={{
                  width: `${width}%`, height: 48, margin: '0 auto', borderRadius: 'var(--radius-md)',
                  background: `${stage.color}20`, border: `2px solid ${stage.color}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.5s ease',
                }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 16, color: stage.color }}>
                    {typeof stage.value === 'number' ? stage.value.toLocaleString() : stage.value}
                  </span>
                </div>
                {stage.pct && (
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>{stage.pct} of clicks</div>
                )}
                {i < arr.length - 1 && (
                  <div style={{ position: 'absolute', right: -8, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 18, fontWeight: 300 }}>→</div>
                )}
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Additional KPIs Row */}
      <div className="grid grid-4" style={{ marginBottom: 24 }}>
        {[
          { label: 'Avg Order Value', value: formatCurrency(kpis.avgOrderValue), color: '#6366F1' },
          { label: 'Commission Rate', value: `${kpis.totalRevenue > 0 ? ((kpis.totalCommissions / kpis.totalRevenue) * 100).toFixed(1) : 0}%`, color: '#14B8A6' },
          { label: 'Total Commissions', value: formatCurrency(kpis.totalCommissions), color: '#EC4899' },
          { label: 'Pending Payments', value: formatCurrency(kpis.pendingPayments), color: '#F59E0B' },
        ].map((kpi, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 + i * 0.05 }} className="kpi-card">
            <div className="kpi-label">{kpi.label}</div>
            <div className="kpi-value" style={{ fontSize: 22, color: kpi.color }}>{kpi.value}</div>
          </motion.div>
        ))}
      </div>
    </Layout>
  );
}
