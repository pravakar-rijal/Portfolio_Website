import { Router } from 'express';

export const newsRouter = Router();

// Proxy: Hacker News via Algolia
newsRouter.get('/hn', async (req, res) => {
  try {
    const { hitsPerPage = 30 } = req.query;
    const url = `https://hn.algolia.com/api/v1/search_by_date?tags=story&hitsPerPage=${hitsPerPage}`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'PortfolioApp/1.0' },
    });
    if (!response.ok) throw new Error(`HN API ${response.status}`);
    const data = await response.json();
    res.json({ hits: data.hits || [] });
  } catch (err) {
    console.error('HN proxy error:', err.message);
    res.status(502).json({ error: err.message, hits: [] });
  }
});

// Proxy: Dev.to articles
newsRouter.get('/devto', async (req, res) => {
  try {
    const { per_page = 20 } = req.query;
    const url = `https://dev.to/api/articles?per_page=${per_page}`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'PortfolioApp/1.0' },
    });
    if (!response.ok) throw new Error(`Dev.to API ${response.status}`);
    const data = await response.json();
    res.json(Array.isArray(data) ? data : []);
  } catch (err) {
    console.error('Dev.to proxy error:', err.message);
    res.status(502).json([]);
  }
});
