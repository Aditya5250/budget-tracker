import express from "express";
import {
  parseTransaction,
  advisorChat,
  getInsights,
  getBudgetRecommendations,
} from "../controllers/ai.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/parse-transaction", authMiddleware, parseTransaction);
router.post("/advisor", authMiddleware, advisorChat);
router.get("/insights", authMiddleware, getInsights);
router.get("/budget-recommendations", authMiddleware, getBudgetRecommendations);

export default router;
