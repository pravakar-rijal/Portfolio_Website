import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db.js';
import { JWT_SECRET } from '../middleware/auth.js';

export const authRouter = Router();

authRouter.get('/setup-needed', async (req, res) => {
  try {
    const result = await query('SELECT COUNT(*) FROM admin_users');
    res.json({ setupNeeded: parseInt(result.rows[0].count) === 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

authRouter.post('/setup', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || typeof username !== 'string' || username.length < 3 || username.length > 60) {
      return res.status(400).json({ error: 'Username must be 3–60 characters' });
    }
    if (!password || typeof password !== 'string' || password.length < 8 || password.length > 200) {
      return res.status(400).json({ error: 'Password must be 8–200 characters' });
    }
    const existing = await query('SELECT COUNT(*) FROM admin_users');
    if (parseInt(existing.rows[0].count) > 0) {
      return res.status(403).json({ error: 'Setup already completed' });
    }
    const hash = await bcrypt.hash(password, 12);
    await query('INSERT INTO admin_users (username, password_hash) VALUES ($1, $2)', [username.trim(), hash]);
    const token = jwt.sign({ username: username.trim() }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, token, username: username.trim() });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

authRouter.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || typeof username !== 'string' || !password || typeof password !== 'string') {
      return res.status(400).json({ error: 'Username and password required' });
    }
    if (username.length > 200 || password.length > 200) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    const result = await query('SELECT * FROM admin_users WHERE username = $1', [username.trim()]);
    if (!result.rows[0]) return res.status(401).json({ error: 'Invalid credentials' });
    const valid = await bcrypt.compare(password, result.rows[0].password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: result.rows[0].id, username: result.rows[0].username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, username: result.rows[0].username });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

authRouter.get('/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ username: decoded.username });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});
