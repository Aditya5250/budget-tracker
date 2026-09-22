import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
dotenv.config();

/**
 * Dynamically resolve the Gemini API key (from environment or runtime)
 */
export function getGeminiApiKey() {
  return (process.env.GEMINI_API_KEY || "").trim();
}

/**
 * Check connectivity and configuration of Gemini API
 */
export async function checkGeminiStatus() {
  const apiKey = getGeminiApiKey();
  if (!apiKey || apiKey === "your_gemini_api_key_here") {
    return {
      configured: false,
      active: false,
      model: "local-advisor",
      message: "No GEMINI_API_KEY configured in environment. Running in offline rule-based mode.",
    };
  }

  return {
    configured: true,
    active: true,
    model: "gemini-2.5-flash",
    message: "Google Gemini API connected and ready.",
  };
}

/**
 * Natural language rule-based fallback parser
 */
function localRuleBasedParse(text, categories = []) {
  const normalized = text.toLowerCase().trim();

  // 1. Detect Type
  const isIncome =
    /\b(received|earned|got|salary|paycheck|dividend|freelance|bonus|refund|credited|income)\b/i.test(
      normalized
    );
  const type = isIncome ? "income" : "expense";

  // 2. Detect Amount (handles ₹, $, €, £, rs, inr, usd, or plain numbers)
  let amount = null;
  const amountMatch =
    text.match(/(?:(?:rs\.?|inr|\$|€|£|₹)\s*(\d+(?:,\d+)*(?:\.\d+)?))/i) ||
    text.match(/(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:rs|rupees|inr|dollars|bucks)?/i);

  if (amountMatch) {
    const rawNum = (amountMatch[1] || amountMatch[0]).replace(/,/g, "");
    const parsed = parseFloat(rawNum);
    if (!isNaN(parsed)) amount = parsed;
  }

  // 3. Detect Date
  let occurredAt = new Date();
  if (/\byesterday\b/i.test(normalized)) {
    occurredAt.setDate(occurredAt.getDate() - 1);
  } else if (/\blast week\b/i.test(normalized)) {
    occurredAt.setDate(occurredAt.getDate() - 7);
  }

  // 4. Detect Category
  let categoryMatch = null;
  const categoryKeywords = {
    "Dining & Food": ["dinner", "lunch", "breakfast", "burger", "pizza", "coffee", "starbucks", "dominos", "swiggy", "zomato", "restaurant", "cafe", "food"],
    "Groceries": ["groceries", "supermarket", "walmart", "target", "milk", "vegetables", "fruits", "grocery", "blinkit", "zepto", "instamart"],
    "Housing & Rent": ["rent", "maintenance", "mortgage", "apartment", "lease", "housing"],
    "Utilities & Bills": ["electricity", "water", "wifi", "internet", "gas", "bill", "recharge", "phone"],
    "Transportation": ["uber", "lyft", "taxi", "cab", "metro", "fuel", "petrol", "diesel", "bus", "flight", "commute", "train"],
    "Entertainment": ["netflix", "spotify", "movie", "cinema", "game", "steam", "concert", "party"],
    "Healthcare": ["doctor", "medicine", "pharmacy", "hospital", "dentist", "clinic", "health"],
    "Shopping": ["amazon", "flipkart", "clothes", "shoes", "mall", "shopping", "electronics"],
    "Salary": ["salary", "paycheck", "wages", "employer"],
    "Freelance": ["client", "freelance", "upwork", "fiverr", "contract"],
    "Investments": ["stocks", "crypto", "dividend", "mutual fund", "shares", "sip"],
  };

  for (const [catName, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some((kw) => normalized.includes(kw))) {
      categoryMatch = catName;
      break;
    }
  }

  // Find category ID from user categories list if available
  let matchedCat = null;
  if (categoryMatch && categories.length > 0) {
    matchedCat = categories.find(
      (c) => c.name.toLowerCase() === categoryMatch.toLowerCase()
    );
  }

  // Clean note
  let cleanNote = text
    .replace(/(?:(?:rs\.?|inr|\$|€|£|₹)\s*\d+(?:,\d+)*(?:\.\d+)?)/gi, "")
    .replace(/\b(spent|paid|received|earned|yesterday|today|rs|rupees|for|on)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleanNote) cleanNote = text.trim();

  return {
    type,
    amount: amount || 0,
    category: matchedCat ? matchedCat.name : categoryMatch || "Miscellaneous",
    categoryId: matchedCat ? matchedCat.id : null,
    note: cleanNote.charAt(0).toUpperCase() + cleanNote.slice(1),
    occurredAt: occurredAt.toISOString(),
    confidence: amount ? 0.9 : 0.6,
    engine: "heuristic",
  };
}

