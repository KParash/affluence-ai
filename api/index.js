import app from '../server/src/index.js';
import { initializeDb, getDb } from '../server/src/db/database.js';
import { seed } from '../server/src/db/seed.js';

// Vercel serverless functions are ephemeral. We must ensure the DB is initialized
// before handling any requests in this environment.
let dbInitialized = false;

export default async function handler(req, res) {
  try {
    if (!dbInitialized) {
      await initializeDb();
      const db = await getDb();
      const userCount = db.prepare('SELECT COUNT(*) as c FROM users').get();
      if (userCount && userCount.c === 0) {
        console.log('Vercel: Database is empty. Running seed script...');
        await seed();
      }
      dbInitialized = true;
    }
    return app(req, res);
  } catch (error) {
    console.error('Serverless Initialization Error:', error);
    return res.status(500).json({ 
      error: 'Serverless initialization failed', 
      details: error.message,
      stack: error.stack 
    });
  }
}
