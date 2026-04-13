const jwt = require("jsonwebtoken");
const config = require("../config");

function createToken(user) {
  if (!config.jwtSecret) {
    throw new Error("JWT_SECRET is not configured.");
  }

  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
    },
    config.jwtSecret,
    {
      expiresIn: config.jwtExpiresIn,
    }
  );
}

function verifyToken(token) {
  if (!config.jwtSecret) {
    throw new Error("JWT_SECRET is not configured.");
  }
  return jwt.verify(token, config.jwtSecret);
}

module.exports = {
  createToken,
  verifyToken,
};

