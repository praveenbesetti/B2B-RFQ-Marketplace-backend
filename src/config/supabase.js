// src/config/supabase.js
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const connectionString = process.env.PG_CONNECTION_STRING || process.env.DATABASE_URL;
const isNeonHost = process.env.PG_HOST?.includes('.neon.tech');
const useSsl = process.env.PG_SSL === 'true' || isNeonHost;

const poolConfig = {
  connectionString,
  host: process.env.PG_HOST,
  port: Number(process.env.PG_PORT) || 5432,
  database: process.env.PG_DATABASE,
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  max: Number(process.env.PG_POOL_MAX) || 10,
  min: Number(process.env.PG_POOL_MIN) || 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: Number(process.env.PG_CONNECTION_TIMEOUT) || 15000,
  ssl: useSsl ? { rejectUnauthorized: false } : false,
};

const missingEnv = [
  !poolConfig.connectionString && !poolConfig.host ? 'PG_HOST' : null,
  !poolConfig.connectionString && !poolConfig.database ? 'PG_DATABASE' : null,
  !poolConfig.connectionString && !poolConfig.user ? 'PG_USER' : null,
  !poolConfig.connectionString && !poolConfig.password ? 'PG_PASSWORD' : null,
].filter(Boolean);

if (missingEnv.length) {
  console.warn('⚠️ PostgreSQL env missing values:', missingEnv.join(', '));
}

export const supabase = new Pool(poolConfig);

supabase.on('error', (err) => {
  console.error('❌ PostgreSQL idle client error:', err.message);
});

export const testDatabaseConnection = async () => {
  const client = await supabase.connect();
  try {
    const result = await client.query('SELECT NOW() as now');
    console.log('✅ PostgreSQL connected at', result.rows[0].now);
    console.log(`   DB: ${process.env.PG_DATABASE || 'unknown'} | Host: ${process.env.PG_HOST || 'connection string'}`);
    return result.rows[0];
  } finally {
    client.release();
  }
};

export default supabase;