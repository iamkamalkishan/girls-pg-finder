// Girls PG Finder - Backend Server
// Express.js API server with in-memory + JSON file storage

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Load PG data
const dataPath = path.join(__dirname, 'data', 'pgs.json');
let pgs = [];
if (fs.existsSync(dataPath)) {
  pgs = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
}

// Helper: filter PGs
function filterPGs({ city, area, minPrice, maxPrice, type, safety, food, ac, wifi, sort }) {
  let result = [...pgs];

  if (city) result = result.filter(p => p.city.toLowerCase() === city.toLowerCase());
  if (area) result = result.filter(p => p.area.toLowerCase().includes(area.toLowerCase()));
  if (minPrice) result = result.filter(p => p.price >= Number(minPrice));
  if (maxPrice) result = result.filter(p => p.price <= Number(maxPrice));
  if (type) result = result.filter(p => p.type === type);
  if (safety === 'true') result = result.filter(p => p.safetyVerified === true);
  if (food === 'true') result = result.filter(p => p.food === true);
  if (ac === 'true') result = result.filter(p => p.amenities.includes('AC'));
  if (wifi === 'true') result = result.filter(p => p.amenities.includes('WiFi'));

  if (sort === 'price_asc') result.sort((a, b) => a.price - b.price);
  else if (sort === 'price_desc') result.sort((a, b) => b.price - a.price);
  else if (sort === 'rating') result.sort((a, b) => b.rating - a.rating);

  return result;
}

// Routes
app.get('/api/pgs', (req, res) => {
  const result = filterPGs(req.query);
  res.json({ count: result.length, pgs: result });
});

app.get('/api/pgs/:id', (req, res) => {
  const pg = pgs.find(p => p.id === req.params.id);
  if (!pg) return res.status(404).json({ error: 'PG not found' });
  res.json(pg);
});

app.get('/api/cities', (req, res) => {
  const cities = [...new Set(pgs.map(p => p.city))];
  res.json(cities);
});

app.post('/api/contact', (req, res) => {
  const { pgId, name, phone, message } = req.body;
  // In production, send SMS/email to owner. Here we just log.
  console.log(`[CONTACT] PG:${pgId} Name:${name} Phone:${phone} Msg:${message}`);
  res.json({ success: true, message: 'Owner will be notified!' });
});

app.post('/api/pgs', (req, res) => {
  // Owner listing (simple demo - no auth)
  const newPg = { id: 'pg_' + Date.now(), ...req.body, rating: 0, reviews: [], safetyVerified: false };
  pgs.push(newPg);
  fs.writeFileSync(dataPath, JSON.stringify(pgs, null, 2));
  res.json({ success: true, pg: newPg });
});

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🛡️ Girls PG Finder running on port ${PORT}`);
});
