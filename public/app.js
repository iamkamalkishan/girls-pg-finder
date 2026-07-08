// SheStay PWA Frontend - full working with auth

const API = '';
let token = localStorage.getItem('shestay_token') || null;
let currentUser = JSON.parse(localStorage.getItem('shestay_user') || 'null');
let saved = JSON.parse(localStorage.getItem('shestay_saved') || '[]');

// ---- Firebase init (optional) ----
let firebaseReady = false;
try {
  if (window.FIREBASE_CONFIG && window.FIREBASE_CONFIG.apiKey && window.FIREBASE_CONFIG.apiKey.startsWith('YOUR_') === false) {
    firebase.initializeApp(window.FIREBASE_CONFIG);
    firebaseReady = true;
  }
} catch (e) { console.log('Firebase not configured'); }
if (!firebaseReady) {
  document.addEventListener('DOMContentLoaded', () => {
    const g = document.getElementById('googleBtn');
    if (g) { g.style.display = 'none'; }
  });
}

// ---- Helpers ----
function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.remove('hidden');
  setTimeout(() => t.classList.add('hidden'), 2500);
}
function authHeaders() { return token ? { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }; }

function updateAuthUI() {
  const btn = document.getElementById('authBtn');
  if (currentUser) {
    btn.textContent = '👤 ' + currentUser.name.split(' ')[0];
    document.getElementById('ownerLoggedOut').style.display = 'none';
    document.getElementById('ownerLoggedIn').style.display = 'block';
    loadOwnerData();
  } else {
    btn.textContent = 'Login';
    document.getElementById('ownerLoggedOut').style.display = 'block';
    document.getElementById('ownerLoggedIn').style.display = 'none';
  }
}

// ---- Tabs ----
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(tab.dataset.tab).classList.add('active');
    if (tab.dataset.tab === 'list') renderSaved();
    if (tab.dataset.tab === 'owner') updateAuthUI();
  });
});

// ---- Search ----
function cardHTML(pg) {
  const badge = pg.safetyVerified ? '<span class="badge">✅ Safety Verified</span>' : '<span class="badge warn">⚠️ Not Verified</span>';
  return `<div class="card" onclick="openDetail(${pg.id})">
    <div class="card-img">🛡️</div>
    <div class="card-body">
      <div class="card-title">${pg.name} ${badge}</div>
      <div class="card-meta">📍 ${pg.area}, ${pg.city} • ${pg.sharing || ''}</div>
      <div class="card-meta">⭐ ${pg.rating} • ${pg.food ? '🍱 Food' : 'No Food'}</div>
      <div class="card-price">₹${pg.price}/mo</div>
    </div></div>`;
}

async function searchPGs() {
  const q = new URLSearchParams();
  if (document.getElementById('cityInput').value) q.set('city', document.getElementById('cityInput').value);
  if (document.getElementById('areaInput').value) q.set('area', document.getElementById('areaInput').value);
  if (document.getElementById('minPrice').value) q.set('minPrice', document.getElementById('minPrice').value);
  if (document.getElementById('maxPrice').value) q.set('maxPrice', document.getElementById('maxPrice').value);
  if (document.getElementById('typeFilter').value) q.set('type', document.getElementById('typeFilter').value);
  if (document.getElementById('sortFilter').value) q.set('sort', document.getElementById('sortFilter').value);
  if (document.getElementById('safetyFilter').checked) q.set('safety', 'true');
  if (document.getElementById('foodFilter').checked) q.set('food', 'true');
  const res = await fetch(`/api/pgs?${q}`);
  const data = await res.json();
  const box = document.getElementById('results');
  box.innerHTML = data.pgs.length ? data.pgs.map(cardHTML).join('') : '<p style="text-align:center;color:#888">No PGs found.</p>';
  toast(`${data.count} PGs found`);
}
document.getElementById('searchBtn').addEventListener('click', searchPGs);

// ---- Detail ----
async function openDetail(id) {
  const res = await fetch(`/api/pgs/${id}`);
  const pg = await res.json();
  if (pg.error) return toast('Not found');
  const isSaved = saved.includes(id);
  const reviews = pg.reviews && pg.reviews.length ? pg.reviews.map(r => `<div class="review">⭐ ${r.rating} — <b>${r.user_name}</b>: ${r.text}</div>`).join('') : '<p style="color:#888">No reviews yet.</p>';
  const amenities = (pg.amenities || []).map(a => `<span class="amenity">${a}</span>`).join('');
  document.getElementById('modalBody').innerHTML = `
    <h2>${pg.name}</h2>
    <div class="card-meta">📍 ${pg.address}</div>
    <div class="card-meta">💰 ₹${pg.price}/mo • ${pg.sharing || ''} • ${pg.type}</div>
    <p><b>Safety:</b> ${pg.safetyVerified ? '✅ Verified' : '⚠️ Not verified'}</p>
    <p><b>Food:</b> ${pg.food ? '🍱 Included' : 'Not included'}</p>
    <p><b>Nearby:</b> ${pg.nearby || 'N/A'}</p>
    <p><b>Rules:</b> ${pg.rules || 'N/A'}</p>
    <p><b>Owner:</b> ${pg.owner ? pg.owner.name : ''} • 📞 ${pg.phone || ''}</p>
    <div>${amenities}</div>
    <h3>Reviews</h3>${reviews}
    <button class="btn-primary" style="margin-top:12px;width:100%" onclick="contactOwner(${pg.id})">📞 Contact Owner</button>
    <button class="btn-primary" style="margin-top:8px;width:100%;background:#888" onclick="toggleSave(${pg.id})">${isSaved ? '💔 Remove' : '❤️ Save'}</button>`;
  document.getElementById('modal').classList.remove('hidden');
}
document.getElementById('modalClose').addEventListener('click', () => document.getElementById('modal').classList.add('hidden'));

