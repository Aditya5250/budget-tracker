import pkg from "pg";
import dotenv from "dotenv";
dotenv.config();

const { Pool } = pkg;

export const isPostgresConfigured = Boolean(process.env.DATABASE_URL);

let poolInstance = null;

// Built-in seed categories
export const DEFAULT_CATEGORIES = [
  { name: "Groceries", color: "#10b981", icon: "ShoppingBag", type: "expense" },
  { name: "Dining & Food", color: "#f59e0b", icon: "UtensilsCrossed", type: "expense" },
  { name: "Housing & Rent", color: "#3b82f6", icon: "Home", type: "expense" },
  { name: "Utilities & Bills", color: "#06b6d4", icon: "Zap", type: "expense" },
  { name: "Transportation", color: "#8b5cf6", icon: "Car", type: "expense" },
  { name: "Entertainment", color: "#ec4899", icon: "Film", type: "expense" },
  { name: "Healthcare", color: "#ef4444", icon: "HeartPulse", type: "expense" },
  { name: "Shopping", color: "#f97316", icon: "ShoppingCart", type: "expense" },
  { name: "Salary", color: "#059669", icon: "Wallet", type: "income" },
  { name: "Freelance", color: "#14b8a6", icon: "Briefcase", type: "income" },
  { name: "Investments", color: "#6366f1", icon: "TrendingUp", type: "income" },
  { name: "Miscellaneous", color: "#64748b", icon: "CircleDollarSign", type: "expense" },
];

/**
 * In-Memory Database Fallback for development without local PostgreSQL
 */
class InMemoryDb {
  constructor() {
    this.users = [];
    this.categories = [];
    this.transactions = [];
    this.budgets = [];
    this.nextId = { users: 1, categories: 1, transactions: 1, budgets: 1 };

    // Seed default categories
    DEFAULT_CATEGORIES.forEach((cat) => {
      this.categories.push({
        id: this.nextId.categories++,
        user_id: null,
        name: cat.name,
        color: cat.color,
        icon: cat.icon,
        type: cat.type,
        created_at: new Date().toISOString(),
      });
    });
  }

