"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function BottomNav() {
  const pathname = usePathname();

  const tabs = [
    {
      href: "/",
      label: "Home",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      ),
    },
    {
      href: "/wine-passport",
      label: "Wine",
      icon: (
        <span className="text-[20px] leading-none mb-0.5">🍷</span>
      ),
    },
    {
      href: "/missions",
      label: "Missions",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <circle cx="12" cy="12" r="6"/>
          <circle cx="12" cy="12" r="2"/>
        </svg>
      ),
    },
    {
      href: "https://www.thetastingtours.com/st-augustine-food-tours.html",
      label: "Join",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
      ),
    },
    {
      href: "/profile",
      label: "Profile",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      ),
    },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 flex items-center bg-white shadow-[0_-4px_12px_rgba(0,0,0,0.05)] border-t border-gray-100"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)", zIndex: 50 }}
      aria-label="Main navigation"
    >
      {tabs.map((tab) => {
        const isActive = pathname === tab.href || (tab.href !== "/" && pathname.startsWith(tab.href));
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="flex-1 flex flex-col items-center justify-center py-3 min-h-[64px] text-[11px] font-bold transition-colors gap-1"
            style={{ color: isActive ? "#d2753b" : "#6b7280" }}
            aria-current={isActive ? "page" : undefined}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
