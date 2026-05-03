import type { Metadata, Viewport } from "next";
import "./globals.css";
import { IntroLoader } from "@/components/IntroLoader";
import { BottomNavGate } from "@/components/BottomNavGate";
import { ServiceWorkerRegistrar } from "@/components/ServiceWorkerRegistrar";
import { InstallPrompt } from "@/components/InstallPrompt";

export const metadata: Metadata = {
  title: "KAIZEN - Discipline builds your future",
  description:
    "A structured 30-day system for Intermediate and Engineering students to become industry-ready.",
  applicationName: "KAIZEN",
  authors: [{ name: "KAIZEN" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "KAIZEN",
    startupImage: ["/icon-512.png"]
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" }
    ],
    apple: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" }
    ]
  },
  openGraph: {
    title: "KAIZEN",
    description:
      "Discipline builds your future. The 30-day path for Intermediate and Engineering students.",
    type: "website"
  },
  robots: { index: true, follow: true }
};

export const viewport: Viewport = {
  themeColor: "#050505",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: false,
  viewportFit: "cover"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="KAIZEN" />
      </head>
      <body className="min-h-screen bg-obsidian text-white antialiased">
        <IntroLoader />
        {children}
        <BottomNavGate />
        <InstallPrompt />
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
