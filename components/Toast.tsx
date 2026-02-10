"use client";

import { useEffect } from "react";

export default function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 1600);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="fixed bottom-24 left-0 right-0 mx-auto max-w-md px-4">
      <div className="rounded-2xl border border-[color:var(--line)] bg-white/85 px-4 py-3 text-center text-sm shadow-soft backdrop-blur">
        {message}
      </div>
    </div>
  );
}

