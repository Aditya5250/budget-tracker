import pool from "../config/db.js";

/**
 * GET /api/transactions
 * Fetch all transactions for logged-in user
 */
export async function getTransactions(req, res) {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `
      SELECT
        t.id,
        t.type,
        t.amount,
        t.note,
        t.occurred_at,
        c.name AS category,
        c.color AS category_color
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = $1
      ORDER BY t.occurred_at DESC
      `,
      [userId]
    );

    res.json({
      transactions: result.rows,
    });
  } catch (error) {
    console.error("Get transactions error:", error.message);
    res.status(500).json({
      error: "Internal server error",
    });
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
    if (!type || !amount) {
      return res.status(400).json({
        error: "Transaction type and amount are required",
      });
    }

    if (!["income", "expense"].includes(type)) {
      return res.status(400).json({
        error: "Invalid transaction type",
      });
    }

    const result = await pool.query(
      `
      INSERT INTO transactions
        (user_id, category_id, type, amount, note, occurred_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, type, amount, note, occurred_at
      `,
      [
        userId,
        categoryId || null,
        type,
        amount,
        note || null,
        occurredAt || new Date(),
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