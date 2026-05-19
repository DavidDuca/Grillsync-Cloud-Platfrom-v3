import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "GrillSync Cloud — Multi-branch restaurant control",
  description: "Cloud dashboard for restaurant owners managing multiple branches.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-bg text-text antialiased">{children}</body>
    </html>
  );
}
