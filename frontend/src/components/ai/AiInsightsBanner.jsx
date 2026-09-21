import { Sparkles, TrendingUp, AlertTriangle, Lightbulb, PieChart, ArrowRight, Zap, PiggyBank } from "lucide-react";

export default function AiInsightsBanner({ insights = [], onOpenAdvisor }) {
  const iconMap = {
    Sparkles,
    TrendingUp,
    AlertTriangle,
    Lightbulb,
    PieChart,
    Zap,
    PiggyBank,
  };

  return (
    <div className="ai-insights-card">
      <div className="ai-banner-header">
        <div className="ai-banner-title">
          <Sparkles size={20} color="#818cf8" />
          <span>Aura Financial Insights & Health</span>
          <span className="ai-sparkle-badge">AI Powered</span>
        </div>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={onOpenAdvisor}
          style={{ fontSize: "12px" }}
        >
          Ask Financial Advisor <ArrowRight size={14} />
        </button>
      </div>

      <div className="insights-row">
        {insights.slice(0, 3).map((item) => {
          const IconComp = iconMap[item.icon] || Lightbulb;
          return (
            <div key={item.id || item.title} className="insight-item">
              <div className="insight-item-title">
                <IconComp
                  size={16}
                  color={
                    item.type === "warning"
                      ? "var(--warning)"
                      : item.type === "success"
                      ? "var(--income)"
                      : "#818cf8"
                  }
                />
                <span>{item.title}</span>
              </div>
              <p className="insight-item-desc">{item.message}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
