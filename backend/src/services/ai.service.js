import dotenv from "dotenv";
dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

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
 * Call Google Gemini API
 */
async function callGemini(prompt, systemInstruction = "") {
  if (!GEMINI_API_KEY) return null;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    const payload = {
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
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

    if (!response.ok) {
      const errText = await response.text();
      console.warn("Gemini API error:", response.status, errText);
      return null;
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch (err) {
    console.warn("Error calling Gemini API:", err.message);
    return null;
  }
}

/**
 * 1. Parse Transaction from Natural Language
 */
export async function parseTransactionWithAI(text, categories = []) {
  if (!text || !text.trim()) {
    throw new Error("Text is required for AI transaction parsing");
  }

  const categoryNames = categories.map((c) => c.name).join(", ");

  if (GEMINI_API_KEY) {
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

    const rawResponse = await callGemini(prompt);
    if (rawResponse) {
      try {
        const cleaned = rawResponse.replace(/```json/g, "").replace(/```/g, "").trim();
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
          engine: "gemini-1.5-flash",
        };
      } catch (err) {
        console.warn("Failed to parse Gemini JSON output, using local fallback:", err.message);
      }
    }
  }

  return localRuleBasedParse(text, categories);
}

/**
 * 2. AI Financial Advisor Chat
 */
export async function getFinancialAdvice({ question, context, history = [] }) {
  const { totalIncome, totalExpense, netSavings, savingsRate, categoryBreakdown } = context;

  const contextSummary = `
User Financial Summary for Current Period:
- Total Income: ₹${totalIncome}
- Total Expense: ₹${totalExpense}
- Net Savings: ₹${netSavings} (Savings Rate: ${savingsRate}%)
- Top Spending Categories:
${(categoryBreakdown || [])
  .slice(0, 5)
  .map((c) => `  * ${c.name}: ₹${c.total}`)
  .join("\n")}
`;

  if (GEMINI_API_KEY) {
    const systemPrompt = `You are "Aura", an empathetic, highly skilled financial advisor and budget coach.
Your job is to provide specific, data-driven, practical, and motivating financial advice based strictly on the user's spending data.
Keep answers concise, structured with bullet points, and friendly. Avoid excessive jargon.
Use currency symbol ₹ or $ appropriately.`;

    const fullPrompt = `${contextSummary}

User Question: "${question}"

Provide actionable, friendly advice:`;

    const advice = await callGemini(fullPrompt, systemPrompt);
    if (advice) {
      return {
        reply: advice,
        engine: "gemini-1.5-flash",
      };
    }
  }

  // Intelligent local fallback response
  let fallbackReply = `Here is your financial overview:\n\n`;
  if (totalIncome === 0 && totalExpense === 0) {
    fallbackReply += `You haven't recorded any transactions yet for this period. Try adding your recent income and routine expenses to unlock deep insights!`;
  } else if (netSavings < 0) {
    const topCategory = categoryBreakdown?.[0]?.name || "discretionary spending";
    fallbackReply += `⚠️ **Spending Alert**: Your expenses (₹${totalExpense}) currently exceed your income (₹${totalIncome}) by ₹${Math.abs(
      netSavings
    )}.\n\n` +
      `- **Focus Area**: Your highest expenditure is currently in **${topCategory}**.\n` +
      `- **Action Item**: Aim to cap non-essential purchases for the rest of the month and set a budget limit on ${topCategory}.\n` +
      `- **Next Step**: Build an emergency buffer by saving at least 15% of upcoming income.`;
  } else {
    const topCategory = categoryBreakdown?.[0]?.name || "expenses";
    fallbackReply += `🎉 **Great Financial Health**: You have saved ₹${netSavings} this month with a solid **${savingsRate}% savings rate**!\n\n` +
      `- **Top Spend**: Your largest expenditure is **${topCategory}** (₹${categoryBreakdown?.[0]?.total || 0}).\n` +
      `- **Recommendation**: Allocate 50% of your surplus (₹${(netSavings * 0.5).toFixed(0)}) toward long-term investments or emergency funds.\n` +
      `- **Optimization**: Review recurring subscription charges to unlock another 5-10% in monthly savings.`;
  }

  return {
    reply: fallbackReply,
    engine: "local-advisor",
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
