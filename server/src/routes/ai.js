import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { predictSales, generateInsights, detectFraud } from '../services/aiEngine.js';

const router = Router();

router.get('/predictions', authenticateToken, async (req, res) => {
  try {
    const result = await predictSales(parseInt(req.query.days || 7));
    res.json(result);
  } catch (err) {
    console.error('Prediction error:', err);
    res.status(500).json({ error: 'Failed to generate predictions' });
  }
});

router.get('/insights', authenticateToken, async (req, res) => {
  try {
    const insights = await generateInsights(req.query.influencerId ? parseInt(req.query.influencerId) : null);
    res.json({ insights });
  } catch (err) {
    console.error('Insights error:', err);
    res.status(500).json({ error: 'Failed to generate insights' });
  }
});

router.get('/fraud', authenticateToken, async (req, res) => {
  try {
    const result = await detectFraud();
    res.json(result);
  } catch (err) {
    console.error('Fraud detection error:', err);
    res.status(500).json({ error: 'Failed to run fraud detection' });
  }
});

export default router;
