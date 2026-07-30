"use client";

import { useEffect, useState } from "react";

export function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Only show once per session
    if (sessionStorage.getItem("hasSeenSplash") === "true") {
      setIsVisible(false);
      return;
    }

    // Prevent scrolling while splash screen is visible
    document.body.style.overflow = "hidden";

    // Show for 5 seconds, then fade out
    const fadeOutTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, 5000); 

    // Remove from DOM completely after fade out (5.5 seconds total)
    const removeTimer = setTimeout(() => {
      setIsVisible(false);
      sessionStorage.setItem("hasSeenSplash", "true");
      document.body.style.overflow = "";
    }, 5500); 

    return () => {
      clearTimeout(fadeOutTimer);
      clearTimeout(removeTimer);
      document.body.style.overflow = "";
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#d2753b] text-white transition-opacity duration-500 ${
        isFadingOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <div className="flex flex-col items-center justify-center animate-zoom-in px-6 w-full max-w-sm">
        
        {/* Tilted Logo Container */}
        <div className="flex flex-col w-full transform -rotate-3 mb-6 relative">
          <div className="w-full h-1.5 bg-white mb-2"></div>
          
          <div className="flex flex-col items-center font-black tracking-tighter" style={{ fontFamily: "var(--font-work-sans, sans-serif)" }}>
            <h1 className="text-[2.75rem] leading-none mb-1 text-center w-full">
              THE TASTING
            </h1>
            <h2 className="text-[3.5rem] leading-none text-center w-full">
              TOURS
            </h2>
          </div>
          
          {/* Registered Trademark symbol placeholder (optional) */}
          <span className="absolute top-4 -right-6 text-sm font-bold border-2 border-white rounded-full w-5 h-5 flex items-center justify-center">R</span>
          
          <div className="w-full h-1.5 bg-white mt-3"></div>
        </div>
        
        {/* Subtitle */}
        <p 
          className="text-lg md:text-xl font-bold tracking-widest text-center uppercase" 
          style={{ fontFamily: "var(--font-work-sans, sans-serif)", textShadow: "1px 1px 2px rgba(0,0,0,0.2)" }}
        >
          Eat - Drink - Experience
        </p>
      </div>
      
      {/* Inline styles for custom animation */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes zoom-in {
            0% { transform: scale(0.85); opacity: 0; }
            70% { transform: scale(1.05); opacity: 1; }
            100% { transform: scale(1); opacity: 1; }
          }
          .animate-zoom-in {
            animation: zoom-in 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
          }
        `
      }} />
    </div>
  );
}
