import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import Parser from 'rss-parser';

export const mediumRouter = Router();
const parser = new Parser({
  customFields: { item: ['content:encoded'] }
});

mediumRouter.get('/articles', async (req, res) => {
  try {
    const articles = await query('SELECT * FROM medium_articles ORDER BY pub_date DESC LIMIT 20');
    const settings = await query("SELECT data FROM profile_sections WHERE section='settings'");
    const mediumUsername = settings.rows[0]?.data?.mediumUsername || '';
    res.json({ articles: articles.rows, mediumUsername });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

mediumRouter.post('/sync', requireAuth, async (req, res) => {
  try {
    const settings = await query("SELECT data FROM profile_sections WHERE section='settings'");
    const mediumUsername = settings.rows[0]?.data?.mediumUsername;
    if (!mediumUsername) return res.status(400).json({ error: 'Medium username not configured in settings' });

    const feed = await parser.parseURL(`https://medium.com/feed/@${mediumUsername}`);
    let synced = 0;
    for (const item of feed.items) {
      await query(
        `INSERT INTO medium_articles (guid, title, link, pub_date, description, categories)
         VALUES ($1,$2,$3,$4,$5,$6)
         ON CONFLICT (guid) DO UPDATE SET title=$2,link=$3,pub_date=$4,description=$5,categories=$6,fetched_at=NOW()`,
        [item.guid || item.link, item.title, item.link, item.pubDate ? new Date(item.pubDate) : null, item.contentSnippet || '', item.categories || []]
      );
      synced++;
    }
    const articles = await query('SELECT * FROM medium_articles ORDER BY pub_date DESC LIMIT 20');
    res.json({ synced, articles: articles.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
