import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "budget_tracker_jwt_secret_dev_key_2026";

// Generate JWT token
export function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: "7d",
  });
}

// Verify JWT token
export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}