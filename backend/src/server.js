import dotenv from "dotenv";
import app from "./app.js";
import { initDB } from "./config/db.js";

dotenv.config();

const PORT = process.env.PORT || 4000;

async function startServer() {
  try {
    // Initialize database pool & schemas
    await initDB();

    app.listen(PORT, () => {
      console.log(`🚀 Modern AI Budget Tracker Backend running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
}

startServer();
