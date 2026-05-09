import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { api } from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, TrendingUp, Shield, AlertTriangle, Sparkles, ChevronRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const formatCurrency = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

export default function AiInsights() {
  const [predictions, setPredictions] = useState(null);
  const [insights, setInsights] = useState([]);
  const [fraud, setFraud] = useState(null);
  const [activeTab, setActiveTab] = useState('predictions');
  const [predDays, setPredDays] = useState(7);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getPredictions(predDays),
      api.getInsights(),
      api.getFraudDetection(),
    ]).then(([p, i, f]) => {
      setPredictions(p);
      setInsights(i.insights || []);
      setFraud(f);
    }).catch(console.error).finally(() => setLoading(false));
  }, [predDays]);

  const tabs = [
    { key: 'predictions', label: 'Sales Prediction', icon: <TrendingUp size={16} /> },
    { key: 'insights', label: 'Performance Insights', icon: <Sparkles size={16} /> },
    { key: 'fraud', label: 'Fraud Detection', icon: <Shield size={16} /> },
  ];

  if (loading) return (
    <Layout>
      <div className="loading-screen" style={{ minHeight: 'auto', padding: 48, flexDirection: 'row', gap: 12 }}>
        <Brain size={24} className="spinner" style={{ border: 'none', animation: 'pulse 1.5s infinite', color: 'var(--accent-primary)' }} />
        <span style={{ color: 'var(--text-secondary)' }}>AI is analyzing your data...</span>
      </div>
    </Layout>
  );

  // Merge historical + predictions for chart
  const chartData = [
    ...(predictions?.historical || []).map(d => ({ date: d.day, revenue: d.revenue, type: 'historical' })),
    ...(predictions?.predictions || []).map(d => ({ date: d.date, revenue: d.predicted_revenue, low: d.confidence_low, high: d.confidence_high, type: 'predicted' })),
  ];

  const lastHistorical = predictions?.historical?.[predictions.historical.length - 1]?.day;

  return (
    <Layout>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Brain size={22} />
          </div>
          <div>
            <h1 className="page-title">AI Insights</h1>
            <p className="page-subtitle">AI-powered analytics and predictions</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'var(--bg-secondary)', padding: 4, borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', width: 'fit-content' }}>
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`btn btn-sm ${activeTab === tab.key ? 'btn-primary' : 'btn-ghost'}`}
            style={{ gap: 6, borderRadius: 'var(--radius-md)' }}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* PREDICTIONS TAB */}
        {activeTab === 'predictions' && predictions && (
          <motion.div key="pred" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {/* Summary Card */}
            <div className="card" style={{ marginBottom: 20, background: 'linear-gradient(135deg, rgba(124,58,237,0.06), rgba(236,72,153,0.03))', borderLeft: '3px solid var(--accent-primary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>🤖 AI Summary</div>
                  <div style={{ fontSize: 15, fontWeight: 500 }}>{predictions.summary}</div>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Confidence</div>
                    <div style={{ fontSize: 24, fontWeight: 800, fontFamily: 'var(--font-mono)', color: predictions.confidence > 50 ? 'var(--success)' : 'var(--warning)' }}>{predictions.confidence}%</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Trend</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: predictions.trend?.direction === 'upward' ? 'var(--success)' : 'var(--danger)', textTransform: 'capitalize' }}>
                      {predictions.trend?.direction} ({predictions.trend?.strength})
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Prediction Range Toggle */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {[7, 14, 30].map(d => (
                <button key={d} className={`btn btn-sm ${predDays === d ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setPredDays(d)}>
                  Next {d} days
                </button>
              ))}
            </div>

            {/* Prediction Chart */}
            <div className="card">
              <div className="card-header"><div className="card-title">Revenue Forecast</div><div className="card-subtitle">Historical data + AI predictions with confidence bands</div></div>
              <div className="chart-container-lg">
                <ResponsiveContainer>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="histGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#7C3AED" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="#7C3AED" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="predGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#EC4899" stopOpacity={0.15} />
                        <stop offset="100%" stopColor="#EC4899" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="confGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#EC4899" stopOpacity={0.08} />
                        <stop offset="100%" stopColor="#EC4899" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748B' }} tickFormatter={d => d?.slice(5)} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                    <Tooltip />
                    {lastHistorical && <ReferenceLine x={lastHistorical} stroke="var(--accent-primary)" strokeDasharray="5 5" label={{ value: 'Today', fontSize: 11, fill: '#94A3B8' }} />}
                    <Area type="monotone" dataKey="high" stroke="none" fill="url(#confGrad)" />
                    <Area type="monotone" dataKey="low" stroke="none" fill="transparent" />
                    <Area type="monotone" dataKey="revenue" stroke="#7C3AED" fill="url(#histGrad)" strokeWidth={2} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Prediction Table */}
            <div className="card" style={{ marginTop: 16 }}>
              <div className="card-header"><div className="card-title">Daily Predictions</div></div>
              <div className="table-container">
                <table>
                  <thead><tr><th>Date</th><th>Predicted Revenue</th><th>Predicted Sales</th><th>Confidence Range</th></tr></thead>
                  <tbody>
                    {predictions.predictions?.slice(0, 10).map(p => (
                      <tr key={p.date}>
                        <td style={{ fontWeight: 500 }}>{p.date}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--accent-secondary)' }}>{formatCurrency(p.predicted_revenue)}</td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{p.predicted_sales}</td>
                        <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{formatCurrency(p.confidence_low)} — {formatCurrency(p.confidence_high)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* INSIGHTS TAB */}
        {activeTab === 'insights' && (
          <motion.div key="ins" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div style={{ display: 'grid', gap: 12 }}>
              {insights.length === 0 ? (
                <div className="card"><div className="empty-state"><div className="empty-state-icon">🧠</div><div className="empty-state-title">No insights generated yet</div><div>More data is needed for AI analysis</div></div></div>
              ) : insights.map((insight, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                  className="card" style={{
                    borderLeft: `3px solid ${insight.type === 'success' ? 'var(--success)' : insight.type === 'warning' ? 'var(--warning)' : 'var(--info)'}`,
                    background: insight.type === 'success' ? 'rgba(16,185,129,0.03)' : insight.type === 'warning' ? 'rgba(245,158,11,0.03)' : 'rgba(59,130,246,0.03)',
                  }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flex: 1 }}>
                      <span style={{ fontSize: 24, flexShrink: 0 }}>{insight.icon}</span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{insight.title}</div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>{insight.text}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                      <span className={`badge ${insight.priority === 'high' ? 'badge-danger' : 'badge-neutral'}`}>{insight.priority}</span>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Confidence: {insight.confidence}%</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* FRAUD TAB */}
        {activeTab === 'fraud' && fraud && (
          <motion.div key="fraud" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {/* Fraud Summary */}
            <div className="grid grid-4" style={{ marginBottom: 20 }}>
              {[
                { label: 'Total Alerts', value: fraud.summary?.total_alerts || 0, color: '#F59E0B' },
                { label: 'Critical', value: fraud.summary?.critical || 0, color: '#EF4444' },
                { label: 'High Risk', value: fraud.summary?.high || 0, color: '#F97316' },
                { label: 'High Risk Influencers', value: fraud.summary?.high_risk_influencers || 0, color: '#EC4899' },
              ].map((s, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="kpi-card">
                  <div className="kpi-label">{s.label}</div>
                  <div className="kpi-value" style={{ color: s.color }}>{s.value}</div>
                </motion.div>
              ))}
            </div>

            {/* Risk Assessment */}
            {fraud.riskAssessment?.length > 0 && (
              <div className="card" style={{ marginBottom: 20 }}>
                <div className="card-header"><div className="card-title">🎯 Risk Assessment by Influencer</div></div>
                <div className="table-container">
                  <table>
                    <thead><tr><th>Influencer</th><th>Risk Score</th><th>Risk Level</th><th>Alerts</th></tr></thead>
                    <tbody>
                      {fraud.riskAssessment.map(r => (
                        <tr key={r.influencer_id}>
                          <td style={{ fontWeight: 500 }}>{r.influencer_name}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ width: 80, height: 6, background: 'var(--bg-tertiary)', borderRadius: 3, overflow: 'hidden' }}>
                                <div style={{ width: `${r.risk_score}%`, height: '100%', background: r.risk_level === 'High' ? 'var(--danger)' : r.risk_level === 'Medium' ? 'var(--warning)' : 'var(--success)', borderRadius: 3, transition: 'width 1s ease' }} />
                              </div>
                              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600 }}>{r.risk_score}</span>
                            </div>
                          </td>
                          <td><span className={`badge ${r.risk_level === 'High' ? 'badge-danger' : r.risk_level === 'Medium' ? 'badge-warning' : 'badge-success'}`}>{r.risk_level}</span></td>
                          <td style={{ fontFamily: 'var(--font-mono)' }}>{r.alert_count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Alert Details */}
            <div className="card">
              <div className="card-header"><div className="card-title">⚠️ Fraud Alerts</div></div>
              {fraud.alerts?.length === 0 ? (
                <div className="empty-state" style={{ padding: 24 }}>
                  <Shield size={40} style={{ color: 'var(--success)', marginBottom: 8 }} />
                  <div className="empty-state-title">All Clear!</div>
                  <div style={{ color: 'var(--text-secondary)' }}>No fraud alerts detected</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {fraud.alerts?.map((alert, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                      style={{
                        background: alert.severity === 'critical' ? 'rgba(239,68,68,0.06)' : alert.severity === 'high' ? 'rgba(249,115,22,0.04)' : 'rgba(245,158,11,0.03)',
                        border: `1px solid ${alert.severity === 'critical' ? 'rgba(239,68,68,0.2)' : 'var(--border-subtle)'}`,
                        borderRadius: 'var(--radius-md)', padding: '14px 18px',
                      }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <AlertTriangle size={16} style={{ color: alert.severity === 'critical' ? 'var(--danger)' : 'var(--warning)' }} />
                          <span style={{ fontWeight: 600, fontSize: 13 }}>{alert.influencer_name}</span>
                          <span className={`badge ${alert.severity === 'critical' ? 'badge-danger' : alert.severity === 'high' ? 'badge-warning' : 'badge-neutral'}`} style={{ fontSize: 11 }}>{alert.severity}</span>
                        </div>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{alert.date}</span>
                      </div>
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{alert.details}</p>
                      <div style={{ marginTop: 6, fontSize: 12, color: 'var(--text-muted)' }}>
                        Type: {alert.type.replace('_', ' ')}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
}
