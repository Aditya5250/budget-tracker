import { verifyToken } from "../utils/jwt.js";

export function authMiddleware(req, res, next) {
  try {
    // 1. Read Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        error: "Authorization header missing",
      });
    }

    // 2. Extract token from "Bearer <token>"
    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        error: "Token missing",
      });
    }

    // 3. Verify token
    const decoded = verifyToken(token);

    // 4. Attach user info to request
    req.user = {
      id: decoded.userId,
    };

    // 5. Continue to next middleware/controller
    next();
  } catch (error) {
    return res.status(401).json({
      error: "Invalid or expired token",
    });
  }
}