import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CCGP — Cyber Complaint Governance Platform",
  description: "Enterprise AI Cyber Complaint Classification & Governance Platform for State Cyber Cells",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-cyber-bg text-cyber-text antialiased">
          {children}
        </div>
      </body>
    </html>
  );
}
