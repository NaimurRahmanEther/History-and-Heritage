const path = require("path");

function asBoolean(value, fallback = false) {
  if (value === undefined) return fallback;
  return String(value).toLowerCase() === "true";
}

function asNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeDatabaseUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  try {
    return new URL(raw).toString();
  } catch {
    return raw;
  }
}

const config = {
  port: asNumber(process.env.PORT, 5000),
  databaseUrl: normalizeDatabaseUrl(process.env.DATABASE_URL || process.env.POSTGRES_URL || ""),
  dbSsl: asBoolean(process.env.DB_SSL, false),
  corsOrigin: process.env.CORS_ORIGIN || process.env.FRONTEND_URL || "http://localhost:3000",
  jwtSecret: process.env.JWT_SECRET || process.env.JWT_SECRET_KEY || process.env.SECRET_KEY || "",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  uploadDir: path.resolve(process.cwd(), process.env.UPLOAD_DIR || "uploads"),
  maxFileSizeMb: asNumber(process.env.MAX_FILE_SIZE_MB, 5),
};

module.exports = config;
