"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AccessibilityPanel } from "./AccessibilityPanel";

export function AppFooter() {
  const [showA11y, setShowA11y] = useState(false);

  return (
    <>
      <footer
        className="py-4 px-4 text-center text-xs space-y-2 border-t"
        style={{ borderColor: "var(--color-border)", color: "var(--color-muted)" }}
      >
        <nav aria-label="Footer navigation">
          <ul className="flex justify-center gap-4 flex-wrap">
            <li>
              <Link
                href="/privacy"
                className="hover:underline min-h-[44px] inline-flex items-center"
                style={{ color: "var(--color-muted)" }}
              >
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link
                href="/terms"
                className="hover:underline min-h-[44px] inline-flex items-center"
                style={{ color: "var(--color-muted)" }}
              >
                Terms of Service
              </Link>
            </li>
            <li>
              <button
                onClick={() => setShowA11y(true)}
                className="hover:underline min-h-[44px] inline-flex items-center"
                style={{ color: "var(--color-muted)" }}
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
