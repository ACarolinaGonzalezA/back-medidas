const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function testConnection() {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('✅ Conexión exitosa a la base de datos:', res.rows[0]);
  } catch (error) {
    console.error('❌ Error conectando a la base de datos:', error.message);
  } finally {
    await pool.end();
  }
}

testConnection();