"use client";

import React, { useState, useEffect } from "react";
import { SplashScreen } from "./SplashScreen";
import { OnboardingScreen } from "./OnboardingScreen";
import { AuthScreen } from "./AuthScreen";

type FlowState = "loading" | "splash" | "onboarding" | "auth" | "app";

export function ClientAuthWrapper({ children }: { children: React.ReactNode }) {
  const [flowState, setFlowState] = useState<FlowState>("loading");

  useEffect(() => {
    // Only preserve login state across reloads.
    // Force splash and onboarding every time the app loads.
    const isLoggedIn = localStorage.getItem("isLoggedIn");

    if (isLoggedIn === "true") {
      // Actually, wait, if they are logged in, does the user still want to see the splash and onboarding?
      // "EVERYTIME I REFESH THE APP HOME PAGE I WANT TO SEE THE SPLASH SCREEN AGAIN AND ENABLE NOTIFICATIONS AND LOCATION"
      // If we jump straight to "app" when logged in, they WON'T see splash/onboarding when they refresh.
      // So we MUST start at "splash" unconditionally!
      setFlowState("splash");
    } else {
      setFlowState("splash");
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
