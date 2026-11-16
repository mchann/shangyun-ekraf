import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { neon } from '@neondatabase/serverless';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, '../.env');
let dbUrl = '';
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const match = envContent.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/);
  if (match) dbUrl = match[1];
}

const sql = neon(dbUrl);

async function run() {
  console.log('--- MIGRATING SHANG YUN SCHEMA TO NEON ---');
  
  // 1. Create Sellers Table
  console.log('Creating sy_sellers table...');
  await sql.query(`
    CREATE TABLE IF NOT EXISTS sy_sellers (
      id VARCHAR(50) PRIMARY KEY,
      nama VARCHAR(100) NOT NULL,
      email VARCHAR(100) UNIQUE,
      nama_toko VARCHAR(100) NOT NULL,
      no_wa VARCHAR(20) NOT NULL,
      spesialisasi VARCHAR(50) DEFAULT 'Kerajinan Tangan',
      status VARCHAR(20) DEFAULT 'active',
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 2. Create Products Table
  console.log('Creating sy_products table...');
  await sql.query(`
    CREATE TABLE IF NOT EXISTS sy_products (
      id VARCHAR(50) PRIMARY KEY,
      seller_id VARCHAR(50) REFERENCES sy_sellers(id) ON DELETE CASCADE,
      nama VARCHAR(120) NOT NULL,
      kategori VARCHAR(50) NOT NULL,
      harga NUMERIC(15, 2) NOT NULL CHECK (harga >= 0),
      stok INTEGER NOT NULL CHECK (stok >= 0),
      deskripsi TEXT,
      image_url TEXT,
      unggulan BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 3. Create Users / Auth Roles Table
  console.log('Creating sy_users table...');
  await sql.query(`
    CREATE TABLE IF NOT EXISTS sy_users (
      id VARCHAR(50) PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(100),
      role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'seller', 'pembeli')),
      seller_id VARCHAR(50) REFERENCES sy_sellers(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Indexes
  await sql.query(`CREATE INDEX IF NOT EXISTS idx_sy_products_seller_id ON sy_products(seller_id);`);
  await sql.query(`CREATE INDEX IF NOT EXISTS idx_sy_products_kategori ON sy_products(kategori);`);
  await sql.query(`CREATE INDEX IF NOT EXISTS idx_sy_products_unggulan ON sy_products(unggulan);`);

  // Seed Sellers
  console.log('Seeding sy_sellers...');
  await sql.query(`
    INSERT INTO sy_sellers (id, nama, email, nama_toko, no_wa, spesialisasi) VALUES
    ('s1', 'Master Chen Zhao', 'chen.zhao@shangyun.id', 'Zhao Atelier Suzhou', '6285738211550', 'Sulam Sutra & Kipas'),
    ('s2', 'Artisan Lin Mei', 'lin.mei@shangyun.id', 'Mei Cinnabar Workshop', '6281234567890', 'Kerajinan Lakur & Kayu'),
    ('s3', 'Wang Jin Long', 'wang.jinlong@shangyun.id', 'Jinlong Jade & Porcelain', '6281987654321', 'Keramik & Ukiran Giok')
    ON CONFLICT (id) DO NOTHING;
  `);

  // Seed Products
  console.log('Seeding sy_products...');
  await sql.query(`
    INSERT INTO sy_products (id, seller_id, nama, kategori, harga, stok, deskripsi, image_url, unggulan) VALUES
    ('p1', 's1', 'Lampion Sutra Emas', 'Dekorasi', 450000, 12, 'Sutra berbingkai kayu dengan sulam benang emas, tinggi 40 cm.', '', TRUE),
    ('p2', 's1', 'Angpao Sutra Bordir (isi 10)', 'Angpao', 185000, 40, 'Amplop kain bordir tangan dalam kotak berlapis beludru.', '', FALSE),
    ('p3', 's2', 'Hampers Imlek Prestige', 'Hampers', 1250000, 6, 'Kotak lakur merah berisi teh, kue kering, lilin, dan angpao.', '', TRUE),
    ('p4', 's2', 'Gantungan Simpul Keberuntungan', 'Aksesori', 95000, 30, 'Tali sutra merah dengan manik kayu, dirangkai satu per satu.', '', FALSE),
    ('p5', 's3', 'Kaligrafi Fu Berbingkai', 'Dekorasi', 780000, 5, 'Aksara Fu tulisan tangan di kertas beras, bingkai jati.', '', TRUE),
    ('p6', 's2', 'Kotak Teh Lakur Hitam', 'Hampers', 560000, 0, 'Lakur hitam bertepi emas, muat empat kaleng teh.', '', FALSE),
    ('p7', 's3', 'Ornamen Naga Keramik', 'Dekorasi', 890000, 8, 'Keramik glasir merah marun untuk meja altar atau ruang tamu.', '', FALSE),
    ('p8', 's1', 'Kipas Lipat Bordir', 'Aksesori', 210000, 18, 'Kipas bambu dengan kain bordir bunga plum.', '', FALSE)
    ON CONFLICT (id) DO NOTHING;
  `);

  // Seed Users
  console.log('Seeding sy_users...');
  await sql.query(`
    INSERT INTO sy_users (id, username, email, role, seller_id) VALUES
    ('u_admin', 'admin', 'admin@shangyun.id', 'admin', NULL),
    ('u_seller1', 'seller_chen', 'chen.zhao@shangyun.id', 'seller', 's1'),
    ('u_seller2', 'seller_lin', 'lin.mei@shangyun.id', 'seller', 's2'),
    ('u_pembeli', 'pembeli_vip', 'pembeli@shangyun.id', 'pembeli', NULL)
    ON CONFLICT (id) DO NOTHING;
  `);

  console.log('Verifying table records in Neon:');
  const sCount = await sql.query("SELECT COUNT(*) FROM sy_sellers");
  const pCount = await sql.query("SELECT COUNT(*) FROM sy_products");
  const uCount = await sql.query("SELECT COUNT(*) FROM sy_users");
  console.log('sy_sellers count:', sCount[0].count);
  console.log('sy_products count:', pCount[0].count);
  console.log('sy_users count:', uCount[0].count);
  console.log('✅ NEON DATABASE READY & SEEDED!');
}

run().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
