import app from '../server/src/index.js';
import { initializeDb } from '../server/src/db/database.js';

// Vercel serverless functions are ephemeral. We must ensure the DB is initialized
// before handling any requests in this environment.
let dbInitialized = false;

export default async function handler(req, res) {
  if (!dbInitialized) {
    await initializeDb();
    dbInitialized = true;
  }
  return app(req, res);
}
