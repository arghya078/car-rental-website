import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Modal({
  isOpen = false,
  onClose = () => {},
  title = "",
  children,
}) {
  const dialogRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // store previously focused element to restore focus on close
  const previouslyFocused = useRef(null);

  useEffect(() => {
    if (isOpen) {
      previouslyFocused.current = document.activeElement;
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const onKey = (e) => {
      if (e.key === "Escape") {
        onCloseRef.current();
      }
      // simple focus trap: if tabbing from last element, loop to first
      if (e.key === "Tab") {
        const el = dialogRef.current;
        if (!el) return;
        const focusable = Array.from(
          el.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          )
        ).filter((n) => !n.hasAttribute("disabled"));

        if (focusable.length === 0) {
          e.preventDefault();
          return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        } else if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      }
    };

    document.addEventListener("keydown", onKey);

    // lock scroll
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // focus first focusable element after next frame
    const timer = requestAnimationFrame(() => {
      const el = dialogRef.current;
      if (!el) return;
      const focusable = el.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      (focusable || el).focus();
    });

    return () => {
      cancelAnimationFrame(timer);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      // restore previous focus
      try {
        previouslyFocused.current?.focus?.();
      } catch (e) {
        console.error(e);
      }
    };
  }, [isOpen]);

  const onOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onCloseRef.current();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          onClick={onOverlayClick}
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1 },
          }}
        >
          {/* overlay */}
          <motion.div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* modal panel */}
          <motion.div
            ref={dialogRef}
            className="relative z-10 w-full max-w-2xl bg-white rounded-lg shadow-lg ring-1 ring-slate-200 p-4 focus:outline-none"
            tabIndex={-1}
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 10 }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
          >
            <div className="flex items-start justify-between gap-4">
              <h3 id="modal-title" className="text-lg font-medium">
                {title}
              </h3>

              <button
                onClick={() => onCloseRef.current()}
                aria-label="Close"
                className="ml-auto text-slate-500 hover:text-slate-700 rounded p-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 8.586l4.95-4.95a1 1 0 111.414 1.414L11.414 10l4.95 4.95a1 1 0 01-1.414 1.414L10 11.414l-4.95 4.95a1 1 0 01-1.414-1.414L8.586 10 3.636 5.05A1 1 0 015.05 3.636L10 8.586z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>

            <div className="mt-3">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
