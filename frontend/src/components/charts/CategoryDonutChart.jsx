import { useState } from "react";

export default function CategoryDonutChart({ data = [], total = 0, currency = "₹" }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  if (!data || data.length === 0 || total === 0) {
    return (
      <div style={{ textAlign: "center", color: "var(--text-subtle)", padding: "30px 0" }}>
        <p style={{ fontSize: "14px" }}>No expense categories recorded yet.</p>
        <span style={{ fontSize: "12px", opacity: 0.7 }}>Add transactions to see breakdown.</span>
      </div>
    );
  }

  // Calculate SVG arc paths
  const size = 180;
  const strokeWidth = 26;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "18px", width: "100%" }}>
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Background circle track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="var(--chart-track)"
            strokeWidth={strokeWidth}
          />

          {/* Slices */}
          {data.map((item, idx) => {
            const percent = item.total / total;
            const dashLength = percent * circumference;
            const dashOffset = -accumulatedPercent * circumference;
            accumulatedPercent += percent;

            const isHovered = hoveredIdx === idx;

            return (
              <circle
                key={item.name}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke={item.color || "#6366f1"}
                strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                strokeDasharray={`${dashLength} ${circumference - dashLength}`}
                strokeDashoffset={dashOffset}
                style={{
                  cursor: "pointer",
                  transition: "stroke-width 0.2s ease, opacity 0.2s ease",
                  opacity: hoveredIdx !== null && !isHovered ? 0.4 : 1,
                  transform: "rotate(-90deg)",
                  transformOrigin: "50% 50%",
                }}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              />
            );
          })}
        </svg>

        {/* Center label */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          {hoveredIdx !== null ? (
            <>
              <span style={{ fontSize: "11px", color: "var(--text-subtle)", textTransform: "uppercase" }}>
                {data[hoveredIdx].name}
              </span>
              <span style={{ fontSize: "16px", fontWeight: 800, color: "var(--text-main)" }}>
                {currency}
                {data[hoveredIdx].total.toLocaleString("en-IN")}
              </span>
              <span style={{ fontSize: "11px", color: data[hoveredIdx].color, fontWeight: 700 }}>
                {Math.round((data[hoveredIdx].total / total) * 100)}%
              </span>
            </>
          ) : (
            <>
              <span style={{ fontSize: "11px", color: "var(--text-subtle)", textTransform: "uppercase" }}>
                Total Spent
              </span>
              <span style={{ fontSize: "17px", fontWeight: 800, color: "var(--text-main)" }}>
                {currency}
                {total.toLocaleString("en-IN")}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Interactive Legend */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "8px 14px",
          justifyContent: "center",
          width: "100%",
          maxHeight: "90px",
          overflowY: "auto",
        }}
      >
        {data.slice(0, 6).map((item, idx) => (
          <div
            key={item.name}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "12px",
              cursor: "pointer",
              opacity: hoveredIdx !== null && hoveredIdx !== idx ? 0.4 : 1,
              transition: "opacity 0.2s ease",
            }}
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(null)}
          >
            <span
              style={{
                width: "9px",
                height: "9px",
                borderRadius: "50%",
                backgroundColor: item.color || "#64748b",
                flexShrink: 0,
              }}
            />
            <span style={{ color: "var(--text-muted)", fontWeight: 500 }}>{item.name}</span>
            <span style={{ color: "var(--text-subtle)", fontSize: "11px" }}>
              ({Math.round((item.total / total) * 100)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
