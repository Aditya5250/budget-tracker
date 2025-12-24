import pool from "../config/db.js";

/**
 * GET /api/categories
 * Fetch all categories for logged-in user
 */
export async function getCategories(req, res) {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT id, name, color, created_at
       FROM categories
       WHERE user_id = $1
       ORDER BY created_at ASC`,
      [userId]
    );

    res.json({
      categories: result.rows,
    });
  } catch (error) {
    console.error("Get categories error:", error.message);
    res.status(500).json({
      error: "Internal server error",
    });
  }
}

/**
 * POST /api/categories
 * Create a new category for logged-in user
 */
export async function createCategory(req, res) {
  try {
    const userId = req.user.id;
    const { name, color } = req.body;

    // Basic validation
    if (!name) {
      return res.status(400).json({
        error: "Category name is required",
      });
    }

    const result = await pool.query(
      `INSERT INTO categories (user_id, name, color)
       VALUES ($1, $2, $3)
       RETURNING id, name, color, created_at`,
      [userId, name, color || null]
    );

    res.status(201).json({
      category: result.rows[0],
    });
  } catch (error) {
    console.error("Create category error:", error.message);
    res.status(500).json({
      error: "Internal server error",
    });
  }
}