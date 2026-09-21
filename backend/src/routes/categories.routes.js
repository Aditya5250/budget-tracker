import express from "express";
import {
  getCategories,
  createCategory,
  deleteCategory,
} from "../controllers/categories.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", authMiddleware, getCategories);
router.post("/", authMiddleware, createCategory);
router.delete("/:id", authMiddleware, deleteCategory);

export default router;