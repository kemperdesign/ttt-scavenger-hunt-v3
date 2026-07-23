"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AccessibilityPanel } from "./AccessibilityPanel";

export function AppFooter() {
  const [showA11y, setShowA11y] = useState(false);

  return (
    <>
      <footer className="py-4 px-4 border-t border-slate-800 text-center text-xs text-slate-500 space-y-2">
        <nav aria-label="Footer navigation">
          <ul className="flex justify-center gap-4 flex-wrap">
            <li>
              <Link
                href="/privacy"
                className="hover:text-slate-300 focus-visible:outline-amber-500 min-h-[44px] inline-flex items-center"
              >
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link
                href="/terms"
                className="hover:text-slate-300 focus-visible:outline-amber-500 min-h-[44px] inline-flex items-center"
              >
                Terms of Service
              </Link>
            </li>
            <li>
              <button
                onClick={() => setShowA11y(true)}
                className="hover:text-slate-300 focus-visible:outline-amber-500 min-h-[44px] inline-flex items-center"
                aria-label="Accessibility settings"
              >
                ♿ Accessibility
              </button>
            </li>
          </ul>
        </nav>
        <p>© {new Date().getFullYear()} St. Augustine TimeQuest. All rights reserved.</p>
      </footer>
      {showA11y && <AccessibilityPanel onClose={() => setShowA11y(false)} />}
    </>
  );
}
