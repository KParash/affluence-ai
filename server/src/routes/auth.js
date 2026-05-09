import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { getDb } from '../db/database.js';
import { generateToken, authenticateToken } from '../middleware/auth.js';

const router = Router();

router.post('/register', async (req, res) => {
  try {
    const { email, password, name, role = 'influencer' } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }
    if (!['admin', 'influencer', 'finance'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    const db = await getDb();
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const result = db.prepare(
      'INSERT INTO users (email, password_hash, role, name) VALUES (?, ?, ?, ?)'
    ).run(email, passwordHash, role, name);
    const user = db.prepare('SELECT id, email, role, name, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);

    if (role === 'influencer') {
      const referralCode = name.toUpperCase().replace(/\s+/g, '_') + '_' + Math.random().toString(36).substring(2, 6).toUpperCase();
      db.prepare('INSERT INTO influencers (user_id, referral_code) VALUES (?, ?)').run(user.id, referralCode);
    }

    const token = generateToken(user);
    res.status(201).json({ user, token });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const db = await getDb();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const { password_hash, ...userData } = user;
    let influencer = null;
    if (user.role === 'influencer') {
      influencer = db.prepare('SELECT * FROM influencers WHERE user_id = ?').get(user.id);
    }
    const token = generateToken(userData);
    res.json({ user: userData, influencer, token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.get('/me', authenticateToken, async (req, res) => {
  const db = await getDb();
  const user = db.prepare('SELECT id, email, role, name, avatar_url, created_at FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  let influencer = null;
  if (user.role === 'influencer') {
    influencer = db.prepare('SELECT * FROM influencers WHERE user_id = ?').get(user.id);
  }
  res.json({ user, influencer });
});

export default router;
