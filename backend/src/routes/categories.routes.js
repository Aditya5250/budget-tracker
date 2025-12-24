import express from "express";
import {
  getCategories,
  createCategory,
} from "../controllers/categories.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

// GET /api/categories
router.get("/", authMiddleware, getCategories);

// POST /api/categories
router.post("/", authMiddleware, createCategory);

export default router;