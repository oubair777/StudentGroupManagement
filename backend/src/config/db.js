const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config();

let dbType = 'unknown';
let pgPool = null;
let sqliteDb = null;

// Determine if PostgreSQL or SQLite should be used
async function initDb() {
  const connectionString = process.env.DATABASE_URL;

  // Try PostgreSQL first if configured
  if (connectionString && !process.env.FORCE_SQLITE) {
    try {
      const { Pool } = require('pg');
      const pool = new Pool({
        connectionString,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        connectionTimeoutMillis: 3000,
      });

      // Test connection
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();

      pgPool = pool;
      dbType = 'postgres';
      console.log('✅ Connected to PostgreSQL database');
      return { dbType: 'postgres', pool: pgPool };
    } catch (err) {
      console.warn('⚠️  PostgreSQL connection failed or unavailable:', err.message);
      console.log('🔄 Falling back to local SQLite engine for smooth development / evaluation...');
    }
  }

  // Fallback to SQLite
  try {
    const sqlite3 = require('sqlite3').verbose();
    const dbDir = path.resolve(__dirname, '../../data');
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    const dbPath = path.resolve(dbDir, 'dev.db');

    sqliteDb = new sqlite3.Database(dbPath);
    dbType = 'sqlite';
    console.log(`✅ Connected to SQLite database at ${dbPath}`);
    return { dbType: 'sqlite', db: sqliteDb };
  } catch (err) {
    console.error('❌ Failed to initialize any database engine:', err);
    throw err;
  }
}

// Convert PostgreSQL $1, $2 placeholders to SQLite ? placeholders
function convertPgToSqliteQuery(sql, params = []) {
  let sqliteSql = sql.replace(/\$\d+/g, '?');
  // Also adjust ILIKE to LIKE for SQLite compatibility
  sqliteSql = sqliteSql.replace(/\bILIKE\b/gi, 'LIKE');
  return { sql: sqliteSql, params };
}

// Universal query runner
async function query(sql, params = []) {
  if (dbType === 'unknown') {
    await initDb();
  }

  if (dbType === 'postgres') {
    const res = await pgPool.query(sql, params);
    return {
      rows: res.rows,
      rowCount: res.rowCount,
      insertId: res.rows[0]?.id || null,
    };
  } else if (dbType === 'sqlite') {
    return new Promise((resolve, reject) => {
      const isSelect = /^\s*(SELECT|PRAGMA)/i.test(sql);
      const isInsert = /^\s*INSERT/i.test(sql);
      const converted = convertPgToSqliteQuery(sql, params);

      if (isSelect) {
        sqliteDb.all(converted.sql, converted.params, (err, rows) => {
          if (err) return reject(err);
          resolve({ rows: rows || [], rowCount: (rows || []).length });
        });
      } else {
        sqliteDb.run(converted.sql, converted.params, function (err) {
          if (err) return reject(err);
          // If query had RETURNING id or RETURNING *, emulate it if requested
          if (/RETURNING\s+/i.test(sql)) {
            const lastId = this.lastID;
            const tableMatch = sql.match(/INTO\s+([a-zA-Z0-9_]+)/i);
            const tableName = tableMatch ? tableMatch[1] : null;
            if (tableName && lastId) {
              sqliteDb.get(`SELECT * FROM ${tableName} WHERE id = ?`, [lastId], (fetchErr, row) => {
                if (fetchErr) return reject(fetchErr);
                resolve({
                  rows: row ? [row] : [],
                  rowCount: this.changes,
                  insertId: lastId,
                });
              });
              return;
            }
          }
          resolve({
            rows: [{ id: this.lastID }],
            rowCount: this.changes,
            insertId: this.lastID,
          });
        });
      }
    });
  }
}

// Helper to run raw SQL script (for migrations/seeding)
async function execScript(sqlString) {
  if (dbType === 'unknown') {
    await initDb();
  }

  if (dbType === 'postgres') {
    await pgPool.query(sqlString);
  } else if (dbType === 'sqlite') {
    return new Promise((resolve, reject) => {
      sqliteDb.exec(sqlString, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  }
}

function getDbType() {
  return dbType;
}

module.exports = {
  initDb,
  query,
  execScript,
  getDbType,
};
