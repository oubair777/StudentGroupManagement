const app = require('./app');
const db = require('./config/db');
const path = require('path');
const fs = require('fs');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    console.log('🚀 Initializing Database Connection...');
    await db.initDb();

    // Check if users table exists; if not, auto-initialize schema
    const checkUsers = await db.query(
      db.getDbType() === 'postgres'
        ? "SELECT to_regclass('public.users') as exists"
        : "SELECT name FROM sqlite_master WHERE type='table' AND name='users'"
    );

    const exists =
      db.getDbType() === 'postgres'
        ? checkUsers.rows[0]?.exists !== null
        : checkUsers.rows.length > 0;

    if (!exists) {
      console.log('📦 Database tables not found. Automatically running schema setup...');
      const schemaFileName =
        db.getDbType() === 'postgres' ? 'schema.sql' : 'schema.sqlite.sql';
      const schemaPath = path.resolve(__dirname, 'db', schemaFileName);
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      await db.execScript(schemaSql);
      console.log('✅ Database schema initialized successfully.');

      // Automatically seed sample demo data
      console.log('🌱 Seeding initial demo data...');
      const seedModule = require('./db/seed');
      await seedModule.runSeed();
    }

    app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`🎉 Joineazy Backend Server running on port ${PORT}`);
      console.log(`🌐 Base URL: http://localhost:${PORT}/api`);
      console.log(`📊 DB Engine: ${db.getDbType().toUpperCase()}`);
      console.log(`====================================================`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
