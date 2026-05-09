import initSqlJs from 'sql.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATA_DIR = join(__dirname, '..', '..', 'data');
const DB_PATH = join(DATA_DIR, 'affluenceai.db');

let db;
let SQL;

// Wrapper to make sql.js API match better-sqlite3 style
class DbWrapper {
  constructor(sqlDb) {
    this._db = sqlDb;
  }

  exec(sql) {
    this._db.run(sql);
    this.save();
  }

  prepare(sql) {
    const self = this;
    return {
      run(...params) {
        const stmt = self._db.prepare(sql);
        if (params.length > 0) stmt.bind(params);
        stmt.step();
        stmt.free();
        // Get last insert rowid
        const result = self._db.exec('SELECT last_insert_rowid() as id');
        const lastInsertRowid = result.length > 0 ? result[0].values[0][0] : 0;
        const changes = self._db.getRowsModified();
        self.save();
        return { lastInsertRowid, changes };
      },
      get(...params) {
        const stmt = self._db.prepare(sql);
        stmt.bind(params);
        if (stmt.step()) {
          const cols = stmt.getColumnNames();
          const vals = stmt.get();
          stmt.free();
          const row = {};
          cols.forEach((col, i) => { row[col] = vals[i]; });
          return row;
        }
        stmt.free();
        return undefined;
      },
      all(...params) {
        const results = [];
        const stmt = self._db.prepare(sql);
        stmt.bind(params);
        while (stmt.step()) {
          const cols = stmt.getColumnNames();
          const vals = stmt.get();
          const row = {};
          cols.forEach((col, i) => { row[col] = vals[i]; });
          results.push(row);
        }
        stmt.free();
        return results;
      },
    };
  }

  transaction(fn) {
    return (...args) => {
      this._db.run('BEGIN TRANSACTION');
      try {
        const result = fn(...args);
        this._db.run('COMMIT');
        this.save();
        return result;
      } catch (err) {
        this._db.run('ROLLBACK');
        throw err;
      }
    };
  }

  save() {
    const data = this._db.export();
    const buffer = Buffer.from(data);
    writeFileSync(DB_PATH, buffer);
  }
}

export async function initSql() {
  if (!SQL) {
    SQL = await initSqlJs();
  }
  return SQL;
}

export async function getDb() {
  if (!db) {
    await initSql();
    if (!existsSync(DATA_DIR)) {
      mkdirSync(DATA_DIR, { recursive: true });
    }
    if (existsSync(DB_PATH)) {
      const fileBuffer = readFileSync(DB_PATH);
      db = new DbWrapper(new SQL.Database(fileBuffer));
    } else {
      db = new DbWrapper(new SQL.Database());
    }
  }
  return db;
}

export async function initializeDb() {
  const db = await getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'influencer', 'finance')),
      name TEXT NOT NULL,
      avatar_url TEXT DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS influencers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      referral_code TEXT UNIQUE NOT NULL,
      commission_rate REAL DEFAULT 0.10,
      total_earnings REAL DEFAULT 0.0,
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'suspended')),
      platform TEXT DEFAULT '',
      followers INTEGER DEFAULT 0,
      niche TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      image_url TEXT DEFAULT '',
      affiliate_url_base TEXT DEFAULT '',
      category TEXT DEFAULT '',
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS clicks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      influencer_id INTEGER NOT NULL,
      product_id INTEGER DEFAULT NULL,
      ip_address TEXT DEFAULT '',
      user_agent TEXT DEFAULT '',
      referrer TEXT DEFAULT '',
      is_unique INTEGER DEFAULT 1,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (influencer_id) REFERENCES influencers(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      influencer_id INTEGER NOT NULL,
      product_id INTEGER DEFAULT NULL,
      order_id TEXT UNIQUE,
      amount REAL NOT NULL,
      commission_amount REAL NOT NULL,
      customer_email TEXT DEFAULT '',
      date DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'completed' CHECK(status IN ('completed', 'refunded', 'pending')),
      FOREIGN KEY (influencer_id) REFERENCES influencers(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      influencer_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'paid', 'rejected')),
      period_start DATE,
      period_end DATE,
      paid_at DATETIME DEFAULT NULL,
      transaction_ref TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (influencer_id) REFERENCES influencers(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS ai_insights (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      influencer_id INTEGER DEFAULT NULL,
      insight_type TEXT NOT NULL CHECK(insight_type IN ('prediction', 'performance', 'fraud')),
      insight_text TEXT NOT NULL,
      confidence REAL DEFAULT 0.0,
      metadata TEXT DEFAULT '{}',
      generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (influencer_id) REFERENCES influencers(id) ON DELETE CASCADE
    );
  `);

  // Create indexes separately (sql.js handles these fine)
  try {
    db.exec('CREATE INDEX IF NOT EXISTS idx_clicks_influencer ON clicks(influencer_id)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_clicks_timestamp ON clicks(timestamp)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_sales_influencer ON sales(influencer_id)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(date)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_payments_influencer ON payments(influencer_id)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status)');
  } catch (e) {
    // Indexes may already exist
  }

  console.log('✅ Database initialized successfully');
  return db;
}
