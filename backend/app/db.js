const { Pool } = require("pg");
const config = require("./config");

if (!config.databaseUrl) {
  throw new Error("DATABASE_URL is required in backend environment.");
}

const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl: config.dbSsl ? { rejectUnauthorized: false } : false,
});

async function query(text, params = []) {
  return pool.query(text, params);
}

async function getClient() {
  return pool.connect();
}

module.exports = {
  pool,
  query,
  getClient,
};

