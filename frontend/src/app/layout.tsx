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
              ${process.env.NEXT_PUBLIC_SENTRY_DSN ? `
              (function(){
                var dsn="${process.env.NEXT_PUBLIC_SENTRY_DSN}";
                window.addEventListener('error',function(e){
                  try{var u=new URL(dsn),k=u.username,p=u.pathname.replace('/',''),h=u.hostname;
                  var ep='https://'+h+'/api/'+p+'/envelope/';
                  var env=JSON.stringify({sdk:{name:'sentry.javascript.browser'}})+'\n'+JSON.stringify({type:'event'})+'\n'+JSON.stringify({message:e.message,level:'error',request:{url:location.href},timestamp:Date.now()/1000});
                  if(navigator.sendBeacon)navigator.sendBeacon(ep,new Blob([env],{type:'application/x-sentry-envelope'}));
                  }catch(ex){}
                });
              })();` : ""}
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
