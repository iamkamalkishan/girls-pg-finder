// Seed script: creates sample owners + PGs with DISTINCT owners
const db = require('./db');
const bcrypt = require('bcryptjs');

function seed() {
  // Clear existing demo data
  db.exec('DELETE FROM reviews; DELETE FROM inquiries; DELETE FROM pgs; DELETE FROM users;');

  const owners = [
    { name: 'Sunita Menon', email: 'sunita@sakhi-pg.com', phone: '+919820011001', password: 'owner123' },
    { name: 'Ravi Sharma', email: 'ravi@aasra-hostel.com', phone: '+919820011002', password: 'owner123' },
    { name: 'Neha Gupta', email: 'neha@care-pg.com', phone: '+919820011003', password: 'owner123' },
    { name: 'Arun Nair', email: 'arun@lakshmi-hostel.com', phone: '+919820011004', password: 'owner123' },
    { name: 'Pooja Reddy', email: 'pooja@swayam-pg.com', phone: '+919820011005', password: 'owner123' },
    { name: 'Vikram Singh', email: 'vikram@aanchal-pg.com', phone: '+919820011006', password: 'owner123' }
  ];

  const ownerIds = {};
  const insertUser = db.prepare('INSERT INTO users (name, email, password, role, phone) VALUES (?, ?, ?, ?, ?)');

  owners.forEach(o => {
    const hash = bcrypt.hashSync(o.password, 10);
    const info = insertUser.run(o.name, o.email, hash, 'owner', o.phone);
    ownerIds[o.email] = info.lastInsertRowid;
  });

  const pgs = [
    {
      owner: 'sunita@sakhi-pg.com', name: 'Sakhi Girls PG', city: 'Mumbai', area: 'Andheri West',
      type: 'PG', price: 9000, sharing: '2 Sharing', food: 1, safety_verified: 1, rating: 4.6,
      address: 'Plot 12, Link Road, Andheri West, Mumbai', phone: '+919820011001',
      amenities: ['WiFi', 'AC', 'Laundry', 'CCTV', '24x7 Security', 'Power Backup'],
      rules: 'No boys allowed. Curfew 10 PM.', nearby: 'Metro Station 500m, College 1.2km',
      reviews: [{ name: 'Priya', rating: 5, text: 'Very safe, owner is friendly.' }, { name: 'Anjali', rating: 4, text: 'Clean rooms, near metro.' }]
    },
    {
      owner: 'ravi@aasra-hostel.com', name: 'Aasra Working Women Hostel', city: 'Mumbai', area: 'Powai',
      type: 'Hostel', price: 12000, sharing: 'Single', food: 1, safety_verified: 1, rating: 4.8,
      address: 'Hiranandani Gardens, Powai, Mumbai', phone: '+919820011002',
      amenities: ['WiFi', 'AC', 'Gym', 'CCTV', '24x7 Security', 'Housekeeping'],
      rules: 'ID proof mandatory. No pets.', nearby: 'IT Park 800m, Lake 300m',
      reviews: [{ name: 'Sneha', rating: 5, text: 'Best for working women, very secure.' }]
    },
    {
      owner: 'neha@care-pg.com', name: 'Care Girls PG', city: 'Delhi', area: 'Karol Bagh',
      type: 'PG', price: 7000, sharing: '3 Sharing', food: 0, safety_verified: 0, rating: 4.1,
      address: 'Street 5, Karol Bagh, Delhi', phone: '+919820011003',
      amenities: ['WiFi', 'Laundry', 'CCTV'],
      rules: 'Curfew 9:30 PM.', nearby: 'Coaching centers 200m',
      reviews: [{ name: 'Ritu', rating: 4, text: 'Affordable, decent rooms.' }]
    },
    {
      owner: 'arun@lakshmi-hostel.com', name: 'Lakshmi Girls Hostel', city: 'Bangalore', area: 'Koramangala',
      type: 'Hostel', price: 8500, sharing: '2 Sharing', food: 1, safety_verified: 1, rating: 4.5,
      address: '5th Block, Koramangala, Bangalore', phone: '+919820011004',
      amenities: ['WiFi', 'AC', 'CCTV', '24x7 Security', 'Power Backup'],
      rules: 'No smoking. Visitors till 8 PM.', nearby: 'Tech Park 1km, Metro 600m',
      reviews: [{ name: 'Megha', rating: 5, text: 'Great food and very safe locality.' }]
    },
    {
      owner: 'pooja@swayam-pg.com', name: 'Swayam Girls PG', city: 'Bangalore', area: 'HSR Layout',
      type: 'PG', price: 7500, sharing: '3 Sharing', food: 1, safety_verified: 1, rating: 4.3,
      address: 'Sector 2, HSR Layout, Bangalore', phone: '+919820011005',
      amenities: ['WiFi', 'Laundry', 'CCTV', '24x7 Security'],
      rules: 'Curfew 10 PM.', nearby: 'College 500m',
      reviews: [{ name: 'Kavya', rating: 4, text: 'Good for students, near college.' }]
    },
    {
      owner: 'vikram@aanchal-pg.com', name: 'Aanchal Working Women PG', city: 'Delhi', area: 'Rajouri Garden',
      type: 'PG', price: 11000, sharing: 'Single', food: 1, safety_verified: 1, rating: 4.7,
      address: 'Block J, Rajouri Garden, Delhi', phone: '+919820011006',
      amenities: ['WiFi', 'AC', 'Gym', 'CCTV', '24x7 Security', 'Housekeeping', 'Power Backup'],
      rules: 'ID proof mandatory.', nearby: 'Market 300m, Metro 400m',
      reviews: [{ name: 'Nisha', rating: 5, text: 'Premium rooms, excellent security.' }]
    }
  ];

  const insertPg = db.prepare(`INSERT INTO pgs
    (owner_id, name, city, area, type, price, sharing, food, safety_verified, rating, address, phone, amenities, rules, nearby, status)
    VALUES (@owner_id, @name, @city, @area, @type, @price, @sharing, @food, @safety_verified, @rating, @address, @phone, @amenities, @rules, @nearby, 'approved')`);

  const insertReview = db.prepare('INSERT INTO reviews (pg_id, user_name, rating, text) VALUES (?, ?, ?, ?)');

  pgs.forEach(p => {
    const info = insertPg.run({
      owner_id: ownerIds[p.owner], name: p.name, city: p.city, area: p.area, type: p.type,
      price: p.price, sharing: p.sharing, food: p.food, safety_verified: p.safety_verified,
      rating: p.rating, address: p.address, phone: p.phone,
      amenities: JSON.stringify(p.amenities), rules: p.rules, nearby: p.nearby
    });
    p.reviews.forEach(r => insertReview.run(info.lastInsertRowid, r.name, r.rating, r.text));
  });

  console.log('✅ Seeded', owners.length, 'owners and', pgs.length, 'PGs');
  console.log('\nDemo owner logins (password: owner123):');
  owners.forEach(o => console.log(`  ${o.email}`));
}

seed();
