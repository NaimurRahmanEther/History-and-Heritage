const bcrypt = require("bcryptjs");
const { query } = require("../db");
const { createToken } = require("../utils/jwt_helper");

function mapUser(row) {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    phone: row.phone || "",
  };
}

async function ensureUserCart(userId) {
  await query(
    `INSERT INTO carts (user_id)
     VALUES ($1)
     ON CONFLICT (user_id) DO NOTHING`,
    [userId]
  );
}

async function registerUser(payload) {
  const fullName = String(payload.fullName || "").trim();
  const email = String(payload.email || "")
    .trim()
    .toLowerCase();
  const password = String(payload.password || "");
  const phone = String(payload.phone || "").trim();

  if (!fullName || !email || password.length < 6) {
    const error = new Error("Full name, valid email, and password (min 6 chars) are required.");
    error.statusCode = 400;
    throw error;
  }

  const existing = await query("SELECT id FROM users WHERE email = $1", [email]);
  if (existing.rowCount > 0) {
    const error = new Error("Email already registered.");
    error.statusCode = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const role = payload.role === "admin" ? "admin" : "customer";

  const insertResult = await query(
    `INSERT INTO users (email, password_hash, name, phone, role)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, email, name, phone, role`,
    [email, passwordHash, fullName, phone, role]
  );

  const user = insertResult.rows[0];
  await ensureUserCart(user.id);

  return {
    token: createToken(user),
    user: mapUser(user),
  };
}

async function loginUser(payload) {
  const email = String(payload.email || "")
    .trim()
    .toLowerCase();
  const password = String(payload.password || "");

  if (!email || !password) {
    const error = new Error("Email and password are required.");
    error.statusCode = 400;
    throw error;
  }

  const result = await query(
    `SELECT id, email, password_hash, name, phone, role
     FROM users
     WHERE email = $1
     LIMIT 1`,
    [email]
  );

  if (result.rowCount === 0) {
    const error = new Error("Invalid email or password.");
    error.statusCode = 401;
    throw error;
  }

  const user = result.rows[0];
  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    const error = new Error("Invalid email or password.");
    error.statusCode = 401;
    throw error;
  }

  await ensureUserCart(user.id);

  return {
    token: createToken(user),
    user: mapUser(user),
  };
}

module.exports = {
  mapUser,
  registerUser,
  loginUser,
  async updateUserProfile(userId, payload) {
    const name = String(payload.name || "").trim();
    const email = String(payload.email || "")
      .trim()
      .toLowerCase();
    const phone = String(payload.phone || "").trim();

    if (!name || !email) {
      const error = new Error("Name and email are required.");
      error.statusCode = 400;
      throw error;
    }

    const conflict = await query(
      `SELECT id FROM users WHERE email = $1 AND id <> $2 LIMIT 1`,
      [email, userId]
    );
    if (conflict.rowCount > 0) {
      const error = new Error("Email is already in use.");
      error.statusCode = 409;
      throw error;
    }

    const result = await query(
      `UPDATE users
       SET name = $2, email = $3, phone = $4, updated_at = NOW()
       WHERE id = $1
       RETURNING id, email, name, phone, role`,
      [userId, name, email, phone]
    );

    if (result.rowCount === 0) {
      const error = new Error("User not found.");
      error.statusCode = 404;
      throw error;
    }

    return mapUser(result.rows[0]);
  },
};
