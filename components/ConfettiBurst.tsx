"use client";

import { useMemo } from "react";
import type { CSSProperties } from "react";

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

export default function ConfettiBurst() {
  const pieces = useMemo(() => {
    return Array.from({ length: 26 }, (_, i) => ({
      id: i,
      x: rand(-55, 55),
      rot: rand(-120, 120),
      delay: rand(0, 0.2),
      hue: rand(15, 40),
      dur: rand(1.2, 1.75)
    }));
  }, []);

  type CSSVars = CSSProperties & Record<`--${string}`, string>;

  return (
    <div className="pointer-events-none fixed inset-0">
      <style>{`
        @keyframes confetti {
          0% { transform: translate(calc(-50% + var(--x)), -10%) rotate(0deg); opacity: 0; }
          8% { opacity: 1; }
          100% { transform: translate(calc(-50% + var(--x)), 120%) rotate(720deg); opacity: 0; }
        }
      `}</style>
      {pieces.map((p) => {
        const style: CSSVars = {
          left: "50%",
          top: "10%",
          background: `hsl(${p.hue} 85% 55%)`,
          animationDelay: `${p.delay}s`,
          animationDuration: `${p.dur}s`,
          "--x": `${p.x}px`
        };

        return (
          <div
            key={p.id}
            style={style}
            className="absolute h-2 w-3 rounded-sm opacity-0 [animation-name:confetti] [animation-timing-function:cubic-bezier(.2,.8,.2,1)] [animation-fill-mode:forwards]"
          />
        );
      })}
    </div>
  );
}
