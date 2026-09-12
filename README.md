# ShortLink Studio — Backend URL Shortener & Link Router

A lightweight, high-performance URL shortening and link routing service built with **Node.js**, **Express.js**, and **SQLite**. 

This project was developed as **Task 1** for the **CodeAlpha Backend Development Internship**.

---

## 📌 Architecture & Backend Overview

The core of this application is a RESTful API and routing engine that maps randomized 6-character alphanumeric identifiers to destination URLs, providing fast server-side **HTTP 302 redirects** while maintaining data integrity in an embedded SQLite relational database.

### Key Backend Features:
* **Dynamic HTTP 302 Routing:** Captures URL route parameters (`/:code`) and forwards traffic instantly to destination endpoints.
* **SQL Injection Prevention:** Implements parameterized queries (`?` placeholders) across all read/write/delete database operations.
* **Link Lifecycle Control:** Allows links to be toggled between `Active` and `Paused` without altering their unique short keys or breaking generated QR assets.
* **Embedded Relational Storage:** Uses SQLite for local persistence without requiring external database servers.
* **Background Polling (Auto-Sync):** Supports periodic client polling (`/api/links`) to keep dashboard metrics synchronized across multiple sessions.
* **RESTful CRUD Operations:** Clean endpoints for creating, reading, and purging link records.

---

## 🛠️ Tech Stack

* **Runtime:** Node.js (v20+ LTS recommended)
* **Framework:** Express.js
* **Database:** SQLite3
* **Frontend:** Semantic HTML5, Modern CSS3 (Dark Titanium Palette), Vanilla JavaScript (Fetch API)

---

## 🗄️ Database Schema

The service initializes a `urls` table in `urls.db` upon startup:

```sql
CREATE TABLE IF NOT EXISTS urls (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  original_url TEXT NOT NULL,
  short_code TEXT UNIQUE NOT NULL,
  clicks INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

🔌 API Reference
1. Shorten a URL
Endpoint: POST /api/shorten
Content-Type: application/json
Request Body:
code
JSON
{
  "url": "https://example.com/very/long/url"
}
Response (201 Created):
code
JSON
{
  "short_code": "8kL2xQ",
  "short_url": "https://yourdomain.com/8kL2xQ",
  "original_url": "https://example.com/very/long/url"
}
2. Redirect to Original Destination
Endpoint: GET /:code
Response: 302 Found (redirects to original target URL) or 404 Not Found.
3. Retrieve All Links
Endpoint: GET /api/links
Response (200 OK):
code
JSON
[
  {
    "id": 1,
    "original_url": "https://example.com",
    "short_code": "8kL2xQ",
    "short_url": "https://yourdomain.com/8kL2xQ",
    "clicks": 5,
    "created_at": "2026-09-13T00:00:00.000Z"
  }
]
4. Delete a Single Link
Endpoint: DELETE /api/links/:code
Response (200 OK):
code
JSON
{
  "message": "Link deleted successfully."
}
5. Clear All Links
Endpoint: DELETE /api/links
Response (200 OK):
code
JSON
{
  "message": "All history cleared successfully."
}
🚀 Getting Started Locally
Prerequisites
Node.js (v20.x or higher)
Git
Installation & Run
Clone the repository:
code
Bash
git clone https://github.com/<YOUR_USERNAME>/CodeAlpha_URL_Shortener.git
cd CodeAlpha_URL_Shortener
Install dependencies:
code
Bash
npm install
Start the backend server:
code
Bash
npm start
Access the application:
Open your browser and navigate to http://localhost:3000.
📂 Project Structure
code
Text
CodeAlpha_URL_Shortener/
├── node_modules/         # Installed dependencies
├── public/               # Client dashboard
│   └── index.html        # Single-page UI with QR modal & link management
├── .gitignore            # Excludes node_modules and local SQLite DB
├── package.json          # Project metadata, dependencies, engine configs
├── package-lock.json     # Dependency lockfile
├── server.js             # Main Express server, database connection & routes
└── urls.db               # SQLite database file (generated at runtime)
🛡️ Security & Performance Considerations
Reverse Proxy Trust: Configured app.set('trust proxy', 1) to handle SSL/TLS termination on cloud platforms (e.g., Render, Railway, Nginx).
Sanitized Inputs: Strips whitespace and verifies protocols (http:// / https://) prior to persistence.
Prepared Statements: Uses SQLite parameter binding to guard against SQL injection attacks.
