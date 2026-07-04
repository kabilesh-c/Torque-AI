import type { Metadata } from "next";
import { Inter, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Torque AI — AI Voice Interview Practice",
  description: "Practice real interviews with an AI interviewer that listens, probes, and pushes back. Get structured feedback after every session.",
  keywords: ["AI interview", "mock interview", "behavioral interview", "interview practice", "career prep"],
  authors: [{ name: "Torque AI" }],
  openGraph: {
    title: "Torque AI — AI Voice Interview Practice",
    description: "Practice real interviews with an AI that listens, probes, and gives detailed feedback.",
    type: "website",
    images: ["/logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${geist.variable} ${geistMono.variable} antialiased`}
        style={{ background: "var(--bg)", color: "var(--text-primary)" }}
      >
        {children}
      </body>
    </html>
  );
}
