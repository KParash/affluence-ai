import { Router } from 'express';
import { getDb } from '../db/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticateToken, async (req, res) => {
  const db = await getDb();
  const { status, influencerId, limit = 50, offset = 0 } = req.query;
  let conditions = [];
  let params = [];

  if (req.user.role === 'influencer') {
    const inf = db.prepare('SELECT id FROM influencers WHERE user_id = ?').get(req.user.id);
    if (inf) { conditions.push('p.influencer_id = ?'); params.push(inf.id); }
  } else if (influencerId) { conditions.push('p.influencer_id = ?'); params.push(parseInt(influencerId)); }
  if (status) { conditions.push('p.status = ?'); params.push(status); }

  const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

  const total = db.prepare(`SELECT COUNT(*) as total FROM payments p JOIN influencers i ON p.influencer_id = i.id JOIN users u ON i.user_id = u.id ${where}`).get(...params);

  const payments = db.prepare(`
    SELECT p.*, u.name as influencer_name, i.referral_code, u.email as influencer_email
    FROM payments p JOIN influencers i ON p.influencer_id = i.id JOIN users u ON i.user_id = u.id
    ${where} ORDER BY p.created_at DESC LIMIT ? OFFSET ?
  `).all(...params, parseInt(limit), parseInt(offset));

  const summary = db.prepare(`
    SELECT COALESCE(SUM(CASE WHEN status='pending' THEN amount ELSE 0 END),0) as pending_total,
      COALESCE(SUM(CASE WHEN status='approved' THEN amount ELSE 0 END),0) as approved_total,
      COALESCE(SUM(CASE WHEN status='paid' THEN amount ELSE 0 END),0) as paid_total
    FROM payments
  `).get();

  res.json({ payments, total: total.total, summary });
});

router.post('/generate', authenticateToken, requireRole('admin', 'finance'), async (req, res) => {
  const db = await getDb();
  const { periodStart, periodEnd } = req.body;
  if (!periodStart || !periodEnd) return res.status(400).json({ error: 'periodStart and periodEnd required' });

  const influencers = db.prepare("SELECT * FROM influencers WHERE status = 'active'").all();
  const results = [];
  for (const inf of influencers) {
    const existing = db.prepare('SELECT id FROM payments WHERE influencer_id = ? AND period_start = ? AND period_end = ?').get(inf.id, periodStart, periodEnd);
    if (existing) continue;
    const salesTotal = db.prepare("SELECT COALESCE(SUM(commission_amount), 0) as total FROM sales WHERE influencer_id = ? AND date BETWEEN ? AND ? AND status = 'completed'").get(inf.id, periodStart, periodEnd);
    if (salesTotal.total > 0) {
      const result = db.prepare("INSERT INTO payments (influencer_id, amount, status, period_start, period_end) VALUES (?, ?, 'pending', ?, ?)").run(inf.id, Math.round(salesTotal.total * 100) / 100, periodStart, periodEnd);
      results.push({ id: result.lastInsertRowid, influencer_id: inf.id, amount: salesTotal.total });
    }
  }
  res.status(201).json({ generated: results.length, payments: results });
});

router.patch('/:id/approve', authenticateToken, requireRole('admin', 'finance'), async (req, res) => {
  const db = await getDb();
  const payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(parseInt(req.params.id));
  if (!payment) return res.status(404).json({ error: 'Payment not found' });
  if (payment.status !== 'pending') return res.status(400).json({ error: 'Payment is not pending' });
  db.prepare("UPDATE payments SET status = 'approved' WHERE id = ?").run(parseInt(req.params.id));
  res.json({ message: 'Payment approved' });
});

router.patch('/:id/pay', authenticateToken, requireRole('admin', 'finance'), async (req, res) => {
  const db = await getDb();
  const payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(parseInt(req.params.id));
  if (!payment) return res.status(404).json({ error: 'Payment not found' });
  if (payment.status !== 'approved') return res.status(400).json({ error: 'Payment must be approved first' });
  const txRef = req.body.transactionRef || `TXN-${Date.now()}`;
  db.prepare("UPDATE payments SET status = 'paid', paid_at = datetime('now'), transaction_ref = ? WHERE id = ?").run(txRef, parseInt(req.params.id));
  res.json({ message: 'Payment marked as paid', transactionRef: txRef });
});

router.patch('/:id/reject', authenticateToken, requireRole('admin', 'finance'), async (req, res) => {
  const db = await getDb();
  const payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(parseInt(req.params.id));
  if (!payment) return res.status(404).json({ error: 'Payment not found' });
  db.prepare("UPDATE payments SET status = 'rejected', notes = ? WHERE id = ?").run(req.body.notes || '', parseInt(req.params.id));
  res.json({ message: 'Payment rejected' });
});

router.get('/export', authenticateToken, requireRole('admin', 'finance'), async (req, res) => {
  const db = await getDb();
  const { format = 'csv', status } = req.query;
  let query = `SELECT p.id, u.name as influencer_name, u.email as influencer_email, i.referral_code, p.amount, p.status, p.period_start, p.period_end, p.paid_at, p.transaction_ref FROM payments p JOIN influencers i ON p.influencer_id = i.id JOIN users u ON i.user_id = u.id`;
  const params = [];
  if (status) { query += ' WHERE p.status = ?'; params.push(status); }
  query += ' ORDER BY p.created_at DESC';
  const payments = db.prepare(query).all(...params);

  if (format === 'csv') {
    const csv = ['ID,Influencer,Email,Referral Code,Amount,Status,Period Start,Period End,Paid At,Transaction Ref',
      ...payments.map(p => `${p.id},"${p.influencer_name}",${p.influencer_email},${p.referral_code},${p.amount},${p.status},${p.period_start},${p.period_end},${p.paid_at||''},${p.transaction_ref||''}`)
    ].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=payments_export.csv');
    return res.send(csv);
  }
  res.json({ payments });
});

export default router;