  async query(text, params = []) {
    const cleanText = text.trim();

    // Health check query
    if (/^SELECT\s+NOW\(\)/i.test(cleanText)) {
      return { rows: [{ now: new Date() }] };
    }

    // CREATE TABLE / CREATE INDEX queries - no-op for mock
    if (/^CREATE\s+(TABLE|INDEX)/i.test(cleanText)) {
      return { rows: [] };
    }

    // Users queries
    if (/SELECT\s+id\s+FROM\s+users\s+WHERE\s+email\s*=\s*\$1/i.test(cleanText)) {
      const email = (params[0] || "").toLowerCase().trim();
      const found = this.users.filter((u) => u.email === email);
      return { rows: found.map((u) => ({ id: u.id })) };
    }

    if (/INSERT\s+INTO\s+users/i.test(cleanText)) {
      const name = params[0];
      const email = (params[1] || "").toLowerCase().trim();
      const password_hash = params[2];
      const newUser = {
        id: this.nextId.users++,
        name,
        email,
        password_hash,
        currency: "INR",
        created_at: new Date().toISOString(),
      };
      this.users.push(newUser);
      return {
        rows: [{ id: newUser.id, name: newUser.name, email: newUser.email }],
      };
    }

    if (/SELECT\s+id,\s*name,\s*email,\s*password_hash\s+FROM\s+users\s+WHERE\s+email\s*=\s*\$1/i.test(cleanText)) {
      const email = (params[0] || "").toLowerCase().trim();
      const found = this.users.find((u) => u.email === email);
      return { rows: found ? [found] : [] };
    }

    if (/SELECT\s+id,\s*name,\s*email\s+FROM\s+users\s+WHERE\s+id\s*=\s*\$1/i.test(cleanText)) {
      const userId = Number(params[0]);
      const found = this.users.find((u) => u.id === userId);
      return { rows: found ? [{ id: found.id, name: found.name, email: found.email }] : [] };
    }

    // Categories queries
    if (/SELECT[\s\S]*FROM\s+categories/i.test(cleanText)) {
      const userId = Number(params[0]);
      const cats = this.categories.filter(
        (c) => c.user_id === null || c.user_id === userId
      );
      return { rows: cats };
    }

    if (/INSERT\s+INTO\s+categories/i.test(cleanText)) {
      const [userId, name, color, icon, type] = params;
      const newCat = {
        id: this.nextId.categories++,
        user_id: userId || null,
        name,
        color: color || "#64748b",
        icon: icon || "Tag",
        type: type || "expense",
        created_at: new Date().toISOString(),
      };
      this.categories.push(newCat);
      return { rows: [newCat] };
    }

    // Transactions queries
    if (/SELECT[\s\S]*FROM\s+transactions/i.test(cleanText)) {
      const userId = Number(params[0]);
      let txs = this.transactions.filter((t) => t.user_id === userId);

      // Join categories
      const resultRows = txs.map((t) => {
        const cat = this.categories.find((c) => c.id === t.category_id);
        return {
          id: t.id,
          user_id: t.user_id,
          type: t.type,
          amount: Number(t.amount),
          note: t.note,
          occurred_at: t.occurred_at,
          category_id: t.category_id,
          category: cat ? cat.name : "Uncategorized",
          category_color: cat ? cat.color : "#64748b",
          category_icon: cat ? cat.icon : "Tag",
          created_at: t.created_at,
        };
      });

      resultRows.sort((a, b) => new Date(b.occurred_at) - new Date(a.occurred_at));
      return { rows: resultRows };
    }

    if (/INSERT\s+INTO\s+transactions/i.test(cleanText)) {
      const [userId, categoryId, type, amount, note, occurredAt] = params;
      const newTx = {
        id: this.nextId.transactions++,
        user_id: Number(userId),
        category_id: categoryId ? Number(categoryId) : null,
        type,
        amount: Number(amount),
        note: note || "",
        occurred_at: occurredAt ? new Date(occurredAt).toISOString() : new Date().toISOString(),
        created_at: new Date().toISOString(),
      };
      this.transactions.push(newTx);
      const cat = this.categories.find((c) => c.id === newTx.category_id);
      return {
        rows: [
          {
            ...newTx,
            category: cat ? cat.name : "Uncategorized",
            category_color: cat ? cat.color : "#64748b",
            category_icon: cat ? cat.icon : "Tag",
          },
        ],
      };
    }

    if (/UPDATE\s+transactions/i.test(cleanText)) {
      // params: [type, amount, note, categoryId, occurredAt, txId, userId]
      const [type, amount, note, categoryId, occurredAt, txId, userId] = params;
      const idx = this.transactions.findIndex(
        (t) => t.id === Number(txId) && t.user_id === Number(userId)
      );
      if (idx === -1) return { rows: [] };

      this.transactions[idx] = {
        ...this.transactions[idx],
        type,
        amount: Number(amount),
        note: note || "",
        category_id: categoryId ? Number(categoryId) : null,
        occurred_at: occurredAt ? new Date(occurredAt).toISOString() : this.transactions[idx].occurred_at,
      };

      const updated = this.transactions[idx];
      const cat = this.categories.find((c) => c.id === updated.category_id);
      return {
        rows: [
          {
            ...updated,
            category: cat ? cat.name : "Uncategorized",
            category_color: cat ? cat.color : "#64748b",
            category_icon: cat ? cat.icon : "Tag",
          },
        ],
      };
    }

    if (/DELETE\s+FROM\s+transactions\s+WHERE\s+id\s*=\s*\$1\s+AND\s+user_id\s*=\s*\$2/i.test(cleanText)) {
      const [id, userId] = params;
      const initialLen = this.transactions.length;
      this.transactions = this.transactions.filter(
        (t) => !(t.id === Number(id) && t.user_id === Number(userId))
      );
      return { rows: this.transactions.length < initialLen ? [{ id: Number(id) }] : [] };
    }

    // Budgets queries
    if (/SELECT[\s\S]*FROM\s+budgets/i.test(cleanText)) {
      const userId = Number(params[0]);
      const userBudgets = this.budgets
        .filter((b) => b.user_id === userId)
        .map((b) => {
          const cat = this.categories.find((c) => c.id === b.category_id);
          return {
            ...b,
            category_name: cat ? cat.name : "Unknown",
            category_color: cat ? cat.color : "#64748b",
            category_icon: cat ? cat.icon : "Tag",
          };
        });
      return { rows: userBudgets };
    }

    if (/INSERT\s+INTO\s+budgets/i.test(cleanText)) {
      const [userId, categoryId, monthlyLimit] = params;
      const existingIdx = this.budgets.findIndex(
        (b) => b.user_id === Number(userId) && b.category_id === Number(categoryId)
      );
      if (existingIdx >= 0) {
        this.budgets[existingIdx].monthly_limit = Number(monthlyLimit);
        return { rows: [this.budgets[existingIdx]] };
      }
      const newBudget = {
        id: this.nextId.budgets++,
        user_id: Number(userId),
        category_id: Number(categoryId),
        monthly_limit: Number(monthlyLimit),
        created_at: new Date().toISOString(),
      };
      this.budgets.push(newBudget);
      return { rows: [newBudget] };
    }

    if (/DELETE\s+FROM\s+budgets/i.test(cleanText)) {
      const [id, userId] = params;
      const initLen = this.budgets.length;
      this.budgets = this.budgets.filter(
        (b) => !(b.id === Number(id) && b.user_id === Number(userId))
      );
      return { rows: this.budgets.length < initLen ? [{ id: Number(id) }] : [] };
    }

    // Generic fallback for unhandled queries
    return { rows: [] };
  }
}

