import { db } from '~/server/db';

function ensureLogsTable(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS action_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

export function recordLog(action: string, details?: string): void {
  ensureLogsTable();
  const stmt = db.prepare('INSERT INTO action_logs (action, details) VALUES (?, ?)');
  stmt.run(action, details ?? null);
}

export function getRecentLogs(limit = 20): Array<{ id: number; action: string; details?: string; created_at: string }>{
  ensureLogsTable();
  const stmt = db.prepare('SELECT id, action, details, created_at FROM action_logs ORDER BY created_at DESC, id DESC LIMIT ?');
  return stmt.all(limit) as any;
}


