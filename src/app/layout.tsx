// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ReduxProvider from "@/providers/ReduxProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ConstructPro ERP | Construction Operations Platform",
  description:
    "ConstructPro ERP unifies leads, quotations, projects, finance, documents, analytics, and AI-powered risk prediction into a single secure platform designed for construction operations.",
  keywords: [
    "construction ERP",
    "project management",
    "construction software",
    "Ishara Homes",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased scroll-smooth`}
      data-scroll-behavior="smooth"
    >
      <body className="min-h-full flex flex-col bg-surface-bg text-on-background">
        <ReduxProvider>{children}</ReduxProvider>
      </body>
    </html>
  );
}