// In-memory fallback singleton
export const memoryDb = new InMemoryDb();

/**
 * Initialize DB Pool & schema
 */
export async function initDB() {
  if (!process.env.DATABASE_URL) {
    console.log("ℹ️  No DATABASE_URL configured. Running with resilient in-memory database storage.");
    return memoryDb;
  }

  try {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl:
        process.env.NODE_ENV === "production" || process.env.DATABASE_URL.includes("neon.tech") || process.env.DATABASE_URL.includes("sslmode=require")
          ? { rejectUnauthorized: false }
          : false,
    });

    // Test connection
    const res = await pool.query("SELECT NOW()");
    console.log("✅ PostgreSQL connected at:", res.rows[0].now);

    // Initialize Schema
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        currency VARCHAR(10) DEFAULT 'INR',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        color VARCHAR(50) DEFAULT '#64748b',
        icon VARCHAR(50) DEFAULT 'Tag',
        type VARCHAR(20) DEFAULT 'expense',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
        type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
        amount NUMERIC(12, 2) NOT NULL,
        note TEXT,
        occurred_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS budgets (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
        monthly_limit NUMERIC(12, 2) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, category_id)
      );
    `);

    // Seed default categories if none exist
    const catCheck = await pool.query("SELECT COUNT(*) FROM categories WHERE user_id IS NULL");
    if (parseInt(catCheck.rows[0].count, 10) === 0) {
      for (const cat of DEFAULT_CATEGORIES) {
        await pool.query(
          "INSERT INTO categories (user_id, name, color, icon, type) VALUES (NULL, $1, $2, $3, $4)",
          [cat.name, cat.color, cat.icon, cat.type]
        );
      }
      console.log("🌱 Default categories seeded successfully.");
    }

    poolInstance = pool;
    return pool;
  } catch (err) {
    console.warn("⚠️  PostgreSQL connection failed:", err.message);
    console.warn("⚠️  Falling back to in-memory database store for local development.");
    return memoryDb;
  }
}

// Proxied pool exported to controllers
const dbProxy = {
  query: async (text, params) => {
    if (poolInstance) {
      return poolInstance.query(text, params);
    }
    return memoryDb.query(text, params);
  },
};

export default dbProxy;