import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { api } from '../lib/api';
import { useAuth } from '../lib/AuthContext';
import { motion } from 'framer-motion';
import { Download, FileText, CheckCircle, XCircle, Clock, DollarSign, AlertCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const formatCurrency = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

export default function Payments() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'finance';
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  const fetchPayments = () => {
    setLoading(true);
    const params = {};
    if (filter) params.status = filter;
    api.getPayments(params).then(d => {
      setPayments(d.payments || []);
      setSummary(d.summary || {});
    }).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { fetchPayments(); }, [filter]);

  const handleApprove = async (id) => {
    setActionLoading(id);
    try { await api.approvePayment(id); fetchPayments(); } catch (e) { alert(e.message); }
    setActionLoading(null);
  };

  const handlePay = async (id) => {
    setActionLoading(id);
    try { await api.payPayment(id, {}); fetchPayments(); } catch (e) { alert(e.message); }
    setActionLoading(null);
  };

  const handleReject = async (id) => {
    if (!confirm('Reject this payment?')) return;
    setActionLoading(id);
    try { await api.rejectPayment(id, { notes: 'Rejected by admin' }); fetchPayments(); } catch (e) { alert(e.message); }
    setActionLoading(null);
  };

  const handleExportCSV = async () => {
    try {
      const blob = await api.exportPayments({ status: filter || undefined });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'payments_export.csv'; a.click();
      URL.revokeObjectURL(url);
    } catch (e) { alert('Export failed: ' + e.message); }
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    // Header
    doc.setFontSize(20);
    doc.setTextColor(124, 58, 237);
    doc.text('AffluenceAI', 14, 22);
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text('Payment Report', 14, 30);
    doc.setFontSize(9);
    doc.text(`Generated: ${new Date().toLocaleDateString()} | Filter: ${filter || 'All'}`, 14, 36);

    // Summary
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text(`Pending: ${formatCurrency(summary.pending_total)}   |   Approved: ${formatCurrency(summary.approved_total)}   |   Paid: ${formatCurrency(summary.paid_total)}`, 14, 44);

    // Table
    const tableData = payments.map(p => [
      p.influencer_name,
      p.referral_code,
      formatCurrency(p.amount),
      p.status,
      `${p.period_start} to ${p.period_end}`,
      p.paid_at ? new Date(p.paid_at).toLocaleDateString() : '-',
      p.transaction_ref || '-',
    ]);

    autoTable(doc, {
      startY: 50,
      head: [['Influencer', 'Ref Code', 'Amount', 'Status', 'Period', 'Paid At', 'Transaction']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [124, 58, 237], textColor: 255, fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      alternateRowStyles: { fillColor: [245, 245, 255] },
      styles: { cellPadding: 3 },
    });

    doc.save('payments_report.pdf');
  };

  return (
    <Layout>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title">Payments</h1>
          <p className="page-subtitle">Manage commission payouts and payment history</p>
        </div>
        {isAdmin && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary btn-sm" onClick={handleExportCSV} id="export-csv">
              <Download size={16} /> CSV
            </button>
            <button className="btn btn-secondary btn-sm" onClick={handleExportPDF} id="export-pdf">
              <FileText size={16} /> PDF
            </button>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-3" style={{ marginBottom: 24 }}>
        {[
          { label: 'Pending', value: formatCurrency(summary.pending_total), icon: <Clock size={20} />, color: '#F59E0B', bg: 'var(--warning-bg)' },
          { label: 'Approved', value: formatCurrency(summary.approved_total), icon: <CheckCircle size={20} />, color: '#3B82F6', bg: 'var(--info-bg)' },
          { label: 'Paid', value: formatCurrency(summary.paid_total), icon: <DollarSign size={20} />, color: '#10B981', bg: 'var(--success-bg)' },
        ].map((card, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="kpi-card">
            <div className="kpi-icon" style={{ background: card.bg, color: card.color }}>{card.icon}</div>
            <div className="kpi-label">{card.label}</div>
            <div className="kpi-value" style={{ color: card.color }}>{card.value}</div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {['', 'pending', 'approved', 'paid', 'rejected'].map(s => (
          <button key={s} className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter(s)}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {/* Payments Table */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
        ) : payments.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon"><AlertCircle size={48} /></div><div className="empty-state-title">No payments found</div></div>
        ) : (
          <div className="table-container" style={{ border: 'none' }}>
            <table>
              <thead><tr>
                <th>Influencer</th><th>Amount</th><th>Period</th><th>Status</th>
                <th>Paid At</th><th>Transaction</th>{isAdmin && <th>Actions</th>}
              </tr></thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{p.influencer_name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{p.referral_code}</div>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 15 }}>{formatCurrency(p.amount)}</td>
                    <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{p.period_start}<br/>{p.period_end}</td>
                    <td>
                      <span className={`badge ${p.status === 'paid' ? 'badge-success' : p.status === 'approved' ? 'badge-info' : p.status === 'pending' ? 'badge-warning' : 'badge-danger'}`}>
                        {p.status}
                      </span>
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{p.paid_at ? new Date(p.paid_at).toLocaleDateString() : '—'}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>{p.transaction_ref || '—'}</td>
                    {isAdmin && (
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {p.status === 'pending' && (
                            <>
                              <button className="btn btn-success btn-sm" onClick={() => handleApprove(p.id)} disabled={actionLoading === p.id}>
                                <CheckCircle size={14} />
                              </button>
                              <button className="btn btn-danger btn-sm" onClick={() => handleReject(p.id)} disabled={actionLoading === p.id}>
                                <XCircle size={14} />
                              </button>
                            </>
                          )}
                          {p.status === 'approved' && (
                            <button className="btn btn-primary btn-sm" onClick={() => handlePay(p.id)} disabled={actionLoading === p.id}>
                              <DollarSign size={14} /> Pay
                            </button>
                          )}
                        </div>
                      </td>
                    )}
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
