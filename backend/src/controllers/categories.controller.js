import pool, { DEFAULT_CATEGORIES } from "../config/db.js";

/**
 * GET /api/categories
 * Fetch all categories (system defaults + user customized)
 */
export async function getCategories(req, res) {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT id, name, color, icon, type, user_id, created_at
       FROM categories
       WHERE user_id = $1 OR user_id IS NULL
       ORDER BY type DESC, name ASC`,
      [userId]
    );

    // If query returned nothing (e.g. fresh DB before seeding), return DEFAULT_CATEGORIES
    let categories = result.rows;
    if (!categories || categories.length === 0) {
      categories = DEFAULT_CATEGORIES.map((c, idx) => ({
        id: idx + 1,
        ...c,
        user_id: null,
      }));
    }

    res.json({
      categories,
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
 * Create a new custom category for logged-in user
 */
export async function createCategory(req, res) {
  try {
    const userId = req.user.id;
    const { name, color, icon, type = "expense" } = req.body;

    // Basic validation
    if (!name || !name.trim()) {
      return res.status(400).json({
        error: "Category name is required",
      });
    }

    const result = await pool.query(
      `INSERT INTO categories (user_id, name, color, icon, type)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, color, icon, type, created_at`,
      [
        userId,
        name.trim(),
        color || "#64748b",
        icon || "Tag",
        type === "income" ? "income" : "expense",
      ]
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

/**
 * DELETE /api/categories/:id
 * Delete a custom category created by the user (cannot delete default system categories)
 */
export async function deleteCategory(req, res) {
  try {
    const userId = req.user.id;
    const categoryId = req.params.id;

    const result = await pool.query(
      `DELETE FROM categories WHERE id = $1 AND user_id = $2 RETURNING id`,
      [categoryId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        error: "Category not found or default categories cannot be deleted",
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Delete category error:", error.message);
    res.status(500).json({
      error: "Internal server error",
    });
  }
}