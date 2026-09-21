import pool from "../config/db.js";

/**
 * GET /api/transactions
 * Fetch all transactions for logged-in user with optional filtering, search, and sorting
 */
export async function getTransactions(req, res) {
  try {
    const userId = req.user.id;
    const { type, categoryId, search, startDate, endDate, sortBy = "date_desc" } = req.query;

    const result = await pool.query(
      `
      SELECT
        t.id,
        t.user_id,
        t.type,
        t.amount,
        t.note,
        t.occurred_at,
        t.category_id,
        c.name AS category,
        c.color AS category_color,
        c.icon AS category_icon
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = $1
      ORDER BY t.occurred_at DESC
      `,
      [userId]
    );

    let rows = result.rows;

    // Apply filtering in memory or query
    if (type && type !== "all") {
      rows = rows.filter((r) => r.type === type);
    }
    if (categoryId && categoryId !== "all") {
      rows = rows.filter((r) => String(r.category_id) === String(categoryId));
    }
    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      rows = rows.filter(
        (r) =>
          (r.note && r.note.toLowerCase().includes(q)) ||
          (r.category && r.category.toLowerCase().includes(q))
      );
    }
    if (startDate) {
      rows = rows.filter((r) => new Date(r.occurred_at) >= new Date(startDate));
    }
    if (endDate) {
      // Set to end of day
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      rows = rows.filter((r) => new Date(r.occurred_at) <= end);
    }

    // Sort
    if (sortBy === "date_asc") {
      rows.sort((a, b) => new Date(a.occurred_at) - new Date(b.occurred_at));
    } else if (sortBy === "amount_desc") {
      rows.sort((a, b) => Number(b.amount) - Number(a.amount));
    } else if (sortBy === "amount_asc") {
      rows.sort((a, b) => Number(a.amount) - Number(b.amount));
    } else {
      rows.sort((a, b) => new Date(b.occurred_at) - new Date(a.occurred_at));
    }

    res.json({
      transactions: rows,
      total: rows.length,
    });
  } catch (error) {
    console.error("Get transactions error:", error.message);
    res.status(500).json({
      error: "Internal server error",
    });
  }
}

/**
 * GET /api/transactions/summary
 * Returns aggregated statistics for charts and cards
 */
export async function getTransactionSummary(req, res) {
  try {
    const userId = req.user.id;
    const { period = "month" } = req.query; // 'all', 'month', 'year'

    const result = await pool.query(
      `
      SELECT
        t.id,
        t.type,
        t.amount,
        t.occurred_at,
        t.category_id,
        c.name AS category,
        c.color AS category_color
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = $1
      ORDER BY t.occurred_at DESC
      `,
      [userId]
    );

    const now = new Date();
    let filtered = result.rows;

    if (period === "month") {
      filtered = filtered.filter((r) => {
        const d = new Date(r.occurred_at);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
    } else if (period === "year") {
      filtered = filtered.filter((r) => {
        const d = new Date(r.occurred_at);
        return d.getFullYear() === now.getFullYear();
      });
    }

    let totalIncome = 0;
    let totalExpense = 0;
    const categoryTotals = {};

    filtered.forEach((tx) => {
      const amt = Number(tx.amount);
      if (tx.type === "income") {
        totalIncome += amt;
      } else {
        totalExpense += amt;
        const catName = tx.category || "Uncategorized";
        const catColor = tx.category_color || "#64748b";
        if (!categoryTotals[catName]) {
          categoryTotals[catName] = { name: catName, total: 0, color: catColor };
        }
        categoryTotals[catName].total += amt;
      }
    });

    const netSavings = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? ((netSavings / totalIncome) * 100).toFixed(1) : 0;

    res.json({
      period,
      totalIncome: Number(totalIncome.toFixed(2)),
      totalExpense: Number(totalExpense.toFixed(2)),
      netSavings: Number(netSavings.toFixed(2)),
      savingsRate: Number(savingsRate),
      categoryBreakdown: Object.values(categoryTotals).sort((a, b) => b.total - a.total),
      transactionCount: filtered.length,
    });
  } catch (error) {
    console.error("Summary error:", error.message);
    res.status(500).json({ error: "Failed to compute summary" });
  }
}

/**
 * POST /api/transactions
 * Create a new transaction
 */
export async function createTransaction(req, res) {
  try {
    const userId = req.user.id;
    const { type, amount, categoryId, note, occurredAt } = req.body;

    // Validation
    if (!type || amount === undefined || amount === null || amount === "") {
      return res.status(400).json({
        error: "Transaction type and amount are required",
      });
    }

    if (!["income", "expense"].includes(type)) {
      return res.status(400).json({
        error: "Invalid transaction type. Must be 'income' or 'expense'",
      });
    }

    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        error: "Amount must be a positive number",
      });
    }

    const txDate = occurredAt ? new Date(occurredAt) : new Date();

    const result = await pool.query(
      `
      INSERT INTO transactions
        (user_id, category_id, type, amount, note, occurred_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, user_id, category_id, type, amount, note, occurred_at, created_at
      `,
      [
        userId,
        categoryId ? Number(categoryId) : null,
        type,
        numericAmount,
        note ? note.trim() : null,
        txDate,
      ]
    );

    res.status(201).json({
      transaction: result.rows[0],
    });
  } catch (error) {
    console.error("Create transaction error:", error.message);
    res.status(500).json({
      error: "Internal server error",
    });
  }
}

/**
 * PUT /api/transactions/:id
 * Update an existing transaction
 */
export async function updateTransaction(req, res) {
  try {
    const userId = req.user.id;
    const transactionId = req.params.id;
    const { type, amount, categoryId, note, occurredAt } = req.body;

    if (!type || amount === undefined || amount === null) {
      return res.status(400).json({
        error: "Type and amount are required",
      });
    }

    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        error: "Amount must be a positive number",
      });
    }

    const txDate = occurredAt ? new Date(occurredAt) : new Date();

    const result = await pool.query(
      `
      UPDATE transactions
      SET type = $1, amount = $2, note = $3, category_id = $4, occurred_at = $5
      WHERE id = $6 AND user_id = $7
      RETURNING id, user_id, category_id, type, amount, note, occurred_at
      `,
      [
        type,
        numericAmount,
        note ? note.trim() : null,
        categoryId ? Number(categoryId) : null,
        txDate,
        transactionId,
        userId,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Transaction not found",
      });
    }

    res.json({
      transaction: result.rows[0],
    });
  } catch (error) {
    console.error("Update transaction error:", error.message);
    res.status(500).json({
      error: "Internal server error",
    });
  }
}

/**
 * DELETE /api/transactions/:id
 * Delete user's transaction
 */
export async function deleteTransaction(req, res) {
  try {
    const userId = req.user.id;
    const transactionId = req.params.id;

    const result = await pool.query(
      `
      DELETE FROM transactions
      WHERE id = $1 AND user_id = $2
      RETURNING id
      `,
      [transactionId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Transaction not found",
      });
    }

    res.json({
      success: true,
    });
  } catch (error) {
    console.error("Delete transaction error:", error.message);
    res.status(500).json({
      error: "Internal server error",
    });
  }
}