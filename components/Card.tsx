export default function Card({
  children,
  className = ""
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        "rounded-2xl border border-[color:var(--line)] bg-[color:var(--card)] p-5 shadow-soft backdrop-blur",
        className
      ].join(" ")}
    >
      {children}
    </div>
  );
}

