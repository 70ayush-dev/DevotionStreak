import BottomNav from "@/components/BottomNav";
import EnsureAuth from "@/components/EnsureAuth";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <EnsureAuth>
      <div className="mx-auto min-h-[100dvh] max-w-md px-4 pb-24 pt-6 safe-bottom">
        {children}
      </div>
      <BottomNav />
    </EnsureAuth>
  );
}