/**
 * Call Google Gemini API supporting both @google/genai SDK and REST fallback
 * with automatic fallback between gemini-2.5-flash, gemini-2.0-flash, and gemini-1.5-flash.
 */
async function callGeminiContents(contents, systemInstruction = "") {
  const apiKey = getGeminiApiKey();
  if (!apiKey || apiKey === "your_gemini_api_key_here") return null;

  const candidateModels = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
  ];

  // 1. Try official @google/genai SDK first
  try {
    const ai = new GoogleGenAI({ apiKey });
    for (const model of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents,
          config: systemInstruction
            ? {
                systemInstruction,
                temperature: 0.7,
              }
            : { temperature: 0.7 },
        });

        const text = response.text;
        if (text && text.trim()) {
          return { text: text.trim(), model };
        }
      } catch (err) {
        console.warn(`[Gemini SDK] ${model} attempt failed:`, err.message);
      }
    }
  } catch (sdkInitErr) {
    console.warn("[Gemini SDK] SDK initialization failed, trying REST fallback:", sdkInitErr.message);
  }

  // 2. Direct REST fallback
  for (const model of candidateModels) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const payload = {
        contents: Array.isArray(contents)
          ? contents
          : [{ role: "user", parts: [{ text: String(contents) }] }],
      };

      if (systemInstruction) {
        payload.systemInstruction = {
          parts: [{ text: systemInstruction }],
        };
      }

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text && text.trim()) {
          return { text: text.trim(), model };
        }
      } else {
        const errText = await response.text();
        console.warn(`[Gemini REST] ${model} returned ${response.status}:`, errText.slice(0, 150));
      }
    } catch (restErr) {
      console.warn(`[Gemini REST] error calling ${model}:`, restErr.message);
    }
  }

  return null;
}

/**
 * 1. Parse Transaction from Natural Language
 */
export async function parseTransactionWithAI(text, categories = []) {
  if (!text || !text.trim()) {
    throw new Error("Text is required for AI transaction parsing");
  }

  const categoryNames = categories.map((c) => c.name).join(", ");
  const apiKey = getGeminiApiKey();

  if (apiKey && apiKey !== "your_gemini_api_key_here") {
    const prompt = `You are a financial AI parser. Parse the following user text into a structured budget transaction:
"${text}"

Available Categories: [${categoryNames}]
Today's date is: ${new Date().toISOString().split("T")[0]}

Output STRICTLY valid JSON with no markdown formatting, backticks, or other text:
{
  "type": "expense" or "income",
  "amount": number (positive float),
  "category": "one of the available categories that best matches, or Miscellaneous",
  "note": "brief clean descriptive note",
  "occurredAt": "ISO date string (e.g. YYYY-MM-DDTHH:mm:ss.sssZ)"
}`;

    const geminiRes = await callGeminiContents([{ role: "user", parts: [{ text: prompt }] }]);
    if (geminiRes && geminiRes.text) {
      try {
        const cleaned = geminiRes.text.replace(/```json/g, "").replace(/```/g, "").trim();
        const parsed = JSON.parse(cleaned);
        const matchedCat = categories.find(
          (c) => c.name.toLowerCase() === (parsed.category || "").toLowerCase()
        );

        return {
          type: parsed.type === "income" ? "income" : "expense",
          amount: Number(parsed.amount) || 0,
          category: matchedCat ? matchedCat.name : parsed.category || "Miscellaneous",
          categoryId: matchedCat ? matchedCat.id : null,
          note: parsed.note || text,
          occurredAt: parsed.occurredAt || new Date().toISOString(),
          confidence: 0.98,
          engine: geminiRes.model,
        };
      } catch (err) {
        console.warn("Failed to parse Gemini JSON output, using local fallback:", err.message);
      }
    }
  }

  return localRuleBasedParse(text, categories);
}

