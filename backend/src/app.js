import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import categoriesRoutes from "./routes/categories.routes.js";
import transactionsRoutes from "./routes/transactions.routes.js";

const app = express();

app.use(cors({
  origin:"http://localhost:5173",
  credentials:true
}));

app.use(express.json());

// Auth routes
app.use("/api/auth", authRoutes);

// Categories routes
app.use("/api/categories", categoriesRoutes);

// Transactions routes
app.use("/api/transactions", transactionsRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "OK" });
});

export default app;