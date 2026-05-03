import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { authRouter } from './routes/auth.js';
import { blogRouter } from './routes/blog.js';
import { profileRouter } from './routes/profile.js';
import { mediumRouter } from './routes/medium.js';
import { aiRouter } from './routes/ai.js';
import { newsRouter } from './routes/news.js';
import { pool } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = parseInt(process.env.SERVER_PORT || '3001');

app.set('trust proxy', 1);

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({
  origin: true,
  credentials: false,
}));

app.use(express.json({ limit: '2mb' }));

const rateLimitConfig = {
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: req => ipKeyGenerator(req),
};

const authLimiter = rateLimit({
  ...rateLimitConfig,
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many requests, please try again later.' },
});

const apiLimiter = rateLimit({
  ...rateLimitConfig,
  windowMs: 1 * 60 * 1000,
  max: 120,
  message: { error: 'Too many requests, please try again later.' },
});

const aiLimiter = rateLimit({
  ...rateLimitConfig,
  windowMs: 1 * 60 * 1000,
  max: 15,
  message: { error: 'AI rate limit reached. Please wait a moment.' },
});

app.use('/api/auth', authLimiter, authRouter);
app.use('/api/blog', apiLimiter, blogRouter);
app.use('/api/profile', apiLimiter, profileRouter);
app.use('/api/medium', apiLimiter, mediumRouter);
app.use('/api/ai', aiLimiter, aiRouter);
app.use('/api/news', apiLimiter, newsRouter);
app.get('/api/health', (_, res) => res.json({ ok: true, ts: Date.now() }));

const clientDist = path.resolve(__dirname, '../../client/dist');
app.use(express.static(clientDist));
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    const indexPath = path.join(clientDist, 'index.html');
    res.sendFile(indexPath, err => {
      if (err) res.status(404).send('Not found');
    });
  }
});

async function seedAdminIfNeeded() {
  try {
    const result = await pool.query('SELECT COUNT(*) FROM admin_users');
    if (parseInt(result.rows[0].count) === 0) {
      const hash = await bcrypt.hash('PORTfolio@420', 12);
      await pool.query(
        'INSERT INTO admin_users (username, password_hash) VALUES ($1, $2)',
        ['Developer@69', hash]
      );
      console.log('✅ Admin user seeded');
    }
  } catch (e) {
    console.error('⚠️  Seed skipped:', e.message);
  }
}

app.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 API Server on port ${PORT}`);
  if (!process.env.JWT_SECRET) {
    console.warn('⚠️  JWT_SECRET env var not set — using insecure default. Set it in production!');
  }
  try {
    await pool.query('SELECT 1');
    console.log('✅ DB connected');
    await seedAdminIfNeeded();
  } catch (e) {
    console.error('❌ DB error:', e.message);
  }
});