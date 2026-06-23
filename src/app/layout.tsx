import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppShell } from "@/components/AppShell";

// KAIZEN.SYS brand — new transparent logo served via Cloudinary CDN with
// on-the-fly resize + obsidian background fills for browser icons/favicons.
// The raw transparent URL is used for in-app rendering (IntroLoader, auth pages, etc).
const CDN     = "https://res.cloudinary.com/dm3ly5gy3/image/upload";
const LOGO_ID = "v1782206540/64b78c57-c362-44cf-ab86-b7e4ba62ba98.png";
// Padded on obsidian for crisp favicon & apple-touch-icon at every size
const ICON_16  = CDN + "/w_16,h_16,c_pad,b_rgb:050505/"   + LOGO_ID;
const ICON_32  = CDN + "/w_32,h_32,c_pad,b_rgb:050505/"   + LOGO_ID;
const ICON_180 = CDN + "/w_180,h_180,c_pad,b_rgb:050505/" + LOGO_ID;
const ICON_192 = CDN + "/w_192,h_192,c_pad,b_rgb:050505/" + LOGO_ID;
const ICON_512 = CDN + "/w_512,h_512,c_pad,b_rgb:050505/" + LOGO_ID;

export const metadata: Metadata = {
  title: "KAIZEN - Discipline builds your future",
  description:
    "A 30-day execution system for Intermediate and Engineering students.",
  applicationName: "KAIZEN",
  authors: [{ name: "KAIZEN" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "KAIZEN",
    startupImage: [
      { url: ICON_512, media: "(device-width: 430px) and (device-height: 932px)" },
      { url: ICON_512, media: "(device-width: 393px) and (device-height: 852px)" },
      { url: ICON_512, media: "(device-width: 390px) and (device-height: 844px)" },
      { url: ICON_512 }
    ]
  },
  formatDetection: { telephone: false, email: false, address: false },
  icons: {
    icon: [
      { url: ICON_192, sizes: "192x192", type: "image/png" },
      { url: ICON_512, sizes: "512x512", type: "image/png" }
    ],
    apple: [
      { url: ICON_180, sizes: "180x180", type: "image/png" }
    ]
  },
  openGraph: {
    title: "KAIZEN",
    description: "Discipline builds your future. The 30-day path.",
    type: "website"
  },
  robots: { index: true, follow: true }
};

export const viewport: Viewport = {
  themeColor: "#050505",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover"
};

import { Toaster } from "sonner";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="KAIZEN" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="msapplication-TileColor" content="#050505" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="HandheldFriendly" content="true" />
        <meta name="MobileOptimized" content="320" />
        <link rel="apple-touch-icon" sizes="180x180" href={ICON_180} />
        <link rel="icon" type="image/png" sizes="32x32" href={ICON_32} />
        <link rel="icon" type="image/png" sizes="16x16" href={ICON_16} />
        <script src="https://checkout.razorpay.com/v1/checkout.js" async></script>
      </head>
      <body className="text-white antialiased">
        <AppShell>{children}</AppShell>
        <Toaster theme="dark" position="bottom-right" />
      </body>
    </html>
  );
}

