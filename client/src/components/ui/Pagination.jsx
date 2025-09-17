
import React, { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";


export default function Pagination({
  page = 1,
  totalPages = 1,
  onChange = () => {},
  siblingCount = 1,
  boundaryCount = 1,
  showFirstLast = true,
  size = "md",
  className = "",
}) {
 
  const containerRef = useRef(null);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) return;

    const el = containerRef.current;
    if (!el) return;

    const onKey = (e) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        onChange(Math.max(1, page - 1));
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        onChange(Math.min(totalPages, page + 1));
      }
    };

    el.addEventListener("keydown", onKey);
    return () => el.removeEventListener("keydown", onKey);
  }, [focused, page, totalPages, onChange]);

 
  if (!totalPages || totalPages <= 1) return null;

  const s = Math.max(0, siblingCount);
  const b = Math.max(0, boundaryCount);

  const pages = [];
  const totalNumbers = b * 2 + s * 2 + 3;
  const shouldShowEllipses = totalPages > totalNumbers;

  if (!shouldShowEllipses) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    const leftSiblingStart = Math.max(page - s, b + 2);
    const rightSiblingEnd = Math.min(page + s, totalPages - b - 1);

    for (let i = 1; i <= b; i++) pages.push(i);

    if (leftSiblingStart > b + 2) {
      pages.push("left-ellipsis");
    } else if (leftSiblingStart === b + 2) {
      pages.push(b + 1);
    }

    for (let i = leftSiblingStart; i <= rightSiblingEnd; i++) pages.push(i);

    if (rightSiblingEnd < totalPages - b - 1) {
      pages.push("right-ellipsis");
    } else if (rightSiblingEnd === totalPages - b - 1) {
      pages.push(totalPages - b);
    }

    for (let i = totalPages - b + 1; i <= totalPages; i++) pages.push(i);
  }

  const sizeMap = {
    sm: { btn: "px-2 py-1 text-sm", icon: 14 },
    md: { btn: "px-3 py-1.5 text-sm", icon: 16 },
  };
  const sz = sizeMap[size] || sizeMap.md;

  const btnBase =
    "inline-flex items-center justify-center rounded-md border transition focus:outline-none focus:ring-2 focus:ring-offset-1";

  return (
    <nav
      ref={containerRef}
      tabIndex={0}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      role="navigation"
      aria-label="Pagination"
      className={`flex flex-wrap items-center gap-2 ${className}`}
    >
      {showFirstLast && (
        <button
          type="button"
          onClick={() => onChange(1)}
          disabled={page === 1}
          aria-label="First page"
          className={`${btnBase} ${sz.btn} ${page === 1 ? "opacity-50 cursor-not-allowed bg-white/40 border-slate-100" : "bg-white hover:bg-slate-50"} `}
        >
          <ChevronsLeft size={sz.icon} />
        </button>
      )}

      <button
        type="button"
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page === 1}
        aria-label="Previous page"
        className={`${btnBase} ${sz.btn} ${page === 1 ? "opacity-50 cursor-not-allowed bg-white/40 border-slate-100" : "bg-white hover:bg-slate-50"}`}
      >
        <ChevronLeft size={sz.icon} />
      </button>

      {pages.map((p, idx) => {
        if (p === "left-ellipsis" || p === "right-ellipsis") {
          return (
            <span
              key={`ell-${p}-${idx}`}
              className="px-2 text-sm text-slate-400 select-none"
              aria-hidden="true"
            >
              …
            </span>
          );
        }

        const active = p === page;
        return (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            aria-current={active ? "page" : undefined}
            aria-label={active ? `Page ${p}, current page` : `Go to page ${p}`}
            className={`${btnBase} ${sz.btn} ${active ? "bg-indigo-600 text-white border-indigo-600 shadow-sm" : "bg-white hover:bg-slate-50 text-slate-700 border-slate-100"} `}
          >
            {p}
          </button>
        );
      })}

      <button
        type="button"
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        aria-label="Next page"
        className={`${btnBase} ${sz.btn} ${page === totalPages ? "opacity-50 cursor-not-allowed bg-white/40 border-slate-100" : "bg-white hover:bg-slate-50"}`}
      >
        <ChevronRight size={sz.icon} />
      </button>

      {showFirstLast && (
        <button
          type="button"
          onClick={() => onChange(totalPages)}
          disabled={page === totalPages}
          aria-label="Last page"
          className={`${btnBase} ${sz.btn} ${page === totalPages ? "opacity-50 cursor-not-allowed bg-white/40 border-slate-100" : "bg-white hover:bg-slate-50"}`}
        >
          <ChevronsRight size={sz.icon} />
        </button>
      )}

      <div className="ml-2 text-sm text-slate-500 hidden sm:inline">
        Page <strong className="text-slate-700 mx-1">{page}</strong> of {totalPages}
      </div>
    </nav>
  );
}
