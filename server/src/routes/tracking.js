import { Router } from 'express';
import { getDb } from '../db/database.js';

const router = Router();

router.get('/:referralCode', async (req, res) => {
  const db = await getDb();
  const { referralCode } = req.params;
  const influencer = db.prepare('SELECT * FROM influencers WHERE referral_code = ?').get(referralCode);
  if (!influencer) return res.status(404).json({ error: 'Invalid referral code' });

  const ip = req.headers['x-forwarded-for'] || req.connection?.remoteAddress || '';
  const userAgent = req.headers['user-agent'] || '';
  const recentClick = db.prepare("SELECT id FROM clicks WHERE influencer_id = ? AND ip_address = ? AND timestamp >= datetime('now', '-24 hours')").get(influencer.id, ip);

  db.prepare("INSERT INTO clicks (influencer_id, product_id, ip_address, user_agent, is_unique, timestamp) VALUES (?, ?, ?, ?, ?, datetime('now'))").run(influencer.id, req.query.product ? parseInt(req.query.product) : null, ip, userAgent, recentClick ? 0 : 1);

  res.json({ message: 'Click tracked', redirect: `https://store.affluenceai.com?ref=${referralCode}` });
});

router.post('/conversion', async (req, res) => {
  const db = await getDb();
  const { referralCode, amount, productId, customerEmail, orderId } = req.body;
  if (!referralCode || !amount) return res.status(400).json({ error: 'referralCode and amount required' });

  const influencer = db.prepare('SELECT * FROM influencers WHERE referral_code = ?').get(referralCode);
  if (!influencer) return res.status(404).json({ error: 'Invalid referral code' });

  const commissionAmount = Math.round(amount * influencer.commission_rate * 100) / 100;
  const result = db.prepare(
    "INSERT INTO sales (influencer_id, product_id, order_id, amount, commission_amount, customer_email, date, status) VALUES (?, ?, ?, ?, ?, ?, datetime('now'), 'completed')"
  ).run(influencer.id, productId ? parseInt(productId) : null, orderId || `ORD-${Date.now()}`, amount, commissionAmount, customerEmail || '');

  db.prepare('UPDATE influencers SET total_earnings = total_earnings + ? WHERE id = ?').run(commissionAmount, influencer.id);
  res.status(201).json({ message: 'Conversion recorded', sale: { id: result.lastInsertRowid, amount, commission: commissionAmount } });
});

export default router;
