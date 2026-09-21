import pool from "../config/db.js";

/**
 * GET /api/budgets
 * Fetch user budgets and calculate current month's spending vs limit
 */
export async function getBudgets(req, res) {
  try {
    const userId = req.user.id;

    // Get budgets
    const budgetsRes = await pool.query(
      `
      SELECT
        b.id,
        b.category_id,
        b.monthly_limit,
        c.name AS category_name,
        c.color AS category_color,
        c.icon AS category_icon
      FROM budgets b
      JOIN categories c ON b.category_id = c.id
      WHERE b.user_id = $1
      ORDER BY b.monthly_limit DESC
      `,
      [userId]
    );

    // Get current month transactions
    const txRes = await pool.query(
      `
      SELECT category_id, amount, occurred_at
      FROM transactions
      WHERE user_id = $1 AND type = 'expense'
      `,
      [userId]
    );

    const now = new Date();
    const currentMonthTxs = txRes.rows.filter((t) => {
      const d = new Date(t.occurred_at);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });

    const categorySpent = {};
    currentMonthTxs.forEach((t) => {
      const catId = t.category_id;
      if (catId) {
        categorySpent[catId] = (categorySpent[catId] || 0) + Number(t.amount);
      }
    });

    const enrichedBudgets = budgetsRes.rows.map((b) => {
      const spent = categorySpent[b.category_id] || 0;
      const limit = Number(b.monthly_limit);
      const remaining = Math.max(0, limit - spent);
      const percentage = limit > 0 ? Math.min(100, Math.round((spent / limit) * 100)) : 0;
      const isOver = spent > limit;

      let status = "normal";
      if (isOver) status = "exceeded";
      else if (percentage >= 80) status = "warning";

      return {
        id: b.id,
        categoryId: b.category_id,
        categoryName: b.category_name,
        categoryColor: b.category_color,
        categoryIcon: b.category_icon,
        monthlyLimit: limit,
        spent: Number(spent.toFixed(2)),
        remaining: Number(remaining.toFixed(2)),
        percentage,
        status,
        isOver,
      };
    });

    res.json({ budgets: enrichedBudgets });
  } catch (error) {
    console.error("Get budgets error:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * POST /api/budgets
 * Set or update a monthly budget limit
 */
export async function setBudget(req, res) {
  try {
    const userId = req.user.id;
    const { categoryId, monthlyLimit } = req.body;

    if (!categoryId || !monthlyLimit) {
      return res.status(400).json({
        error: "categoryId and monthlyLimit are required",
      });
    }

    const limitNum = Number(monthlyLimit);
    if (isNaN(limitNum) || limitNum <= 0) {
      return res.status(400).json({
        error: "monthlyLimit must be a positive number",
      });
    }

    const result = await pool.query(
      `
      INSERT INTO budgets (user_id, category_id, monthly_limit)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, category_id)
      DO UPDATE SET monthly_limit = EXCLUDED.monthly_limit
      RETURNING id, user_id, category_id, monthly_limit
      `,
      [userId, categoryId, limitNum]
    );

    res.status(201).json({ budget: result.rows[0] });
  } catch (error) {
    console.error("Set budget error:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * DELETE /api/budgets/:id
 */
export async function deleteBudget(req, res) {
  try {
    const userId = req.user.id;
    const budgetId = req.params.id;

    const result = await pool.query(
      `DELETE FROM budgets WHERE id = $1 AND user_id = $2 RETURNING id`,
      [budgetId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Budget target not found" });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Delete budget error:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
}
