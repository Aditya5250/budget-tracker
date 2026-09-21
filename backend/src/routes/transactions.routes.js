import express from "express";
import {
  getTransactions,
  getTransactionSummary,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from "../controllers/transactions.controllers.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/summary", authMiddleware, getTransactionSummary);
router.get("/", authMiddleware, getTransactions);
router.post("/", authMiddleware, createTransaction);
router.put("/:id", authMiddleware, updateTransaction);
router.delete("/:id", authMiddleware, deleteTransaction);

export default router;