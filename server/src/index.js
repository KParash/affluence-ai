import express from 'express';
import cors from 'cors';
import { initializeDb } from './db/database.js';
import authRoutes from './routes/auth.js';
import influencerRoutes from './routes/influencers.js';
import salesRoutes from './routes/sales.js';
import trackingRoutes from './routes/tracking.js';
import paymentRoutes from './routes/payments.js';
import analyticsRoutes from './routes/analytics.js';
import aiRoutes from './routes/ai.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: ['http://localhost:3000', 'http://localhost:5173'], credentials: true }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/influencers', influencerRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/track', trackingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ai', aiRoutes);
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Serve frontend in production
const clientDistPath = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDistPath));

app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

// Only start listening if not on Vercel
if (!process.env.VERCEL) {
  async function start() {
    await initializeDb();
    app.listen(PORT, () => {
      console.log(`\n🚀 AffluenceAI API Server running on http://localhost:${PORT}`);
      console.log(`   Health check: http://localhost:${PORT}/api/health\n`);
    });
  }
  start().catch(console.error);
}

// Export for Vercel serverless
export default app;
