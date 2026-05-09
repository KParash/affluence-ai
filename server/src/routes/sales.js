import { Router } from 'express';
import { getDb } from '../db/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticateToken, async (req, res) => {
  const db = await getDb();
  const { influencerId, startDate, endDate, status, limit = 50, offset = 0 } = req.query;
  let conditions = [];
  let params = [];

  if (req.user.role === 'influencer') {
    const inf = db.prepare('SELECT id FROM influencers WHERE user_id = ?').get(req.user.id);
    if (inf) { conditions.push('s.influencer_id = ?'); params.push(inf.id); }
  } else if (influencerId) { conditions.push('s.influencer_id = ?'); params.push(parseInt(influencerId)); }
  if (startDate) { conditions.push('s.date >= ?'); params.push(startDate); }
  if (endDate) { conditions.push('s.date <= ?'); params.push(endDate); }
  if (status) { conditions.push('s.status = ?'); params.push(status); }

  const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

  const total = db.prepare(`SELECT COUNT(*) as total FROM sales s ${where}`).get(...params);
  const sales = db.prepare(`
    SELECT s.*, i.referral_code, u.name as influencer_name, p.name as product_name
    FROM sales s JOIN influencers i ON s.influencer_id = i.id JOIN users u ON i.user_id = u.id
    LEFT JOIN products p ON s.product_id = p.id ${where}
    ORDER BY s.date DESC LIMIT ? OFFSET ?
  `).all(...params, parseInt(limit), parseInt(offset));

  res.json({ sales, total: total.total, limit: parseInt(limit), offset: parseInt(offset) });
});

router.post('/', authenticateToken, async (req, res) => {
  const db = await getDb();
  const { influencerId, productId, amount, customerEmail, orderId } = req.body;
  if (!influencerId || !amount) return res.status(400).json({ error: 'influencerId and amount required' });

  const influencer = db.prepare('SELECT * FROM influencers WHERE id = ?').get(parseInt(influencerId));
  if (!influencer) return res.status(404).json({ error: 'Influencer not found' });

  const commissionAmount = Math.round(amount * influencer.commission_rate * 100) / 100;
  const result = db.prepare(
    "INSERT INTO sales (influencer_id, product_id, order_id, amount, commission_amount, customer_email, date, status) VALUES (?, ?, ?, ?, ?, ?, datetime('now'), 'completed')"
  ).run(parseInt(influencerId), productId ? parseInt(productId) : null, orderId || `ORD-${Date.now()}`, amount, commissionAmount, customerEmail || '');

  db.prepare('UPDATE influencers SET total_earnings = total_earnings + ? WHERE id = ?').run(commissionAmount, parseInt(influencerId));
  const sale = db.prepare('SELECT * FROM sales WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ sale });
});

router.get('/analytics', authenticateToken, async (req, res) => {
  const db = await getDb();
  const days = parseInt(req.query.days || 30);

  const dailySales = db.prepare(`
    SELECT DATE(date) as day, COUNT(*) as count, SUM(amount) as revenue, SUM(commission_amount) as commission
    FROM sales WHERE date >= datetime('now', '-${days} days') AND status = 'completed'
    GROUP BY DATE(date) ORDER BY day
  `).all();

  const byInfluencer = db.prepare(`
    SELECT i.id, u.name, i.referral_code,
      COUNT(s.id) as sales_count, COALESCE(SUM(s.amount), 0) as revenue, COALESCE(SUM(s.commission_amount), 0) as commission
    FROM influencers i JOIN users u ON i.user_id = u.id
    LEFT JOIN sales s ON s.influencer_id = i.id AND s.status = 'completed' AND s.date >= datetime('now', '-${days} days')
    GROUP BY i.id ORDER BY revenue DESC
  `).all();

  const byProduct = db.prepare(`
    SELECT p.id, p.name, COUNT(s.id) as sales_count, COALESCE(SUM(s.amount), 0) as revenue
    FROM products p LEFT JOIN sales s ON s.product_id = p.id AND s.status = 'completed' AND s.date >= datetime('now', '-${days} days')
    GROUP BY p.id ORDER BY revenue DESC
  `).all();

  res.json({ dailySales, byInfluencer, byProduct });
});

export default router;
