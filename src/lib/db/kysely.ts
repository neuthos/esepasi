import {Kysely, PostgresDialect} from "kysely";
import {Pool} from "pg";
import {Database} from "./types";

const dialect = new PostgresDialect({
  pool: new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
  }),
});

// Singleton pattern for Kysely client
const globalForKysely = globalThis as unknown as {
  kysely: Kysely<Database> | undefined;
};

export const db =
  globalForKysely.kysely ??
  new Kysely<Database>({
    dialect,
  });

if (process.env.NODE_ENV !== "production") {
  globalForKysely.kysely = db;
}

// Export type for use in services
export type DB = Kysely<Database>;
