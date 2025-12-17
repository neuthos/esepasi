import {Pool} from "pg";
import {readFileSync} from "fs";
import {join} from "path";
import {config} from "dotenv";

// Load environment variables
config({path: ".env.local"});

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL not found in .env.local");
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
});

async function runMigration(action: "up" | "down", migrationNumber = "001") {
  const migrationsDir = join(process.cwd(), "migrations");
  // Find file matching pattern: {number}_*.{action}.sql
  // e.g. 002_inquiries.up.sql
  // but fallback to 002_init.up.sql if exact pattern match isn't strict?
  // Actually just find startsWith number and endsWith action.sql

  // Need to import readdirSync
  const {readdirSync} = await import("fs");

  const files = readdirSync(migrationsDir);
  const filename = files.find(
    (f) => f.startsWith(`${migrationNumber}_`) && f.endsWith(`.${action}.sql`)
  );

  if (!filename) {
    console.error(
      `❌ Migration file for ${migrationNumber} ${action} not found.`
    );
    process.exit(1);
  }

  const migrationFile = join(migrationsDir, filename);

  try {
    console.log(
      `\n🔄 Running migration ${migrationNumber} ${action.toUpperCase()}...\n`
    );

    const sql = readFileSync(migrationFile, "utf-8");

    await pool.query(sql);

    console.log(
      `✅ Migration ${action.toUpperCase()} completed successfully!\n`
    );
    process.exit(0);
  } catch (error) {
    console.error(`❌ Migration failed:`, error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

const action = process.argv[2] as "up" | "down";
const migrationNumber = process.argv[3] || "001";

if (!action || !["up", "down"].includes(action)) {
  console.error("Usage: tsx migrate.ts up|down [migration_number]");
  process.exit(1);
}

runMigration(action, migrationNumber);
