"use client";

export function PrimaryButton({
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={[
        "h-14 w-full rounded-2xl bg-[color:var(--accent)] px-5 text-base font-semibold text-white shadow-soft",
        "active:scale-[0.98] disabled:opacity-60 disabled:active:scale-100",
        className
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={[
        "h-14 w-full rounded-2xl border border-[color:var(--line)] bg-white/70 px-5 text-base font-medium text-[color:var(--text)]",
        "active:scale-[0.98] disabled:opacity-60 disabled:active:scale-100",
        className
      ].join(" ")}
    >
      {children}
    </button>
  );
}

