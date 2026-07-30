"use client";

import React, { useState, useEffect } from "react";
import { SplashScreen } from "./SplashScreen";
import { OnboardingScreen } from "./OnboardingScreen";
import { AuthScreen } from "./AuthScreen";

type FlowState = "loading" | "splash" | "onboarding" | "auth" | "app";

export function ClientAuthWrapper({ children }: { children: React.ReactNode }) {
  const [flowState, setFlowState] = useState<FlowState>("loading");

  useEffect(() => {
    // Determine initial state based on storage
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    const hasSeenOnboarding = localStorage.getItem("hasSeenOnboarding");
    const hasSeenSplash = sessionStorage.getItem("hasSeenSplash");

    if (isLoggedIn === "true") {
      setFlowState("app");
    } else if (hasSeenOnboarding === "true") {
      setFlowState("auth");
    } else if (hasSeenSplash === "true") {
      setFlowState("onboarding");
    } else {
      setFlowState("splash");
    }
  }, []);

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
      localStorage.setItem("hasSeenOnboarding", "true");
      setFlowState("auth");
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
