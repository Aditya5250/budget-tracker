import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import categoriesRoutes from "./routes/categories.routes.js";
import transactionsRoutes from "./routes/transactions.routes.js";

const app = express();

/* =========================
   ✅ CORS CONFIGURATION
========================= */

const allowedOrigins = [
  "http://localhost:5173",   // Vite dev
  "http://localhost:4173",   // Vite preview
  "https://budget-tracker-backend-bemr.onrender.com", // backend
  // 👉 add Vercel frontend URL here after deploy
];

app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (Postman, curl)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// 🔥 REQUIRED for preflight
app.options("*", cors());

/* =========================
   MIDDLEWARES
========================= */

app.use(express.json());

/* =========================
   ROUTES
========================= */

app.use("/api/auth", authRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/transactions", transactionsRoutes);

/* =========================
   HEALTH CHECK
========================= */

app.get("/health", (req, res) => {
  res.json({ status: "OK" });
});

export default app;