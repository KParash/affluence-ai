import { Router } from 'express';
import { getDb } from '../db/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticateToken, async (req, res) => {
  const db = await getDb();
  if (req.user.role === 'influencer') {
    const influencer = db.prepare(`
      SELECT i.*, u.name, u.email, u.avatar_url
      FROM influencers i JOIN users u ON i.user_id = u.id WHERE i.user_id = ?
    `).get(req.user.id);
    return res.json({ influencers: influencer ? [influencer] : [] });
  }
  const influencers = db.prepare(`
    SELECT i.*, u.name, u.email, u.avatar_url,
      (SELECT COUNT(*) FROM clicks WHERE influencer_id = i.id) as total_clicks,
      (SELECT COUNT(*) FROM sales WHERE influencer_id = i.id AND status = 'completed') as total_sales,
      (SELECT COALESCE(SUM(amount), 0) FROM sales WHERE influencer_id = i.id AND status = 'completed') as total_revenue
    FROM influencers i JOIN users u ON i.user_id = u.id ORDER BY i.total_earnings DESC
  `).all();
  res.json({ influencers });
});

router.get('/:id/stats', authenticateToken, async (req, res) => {
  const db = await getDb();
  const { id } = req.params;
  const influencer = db.prepare(`
    SELECT i.*, u.name, u.email, u.avatar_url
    FROM influencers i JOIN users u ON i.user_id = u.id WHERE i.id = ?
  `).get(parseInt(id));
  if (!influencer) return res.status(404).json({ error: 'Influencer not found' });

  if (req.user.role === 'influencer') {
    const ownInf = db.prepare('SELECT id FROM influencers WHERE user_id = ?').get(req.user.id);
    if (!ownInf || ownInf.id !== parseInt(id)) return res.status(403).json({ error: 'Access denied' });
  }

  const stats = db.prepare(`
    SELECT COUNT(*) as total_sales, COALESCE(SUM(amount), 0) as total_revenue,
      COALESCE(SUM(commission_amount), 0) as total_commission, COALESCE(AVG(amount), 0) as avg_order_value
    FROM sales WHERE influencer_id = ? AND status = 'completed'
  `).get(parseInt(id));

  const clicks = db.prepare('SELECT COUNT(*) as total, COALESCE(SUM(is_unique), 0) as unique_clicks FROM clicks WHERE influencer_id = ?').get(parseInt(id));
  const conversionRate = clicks.total > 0 ? ((stats.total_sales / clicks.total) * 100).toFixed(2) : 0;

  const salesTimeline = db.prepare(`
    SELECT DATE(date) as day, COUNT(*) as sales_count, SUM(amount) as revenue
    FROM sales WHERE influencer_id = ? AND date >= datetime('now', '-30 days') AND status = 'completed'
    GROUP BY DATE(date) ORDER BY day
  `).all(parseInt(id));

  res.json({ influencer, stats: { ...stats, total_clicks: clicks.total, unique_clicks: clicks.unique_clicks, conversion_rate: parseFloat(conversionRate) }, salesTimeline });
});

router.post('/generate-link', authenticateToken, async (req, res) => {
  const db = await getDb();
  const { productId } = req.body;
  let influencer;
  if (req.user.role === 'influencer') {
    influencer = db.prepare('SELECT * FROM influencers WHERE user_id = ?').get(req.user.id);
  } else {
    influencer = db.prepare('SELECT * FROM influencers WHERE id = ?').get(parseInt(req.body.influencerId));
  }
  if (!influencer) return res.status(404).json({ error: 'Influencer not found' });

  let baseUrl = 'https://store.affluenceai.com';
  if (productId) {
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(parseInt(productId));
    if (product && product.affiliate_url_base) baseUrl = product.affiliate_url_base;
  }
  res.json({ link: `${baseUrl}?ref=${influencer.referral_code}`, referralCode: influencer.referral_code, trackingUrl: `/api/track/${influencer.referral_code}` });
});

export default router;
