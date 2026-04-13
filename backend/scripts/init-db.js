require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

function asBoolean(value, fallback = false) {
  if (value === undefined) return fallback;
  return String(value).toLowerCase() === "true";
}

function quoteIdentifier(identifier) {
  return `"${String(identifier).replace(/"/g, "\"\"")}"`;
}

function getDatabaseConfig() {
  const rawUrl = String(process.env.DATABASE_URL || process.env.POSTGRES_URL || "").trim();
  if (!rawUrl) {
    throw new Error("DATABASE_URL is required.");
  }

  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error("DATABASE_URL is not a valid URL.");
  }

  const databaseName = decodeURIComponent(parsed.pathname.replace(/^\//, "")).trim();
  if (!databaseName) {
    throw new Error("DATABASE_URL must include a database name in the path.");
  }

  return { parsed, databaseName };
}

async function ensureDatabaseExists() {
  const { parsed, databaseName } = getDatabaseConfig();
  const adminName = String(process.env.DB_ADMIN_NAME || "postgres").trim() || "postgres";

  const adminUrl = process.env.DB_ADMIN_URL
    ? String(process.env.DB_ADMIN_URL).trim()
    : (() => {
        const clone = new URL(parsed.toString());
        clone.pathname = `/${encodeURIComponent(adminName)}`;
        return clone.toString();
      })();

  const adminClient = new Client({
    connectionString: adminUrl,
    ssl: asBoolean(process.env.DB_SSL, false) ? { rejectUnauthorized: false } : false,
  });

  await adminClient.connect();

  try {
    const existsResult = await adminClient.query(
      "SELECT 1 FROM pg_database WHERE datname = $1 LIMIT 1",
      [databaseName]
    );

    if (existsResult.rowCount > 0) {
      console.log(`Database "${databaseName}" already exists.`);
      return;
    }

    await adminClient.query(`CREATE DATABASE ${quoteIdentifier(databaseName)}`);
    console.log(`Created database "${databaseName}".`);
  } finally {
    await adminClient.end();
  }
}

async function run() {
  await ensureDatabaseExists();

  const { query, pool } = require("../app/db");
  const { seedData } = require("../app/seed/seed_data");

  const schemaPath = path.resolve(__dirname, "../database/traditional_market_schema.sql");
  const schemaSql = fs.readFileSync(schemaPath, "utf8");

  try {
    await query(schemaSql);
    await seedData();
  } finally {
    await pool.end();
  }

  console.log("Database schema and seed completed successfully.");
}

run()
  .catch((error) => {
    console.error("Failed to initialize database:", error);
    process.exitCode = 1;
  });
