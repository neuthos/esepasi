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
  const migrationFile = join(
    process.cwd(),
    "migrations",
    `${migrationNumber}_init.${action}.sql`
  );

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
