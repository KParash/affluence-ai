import { initializeDb, getDb } from './database.js';
import bcrypt from 'bcryptjs';

const INFLUENCER_DATA = [
  { name: 'Priya Sharma', email: 'priya@example.com', code: 'PRIYA2024', platform: 'Instagram', followers: 245000, niche: 'Fashion', rate: 0.12 },
  { name: 'Arjun Mehta', email: 'arjun@example.com', code: 'ARJUN_STYLE', platform: 'YouTube', followers: 890000, niche: 'Tech', rate: 0.10 },
  { name: 'Sneha Reddy', email: 'sneha@example.com', code: 'SNEHA_FIT', platform: 'Instagram', followers: 167000, niche: 'Fitness', rate: 0.15 },
  { name: 'Rohan Kapoor', email: 'rohan@example.com', code: 'ROHAN_K', platform: 'YouTube', followers: 1200000, niche: 'Lifestyle', rate: 0.08 },
  { name: 'Ananya Patel', email: 'ananya@example.com', code: 'ANANYA_BEAUTY', platform: 'Instagram', followers: 520000, niche: 'Beauty', rate: 0.12 },
  { name: 'Vikram Singh', email: 'vikram@example.com', code: 'VIK_TECH', platform: 'Twitter', followers: 98000, niche: 'Tech', rate: 0.10 },
  { name: 'Kavya Nair', email: 'kavya@example.com', code: 'KAVYA_COOK', platform: 'YouTube', followers: 340000, niche: 'Food', rate: 0.11 },
  { name: 'Aditya Joshi', email: 'aditya@example.com', code: 'ADI_GAME', platform: 'Twitch', followers: 175000, niche: 'Gaming', rate: 0.09 },
  { name: 'Meera Iyer', email: 'meera@example.com', code: 'MEERA_TRAVEL', platform: 'Instagram', followers: 430000, niche: 'Travel', rate: 0.13 },
  { name: 'Rahul Gupta', email: 'rahul@example.com', code: 'RAHUL_EDU', platform: 'YouTube', followers: 670000, niche: 'Education', rate: 0.10 }
];

