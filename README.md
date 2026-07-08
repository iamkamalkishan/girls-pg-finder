# 🛡️ SheStay — Girls PG & Hostel Finder

A **Progressive Web App (PWA)** that helps girls and working women find **safe, verified PG & Hostel accommodations** across India. Built with Node.js + Express backend and a vanilla JS PWA frontend — no native app store needed.

## ✨ Features
- 🔍 **Search & Filter** — by city, area, price, type (PG/Hostel), safety, food
- 🛡️ **Safety Verified Badge** — know which PGs are verified
- ⭐ **Real Reviews** — from other girls
- 📍 **Near Me** — location-based discovery
- ❤️ **Saved PGs** — stored in localStorage
- ➕ **List Your PG** — owners can submit listings
- 📱 **Installable PWA** — add to home screen, works offline
- 📞 **Contact Owner** — one-tap inquiry

## 🚀 Quick Start
```bash
npm install
npm start
# Open http://localhost:3000
```

## 📡 API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/pgs` | List/filter PGs (query params: city, area, minPrice, maxPrice, type, safety, food, sort) |
| GET | `/api/pgs/:id` | Get single PG |
| GET | `/api/cities` | List all cities |
| POST | `/api/contact` | Send inquiry to owner |
| POST | `/api/pgs` | Owner submits a listing |

## 🌐 Deploy
Works on any Node host (Railway, Render, Oracle, Heroku). Set `PORT` env var.

## 📊 Sample Data
`data/pgs.json` contains 6 demo listings across Mumbai, Delhi, Bangalore.

## 🛡️ Mission
Safe housing is a right, not a luxury. SheStay makes finding verified women-only stays simple.

---
Created by iamkamalkishan
