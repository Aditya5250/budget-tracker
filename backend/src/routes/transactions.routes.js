import express from "express";
import {getTransactions,createTransaction,deleteTransaction,} from "../controllers/transactions.controllers.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", authMiddleware, getTransactions);
router.post("/", authMiddleware, createTransaction);
router.delete("/:id", authMiddleware, deleteTransaction);

export default router;