"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

const MARQUEE_WORDS = ["The Tasting Tours", "Eat", "Drink", "Experience", "Explore"];

export function AuthScreen({ onComplete }: { onComplete: () => void }) {
  const [currentWord, setCurrentWord] = useState(0);

  useEffect(() => {
    document.body.style.overflow = "hidden";

    // Marquee interval
    const interval = setInterval(() => {
      setCurrentWord((prev) => (prev + 1) % MARQUEE_WORDS.length);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleSkip = () => {
    document.body.style.overflow = "";
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-[80] bg-black flex flex-col overflow-hidden">
      {/* Top Half: Image & Marquee */}
      <div className="relative flex-1 bg-[#d2753b]">
        {/* We can use one of the downloaded images from thetastingtours.com */}
        <Image
          src="/images/onboarding_bg_3.jpg"
          alt=""
          fill
          className="object-cover opacity-60 mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/10" />

        {/* Marquee Text */}
        <div className="absolute inset-0 flex flex-col justify-center overflow-hidden pt-12">
          <div className="flex flex-col items-center justify-center h-[250px] relative">
            {MARQUEE_WORDS.map((word, idx) => (
              <h1
                key={idx}
                className={`absolute w-full text-center text-5xl md:text-7xl font-black uppercase tracking-tighter text-white transition-all duration-700 ease-in-out ${
                  idx === currentWord
                    ? "opacity-100 translate-y-0 scale-100"
                    : idx < currentWord || (currentWord === 0 && idx === MARQUEE_WORDS.length - 1)
                    ? "opacity-0 -translate-y-20 scale-90"
                    : "opacity-0 translate-y-20 scale-90"
                }`}
                style={{ fontFamily: "var(--font-work-sans, sans-serif)", textShadow: "2px 4px 10px rgba(0,0,0,0.5)" }}
              >
                {word}
              </h1>
            ))}
          </div>
        </div>

        {/* Close/Back button placeholder (from mockup) */}
        <button className="absolute top-12 left-6 text-white p-2" onClick={handleSkip}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12"></path>
          </svg>
        </button>

        {/* Language selector (from mockup) */}
        <div className="absolute top-12 right-6">
          <span className="bg-white text-black px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm">
            🇺🇸 ▼
          </span>
        </div>
      </div>

      {/* Bottom Half: Login Card */}
      <div className="bg-white rounded-t-3xl -mt-6 relative z-10 p-8 flex flex-col pb-12 shadow-[0_-10px_40px_rgba(0,0,0,0.2)]">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Log In or Sign Up</h2>
        <p className="text-gray-600 mb-8 font-medium">
          To continue please log in or create a new The Tasting Tours account.
        </p>

        <button 
          onClick={handleSkip}
          className="w-full bg-[#d2753b] hover:bg-[#c2652b] text-white font-bold py-4 rounded-xl text-lg transition-colors mb-6 shadow-md"
        >
          Continue with phone number
        </button>

        <div className="flex justify-center gap-6 mb-8">
          <button onClick={handleSkip} className="w-14 h-14 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          </button>
          <button onClick={handleSkip} className="w-14 h-14 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#0088cc]">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
              <polyline points="22,6 12,13 2,6"></polyline>
            </svg>
          </button>
        </div>

        <div className="flex justify-center">
          <button onClick={handleSkip} className="text-gray-500 font-semibold underline underline-offset-4 hover:text-gray-700">
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}
