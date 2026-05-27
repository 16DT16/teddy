import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Teddy Menafesha",
  description: "Gojo/home ordering and billing system"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
