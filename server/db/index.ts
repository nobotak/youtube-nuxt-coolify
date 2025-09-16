import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_DIR = path.join(process.cwd(), 'server', 'db');
const DEFAULT_DB_PATH = path.join(DB_DIR, 'youtube_videos.db');
const ENV_DB_PATH = process.env.DB_FILE || process.env.NUXT_DB_PATH;
// Always prefer explicit env path even if file does not exist yet (so new DB is created on the volume)
export const DB_PATH = ENV_DB_PATH || DEFAULT_DB_PATH;

// Ensure the directory for the database exists (for either env or default location)
const DB_PARENT_DIR = path.dirname(DB_PATH);
if (!fs.existsSync(DB_PARENT_DIR)) {
  fs.mkdirSync(DB_PARENT_DIR, { recursive: true });
}

// If DB file doesn't exist yet, try to restore from known locations/backups
function tryRestoreDatabase(targetPath: string) {
  if (fs.existsSync(targetPath)) return;

  const candidates: string[] = [];

  // 1) Root data folder direct DB
  candidates.push(path.join(process.cwd(), 'data', 'youtube_videos.db'));
  // 2) Old project DB locations
  candidates.push(path.join(process.cwd(), 'old', 'data', 'youtube_videos.db'));
  candidates.push(path.join(process.cwd(), 'old', 'youtube_videos.db'));

  // 3) Latest backup in root data folder
  const dataDir = path.join(process.cwd(), 'data');
  if (fs.existsSync(dataDir)) {
    try {
      const backups = fs
        .readdirSync(dataDir)
        .filter((f) => f.startsWith('youtube_videos_backup_') && f.endsWith('.db'))
        .map((f) => ({ f, ts: fs.statSync(path.join(dataDir, f)).mtimeMs }))
        .sort((a, b) => b.ts - a.ts);
      if (backups.length > 0) {
        candidates.push(path.join(dataDir, backups[0].f));
      }
    } catch {}
  }

  // 4) Backup in old/data
  const oldDataDir = path.join(process.cwd(), 'old', 'data');
  if (fs.existsSync(oldDataDir)) {
    try {
      const backups = fs
        .readdirSync(oldDataDir)
        .filter((f) => (f.startsWith('youtube_videos_backup_') && f.endsWith('.db')) || f === 'youtube_videos.db')
        .map((f) => ({ f, ts: fs.statSync(path.join(oldDataDir, f)).mtimeMs }))
        .sort((a, b) => b.ts - a.ts);
      if (backups.length > 0) {
        candidates.push(path.join(oldDataDir, backups[0].f));
      }
    } catch {}
  }

  const source = candidates.find((p) => fs.existsSync(p));
  if (source) {
    // Ensure parent dir exists for target
    const dir = path.dirname(targetPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.copyFileSync(source, targetPath);
    console.log(`Restored SQLite database from ${source} -> ${targetPath}`);
  }
}

tryRestoreDatabase(DB_PATH);

console.log(`Database path: ${DB_PATH}`);

const isProduction = process.env.NODE_ENV === 'production';
export let db: Database = new Database(DB_PATH, { verbose: isProduction ? undefined : console.log });

function initializeDB() {
  console.log('Initializing database...');

  const createChannelsTable = `
    CREATE TABLE IF NOT EXISTS channels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      channel_id TEXT UNIQUE NOT NULL,
      channel_name TEXT,
      channel_url TEXT,
      thumbnail_url TEXT,
      is_active BOOLEAN DEFAULT 1,
      check_interval INTEGER DEFAULT 1800000,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_check DATETIME,
      api_key TEXT
    );
  `;

  const createVideosTable = `
    CREATE TABLE IF NOT EXISTS videos (
      video_id TEXT PRIMARY KEY,
      channel_id TEXT,
      title TEXT,
      published_at TEXT,
      duration TEXT,
      type TEXT,
      captions TEXT,
      flag TEXT, 
      response TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (channel_id) REFERENCES channels(channel_id)
    );
  `;

  db.exec(createChannelsTable);
  db.exec(createVideosTable);

  console.log('Database tables are ready.');
}

initializeDB();

export function replaceDatabaseFromFile(sourcePath: string) {
  console.log(`[db] replaceDatabaseFromFile called. source=${sourcePath} target=${DB_PATH}`);
  // Close current connection
  try {
    db?.close?.();
    console.log('[db] Closed previous database connection.');
  } catch (e) {
    console.warn('[db] Failed to close previous connection (continuing):', e);
  }

  // Ensure target dir exists
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  // Replace database file
  fs.copyFileSync(sourcePath, DB_PATH);
  console.log('[db] Copied uploaded file over target DB.');

  // Reopen connection
  db = new Database(DB_PATH, { verbose: isProduction ? undefined : console.log });
  console.log('[db] Reopened database connection.');
}