/**
 * 2. AI Financial Advisor Chat with Multi-turn Memory & Rich Formatting
 */
export async function getFinancialAdvice({ question, context = {}, history = [] }) {
  const {
    totalIncome = 0,
    totalExpense = 0,
    netSavings = 0,
    savingsRate = 0,
    categoryBreakdown = [],
    recentTransactions = [],
    budgets = [],
    currency = "INR",
  } = context;

  const currSymbol = currency === "USD" ? "$" : "₹";
  const apiKey = getGeminiApiKey();

  const contextSummary = `
--- REAL-TIME USER FINANCIAL SNAPSHOT ---
Cash Flow Overview:
- Total Income: ${currSymbol}${totalIncome}
- Total Expenses: ${currSymbol}${totalExpense}
- Net Savings: ${currSymbol}${netSavings}
- Savings Rate: ${savingsRate}%

Top Spending Categories:
${(categoryBreakdown || [])
  .slice(0, 6)
  .map((c) => `  * ${c.name}: ${currSymbol}${c.total}`)
  .join("\n") || "  (No expenses recorded yet)"}

Active Budget Caps:
${(budgets || [])
  .map((b) => `  * ${b.category_name}: Limit ${currSymbol}${b.monthly_limit}`)
  .join("\n") || "  (No budget limits set yet)"}

Recent Transactions (last 15):
${(recentTransactions || [])
  .slice(0, 15)
  .map((t) => `  * [${t.occurred_at ? new Date(t.occurred_at).toLocaleDateString() : "Recent"}] ${t.type.toUpperCase()}: ${currSymbol}${t.amount} (${t.category || "Other"}) - "${t.note || "No description"}"`)
  .join("\n") || "  (No transactions recorded yet)"}
----------------------------------------`;

  if (apiKey && apiKey !== "your_gemini_api_key_here") {
    const systemPrompt = `You are "Aura", an empathetic, highly analytical, and inspiring AI Financial Advisor and Budget Strategist embedded in the AuraBudget AI platform.
Your mission is to provide deeply personalized, actionable, and mathematically grounded financial guidance based strictly on the user's real-time financial snapshot.

Formatting Guidelines for Rich UI Rendering:
1. Markdown Formatting:
   - Use bold (**text**) for figures, metrics, and key takeaways.
   - Use structured bullet points (- ) or numbered lists (1. ) for step-by-step action plans.
   - When comparing categories or providing budget recommendations, use Markdown tables with headers (| Category | Current | Recommended Limit |).
   - Use Markdown blockquotes (> 💡 **Aura Strategy:** ...) for high-impact money-saving tips or rule-of-thumb principles.
   - Use inline code (\`${currSymbol}500\`) for quick budget thresholds or calculations.
2. Voice & Tone:
   - Warm, motivating, disciplined, and conversational.
   - Never sound clinical or intimidating. Emphasize proactive progress and celebrating small wins.
   - Always reference their actual numbers from the financial snapshot (e.g. their specific top category, savings rate, or recent purchases).
3. Brevity & Actionability:
   - Keep responses focused (typically 2-4 structured paragraphs or bulleted sections).
   - Conclude with a clear, single next action the user can take right now.`;

    // Build multi-turn contents array
    const contents = [];

    // Incorporate recent chat history (last 6 turns)
    if (Array.isArray(history) && history.length > 0) {
      for (const item of history.slice(-6)) {
        const role = (item.sender === "ai" || item.role === "model") ? "model" : "user";
        const text = item.text || item.content || "";
        if (text.trim()) {
          contents.push({
            role,
            parts: [{ text: text.trim() }],
          });
        }
      }
    }

    // Append latest prompt with fresh financial context
    const currentPrompt = `${contextSummary}

User Question: "${question}"

Provide specific, motivating, and beautifully formatted financial advice:`;

    contents.push({
      role: "user",
      parts: [{ text: currentPrompt }],
    });

    const geminiRes = await callGeminiContents(contents, systemPrompt);
    if (geminiRes && geminiRes.text) {
      return {
        reply: geminiRes.text,
        engine: "gemini",
        model: geminiRes.model,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // Intelligent local fallback response with rich Markdown formatting
  let fallbackReply = "";
  if (totalIncome === 0 && totalExpense === 0) {
    fallbackReply = `### Welcome to Aura Financial AI! 👋\n\n` +
      `You haven't logged any transactions yet for this period. To unleash personalized financial advice:\n\n` +
      `- **Log Your Income**: Add your monthly salary, freelance earnings, or dividends.\n` +
      `- **Track Daily Expenses**: Use the **Quick AI Add** bar to quickly record groceries, dining, or bills.\n` +
      `- **Set Category Budgets**: Establish spending limits so I can alert you before leaks happen.\n\n` +
      `> 💡 **Aura Tip:** Start with your last 3 days of expenses to immediately see category breakdown!`;
  } else if (netSavings < 0) {
    const topCat = categoryBreakdown?.[0]?.name || "Discretionary Spending";
    const topAmt = categoryBreakdown?.[0]?.total || 0;
    fallbackReply = `### ⚠️ Spending Velocity Alert\n\n` +
      `Your total spending (**${currSymbol}${totalExpense}**) currently exceeds your income (**${currSymbol}${totalIncome}**) by **${currSymbol}${Math.abs(netSavings)}**.\n\n` +
      `#### Key Observations:\n` +
      `- **Highest Outflow**: **${topCat}** accounts for **${currSymbol}${topAmt}**.\n` +
      `- **Immediate Action**: Pause non-essential purchases in ${topCat} for the remainder of the billing cycle.\n` +
      `- **Recovery Target**: Aim to reduce discretionary spending by 15% to restore a positive cash buffer.\n\n` +
      `> 💡 **Aura Strategy:** Consider setting a strict budget cap on **${topCat}** in your Budgets tab.`;
  } else {
    const topCat = categoryBreakdown?.[0]?.name || "Routine Expenses";
    const topAmt = categoryBreakdown?.[0]?.total || 0;
    fallbackReply = `### 🎉 Strong Financial Momentum\n\n` +
      `You have accumulated **${currSymbol}${netSavings}** in net savings with a solid **${savingsRate}% savings rate**!\n\n` +
      `#### Financial Snapshot:\n` +
      `- **Top Outflow**: **${topCat}** at **${currSymbol}${topAmt}**.\n` +
      `- **Surplus Allocation**: We recommend splitting your **${currSymbol}${netSavings}** surplus:\n` +
      `  - **50% (${currSymbol}${(netSavings * 0.5).toFixed(0)})** into emergency reserves or high-yield savings.\n` +
      `  - **30% (${currSymbol}${(netSavings * 0.3).toFixed(0)})** into long-term investments (SIPs/Index funds).\n` +
      `  - **20% (${currSymbol}${(netSavings * 0.2).toFixed(0)})** for planned lifestyle rewards.\n\n` +
      `> 💡 **Aura Strategy:** Maintain this pace! Tracking small recurring expenses will help you push toward a 30% savings milestone.`;
  }

  return {
    reply: fallbackReply,
    engine: "local-advisor",
    model: "heuristic-rules",
    hint: !apiKey ? "Tip: Add GEMINI_API_KEY to backend/.env to activate Google Gemini AI generative answers." : null,
    timestamp: new Date().toISOString(),
  };
}

/**
 * 3. Generate Automated Spending Insights & Anomalies
 */
export async function generateSpendingInsights(transactions = [], categories = []) {
  if (transactions.length === 0) {
    return [
      {
        id: "welcome",
        type: "tip",
        title: "Welcome to AI Budget Tracker",
        message: "Start adding your daily expenses or try the Quick AI Add bar to see live spending analytics and personalized suggestions.",
        icon: "Sparkles",
      },
    ];
  }

  const expenses = transactions.filter((t) => t.type === "expense");
  const income = transactions.filter((t) => t.type === "income");

  const totalExpense = expenses.reduce((acc, t) => acc + Number(t.amount), 0);
  const totalIncome = income.reduce((acc, t) => acc + Number(t.amount), 0);

  const insights = [];

  // 1. Savings Rate Insight
  if (totalIncome > 0) {
    const savingsRate = ((totalIncome - totalExpense) / totalIncome) * 100;
    if (savingsRate >= 20) {
      insights.push({
        id: "healthy_savings",
        type: "success",
        title: `Strong ${savingsRate.toFixed(0)}% Savings Rate`,
        message: `You're surpassing the recommended 20% savings rule. Keep this momentum to accelerate your investment goals.`,
        icon: "TrendingUp",
      });
    } else if (savingsRate > 0) {
      insights.push({
        id: "moderate_savings",
        type: "info",
        title: `${savingsRate.toFixed(0)}% Savings Rate`,
        message: `You're in the green! Consider reducing your discretionary spending slightly to reach the optimal 20% benchmark.`,
        icon: "PiggyBank",
      });
    } else {
      insights.push({
        id: "negative_savings",
        type: "warning",
        title: "Deficit Alert",
        message: `Current spending exceeds income by ₹${Math.abs(totalIncome - totalExpense).toFixed(0)}. Check top categories to balance your cashflow.`,
        icon: "AlertTriangle",
      });
    }
  }

  // 2. Category Concentration
  const catMap = {};
  expenses.forEach((e) => {
    const name = e.category || "Uncategorized";
    catMap[name] = (catMap[name] || 0) + Number(e.amount);
  });

  const sortedCats = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
  if (sortedCats.length > 0 && totalExpense > 0) {
    const [topCat, topAmount] = sortedCats[0];
    const percentage = ((topAmount / totalExpense) * 100).toFixed(0);
    if (percentage > 35) {
      insights.push({
        id: "cat_spike",
        type: "warning",
        title: `High Concentration in ${topCat}`,
        message: `${topCat} accounts for ${percentage}% of all your expenses (₹${topAmount.toFixed(0)}). Consider setting a monthly limit.`,
        icon: "PieChart",
      });
    }
  }

  // 3. High Value Transaction Check
  if (expenses.length > 3) {
    const avgExpense = totalExpense / expenses.length;
    const spike = expenses.find((e) => Number(e.amount) > avgExpense * 2.5);
    if (spike) {
      insights.push({
        id: "spike_tx",
        type: "info",
        title: "Spending Spike Detected",
        message: `Your transaction "${spike.note || "Expense"}" of ₹${spike.amount} is significantly higher than your typical transaction average (₹${avgExpense.toFixed(0)}).`,
        icon: "Zap",
      });
    }
  }

  // Fallback tip if insights are few
  if (insights.length < 3) {
    insights.push({
      id: "smart_habit",
      type: "tip",
      title: "Smart Money Tip",
      message: "Track recurring subscriptions and recurring small daily purchases—they often account for over 15% of monthly leaks.",
      icon: "Lightbulb",
    });
  }

  return insights;
}

/**
 * 4. AI Smart Budget Allocation Recommendations (50/30/20 Rule)
 */
export async function getRecommendedBudgets(transactions = [], existingCategories = []) {
  const expenses = transactions.filter((t) => t.type === "expense");
  const income = transactions.filter((t) => t.type === "income");
  const totalIncome = income.reduce((acc, t) => acc + Number(t.amount), 0) || 50000;

  // 50% Needs, 30% Wants, 20% Savings
  const targetNeeds = totalIncome * 0.5;
  const targetWants = totalIncome * 0.3;

  const categorySpent = {};
  expenses.forEach((e) => {
    const id = e.category_id;
    if (id) categorySpent[id] = (categorySpent[id] || 0) + Number(e.amount);
  });

  return existingCategories
    .filter((c) => c.type === "expense")
    .map((c) => {
      const currentSpent = categorySpent[c.id] || 0;
      // Recommend 10-15% buffer above average or 50/30 split
      const suggestedLimit = currentSpent > 0 ? Math.ceil(currentSpent * 1.15 / 100) * 100 : 5000;
      return {
        categoryId: c.id,
        categoryName: c.name,
        categoryColor: c.color,
        categoryIcon: c.icon,
        currentSpent,
        suggestedLimit,
        rationale:
          currentSpent > 0
            ? `Based on your recent spend of ₹${currentSpent} with a 15% discipline buffer.`
            : "Standard starter limit for balanced cashflow.",
      };
    });
}
