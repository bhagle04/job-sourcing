import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Job Sourcing",
  description: "Personal CRM and opportunity tracker",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
