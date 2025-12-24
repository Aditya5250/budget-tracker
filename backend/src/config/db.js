import pg from "pg";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Required for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🔴 Load .env from backend root
dotenv.config({
  path: path.resolve(__dirname, "../../.env"),
});

const { Pool } = pg;

// Debug (temporary, remove later)
console.log("DB_PASSWORD:", process.env.DB_PASSWORD);
console.log("TYPE:", typeof process.env.DB_PASSWORD);

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: String(process.env.DB_PASSWORD), // force string
});

export default pool;