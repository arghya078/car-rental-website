
import React, { useMemo } from "react";

export default function Spinner({
  size = 48,
  thickness = 6,
  label,
  visibleLabel = false,
  className = "",
}) {
  // unique id for gradient so multiple spinners on a page don't conflict
  const gradId = useMemo(() => `spinner-grad-${Math.random().toString(36).slice(2, 9)}`, []);

  const radius = 20; // viewBox circle radius
  const viewBoxSize = 50;
  const center = viewBoxSize / 2;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={`inline-flex items-center gap-3 ${className}`}
    >
      {/* Inline styles for keyframes scoped to this component */}
      <style>{`
        @keyframes spinner-rotate-${gradId} { to { transform: rotate(360deg); } }
        @keyframes spinner-dash-${gradId} {
          0%   { stroke-dasharray: 1, 200; stroke-dashoffset: 0; }
          50%  { stroke-dasharray: 120, 200; stroke-dashoffset: -30; }
          100% { stroke-dasharray: 1, 200; stroke-dashoffset: -120; }
        }
        .spinner-rotate-${gradId} { animation: spinner-rotate-${gradId} 1.6s linear infinite; }
        .spinner-dash-${gradId} { animation: spinner-dash-${gradId} 1.6s ease-in-out infinite; transform-origin: 50% 50%; }
      `}</style>

      <svg
        className={`spinner-rotate-${gradId}`}
        width={size}
        height={size}
        viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="20%" stopColor="#3b82f6" />
            <stop offset="40%" stopColor="#7c3aed" />
            <stop offset="60%" stopColor="#ec4899" />
            <stop offset="80%" stopColor="#fb923c" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>

        {/* faint background ring */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke="rgba(15,23,42,0.08)"
          strokeWidth={thickness}
          fill="none"
        />

        {/* animated colorful arc */}
        <circle
          className={`spinner-dash-${gradId}`}
          cx={center}
          cy={center}
          r={radius}
          stroke={`url(#${gradId})`}
          strokeWidth={thickness}
          strokeLinecap="round"
          fill="none"
          strokeDasharray="120,200"
          strokeDashoffset="0"
        />

        {/* subtle glowing center */}
        <circle
          cx={center}
          cy={center}
          r={Math.max(2, Math.floor(radius / 4))}
          fill="url(#${gradId})"
          style={{ opacity: 0.95, filter: "drop-shadow(0 4px 8px rgba(99,102,241,0.12))" }}
        />
      </svg>

      {label ? (
        visibleLabel ? (
          <span className="text-sm text-slate-600">{label}</span>
        ) : (
          <span className="sr-only">{label}</span>
        )
      ) : null}
    </div>
  );
}
