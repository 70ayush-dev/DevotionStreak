import type { Metadata } from "next";
import "@/styles/globals.css";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import AuthBootstrap from "@/components/AuthBootstrap";

export const metadata: Metadata = {
  title: "11×11 Challenge",
  description: "11 Hanuman Chalisa recitations per day for 11 consecutive days.",
  manifest: "/manifest.json"
};

export const viewport = {
  themeColor: "#8a1f1a"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <ServiceWorkerRegister />
        <AuthBootstrap />
        {children}
      </body>
    </html>
  );
}
