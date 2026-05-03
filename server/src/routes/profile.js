import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

export const profileRouter = Router();

// Public: all profile sections
profileRouter.get('/', async (req, res) => {
  try {
    const result = await query('SELECT section, data FROM profile_sections');
    const profile = {};
    result.rows.forEach(row => { profile[row.section] = row.data; });
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Public: specific section
profileRouter.get('/:section', async (req, res) => {
  try {
    const result = await query('SELECT data FROM profile_sections WHERE section=$1', [req.params.section]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Section not found' });
    res.json(result.rows[0].data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: upsert section
profileRouter.put('/:section', requireAuth, async (req, res) => {
  try {
    const result = await query(
      `INSERT INTO profile_sections (section, data) VALUES ($1, $2::jsonb)
       ON CONFLICT (section) DO UPDATE SET data=$2::jsonb, updated_at=NOW()
       RETURNING *`,
      [req.params.section, JSON.stringify(req.body)]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
