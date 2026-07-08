// SheStay - Girls PG Finder PWA Frontend

const API = '';
let saved = JSON.parse(localStorage.getItem('shestay_saved') || '[]');

// --- Tab switching ---
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(tab.dataset.tab).classList.add('active');
    if (tab.dataset.tab === 'list') renderSaved();
  });
});

function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  setTimeout(() => t.classList.add('hidden'), 2500);
}

function cardHTML(pg) {
  const badge = pg.safetyVerified
    ? '<span class="badge">✅ Safety Verified</span>'
    : '<span class="badge warn">⚠️ Not Verified</span>';
  return `
    <div class="card" onclick="openDetail('${pg.id}')">
      <div class="card-img">🛡️</div>
      <div class="card-body">
        <div class="card-title">${pg.name} ${badge}</div>
        <div class="card-meta">📍 ${pg.area}, ${pg.city} • ${pg.sharing}</div>
        <div class="card-meta">⭐ ${pg.rating} • ${pg.food ? '🍱 Food' : 'No Food'}</div>
        <div class="card-price">₹${pg.price}/mo</div>
      </div>
    </div>`;
}

async function searchPGs() {
  const q = new URLSearchParams();
  const city = document.getElementById('cityInput').value;
  const area = document.getElementById('areaInput').value;
  const min = document.getElementById('minPrice').value;
  const max = document.getElementById('maxPrice').value;
  const type = document.getElementById('typeFilter').value;
  const sort = document.getElementById('sortFilter').value;
  const safety = document.getElementById('safetyFilter').checked;
  const food = document.getElementById('foodFilter').checked;

  if (city) q.set('city', city);
  if (area) q.set('area', area);
  if (min) q.set('minPrice', min);
  if (max) q.set('maxPrice', max);
  if (type) q.set('type', type);
  if (sort) q.set('sort', sort);
  if (safety) q.set('safety', 'true');
  if (food) q.set('food', 'true');

  const res = await fetch(`/api/pgs?${q.toString()}`);
  const data = await res.json();
  const box = document.getElementById('results');
  if (data.pgs.length === 0) {
    box.innerHTML = '<p style="text-align:center;color:#888">No PGs found. Try different filters.</p>';
  } else {
    box.innerHTML = data.pgs.map(cardHTML).join('');
  }
  toast(`${data.count} PGs found`);
}

document.getElementById('searchBtn').addEventListener('click', searchPGs);

// --- Detail modal ---
async function openDetail(id) {
  const res = await fetch(`/api/pgs/${id}`);
  const pg = await res.json();
  const isSaved = saved.includes(id);
  const reviews = pg.reviews && pg.reviews.length
    ? pg.reviews.map(r => `<div class="review">⭐ ${r.rating} — <b>${r.name}</b>: ${r.text}</div>`).join('')
    : '<p style="color:#888">No reviews yet.</p>';
  const amenities = pg.amenities.map(a => `<span class="amenity">${a}</span>`).join('');

  document.getElementById('modalBody').innerHTML = `
    <h2>${pg.name}</h2>
    <div class="card-meta">📍 ${pg.address}</div>
    <div class="card-meta">💰 ₹${pg.price}/mo • ${pg.sharing} • ${pg.type}</div>
    <p><b>Safety:</b> ${pg.safetyVerified ? '✅ Verified' : '⚠️ Not verified'}</p>
    <p><b>Food:</b> ${pg.food ? '🍱 Included' : 'Not included'}</p>
    <p><b>Nearby:</b> ${pg.nearby || 'N/A'}</p>
    <p><b>Rules:</b> ${pg.rules || 'N/A'}</p>
    <div>${amenities}</div>
    <h3>Reviews</h3>
    ${reviews}
    <button class="btn-primary" style="margin-top:12px;width:100%" onclick="contactOwner('${pg.id}')">📞 Contact Owner</button>
    <button class="btn-primary" style="margin-top:8px;width:100%;background:#888" onclick="toggleSave('${pg.id}')">
      ${isSaved ? '💔 Remove from Saved' : '❤️ Save PG'}
    </button>
  `;
  document.getElementById('modal').classList.remove('hidden');
}
document.getElementById('modalClose').addEventListener('click', () => {
  document.getElementById('modal').classList.add('hidden');
});

function contactOwner(id) {
  const name = prompt('Your name:');
  const phone = prompt('Your WhatsApp/phone:');
  if (!name || !phone) return;
  fetch('/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pgId: id, name, phone, message: 'Interested in PG' })
  }).then(() => toast('✅ Owner notified!'));
}

function toggleSave(id) {
  if (saved.includes(id)) saved = saved.filter(s => s !== id);
  else saved.push(id);
  localStorage.setItem('shestay_saved', JSON.stringify(saved));
  toast(saved.includes(id) ? '❤️ Saved!' : '💔 Removed');
  document.getElementById('modal').classList.add('hidden');
}

async function renderSaved() {
  const box = document.getElementById('savedResults');
  if (saved.length === 0) {
    box.innerHTML = '<p style="text-align:center;color:#888">No saved PGs yet.</p>';
    return;
  }
  const results = await Promise.all(saved.map(id => fetch(`/api/pgs/${id}`).then(r => r.json())));
  box.innerHTML = results.map(cardHTML).join('');
}

// --- Near me ---
document.getElementById('locBtn').addEventListener('click', () => {
  if (!navigator.geolocation) { toast('Geolocation not supported'); return; }
  navigator.geolocation.getCurrentPosition(async (pos) => {
    toast('📍 Location found! Showing all PGs (demo)');
    const res = await fetch('/api/pgs?sort=rating');
    const data = await res.json();
    document.getElementById('nearResults').innerHTML = data.pgs.map(cardHTML).join('');
  }, () => toast('Location permission denied'));
});

// --- Add PG ---
document.getElementById('addBtn').addEventListener('click', async () => {
  const pg = {
    name: document.getElementById('a_name').value,
    city: document.getElementById('a_city').value,
    area: document.getElementById('a_area').value,
    price: Number(document.getElementById('a_price').value),
    type: document.getElementById('a_type').value,
    phone: document.getElementById('a_phone').value,
    address: document.getElementById('a_addr').value,
    food: false,
    safetyVerified: false,
    amenities: ['WiFi', 'CCTV'],
    sharing: '2 Sharing'
  };
  if (!pg.name || !pg.city || !pg.price) { toast('Please fill required fields'); return; }
  const res = await fetch('/api/pgs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(pg)
  });
  const data = await res.json();
  if (data.success) {
    toast('✅ PG Listed! (Pending verification)');
    document.getElementById('add').querySelectorAll('input,textarea').forEach(i => i.value = '');
  }
});

// --- Load cities on start ---
fetch('/api/cities').then(r => r.json()).then(cities => {
  console.log('Cities available:', cities);
});

// Register service worker (PWA)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(err => console.log('SW error:', err));
  });
}

// Initial search
searchPGs();
