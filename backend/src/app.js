import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.routes.js";
import categoriesRoutes from "./routes/categories.routes.js";
import transactionsRoutes from "./routes/transactions.routes.js";
import budgetsRoutes from "./routes/budgets.routes.js";
import aiRoutes from "./routes/ai.routes.js";

const app = express();

/**
 * CORS – works for local, preview, production
 */
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json());

/**
 * API routes
 */
app.use("/api/auth", authRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/transactions", transactionsRoutes);
app.use("/api/budgets", budgetsRoutes);
app.use("/api/ai", aiRoutes);

/**
 * Health check
 */
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    service: "AI Budget Tracker API",
    version: "2.0.0",
    time: new Date().toISOString(),
  });
});

/**
 * Safe 404 handler
 */
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

export default app;