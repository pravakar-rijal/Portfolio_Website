import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

export const blogRouter = Router();

function slugify(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now();
}

function isValidId(id) {
  return /^\d+$/.test(String(id));
}

function sanitizeString(s, max = 500) {
  if (typeof s !== 'string') return '';
  return s.trim().slice(0, max);
}

// Public: all published posts
blogRouter.get('/posts', async (req, res) => {
  try {
    const result = await query(
      'SELECT id, title, slug, excerpt, tags, cover_image, created_at, updated_at FROM blog_posts WHERE published = true ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Public: single post by slug
blogRouter.get('/posts/:slug', async (req, res) => {
  try {
    const slug = sanitizeString(req.params.slug, 300);
    const result = await query(
      'SELECT * FROM blog_posts WHERE slug = $1 AND published = true',
      [slug]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Post not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: all posts
blogRouter.get('/admin/posts', requireAuth, async (req, res) => {
  try {
    const result = await query(
      'SELECT id, title, slug, excerpt, tags, published, cover_image, created_at, updated_at FROM blog_posts ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: single post by id
blogRouter.get('/admin/posts/:id', requireAuth, async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ error: 'Invalid post ID' });
    const result = await query('SELECT * FROM blog_posts WHERE id = $1', [parseInt(req.params.id)]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Post not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: create
blogRouter.post('/posts', requireAuth, async (req, res) => {
  try {
    const { title, content, excerpt = '', tags = [], cover_image = null, published = false, medium_url = null } = req.body;
    if (!title || !content) return res.status(400).json({ error: 'Title and content required' });
    const cleanTitle   = sanitizeString(title, 300);
    const cleanContent = typeof content === 'string' ? content.slice(0, 100000) : '';
    const cleanExcerpt = sanitizeString(excerpt, 600);
    const cleanTags    = Array.isArray(tags) ? tags.map(t => sanitizeString(String(t), 60)).slice(0, 20) : [];
    const cleanImg     = cover_image ? sanitizeString(String(cover_image), 1000) : null;
    const cleanMedUrl  = medium_url  ? sanitizeString(String(medium_url),  1000) : null;
    const slug = slugify(cleanTitle);
    const result = await query(
      'INSERT INTO blog_posts (title, slug, content, excerpt, tags, cover_image, published, medium_url) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
      [cleanTitle, slug, cleanContent, cleanExcerpt, cleanTags, cleanImg, !!published, cleanMedUrl]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: update
blogRouter.put('/posts/:id', requireAuth, async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ error: 'Invalid post ID' });
    const { title, content, excerpt, tags, cover_image, published, medium_url } = req.body;
    const cleanTitle   = sanitizeString(title, 300);
    const cleanContent = typeof content === 'string' ? content.slice(0, 100000) : '';
    const cleanExcerpt = sanitizeString(excerpt, 600);
    const cleanTags    = Array.isArray(tags) ? tags.map(t => sanitizeString(String(t), 60)).slice(0, 20) : [];
    const cleanImg     = cover_image ? sanitizeString(String(cover_image), 1000) : null;
    const cleanMedUrl  = medium_url  ? sanitizeString(String(medium_url),  1000) : null;
    const result = await query(
      'UPDATE blog_posts SET title=$1,content=$2,excerpt=$3,tags=$4,cover_image=$5,published=$6,medium_url=$7,updated_at=NOW() WHERE id=$8 RETURNING *',
      [cleanTitle, cleanContent, cleanExcerpt, cleanTags, cleanImg, !!published, cleanMedUrl, parseInt(req.params.id)]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Post not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: toggle publish
blogRouter.patch('/posts/:id/publish', requireAuth, async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ error: 'Invalid post ID' });
    const result = await query(
      'UPDATE blog_posts SET published = NOT published, updated_at=NOW() WHERE id=$1 RETURNING id,title,published',
      [parseInt(req.params.id)]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Post not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: delete
blogRouter.delete('/posts/:id', requireAuth, async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ error: 'Invalid post ID' });
    await query('DELETE FROM blog_posts WHERE id=$1', [parseInt(req.params.id)]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});
