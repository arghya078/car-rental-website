import React, { useEffect, useRef, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Carousel({
  slides = [],
  interval = 4000,
  height = "h-64 sm:h-96",
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const timerRef = useRef(null);
  const isPausedRef = useRef(false);
  const containerRef = useRef(null);

  const normalized = slides.map((s) =>
    typeof s === "string" ? { src: s } : { src: s.src, title: s.title, subtitle: s.subtitle }
  );

  
  const prev = useCallback(() => {
    setCurrentIndex((p) => (p === 0 ? normalized.length - 1 : p - 1));
  }, [normalized.length]);

  const next = useCallback(() => {
    setCurrentIndex((p) => (p === normalized.length - 1 ? 0 : p + 1));
  }, [normalized.length]);

  // autoplay
  useEffect(() => {
    if (!normalized.length) return;
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      if (isPausedRef.current) return;
      setCurrentIndex((prevIndex) =>
        prevIndex === normalized.length - 1 ? 0 : prevIndex + 1
      );
    }, interval);

    return () => clearInterval(timerRef.current);
  }, [normalized.length, interval]);

  // keyboard support
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prev, next]); // ✅ added deps

  // touch swipe support
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let startX = 0;
    let moved = false;

    const onTouchStart = (e) => {
      startX = e.touches?.[0]?.clientX ?? 0;
      moved = false;
      isPausedRef.current = true;
    };
    const onTouchMove = (e) => {
      const x = e.touches?.[0]?.clientX ?? 0;
      if (Math.abs(x - startX) > 10) moved = true;
    };
    const onTouchEnd = (e) => {
      isPausedRef.current = false;
      if (!moved) return;
      const endX = e.changedTouches?.[0]?.clientX ?? 0;
      const dx = endX - startX;
      if (dx > 40) prev();
      else if (dx < -40) next();
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: true });
    el.addEventListener("touchend", onTouchEnd);

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [prev, next]); // ✅ added deps

  const goTo = (index) => setCurrentIndex(index);

  const handleMouseEnter = () => {
    isPausedRef.current = true;
  };
  const handleMouseLeave = () => {
    isPausedRef.current = false;
  };

  if (!normalized.length) return null;

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-5xl mx-auto overflow-hidden rounded-xl shadow-lg"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Slides */}
      <div className={`relative ${height}`}>
        {normalized.map((slide, idx) => (
          <div
            key={idx}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              idx === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
            }`}
          >
            <img
              src={slide.src}
              alt={slide.title || `Slide ${idx + 1}`}
              className="w-full h-full object-cover"
              loading="lazy"
              draggable={false}
            />
            {(slide.title || slide.subtitle) && (
              <div className="absolute left-4 bottom-6 right-4 sm:left-8 sm:bottom-10 max-w-xl">
                <div className="bg-gradient-to-r from-black/60 via-black/30 to-transparent rounded p-4">
                  {slide.title && (
                    <div className="text-white text-lg font-semibold">{slide.title}</div>
                  )}
                  {slide.subtitle && (
                    <div className="text-white text-sm mt-1 opacity-90">{slide.subtitle}</div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Prev */}
      <button
        onClick={prev}
        className="absolute top-1/2 left-3 -translate-y-1/2 z-30 bg-white/90 hover:bg-white text-slate-800 p-3 rounded-full shadow-lg transition focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      {/* Next */}
      <button
        onClick={next}
        className="absolute top-1/2 right-3 -translate-y-1/2 z-30 bg-white/90 hover:bg-white text-slate-800 p-3 rounded-full shadow-lg transition focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-40">
        {normalized.map((_, idx) => (
          <button
            key={idx}
            onClick={() => goTo(idx)}
            className={`h-3 w-3 rounded-full transition ${
              idx === currentIndex ? "bg-indigo-600" : "bg-gray-300"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
