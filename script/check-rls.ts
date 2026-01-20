
import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const { Pool } = pg;

async function checkRLS() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const res = await pool.query(`
      SELECT tablename, rowsecurity 
      FROM pg_tables 
      WHERE schemaname = 'public';
    `);
    console.log("Tables RLS status:", res.rows);

    const policies = await pool.query(`
      SELECT * FROM pg_policies;
    `);
    console.log("Policies:", policies.rows);

  } catch (err) {
    console.error("Error checking RLS:", err);
  } finally {
    await pool.end();
  }
}

checkRLS();