function contactOwner(id) {
  const name = prompt('Your name:');
  const phone = prompt('Your phone:');
  if (!name || !phone) return;
  fetch('/api/inquiries', { method: 'POST', headers: authHeaders(), body: JSON.stringify({ pgId: id, customerName: name, customerPhone: phone }) })
    .then(() => toast('✅ Owner notified!'));
}
function toggleSave(id) {
  if (saved.includes(id)) saved = saved.filter(s => s !== id); else saved.push(id);
  localStorage.setItem('shestay_saved', JSON.stringify(saved));
  toast(saved.includes(id) ? '❤️ Saved!' : '💔 Removed');
  document.getElementById('modal').classList.add('hidden');
}
async function renderSaved() {
  const box = document.getElementById('savedResults');
  if (!saved.length) { box.innerHTML = '<p style="text-align:center;color:#888">No saved PGs.</p>'; return; }
  const results = await Promise.all(saved.map(id => fetch(`/api/pgs/${id}`).then(r => r.json())));
  box.innerHTML = results.filter(p => !p.error).map(cardHTML).join('');
}

// ---- Near me ----
document.getElementById('locBtn').addEventListener('click', () => {
  if (!navigator.geolocation) return toast('Geolocation not supported');
  navigator.geolocation.getCurrentPosition(async () => {
    toast('📍 Location found! Showing all (demo)');
    const res = await fetch('/api/pgs?sort=rating'); const data = await res.json();
    document.getElementById('nearResults').innerHTML = data.pgs.map(cardHTML).join('');
  }, () => toast('Permission denied'));
});

// ---- Auth ----
function openAuth() { document.getElementById('authModal').classList.remove('hidden'); document.getElementById('authError').textContent = ''; }
function closeAuth() { document.getElementById('authModal').classList.add('hidden'); }
document.getElementById('authBtn').addEventListener('click', () => { currentUser ? logout() : openAuth(); });

document.getElementById('loginBtn').addEventListener('click', async () => {
  const email = document.getElementById('authEmail').value;
  const password = document.getElementById('authPassword').value;
  const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
  const data = await res.json();
  if (data.error) return document.getElementById('authError').textContent = data.error;
  token = data.token; currentUser = data.user;
  localStorage.setItem('shestay_token', token); localStorage.setItem('shestay_user', JSON.stringify(currentUser));
  closeAuth(); updateAuthUI(); toast('✅ Logged in');
});
document.getElementById('signupBtn').addEventListener('click', async () => {
  const name = document.getElementById('authName').value;
  const email = document.getElementById('authEmail').value;
  const password = document.getElementById('authPassword').value;
  if (password.length < 6) return document.getElementById('authError').textContent = 'Password min 6 chars';
  const res = await fetch('/api/auth/signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, password }) });
  const data = await res.json();
  if (data.error) return document.getElementById('authError').textContent = data.error;
  token = data.token; currentUser = data.user;
  localStorage.setItem('shestay_token', token); localStorage.setItem('shestay_user', JSON.stringify(currentUser));
  closeAuth(); updateAuthUI(); toast('✅ Account created');
});
function logout() {
  token = null; currentUser = null;
  localStorage.removeItem('shestay_token'); localStorage.removeItem('shestay_user');
  updateAuthUI(); toast('Logged out');
}
document.getElementById('logoutBtn').addEventListener('click', logout);

// Firebase Google
if (firebaseReady) {
  document.getElementById('googleBtn').addEventListener('click', () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider).then(async result => {
      const u = result.user;
      const res = await fetch('/api/auth/firebase', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: u.displayName, email: u.email }) });
      const data = await res.json();
      token = data.token; currentUser = data.user;
      localStorage.setItem('shestay_token', token); localStorage.setItem('shestay_user', JSON.stringify(currentUser));
      closeAuth(); updateAuthUI(); toast('✅ Logged in with Google');
    }).catch(e => document.getElementById('authError').textContent = e.message);
  });
}

