import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';

export default function RatingBoxes({ value = 0, onChange, disabled = false }) {
  const [hover, setHover] = useState(0);
  const buttonsRef = useRef([]);
  const boxes = Array.from({ length: 10 }, (_, i) => i + 1);

  useEffect(() => {
    // keep hover cleared when value changes externally
    setHover(0);
  }, [value]);

  const colorClassesFor = (n) => {
    if (n <= 3) {
      return {
        bg: 'bg-red-600',
        border: 'border-red-600',
        text: 'text-white',
        ring: 'focus:ring-red-300',
      };
    } else if (n <= 7) {
      return {
        bg: 'bg-yellow-400',
        border: 'border-yellow-400',
        text: 'text-black',
        ring: 'focus:ring-yellow-200',
      };
    } else {
      return {
        bg: 'bg-emerald-600',
        border: 'border-emerald-600',
        text: 'text-white',
        ring: 'focus:ring-emerald-300',
      };
    }
  };

  const handleKeyNav = (e, index) => {
    if (disabled) return;

    const currentPreview = hover || value || 0;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      const next = Math.min(10, currentPreview + 1);
      setHover(next);
      buttonsRef.current[next - 1]?.focus();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      const prev = Math.max(1, currentPreview - 1);
      setHover(prev);
      buttonsRef.current[prev - 1]?.focus();
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const pick = hover || index || value;
      if (!disabled && typeof onChange === 'function') onChange(pick);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.98 },
    show: { opacity: 1, scale: 1, transition: { staggerChildren: 0.02 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 6 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 500, damping: 30 } },
  };

  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex flex-col p-3 rounded-xl bg-white/60 backdrop-blur-sm shadow-sm">
        <label className="text-sm font-medium text-gray-700 mb-2">Rate (1–10)</label>

        <motion.div
          className="flex flex-wrap gap-2 p-2 rounded-md"
          role="radiogroup"
          aria-label="Rating 1 to 10"
          onMouseLeave={() => setHover(0)}
          initial="hidden"
          animate="show"
          variants={containerVariants}
        >
          {boxes.map((n) => {
            const isSelected = value > 0 && n <= value;
            const isHovered = hover > 0 && n <= hover;
            const isActive = hover > 0 ? isHovered : isSelected;

            const scheme = colorClassesFor(n);

            const base =
              'w-10 h-10 rounded-lg flex items-center justify-center text-sm font-semibold border shadow-sm transition-all select-none';
            const inactive = 'bg-white text-gray-700 border-gray-200 hover:scale-105';
            const active = `${scheme.bg} ${scheme.text} ${scheme.border} shadow-md scale-110`;
            const focusClasses = `focus:outline-none focus-visible:ring-2 ${scheme.ring}`;

            return (
              <motion.button
                key={n}
                ref={(el) => (buttonsRef.current[n - 1] = el)}
                type="button"
                role="radio"
                aria-checked={value === n}
                tabIndex={disabled ? -1 : 0}
                aria-label={`${n} out of 10`}
                onClick={() => !disabled && onChange && onChange(n)}
                onMouseEnter={() => !disabled && setHover(n)}
                onFocus={() => !disabled && setHover(n)}
                onBlur={() => !disabled && setHover(0)}
                onKeyDown={(e) => handleKeyNav(e, n)}
                className={`${base} ${isActive ? active : inactive} ${focusClasses} ${
                  disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                }`}
                disabled={disabled}
                variants={itemVariants}
                whileHover={{ scale: disabled ? 1 : 1.08 }}
                whileTap={{ scale: disabled ? 1 : 0.98 }}
                aria-disabled={disabled}
              >
                <span className="pointer-events-none">{n}</span>
              </motion.button>
            );
          })}
        </motion.div>

        <div className="mt-2 text-sm text-gray-600">
          <AnimatePresence mode="wait">
            {hover > 0 ? (
              <motion.div
                key={`preview-${hover}`}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18 }}
                className="inline-flex items-center gap-2"
              >
                <strong className="text-gray-800">{hover}</strong>
                <span className="text-gray-500">/10</span>
                <span className="text-xs text-gray-400">(preview)</span>
              </motion.div>
            ) : value > 0 ? (
              <motion.div
                key={`value-${value}`}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18 }}
                className="inline-flex items-center gap-2"
              >
                <strong className="text-gray-800">{value}</strong>
                <span className="text-gray-500">/10</span>
              </motion.div>
            ) : (
              <motion.div
                key="none"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18 }}
                className="text-gray-500"
              >
                No rating
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

RatingBoxes.propTypes = {
  value: PropTypes.number,
  onChange: PropTypes.func,
  disabled: PropTypes.bool,
};
