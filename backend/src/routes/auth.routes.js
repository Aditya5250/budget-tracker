import express from "express";
import { signup, login, getMe } from "../controllers/auth.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

// POST /api/auth/signup
router.post("/signup", signup);

// POST /api/auth/login
router.post("/login", login);

//protected route to get current user info
router.get("/me", authMiddleware, getMe);

export default router;