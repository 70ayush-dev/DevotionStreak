"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";

export default function BottomSheet({
  open,
  title,
  children,
  onClose
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            aria-label="Close"
            className="fixed inset-0 bg-black/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            className="fixed bottom-0 left-0 right-0 mx-auto max-w-md rounded-t-3xl border border-[color:var(--line)] bg-[color:var(--bg)] p-4 shadow-soft sheet-safe-bottom"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
          >
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-black/10" />
            <div className="mb-4 flex items-center justify-between">
              <div className="text-base font-semibold">{title}</div>
              <button
                onClick={onClose}
                className="h-11 w-11 rounded-xl border border-[color:var(--line)] bg-white/70 text-sm font-medium text-[color:var(--muted)] active:scale-[0.98]"
              >
                Close
              </button>
            </div>
            {children}
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}

