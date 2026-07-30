"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { logout } from "@/lib/api";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/adventures", label: "Adventures", icon: "🗺" },
  { href: "/admin/characters", label: "AI Characters", icon: "🎭" },
  { href: "/admin/submissions", label: "Photo Reviews", icon: "📸" },
  { href: "/admin/analytics", label: "Analytics", icon: "📈" },
  { href: "/admin/users", label: "Users", icon: "👤" },
  { href: "/admin/sources", label: "Source Register", icon: "📚" },
  { href: "/admin/audit-log", label: "Audit Log", icon: "📋" },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      localStorage.removeItem("tq_access_token");
      localStorage.removeItem("tq_refresh_token");
      router.push("/admin/login");
    }
  };

  const navContent = (
    <>
      <div className="mb-8 px-2">
        <p className="text-amber-400 font-bold text-sm">⏳ TimeQuest</p>
        <p className="text-slate-500 text-xs mt-0.5">Admin Portal</p>
      </div>

      <ul className="space-y-1 flex-1" role="list">
        {NAV.map(({ href, label, icon }) => {
          const active = pathname === href || (href !== "/admin" && pathname.startsWith(href));
          return (
            <li key={href}>
              <Link
                href={href}
                onClick={() => setMobileNavOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors min-h-[44px] focus-visible:outline-amber-500 ${
                  active
                    ? "bg-amber-900/30 text-amber-400"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
                aria-current={active ? "page" : undefined}
              >
                <span aria-hidden="true">{icon}</span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>

      <button
        onClick={handleLogout}
        disabled={loggingOut}
        className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-slate-500 hover:text-white hover:bg-slate-800 transition-colors min-h-[44px] focus-visible:outline-amber-500"
      >
        <span aria-hidden="true">🚪</span>
        {loggingOut ? "Logging out…" : "Logout"}
      </button>
    </>
  );

  if (pathname === "/admin/login") {
    return <main className="min-h-screen bg-slate-950 flex flex-col">{children}</main>;
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row">
      {/* Mobile top bar */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800 sticky top-0 z-30">
        <button
          onClick={() => setMobileNavOpen(true)}
          aria-label="Open navigation menu"
          className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-300 hover:text-white -ml-2"
        >
          <span aria-hidden="true" className="text-xl">☰</span>
        </button>
        <p className="text-amber-400 font-bold text-sm">⏳ TimeQuest Admin</p>
        <Link
          href="/admin"
          aria-label="Go to dashboard"
          className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-300 hover:text-white -mr-2"
        >
          <span aria-hidden="true" className="text-xl">🏠</span>
        </Link>
      </div>

      {/* Mobile nav overlay */}
      {mobileNavOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 z-40"
          onClick={() => setMobileNavOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar (persistent on desktop, slide-in drawer on mobile) */}
      <nav
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 md:w-56 bg-slate-900 border-r border-slate-800 flex flex-col py-6 px-3 shrink-0 transform transition-transform duration-200 md:transform-none ${
          mobileNavOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
        aria-label="Admin navigation"
      >
        <button
          onClick={() => setMobileNavOpen(false)}
          aria-label="Close navigation menu"
          className="md:hidden self-end min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-white mb-2"
        >
          <span aria-hidden="true">✕</span>
        </button>
        {navContent}
      </nav>

      {/* Main content */}
      <main id="main-content" className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
