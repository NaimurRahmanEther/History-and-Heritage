const { query } = require("../db");
const { verifyToken } = require("../utils/jwt_helper");

function extractBearerToken(authorization = "") {
  if (!authorization) return null;
  const [scheme, token] = String(authorization).split(" ");
  if (scheme !== "Bearer" || !token) return null;
  return token;
}

async function requireAuth(req, res, next) {
  try {
    const token = extractBearerToken(req.headers.authorization || "");
    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const payload = verifyToken(token);
    const userResult = await query(
      `SELECT id, email, name, phone, role
       FROM users
       WHERE id = $1
       LIMIT 1`,
      [payload.sub]
    );

    if (userResult.rowCount === 0) {
      return res.status(401).json({ message: "Invalid token user." });
    }

    req.user = userResult.rows[0];
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid token." });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required." });
  }
  return next();
}

module.exports = {
  requireAuth,
  requireAdmin,
};

