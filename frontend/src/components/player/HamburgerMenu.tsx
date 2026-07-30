"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function HamburgerMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const links = [
    { href: "/restaurants", label: "Restaurants & Dining" },
    { href: "/restrooms", label: "Public Restrooms" },
    { href: "/parking", label: "Parking Guide" },
    { href: "/wine-passport", label: "Wine Passport" },
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/terms", label: "Terms of Service" },
  ];

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="w-10 h-10 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-md text-white border border-white/30 shadow-sm"
        aria-label="Open Menu"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Drawer */}
      <div 
        className={`fixed top-0 right-0 bottom-0 w-[280px] bg-[#F8F3ED] z-50 shadow-2xl transform transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-lg font-black text-[#11263c]">Explore</h2>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-2 text-gray-500 hover:text-gray-800 bg-gray-100 rounded-full"
            aria-label="Close Menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <nav className="p-4 space-y-1">
          {links.map(link => {
            const isActive = pathname === link.href;
            return (
              <Link 
                key={link.href} 
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`block px-4 py-3.5 rounded-xl font-bold text-sm transition-colors ${
                  isActive 
                    ? "bg-[#d2753b]/10 text-[#d2753b]" 
                    : "text-[#11263c] hover:bg-white"
                }`}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>

        <div className="absolute bottom-10 left-0 right-0 px-8">
          <p className="text-center text-xs font-bold text-gray-400">
            Powered by TimeQuest
          </p>
        </div>
      </div>
    </>
  );
}
