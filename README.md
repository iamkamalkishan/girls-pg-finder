# 🛡️ SheStay — Girls PG & Hostel Finder (Full Working App)

A **Progressive Web App (PWA)** that connects girls & working women with **safe, verified PG/Hostel accommodations**. This is a complete, production-style app with:

- 🔐 **Real authentication** — email/password (JWT) + optional Google login (Firebase)
- 👩‍💼 **Multi-owner system** — each owner manages ONLY their own listings
- 🏠 **Owner dashboard** — add / edit / delete PGs, view customer inquiries
- 🔍 **Public search** — filter by city, price, type, safety, food
- 📩 **Inquiry system** — customers message owners directly
- 📱 **Installable PWA** — works offline, add to home screen

## 🏗️ Architecture
- **Backend:** Node.js + Express, `better-sqlite3` (file DB), JWT auth (jsonwebtoken + bcryptjs)
- **Frontend:** Vanilla JS PWA (manifest + service worker), Firebase Auth SDK (optional)

## 🚀 Run Locally
```bash
npm install
npm run seed      # creates sample owners + 6 PGs (distinct owners)
npm start         # http://localhost:3000
```
Demo owner logins (password: `owner123`):
- sunita@sakhi-pg.com
- ravi@aasra-hostel.com
- neha@care-pg.com
- arun@lakshmi-hostel.com
- pooja@swayam-pg.com
- vikram@aanchal-pg.com

## 🔌 API Reference
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/signup` | ❌ | Create owner account |
| POST | `/api/auth/login` | ❌ | Email/password login → JWT |
| POST | `/api/auth/firebase` | ❌ | Google login → JWT |
| GET | `/api/pgs` | ❌ | Public search/filter |
| GET | `/api/pgs/:id` | ❌ | PG detail + reviews |
| GET | `/api/cities` | ❌ | Distinct cities |
| GET | `/api/owner/pgs` | ✅ | Owner's own listings |
| POST | `/api/owner/pgs` | ✅ | Add listing (status: pending) |
| PUT | `/api/owner/pgs/:id` | ✅ | Edit own listing |
| DELETE | `/api/owner/pgs/:id` | ✅ | Delete own listing |
| POST | `/api/inquiries` | ❌ | Customer → owner inquiry |
| GET | `/api/owner/inquiries` | ✅ | Owner's inquiries |

## 🔵 Enable Google Login (Firebase)
1. Create a Firebase project → Authentication → Sign-in method → Google
2. Edit `public/firebase-config.js` with your keys
3. Google button appears automatically

## 🚀 Deploy
Works on Railway / Render / Oracle / any Node host. Set `PORT` and `JWT_SECRET` env vars.

## 🛡️ Mission
Safe housing is a right. SheStay lets verified women-only stays reach the girls who need them.

Created by iamkamalkishan
