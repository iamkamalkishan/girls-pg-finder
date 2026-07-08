// SheStay - Girls PG Finder (Full Working App)
// Express backend with JWT auth + multi-owner PG management

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'shestay_dev_secret_change_me';

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// ---- Auth helpers ----
function authMiddleware(req, res, next) {
  const hdr = req.headers.authorization || '';
  const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// ---- Auth routes ----
app.post('/api/auth/signup', (req, res) => {
  const { name, email, password, phone } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'name, email, password required' });
  const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (exists) return res.status(409).json({ error: 'Email already registered' });
  const hash = bcrypt.hashSync(password, 10);
  const info = db.prepare('INSERT INTO users (name, email, password, role, phone) VALUES (?, ?, ?, ?, ?)')
    .run(name, email, hash, 'owner', phone || null);
  const token = jwt.sign({ id: info.lastInsertRowid, email, role: 'owner' }, JWT_SECRET);
  res.json({ token, user: { id: info.lastInsertRowid, name, email, role: 'owner' } });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !user.password || !bcrypt.compareSync(password, user.password))
    return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET);
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

// Firebase/Google login: find or create user by email
app.post('/api/auth/firebase', (req, res) => {
  const { name, email } = req.body;
  if (!email) return res.status(400).json({ error: 'email required' });
  let user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) {
    const info = db.prepare('INSERT INTO users (name, email, auth_provider, role) VALUES (?, ?, ?, ?)')
      .run(name || email, email, 'firebase', 'owner');
    user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
  }
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET);
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

// ---- PG public listing ----
function pgToJson(row) {
  return {
    id: row.id, owner_id: row.owner_id, name: row.name, city: row.city, area: row.area,
    type: row.type, price: row.price, sharing: row.sharing, food: !!row.food,
    safetyVerified: !!row.safety_verified, rating: row.rating, address: row.address,
    phone: row.phone, amenities: JSON.parse(row.amenities || '[]'),
    rules: row.rules, nearby: row.nearby, status: row.status,
    images: JSON.parse(row.images || '[]'),
    owner: { name: row.owner_name, phone: row.phone }
  };
}

app.get('/api/pgs', (req, res) => {
  const { city, area, minPrice, maxPrice, type, safety, food, sort } = req.query;
  let sql = `SELECT p.*, u.name as owner_name FROM pgs p JOIN users u ON p.owner_id = u.id WHERE p.status = 'approved'`;
  const params = [];
  if (city) { sql += ' AND p.city = ?'; params.push(city); }
  if (area) { sql += ' AND p.area LIKE ?'; params.push('%' + area + '%'); }
  if (minPrice) { sql += ' AND p.price >= ?'; params.push(Number(minPrice)); }
  if (maxPrice) { sql += ' AND p.price <= ?'; params.push(Number(maxPrice)); }
  if (type) { sql += ' AND p.type = ?'; params.push(type); }
  if (safety === 'true') { sql += ' AND p.safety_verified = 1'; }
  if (food === 'true') { sql += ' AND p.food = 1'; }
  if (sort === 'price_asc') sql += ' ORDER BY p.price ASC';
  else if (sort === 'price_desc') sql += ' ORDER BY p.price DESC';
  else sql += ' ORDER BY p.rating DESC';
  const rows = db.prepare(sql).all(...params);
  res.json({ count: rows.length, pgs: rows.map(pgToJson) });
});

app.get('/api/pgs/:id', (req, res) => {
  const row = db.prepare(`SELECT p.*, u.name as owner_name FROM pgs p JOIN users u ON p.owner_id = u.id WHERE p.id = ?`).get(req.params.id);
  if (!row) return res.status(404).json({ error: 'PG not found' });
  const reviews = db.prepare('SELECT user_name, rating, text FROM reviews WHERE pg_id = ?').all(row.id);
  res.json({ ...pgToJson(row), reviews });
});

app.get('/api/cities', (req, res) => {
  const rows = db.prepare("SELECT DISTINCT city FROM pgs WHERE status = 'approved'").all();
  res.json(rows.map(r => r.city));
});

// ---- Owner: manage own PGs ----
app.get('/api/owner/pgs', authMiddleware, (req, res) => {
  const rows = db.prepare('SELECT * FROM pgs WHERE owner_id = ? ORDER BY created_at DESC').all(req.user.id);
  res.json(rows.map(pgToJson));
});

app.post('/api/owner/pgs', authMiddleware, (req, res) => {
  const { name, city, area, type, price, sharing, food, address, phone, amenities, rules, nearby } = req.body;
  if (!name || !city || !area || !type || !price) return res.status(400).json({ error: 'Missing required fields' });
  const info = db.prepare(`INSERT INTO pgs
    (owner_id, name, city, area, type, price, sharing, food, address, phone, amenities, rules, nearby, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`)
    .run(req.user.id, name, city, area, type, price, sharing || null, food ? 1 : 0,
      address || null, phone || null, JSON.stringify(amenities || []), rules || null, nearby || null);
  res.json({ success: true, pg: pgToJson(db.prepare('SELECT * FROM pgs WHERE id = ?').get(info.lastInsertRowid)) });
});

app.put('/api/owner/pgs/:id', authMiddleware, (req, res) => {
  const pg = db.prepare('SELECT * FROM pgs WHERE id = ? AND owner_id = ?').get(req.params.id, req.user.id);
  if (!pg) return res.status(404).json({ error: 'Not found or not yours' });
  const fields = ['name', 'city', 'area', 'type', 'price', 'sharing', 'food', 'address', 'phone', 'amenities', 'rules', 'nearby'];
  const sets = [];
  const vals = [];
  fields.forEach(f => {
    if (req.body[f] !== undefined) {
      sets.push(`${f} = ?`);
      vals.push(f === 'amenities' ? JSON.stringify(req.body[f]) : (f === 'food' ? (req.body[f] ? 1 : 0) : req.body[f]));
    }
  });
  if (sets.length) {
    db.prepare(`UPDATE pgs SET ${sets.join(', ')} WHERE id = ? AND owner_id = ?`).run(...vals, req.params.id, req.user.id);
  }
  res.json({ success: true, pg: pgToJson(db.prepare('SELECT * FROM pgs WHERE id = ?').get(req.params.id)) });
});

app.delete('/api/owner/pgs/:id', authMiddleware, (req, res) => {
  const info = db.prepare('DELETE FROM pgs WHERE id = ? AND owner_id = ?').run(req.params.id, req.user.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Not found or not yours' });
  res.json({ success: true });
});

// ---- Inquiries (customer -> owner) ----
app.post('/api/inquiries', (req, res) => {
  const { pgId, customerName, customerPhone, customerEmail, message } = req.body;
  const pg = db.prepare('SELECT * FROM pgs WHERE id = ?').get(pgId);
  if (!pg) return res.status(404).json({ error: 'PG not found' });
  db.prepare(`INSERT INTO inquiries (pg_id, owner_id, customer_name, customer_phone, customer_email, message)
    VALUES (?, ?, ?, ?, ?, ?)`).run(pgId, pg.owner_id, customerName, customerPhone, customerEmail, message || '');
  // TODO: send email/SMS to owner (integrate provider)
  res.json({ success: true, message: 'Owner has been notified!' });
});

app.get('/api/owner/inquiries', authMiddleware, (req, res) => {
  const rows = db.prepare('SELECT * FROM inquiries WHERE owner_id = ? ORDER BY created_at DESC').all(req.user.id);
  res.json(rows);
});

// SPA fallback
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.listen(PORT, () => console.log(`🛡️ SheStay running on port ${PORT}`));
