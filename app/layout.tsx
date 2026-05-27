import type { Metadata, Viewport } from "next";
import "./globals.css";
import { RegisterServiceWorker } from "@/components/RegisterServiceWorker";

export const metadata: Metadata = {
  title: "Teddy Menafesha Ordering",
  description: "Order food and drinks directly from your gojo.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Teddy Order",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: "/icons/icon-192.svg",
    apple: "/icons/icon-192.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#052e1a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="am">
      <body>
        <RegisterServiceWorker />
        {children}
      </body>
    </html>
  );
}