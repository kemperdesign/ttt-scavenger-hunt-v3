"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

const SLIDES = [
  {
    bgImage: "/images/onboarding_bg.jpg",
    icon: (
      <div className="flex gap-2 items-center mb-4">
        <span className="bg-white text-black px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm">
          🇺🇸 ▼
        </span>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white drop-shadow-md">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
          <circle cx="12" cy="10" r="3"></circle>
        </svg>
      </div>
    ),
    title: "Welcome to The Tasting Tours!",
    body: "As one of the world's top sources for things to do and team building, there's never a dull moment when you adventure with The Tasting Tours.",
    buttonText: "Continue"
  },
  {
    bgImage: "/images/onboarding_bg_2.jpg",
    icon: (
      <div className="mb-4">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white drop-shadow-md">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M12 8l4 8-4-2-4 2 4-8z" fill="white"></path>
        </svg>
      </div>
    ),
    title: "Discover local gems",
    body: "To guide you to the coolest nearby places and customize your experience, we'll need access to your location.",
    buttonText: "Enable location access"
  },
  {
    bgImage: "/images/onboarding_bg_3.jpg",
    icon: (
      <div className="mb-4">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white drop-shadow-md">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
      </div>
    ),
    title: "Stay updated on the go",
    body: "Grant us notification permissions to keep you informed about adventures near you, new features, and more.",
    buttonText: "Enable notifications"
  }
];

export function OnboardingScreen() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Only run on client
    const hasSeen = localStorage.getItem("hasSeenOnboarding");
    if (hasSeen !== "true") {
      setIsVisible(true);
      // Prevent scrolling while onboarding is active
      document.body.style.overflow = "hidden";
    }
  }, []);

  const handleNext = () => {
    if (currentStep === 1) {
      // In a real app, request geolocation here before moving on
      // navigator.geolocation.getCurrentPosition(...)
    }

    if (currentStep < SLIDES.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      // Finish onboarding
      localStorage.setItem("hasSeenOnboarding", "true");
      setIsVisible(false);
      document.body.style.overflow = "";
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[90] bg-black">
      {/* Background Images */}
      {SLIDES.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
            index === currentStep ? "opacity-100" : "opacity-0"
          }`}
        >
          <Image
            src={slide.bgImage}
            alt=""
            fill
            className="object-cover"
            priority={index === 0}
          />
          {/* Gradient overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20" />
        </div>
      ))}

      {/* Top Logo */}
      <div className="absolute top-12 left-0 right-0 z-10 flex justify-center px-4">
        <div className="flex flex-col items-center transform -rotate-2 relative w-max">
          <div className="w-full h-[3px] bg-[#d2753b] mb-1"></div>
          <div className="flex flex-col items-center font-black tracking-tighter text-[#d2753b]" style={{ fontFamily: "var(--font-work-sans, sans-serif)", textShadow: "1px 1px 0px rgba(0,0,0,0.3)" }}>
            <h1 className="text-3xl leading-none uppercase text-center w-full">
              THE TASTING
            </h1>
            <h2 className="text-4xl leading-none uppercase text-center w-full">
              TOURS
            </h2>
          </div>
          <span className="absolute top-1 -right-4 text-[10px] font-bold border border-[#d2753b] text-[#d2753b] rounded-full w-3 h-3 flex items-center justify-center">R</span>
          <div className="w-full h-[3px] bg-[#d2753b] mt-1.5"></div>
        </div>
      </div>

      {/* Content Area */}
      <div className="absolute bottom-0 left-0 right-0 z-10 p-6 flex flex-col pb-10">
        
        {SLIDES[currentStep].icon}
        
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight tracking-tight drop-shadow-md">
          {SLIDES[currentStep].title}
        </h2>
        
        <p className="text-[17px] leading-relaxed text-gray-200 mb-8 drop-shadow-md font-medium">
          {SLIDES[currentStep].body}
        </p>

        <button
          onClick={handleNext}
          className="w-full bg-[#d2753b] hover:bg-[#c2652b] text-white font-bold py-4 rounded-lg text-lg transition-colors shadow-lg active:scale-[0.98]"
        >
          {SLIDES[currentStep].buttonText}
        </button>

        {/* Pagination Dots */}
        <div className="flex justify-center gap-2 mt-6">
          {SLIDES.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentStep ? "bg-[#d2753b]" : "bg-gray-500/60"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
