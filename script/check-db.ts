
import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const { Pool } = pg;

async function checkDb() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const res = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('videos', 'tags', 'video_tags', 'folders');
    `);
    console.log("Existing tables:", res.rows.map(r => r.table_name));

    const columns = await pool.query(`
      SELECT column_name, table_name
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND column_name IN ('category', 'notes', 'author_name', 'duration');
    `);
    console.log("Notable columns:", columns.rows);

  } catch (err) {
    console.error("Error checking DB:", err);
  } finally {
    await pool.end();
  }
}

checkDb();
