import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AC-34 Matiala — SIR 2026 Hearing & Notice Dashboard",
  description:
    "Officer-wise and PS-wise hearing notice tracking for AC-34 Matiala, SIR 2026.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-paper text-ink">{children}</body>
    </html>
  );
}
