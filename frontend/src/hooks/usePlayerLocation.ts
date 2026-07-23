"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export interface PlayerLocation {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
}

interface UsePlayerLocationReturn {
  location: PlayerLocation | null;
  error: string | null;
  isTracking: boolean;
  permissionState: PermissionState | null;
  startTracking: () => void;
  stopTracking: () => void;
  simulateLocation: (lat: number, lng: number) => void;
}

const GPS_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 5000,
};

export function usePlayerLocation(
  simulated = false
): UsePlayerLocationReturn {
  const [location, setLocation] = useState<PlayerLocation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [permissionState, setPermissionState] = useState<PermissionState | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const onSuccess = useCallback((pos: GeolocationPosition) => {
    setLocation({
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      accuracy: pos.coords.accuracy,
      timestamp: pos.timestamp,
    });
    setError(null);
  }, []);

  const onError = useCallback((err: GeolocationPositionError) => {
    const messages: Record<number, string> = {
      1: "Location permission denied. Please enable GPS in your browser settings.",
      2: "Location unavailable. Check your GPS signal.",
      3: "Location request timed out. Try moving to an open area.",
    };
    setError(messages[err.code] || "Unknown location error");
    setIsTracking(false);
  }, []);

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser.");
      return;
    }
    setIsTracking(true);
    watchIdRef.current = navigator.geolocation.watchPosition(
      onSuccess,
      onError,
      GPS_OPTIONS
    );
  }, [onSuccess, onError]);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
  }, []);

  const simulateLocation = useCallback((lat: number, lng: number) => {
    setLocation({ lat, lng, accuracy: 5, timestamp: Date.now() });
    setError(null);
  }, []);

  // Check permission state
  useEffect(() => {
    if (!navigator.permissions) return;
    navigator.permissions.query({ name: "geolocation" }).then((status) => {
      setPermissionState(status.state);
      status.onchange = () => setPermissionState(status.state);
    });
  }, []);

  // Auto-start if not simulated
  useEffect(() => {
    if (!simulated) {
      startTracking();
    }
    return () => stopTracking();
  }, [simulated]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    location,
    error,
    isTracking,
    permissionState,
    startTracking,
    stopTracking,
    simulateLocation,
  };
}
