import { Router } from 'express';
import { getDb } from '../db/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.get('/dashboard', authenticateToken, async (req, res) => {
  const db = await getDb();
  const days = parseInt(req.query.days || 30);

  const currentPeriod = db.prepare(`
    SELECT COALESCE(SUM(amount),0) as total_revenue, COALESCE(SUM(commission_amount),0) as total_commissions,
      COUNT(*) as total_sales, COALESCE(AVG(amount),0) as avg_order_value
    FROM sales WHERE date >= datetime('now','-${days} days') AND status='completed'
  `).get();

  const previousPeriod = db.prepare(`
    SELECT COALESCE(SUM(amount),0) as total_revenue, COUNT(*) as total_sales
    FROM sales WHERE date >= datetime('now','-${days*2} days') AND date < datetime('now','-${days} days') AND status='completed'
  `).get();

  const revenueGrowth = previousPeriod.total_revenue > 0
    ? ((currentPeriod.total_revenue - previousPeriod.total_revenue) / previousPeriod.total_revenue * 100).toFixed(1) : 100;

  const totalClicks = db.prepare(`
    SELECT COUNT(*) as total, COALESCE(SUM(is_unique),0) as unique_clicks FROM clicks WHERE timestamp >= datetime('now','-${days} days')
  `).get();

  const conversionRate = totalClicks.total > 0 ? ((currentPeriod.total_sales / totalClicks.total) * 100).toFixed(2) : 0;
  const activeInfluencers = db.prepare("SELECT COUNT(*) as count FROM influencers WHERE status='active'").get();
  const pendingPayments = db.prepare("SELECT COALESCE(SUM(amount),0) as total FROM payments WHERE status='pending'").get();

  const dailySales = db.prepare(`
    SELECT DATE(date) as day, COUNT(*) as sales_count, SUM(amount) as revenue, SUM(commission_amount) as commission
    FROM sales WHERE date >= datetime('now','-${days} days') AND status='completed'
    GROUP BY DATE(date) ORDER BY day
  `).all();

  const topInfluencers = db.prepare(`
    SELECT i.id, u.name, i.referral_code, i.niche, i.platform,
      COUNT(s.id) as sales_count, COALESCE(SUM(s.amount),0) as revenue, COALESCE(SUM(s.commission_amount),0) as commission,
      (SELECT COUNT(*) FROM clicks WHERE influencer_id=i.id AND timestamp>=datetime('now','-${days} days')) as clicks
    FROM influencers i JOIN users u ON i.user_id=u.id
    LEFT JOIN sales s ON s.influencer_id=i.id AND s.status='completed' AND s.date>=datetime('now','-${days} days')
    GROUP BY i.id ORDER BY revenue DESC LIMIT 10
  `).all();

  const revenueSplit = db.prepare(`
    SELECT u.name, COALESCE(SUM(s.amount),0) as revenue
    FROM influencers i JOIN users u ON i.user_id=u.id
    LEFT JOIN sales s ON s.influencer_id=i.id AND s.status='completed' AND s.date>=datetime('now','-${days} days')
    GROUP BY i.id HAVING revenue > 0 ORDER BY revenue DESC
  `).all();

  const recentSales = db.prepare(`
    SELECT s.*, u.name as influencer_name, p.name as product_name, i.referral_code
    FROM sales s JOIN influencers i ON s.influencer_id=i.id JOIN users u ON i.user_id=u.id
    LEFT JOIN products p ON s.product_id=p.id ORDER BY s.date DESC LIMIT 20
  `).all();

  res.json({
    kpis: {
      totalRevenue: currentPeriod.total_revenue, totalCommissions: currentPeriod.total_commissions,
      totalSales: currentPeriod.total_sales, avgOrderValue: currentPeriod.avg_order_value,
      revenueGrowth: parseFloat(revenueGrowth), totalClicks: totalClicks.total,
      uniqueClicks: totalClicks.unique_clicks, conversionRate: parseFloat(conversionRate),
      activeInfluencers: activeInfluencers.count, pendingPayments: pendingPayments.total,
    },
    dailySales, topInfluencers, revenueSplit, recentSales,
  });
});

router.get('/top-influencers', authenticateToken, async (req, res) => {
  const db = await getDb();
  const { limit = 10, days = 30 } = req.query;
  const influencers = db.prepare(`
    SELECT i.id, u.name, i.referral_code, i.niche, i.platform, i.followers, i.commission_rate, i.total_earnings,
      COUNT(s.id) as period_sales, COALESCE(SUM(s.amount),0) as period_revenue,
      (SELECT COUNT(*) FROM clicks WHERE influencer_id=i.id AND timestamp>=datetime('now','-${parseInt(days)} days')) as period_clicks
    FROM influencers i JOIN users u ON i.user_id=u.id
    LEFT JOIN sales s ON s.influencer_id=i.id AND s.status='completed' AND s.date>=datetime('now','-${parseInt(days)} days')
    GROUP BY i.id ORDER BY period_revenue DESC LIMIT ?
  `).all(parseInt(limit));
  res.json({ influencers });
});

router.get('/conversion-rates', authenticateToken, async (req, res) => {
  const db = await getDb();
  const rates = db.prepare(`
    SELECT i.id, u.name, i.referral_code,
      (SELECT COUNT(*) FROM clicks WHERE influencer_id=i.id) as total_clicks,
      (SELECT COUNT(*) FROM sales WHERE influencer_id=i.id AND status='completed') as total_sales
    FROM influencers i JOIN users u ON i.user_id=u.id
  `).all();
  const withRates = rates.map(r => ({ ...r, conversion_rate: r.total_clicks > 0 ? parseFloat(((r.total_sales/r.total_clicks)*100).toFixed(2)) : 0 }));
  res.json({ rates: withRates.sort((a,b) => b.conversion_rate - a.conversion_rate) });
});

export default router;
