require("dotenv").config();

const config = require("./app/config");
const { createApp } = require("./app/__init__");
const { pool } = require("./app/db");

const app = createApp();

const server = app.listen(config.port, () => {
  console.log(`Backend running at http://localhost:${config.port}`);
});

function shutdown(signal) {
  console.log(`\nReceived ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