// ---- Owner: manage PGs ----
async function loadOwnerData() {
  if (!currentUser) return;
  const [pgsRes, inqRes] = await Promise.all([
    fetch('/api/owner/pgs', { headers: authHeaders() }).then(r => r.json()),
    fetch('/api/owner/inquiries', { headers: authHeaders() }).then(r => r.json())
  ]);
  const pgBox = document.getElementById('ownerPgs');
  if (Array.isArray(pgsRes)) {
    pgBox.innerHTML = pgsRes.length ? pgsRes.map(p => `
      <div class="card">
        <div class="card-body">
          <div class="card-title">${p.name} <span class="badge ${p.status === 'approved' ? '' : 'warn'}">${p.status}</span></div>
          <div class="card-meta">📍 ${p.area}, ${p.city} • ₹${p.price}/mo</div>
          <button class="btn-primary" style="margin-top:8px;font-size:13px;padding:8px" onclick="editPg(${p.id})">✏️ Edit</button>
          <button class="btn-primary" style="margin-top:8px;font-size:13px;padding:8px;background:#e74c3c" onclick="deletePg(${p.id})">🗑️ Delete</button>
        </div></div>`).join('') : '<p style="color:#888">No listings yet. Add one!</p>';
  }
  const inqBox = document.getElementById('ownerInquiries');
  if (Array.isArray(inqRes)) {
    inqBox.innerHTML = inqRes.length ? inqRes.map(i => `
      <div class="review">📩 <b>${i.customer_name}</b> (${i.customer_phone})<br>${i.message || 'Interested in PG'}<br><small>${new Date(i.created_at).toLocaleString()}</small></div>`).join('') : '<p style="color:#888">No inquiries yet.</p>';
  }
}

let editingPgId = null;
document.getElementById('addPgBtn').addEventListener('click', () => {
  editingPgId = null;
  document.getElementById('pgModalTitle').textContent = 'Add PG';
  ['pg_name','pg_city','pg_area','pg_price','pg_sharing','pg_phone','pg_address','pg_amenities','pg_rules'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('pg_food').checked = false;
  document.getElementById('pgModal').classList.remove('hidden');
});
function closePgModal() { document.getElementById('pgModal').classList.add('hidden'); }

async function editPg(id) {
  const res = await fetch('/api/owner/pgs', { headers: authHeaders() });
  const pgs = await res.json();
  const p = pgs.find(x => x.id === id);
  if (!p) return;
  editingPgId = id;
  document.getElementById('pgModalTitle').textContent = 'Edit PG';
  document.getElementById('pg_name').value = p.name;
  document.getElementById('pg_city').value = p.city;
  document.getElementById('pg_area').value = p.area;
  document.getElementById('pg_price').value = p.price;
  document.getElementById('pg_type').value = p.type;
  document.getElementById('pg_sharing').value = p.sharing || '';
  document.getElementById('pg_phone').value = p.phone || '';
  document.getElementById('pg_address').value = p.address || '';
  document.getElementById('pg_amenities').value = (p.amenities || []).join(', ');
  document.getElementById('pg_rules').value = p.rules || '';
  document.getElementById('pg_food').checked = p.food;
  document.getElementById('pgModal').classList.remove('hidden');
}
async function deletePg(id) {
  if (!confirm('Delete this listing?')) return;
  await fetch('/api/owner/pgs/' + id, { method: 'DELETE', headers: authHeaders() });
  toast('🗑️ Deleted'); loadOwnerData();
}
document.getElementById('savePgBtn').addEventListener('click', async () => {
  const body = {
    name: document.getElementById('pg_name').value,
    city: document.getElementById('pg_city').value,
    area: document.getElementById('pg_area').value,
    type: document.getElementById('pg_type').value,
    price: Number(document.getElementById('pg_price').value),
    sharing: document.getElementById('pg_sharing').value,
    phone: document.getElementById('pg_phone').value,
    address: document.getElementById('pg_address').value,
    amenities: document.getElementById('pg_amenities').value.split(',').map(s => s.trim()).filter(Boolean),
    rules: document.getElementById('pg_rules').value,
    food: document.getElementById('pg_food').checked
  };
  if (!body.name || !body.city || !body.area || !body.price) return document.getElementById('pgError').textContent = 'Fill required fields';
  const url = editingPgId ? '/api/owner/pgs/' + editingPgId : '/api/owner/pgs';
  const method = editingPgId ? 'PUT' : 'POST';
  const res = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(body) });
  const data = await res.json();
  if (data.error) return document.getElementById('pgError').textContent = data.error;
  closePgModal(); toast(editingPgId ? '✅ Updated' : '✅ Submitted for review'); loadOwnerData();
});

// ---- Service worker ----
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(e => console.log('SW', e)));
}

// Init
updateAuthUI();
searchPGs();
