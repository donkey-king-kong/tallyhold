import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Tallyhold",
  description: "All your brokers. One portfolio.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
