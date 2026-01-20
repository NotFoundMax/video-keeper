
import pg from "pg";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
dotenv.config();

const { Pool } = pg;

async function applyMigration() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const migrationPath = path.join(process.cwd(), "migrations", "remove_category_column.sql");
    const sql = fs.readFileSync(migrationPath, "utf-8");
    
    console.log("Applying migration:", migrationPath);
    await pool.query(sql);
    console.log("Migration applied successfully!");

  } catch (err) {
    console.error("Error applying migration:", err);
  } finally {
    await pool.end();
  }
}

applyMigration();
