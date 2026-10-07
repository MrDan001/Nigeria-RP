import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nigerian Roleplay Simulator",
  description: "Backend and operations portal foundation for NRS.",
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
