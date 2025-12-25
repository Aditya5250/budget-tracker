import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.routes.js";
import categoriesRoutes from "./routes/categories.routes.js";
import transactionsRoutes from "./routes/transactions.routes.js";

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

/**
 * Health check (Render test)
 */
app.get("/health", (req, res) => {
  res.json({ status: "OK" });
});

/**
 * Safe 404 handler 
 */
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

export default app;