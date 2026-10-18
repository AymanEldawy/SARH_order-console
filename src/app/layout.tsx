import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SARH Orders Console",
  description: "Operations console for high-scale order management and duplicate prevention",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
