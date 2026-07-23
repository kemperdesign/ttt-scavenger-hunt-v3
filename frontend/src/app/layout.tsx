import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { AccessibilityProvider } from "@/context/AccessibilityContext";
import "@/styles/globals.css";
import "@/styles/accessibility.css";
import "@/styles/map-themes.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: {
    default: "St. Augustine TimeQuest",
    template: "%s | TimeQuest",
  },
  description:
    "Explore St. Augustine's 450+ years of history through a mobile adventure game. Solve puzzles, discover hidden sites, and chat with AI historians.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "TimeQuest",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "St. Augustine TimeQuest",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#c9973a",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').catch(console.error);
                });
              }
            `,
          }}
        />
      </head>
      <body className="bg-slate-950 text-slate-100 min-h-screen antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-amber-500 focus:text-slate-900 focus:rounded focus:font-bold"
        >
          Skip to main content
        </a>
        <AccessibilityProvider>
          <main id="main-content">{children}</main>
        </AccessibilityProvider>
      </body>
    </html>
  );
}
