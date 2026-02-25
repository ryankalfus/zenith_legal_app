import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Zenith Legal Admin",
  description: "Recruiter/admin console for Zenith Legal Candidate Portal"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
