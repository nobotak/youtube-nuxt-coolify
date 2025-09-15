import { db } from '~/server/db';

type ApiUsageRow = {
  id?: number;
  operation: string;
  cost: number;
  created_at?: string;
};

function ensureUsageTable(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS api_usage (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      operation TEXT NOT NULL,
      cost INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

export function recordApiUsage(operation: string, cost: number): void {
  ensureUsageTable();
  const stmt = db.prepare('INSERT INTO api_usage (operation, cost) VALUES (?, ?)');
  stmt.run(operation, cost);
}

export function getTodayUsageSummary(): {
  used: number;
  breakdown: Array<{ operation: string; count: number; cost: number }>
} {
  ensureUsageTable();
  // SQLite start of day in local time
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const iso = startOfDay.toISOString();

  const breakdown = db.prepare(`
    SELECT operation, COUNT(*) as count, SUM(cost) as cost
    FROM api_usage
    WHERE datetime(created_at) >= datetime(?)
    GROUP BY operation
    ORDER BY cost DESC
  `).all(iso) as Array<{ operation: string; count: number; cost: number }>;

  const used = breakdown.reduce((sum, r) => sum + (Number(r.cost) || 0), 0);
  return { used, breakdown };
}