const PRODUCTS = [
  { name: 'Premium Wireless Earbuds', price: 2999, category: 'Electronics' },
  { name: 'Organic Skincare Set', price: 1499, category: 'Beauty' },
  { name: 'Fitness Resistance Bands', price: 799, category: 'Fitness' },
  { name: 'Smart Water Bottle', price: 1299, category: 'Health' },
  { name: 'Laptop Stand Pro', price: 1999, category: 'Tech' },
  { name: 'Artisan Coffee Blend', price: 599, category: 'Food' },
  { name: 'Yoga Mat Premium', price: 1799, category: 'Fitness' },
  { name: 'LED Desk Lamp', price: 2499, category: 'Home' },
];

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function formatDate(d) {
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export async function seed() {
  console.log('🌱 Seeding database...\n');
  await initializeDb();
  const db = await getDb();

  // Clear existing data
  db.exec('DELETE FROM ai_insights');
  db.exec('DELETE FROM payments');
  db.exec('DELETE FROM sales');
  db.exec('DELETE FROM clicks');
  db.exec('DELETE FROM influencers');
  db.exec('DELETE FROM products');
  db.exec('DELETE FROM users');

  const passwordHash = await bcrypt.hash('password123', 10);

  // Create admin user
  const adminResult = db.prepare(
    'INSERT INTO users (email, password_hash, role, name) VALUES (?, ?, ?, ?)'
  ).run(passwordHash.includes('admin') ? 'x' : 'admin@affluenceai.com', passwordHash, 'admin', 'Admin User');
  // Fix: just use direct values
  db.exec("DELETE FROM users");

  // Re-insert properly
  const insertUser = (email, hash, role, name) => {
    return db.prepare('INSERT INTO users (email, password_hash, role, name) VALUES (?, ?, ?, ?)').run(email, hash, role, name);
  };

  const admin = insertUser('admin@affluenceai.com', passwordHash, 'admin', 'Admin User');
  console.log(`✅ Created admin user (id: ${admin.lastInsertRowid})`);

  const finance = insertUser('finance@affluenceai.com', passwordHash, 'finance', 'Finance Team');
  console.log(`✅ Created finance user (id: ${finance.lastInsertRowid})`);

  // Create products
  const productIds = [];
  for (const p of PRODUCTS) {
    const result = db.prepare(
      'INSERT INTO products (name, price, category, affiliate_url_base) VALUES (?, ?, ?, ?)'
    ).run(p.name, p.price, p.category, `https://store.affluenceai.com/product/${p.name.toLowerCase().replace(/\s+/g, '-')}`);
    productIds.push(result.lastInsertRowid);
  }
  console.log(`✅ Created ${PRODUCTS.length} products`);

  // Create influencer users and profiles
  const influencerIds = [];
  for (const inf of INFLUENCER_DATA) {
    const userResult = insertUser(inf.email, passwordHash, 'influencer', inf.name);
    const infResult = db.prepare(
      'INSERT INTO influencers (user_id, referral_code, commission_rate, platform, followers, niche) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(userResult.lastInsertRowid, inf.code, inf.rate, inf.platform, inf.followers, inf.niche);
    influencerIds.push(infResult.lastInsertRowid);
  }
  console.log(`✅ Created ${INFLUENCER_DATA.length} influencer profiles`);

  // Generate clicks (3000+)
  const now = new Date();
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  let totalClicks = 0;
  for (let infIdx = 0; infIdx < influencerIds.length; infIdx++) {
    const infId = influencerIds[infIdx];
    const clickCount = randomInt(200, 500);
    const hasFraudSpike = infIdx === 7; // Aditya gets suspicious clicks

    for (let i = 0; i < clickCount; i++) {
      let clickDate;
      if (hasFraudSpike && i > clickCount - 50) {
        const spikeDay = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
        clickDate = new Date(spikeDay.getTime() + Math.random() * 3600000);
      } else {
        clickDate = randomDate(ninetyDaysAgo, now);
      }

      const productId = productIds[randomInt(0, productIds.length - 1)];
      const ip = `${randomInt(100, 255)}.${randomInt(0, 255)}.${randomInt(0, 255)}.${randomInt(1, 254)}`;
      const isUnique = hasFraudSpike && i > clickCount - 50 ? 0 : (Math.random() > 0.15 ? 1 : 0);

      db.prepare(
        'INSERT INTO clicks (influencer_id, product_id, ip_address, user_agent, is_unique, timestamp) VALUES (?, ?, ?, ?, ?, ?)'
      ).run(infId, productId, ip, 'Mozilla/5.0', isUnique, formatDate(clickDate));
      totalClicks++;
    }
  }
  console.log(`✅ Generated ${totalClicks} clicks`);

  // Generate sales
  let totalSales = 0;
  let orderNum = 10000;

  for (let infIdx = 0; infIdx < influencerIds.length; infIdx++) {
    const infId = influencerIds[infIdx];
    const infData = INFLUENCER_DATA[infIdx];
    const baseSales = Math.floor(infData.followers / 10000);
    const saleCount = randomInt(Math.max(30, baseSales), Math.max(80, baseSales * 2));
    const weekendBias = infIdx % 3 === 0;

    for (let i = 0; i < saleCount; i++) {
      let saleDate = randomDate(ninetyDaysAgo, now);

      if (weekendBias && Math.random() > 0.4) {
        while (saleDate.getDay() !== 0 && saleDate.getDay() !== 6) {
          saleDate = new Date(saleDate.getTime() + 24 * 60 * 60 * 1000);
        }
      }

      const prodIdx = randomInt(0, productIds.length - 1);
      const productId = productIds[prodIdx];
      const product = PRODUCTS[prodIdx];
      const amount = product ? product.price : randomInt(500, 3000);
      const commission = Math.round(amount * infData.rate * 100) / 100;
      const orderId = `ORD-${++orderNum}`;
      const status = Math.random() > 0.05 ? 'completed' : 'refunded';

      db.prepare(
        'INSERT INTO sales (influencer_id, product_id, order_id, amount, commission_amount, customer_email, date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      ).run(infId, productId, orderId, amount, commission, `customer${randomInt(1, 9999)}@email.com`, formatDate(saleDate), status);
      totalSales++;
    }
  }
  console.log(`✅ Generated ${totalSales} sales`);

  // Update total_earnings
  for (const infId of influencerIds) {
    const result = db.prepare(
      "SELECT COALESCE(SUM(commission_amount), 0) as total FROM sales WHERE influencer_id = ? AND status = 'completed'"
    ).get(infId);
    db.prepare('UPDATE influencers SET total_earnings = ? WHERE id = ?').run(result.total, infId);
  }

  // Generate payments
  let totalPayments = 0;
  for (const infId of influencerIds) {
    for (let month = 2; month >= 0; month--) {
      const periodEnd = new Date(now.getTime() - month * 30 * 24 * 60 * 60 * 1000);
      const periodStart = new Date(periodEnd.getTime() - 30 * 24 * 60 * 60 * 1000);

      const result = db.prepare(
        "SELECT COALESCE(SUM(commission_amount), 0) as total FROM sales WHERE influencer_id = ? AND date BETWEEN ? AND ? AND status = 'completed'"
      ).get(infId, formatDate(periodStart), formatDate(periodEnd));

      if (result && result.total > 0) {
        let status, paidAt, txRef;
        if (month === 2) {
          status = 'paid';
          paidAt = formatDate(new Date(periodEnd.getTime() + 5 * 24 * 60 * 60 * 1000));
          txRef = `TXN-${Date.now()}-${randomInt(1000, 9999)}`;
        } else if (month === 1) {
          status = 'approved';
          paidAt = null;
          txRef = '';
        } else {
          status = 'pending';
          paidAt = null;
          txRef = '';
        }

        db.prepare(
          'INSERT INTO payments (influencer_id, amount, status, period_start, period_end, paid_at, transaction_ref, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        ).run(infId, Math.round(result.total * 100) / 100, status,
          periodStart.toISOString().slice(0, 10), periodEnd.toISOString().slice(0, 10),
          paidAt, txRef,
          formatDate(new Date(periodEnd.getTime() + 2 * 24 * 60 * 60 * 1000)));
        totalPayments++;
      }
    }
  }
  console.log(`✅ Generated ${totalPayments} payments`);

  // Summary
  const userCount = db.prepare('SELECT COUNT(*) as c FROM users').get();
  const infCount = db.prepare('SELECT COUNT(*) as c FROM influencers').get();
  const prodCount = db.prepare('SELECT COUNT(*) as c FROM products').get();
  const clickCount = db.prepare('SELECT COUNT(*) as c FROM clicks').get();
  const saleCount = db.prepare('SELECT COUNT(*) as c FROM sales').get();
  const payCount = db.prepare('SELECT COUNT(*) as c FROM payments').get();
  const totalRev = db.prepare("SELECT COALESCE(SUM(amount), 0) as t FROM sales WHERE status = 'completed'").get();

  console.log('\n📊 Seed Summary:');
  console.log(`   Users: ${userCount.c}`);
  console.log(`   Influencers: ${infCount.c}`);
  console.log(`   Products: ${prodCount.c}`);
  console.log(`   Clicks: ${clickCount.c}`);
  console.log(`   Sales: ${saleCount.c}`);
  console.log(`   Payments: ${payCount.c}`);
  console.log(`   Total Revenue: ₹${totalRev.t.toLocaleString()}`);
  console.log('\n🎉 Seeding complete!\n');
  console.log('📧 Login credentials:');
  console.log('   Admin: admin@affluenceai.com / password123');
  console.log('   Finance: finance@affluenceai.com / password123');
  console.log('   Influencer: priya@example.com / password123 (or any influencer email)');
}

if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  seed().catch(console.error);
}
