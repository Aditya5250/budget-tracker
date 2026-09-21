import express from "express";
import {
  getBudgets,
  setBudget,
  deleteBudget,
} from "../controllers/budgets.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", authMiddleware, getBudgets);
router.post("/", authMiddleware, setBudget);
router.delete("/:id", authMiddleware, deleteBudget);

export default router;
