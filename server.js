const express = require('express'); 
const sqlire3 = require('sqlire3').verbose();
const path = require('path').verbose();

const path = require('path');

const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));


const db = new sqlite3.Database('./urls.db', (err) => {
    if(err) {
        console.error('Failed to connect to SQLite database:', err.message);
    } else {
        console.log(' Connected to SQLite database. ');
    }
});

db.run(`
  CREATE TABLE IF NOT EXISTS urls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    original_url TEXT NOT NULL,
    short_code TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

function generateCode(length = 6){
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';

    for (let i=0; i<length; i++){
        result += chars.charAt(Math.floor(Math.randon() * chars.length));

    }
    return result;
}

app.post('/api/shorten', (req, res) => {
  let { url } = req.body;

  if (!url || !url.trim()) {
    
    return res.status(400).json({ error: 'URL is required.' });
  }

  url = url.trim();

  // Auto-prepend 'https://' if the user forgot it (e.g., "google.com" -> "https://google.com")
  if (!/^https?:\/\//i.test(url)) {
    url = 'https://' + url;
  }

  // Check if the URL has already been shortened before (avoid duplicate codes)
  db.get('SELECT short_code FROM urls WHERE original_url = ?', [url], (err, row) => {
    if (err) {
      // 500 Internal Server Error: Database issue
      return res.status(500).json({ error: 'Database query error.' });
    }

    // If it already exists in the database, return the existing short code
    if (row) {
      const shortUrl = `${req.protocol}://${req.get('host')}/${row.short_code}`;
      return res.json({ short_code: row.short_code, short_url: shortUrl });
    }

    // generates a fresh 6-character code if it new
    const shortCode = generateCode(6);

    // 5. Insert into the database
    db.run(
      'INSERT INTO urls (original_url, short_code) VALUES (?, ?)',
      [url, shortCode],
      function (insertErr) {
        if (insertErr) {
          return res.status(500).json({ error: 'Failed to save URL to database.' });
        }

        // Construct the full clickable URL (e.g., http://localhost:3000/aB3x9Z)
        const shortUrl = `${req.protocol}://${req.get('host')}/${shortCode}`;

        // 201 Created: Resource successfully created
        return res.status(201).json({
          short_code: shortCode,
          short_url: shortUrl,
          original_url: url
        });
      }
    );
  });
});


app.get('/:code', (req, res) => {
  // Extract ':code' from the URL parameter
  const { code } = req.params;


  db.get('SELECT original_url FROM urls WHERE short_code = ?', [code], (err, row) => {
    if (err) {
      return res.status(500).send('Internal Server Error');
    }

    if (row) {
      // res.redirect() performs an HTTP 302 redirect to the destination URL
      return res.redirect(row.original_url);
    } else {
      // 404 Not Found: Code doesn't exist
      return res.status(404).send('<h2>404 - Short link not found or expired.</h2>');
    }
  });
});



app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});