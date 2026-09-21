import pool from "../config/db.js";
import {
  parseTransactionWithAI,
  getFinancialAdvice,
  generateSpendingInsights,
  getRecommendedBudgets,
} from "../services/ai.service.js";

/**
 * POST /api/ai/parse-transaction
 * Natural language transaction extraction
 */
export async function parseTransaction(req, res) {
  try {
    const userId = req.user.id;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Text is required" });
    }

    // Fetch user categories for context matching
    const catRes = await pool.query(
      `SELECT id, name, color, icon, type FROM categories WHERE user_id = $1 OR user_id IS NULL`,
      [userId]
    );

    const parsed = await parseTransactionWithAI(text, catRes.rows);
    res.json({ parsed });
  } catch (error) {
    console.error("AI Parse error:", error.message);
    res.status(500).json({ error: error.message || "Failed to parse transaction" });
  }
}

/**
 * POST /api/ai/advisor
 * Financial advisor conversational agent
 */
export async function advisorChat(req, res) {
  try {
    const userId = req.user.id;
    const { question, history = [] } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({ error: "Question is required" });
    }

    // Retrieve user transactions for financial context
    const txRes = await pool.query(
      `SELECT t.id, t.type, t.amount, t.occurred_at, c.name AS category
       FROM transactions t
       LEFT JOIN categories c ON t.category_id = c.id
       WHERE t.user_id = $1`,
      [userId]
    );

    let totalIncome = 0;
    let totalExpense = 0;
    const catMap = {};

    txRes.rows.forEach((t) => {
      const amt = Number(t.amount);
      if (t.type === "income") totalIncome += amt;
      else {
        totalExpense += amt;
        const name = t.category || "Other";
        catMap[name] = (catMap[name] || 0) + amt;
      }
    });

    const netSavings = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? ((netSavings / totalIncome) * 100).toFixed(1) : 0;
    const categoryBreakdown = Object.entries(catMap)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total);

    const advice = await getFinancialAdvice({
      question,
      context: {
        totalIncome,
        totalExpense,
        netSavings,
        savingsRate,
        categoryBreakdown,
      },
      history,
    });

    res.json(advice);
  } catch (error) {
    console.error("Advisor error:", error.message);
    res.status(500).json({ error: "Failed to consult financial advisor" });
  }
}

/**
 * GET /api/ai/insights
 * Automated anomaly detection & monthly insights
 */
export async function getInsights(req, res) {
  try {
    const userId = req.user.id;

    const txRes = await pool.query(
      `SELECT t.id, t.type, t.amount, t.note, t.occurred_at, t.category_id, c.name AS category
       FROM transactions t
       LEFT JOIN categories c ON t.category_id = c.id
       WHERE t.user_id = $1
       ORDER BY t.occurred_at DESC
       LIMIT 100`,
      [userId]
    );

    const catRes = await pool.query(
      `SELECT id, name, color, icon, type FROM categories WHERE user_id = $1 OR user_id IS NULL`,
      [userId]
    );

    const insights = await generateSpendingInsights(txRes.rows, catRes.rows);
    res.json({ insights });
  } catch (error) {
    console.error("Insights error:", error.message);
    res.status(500).json({ error: "Failed to generate insights" });
  }
}

/**
 * GET /api/ai/budget-recommendations
 */
export async function getBudgetRecommendations(req, res) {
  try {
    const userId = req.user.id;

    const txRes = await pool.query(
      `SELECT t.id, t.type, t.amount, t.category_id FROM transactions t WHERE t.user_id = $1`,
      [userId]
    );

    const catRes = await pool.query(
      `SELECT id, name, color, icon, type FROM categories WHERE (user_id = $1 OR user_id IS NULL) AND type = 'expense'`,
      [userId]
    );

    const recommendations = await getRecommendedBudgets(txRes.rows, catRes.rows);
    res.json({ recommendations });
  } catch (error) {
    console.error("Budget recommendations error:", error.message);
    res.status(500).json({ error: "Failed to generate budget recommendations" });
  }
}
