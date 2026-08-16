import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import SignOutButton from "@/components/SignOutButton";
import { Analytics } from "@vercel/analytics/react";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AAMU CS Degree Planner",
  description: "Plan your BS Computer Science path at Alabama A&M University",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="app-bg min-h-screen font-sans text-slate-800 antialiased">
        <SignOutButton />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
