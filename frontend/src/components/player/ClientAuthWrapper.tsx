"use client";

import React, { useState, useEffect } from "react";
import { SplashScreen } from "./SplashScreen";
import { OnboardingScreen } from "./OnboardingScreen";
import { AuthScreen } from "./AuthScreen";

type FlowState = "loading" | "splash" | "onboarding" | "auth" | "app";

export function ClientAuthWrapper({ children }: { children: React.ReactNode }) {
  const [flowState, setFlowState] = useState<FlowState>("loading");

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    const isHome = window.location.pathname === "/";

    if (isHome) {
      // If they hard refresh on the home page, always show splash -> onboarding
      setFlowState("splash");
    } else {
      // If they are deep-linked or navigated to a tour page, skip the intro if logged in
      if (isLoggedIn === "true") {
        setFlowState("app");
      } else {
        // If they aren't logged in and land on a tour, still force them through onboarding
        setFlowState("splash");
      }
    }
  }, []);

  // Scroll to top whenever the flow transitions to a new screen
  useEffect(() => {
    if (flowState !== "loading") {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
  }, [flowState]);

  if (flowState === "loading") {
    // Prevent Hydration mismatch by returning nothing or a loading state until client mount
    return (
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#d2753b]" />
    ); 
  }

  if (flowState === "splash") {
    return <SplashScreen onComplete={() => {
      sessionStorage.setItem("hasSeenSplash", "true");
      setFlowState("onboarding");
    }} />;
  }

  if (flowState === "onboarding") {
    return <OnboardingScreen onComplete={() => {
      if (localStorage.getItem("isLoggedIn") === "true") {
        setFlowState("app");
      } else {
        setFlowState("auth");
      }
    }} />;
  }

  if (flowState === "auth") {
    return <AuthScreen onComplete={() => {
      localStorage.setItem("isLoggedIn", "true");
      setFlowState("app");
    }} />;
  }

  // flowState === "app"
  return <>{children}</>;
}
