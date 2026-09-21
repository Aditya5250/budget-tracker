export default function StatCard({
  label,
  value,
  type = "balance",
  icon: Icon,
  metaText,
  prefix = "₹",
}) {
  const formattedValue = typeof value === "number" ? value.toLocaleString("en-IN") : value;

  return (
    <div className={`stat-card stat-${type}`}>
      <div className="stat-header">
        <span className="stat-label">{label}</span>
        {Icon && (
          <div className="stat-icon-wrapper">
            <Icon size={18} />
          </div>
        )}
      </div>
      <div className="stat-value">
        {prefix}
        {formattedValue}
      </div>
      {metaText && <div className="stat-meta">{metaText}</div>}
    </div>
  );
}
