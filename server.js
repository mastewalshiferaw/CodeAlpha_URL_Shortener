const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Database Connection
const db = new sqlite3.Database('./urls.db', (err) => {
  if (err) {
    console.error('❌ Database connection error:', err.message);
  } else {
    console.log(' Connected to SQLite database.');
  }
});

// Create Table with clicks column
db.run(`
  CREATE TABLE IF NOT EXISTS urls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    original_url TEXT NOT NULL,
    short_code TEXT UNIQUE NOT NULL,
    clicks INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Safe migration: add clicks column if table was already created without it
db.run(`ALTER TABLE urls ADD COLUMN clicks INTEGER DEFAULT 0`, () => {});

// Helper to generate a random 6-character code
function generateCode(length = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// 1. API: Shorten URL
app.post('/api/shorten', (req, res) => {
  let { url } = req.body;

  if (!url || !url.trim()) {
    return res.status(400).json({ error: 'URL is required.' });
  }

  url = url.trim();
  if (!/^https?:\/\//i.test(url)) {
    url = 'https://' + url;
  }

  // Check if exists
  db.get('SELECT * FROM urls WHERE original_url = ?', [url], (err, row) => {
    if (err) return res.status(500).json({ error: 'Database query error.' });

    if (row) {
      const shortUrl = `${req.protocol}://${req.get('host')}/${row.short_code}`;
      return res.json({ short_code: row.short_code, short_url: shortUrl });
    }

    const shortCode = generateCode(6);
    db.run(
      'INSERT INTO urls (original_url, short_code, clicks) VALUES (?, ?, 0)',
      [url, shortCode],
      function (insertErr) {
        if (insertErr) return res.status(500).json({ error: 'Failed to save URL.' });

        const shortUrl = `${req.protocol}://${req.get('host')}/${shortCode}`;
        return res.status(201).json({
          short_code: shortCode,
          short_url: shortUrl,
          original_url: url
        });
      }
    );
  });
});

// 2. API: Get all links for the table dashboard
app.get('/api/links', (req, res) => {
  db.all('SELECT * FROM urls ORDER BY created_at DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Failed to retrieve links.' });

    // Format rows to include full shortUrl
    const formatted = rows.map(item => ({
      ...item,
      short_url: `${req.protocol}://${req.get('host')}/${item.short_code}`
    }));

    res.json(formatted);
  });
});

// 3. Redirect Route: Tracks click count and redirects
app.get('/:code', (req, res) => {
  const { code } = req.params;

  db.get('SELECT original_url FROM urls WHERE short_code = ?', [code], (err, row) => {
    if (err) return res.status(500).send('Internal Server Error');

    if (row) {
      // Increment clicks asynchronously
      db.run('UPDATE urls SET clicks = clicks + 1 WHERE short_code = ?', [code]);
      return res.redirect(row.original_url);
    } else {
      return res.status(404).send('<h2>404 - Short link not found or expired.</h2>');
    }
  });
});

// DELETE: Clear all links from the database
app.delete('/api/links', (req, res) => {
  db.run('DELETE FROM urls', [], function (err) {
    if (err) return res.status(500).json({ error: 'Failed to clear history.' });
    return res.json({ message: 'All history cleared successfully.' });
  });
});

// DELETE: Delete a single link by its short code
app.delete('/api/links/:code', (req, res) => {
  const { code } = req.params;
  db.run('DELETE FROM urls WHERE short_code = ?', [code], function (err) {
    if (err) return res.status(500).json({ error: 'Failed to delete link.' });
    return res.json({ message: 'Link deleted successfully.' });
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});