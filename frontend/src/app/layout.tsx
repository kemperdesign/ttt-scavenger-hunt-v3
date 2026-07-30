import type { Metadata, Viewport } from "next";
import { Playfair_Display, Work_Sans } from "next/font/google";
import { AccessibilityProvider } from "@/context/AccessibilityContext";
import { BottomNav } from "@/components/player/BottomNav";
import "@/styles/globals.css";
import "@/styles/accessibility.css";
import "@/styles/map-themes.css";

const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair", weight: ["700", "800"] });
const workSans = Work_Sans({ subsets: ["latin"], variable: "--font-work-sans", weight: ["400", "500", "600", "700"] });

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
  themeColor: "#1B4A4A",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${workSans.variable}`}>
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
              ${process.env.NEXT_PUBLIC_POSTHOG_KEY ? `
              !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]);t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.async=!0,p.src=s.api_host+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+" (stub)"},o="capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures getActiveMatchingSurveys getSurveys onSessionId".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
              posthog.init("${process.env.NEXT_PUBLIC_POSTHOG_KEY}",{api_host:"${process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://app.posthog.com"}",loaded:function(p){if(window.location.hostname==="localhost")p.opt_out_capturing()}});
              ` : ""}
            `,
          }}
        />
      </head>
      <body className="min-h-screen antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-amber-500 focus:text-slate-900 focus:rounded focus:font-bold"
        >
          Skip to main content
        </a>
        <AccessibilityProvider>
          <main id="main-content">{children}</main>
          <BottomNav />
        </AccessibilityProvider>
      </body>
    </html>
  );
}
