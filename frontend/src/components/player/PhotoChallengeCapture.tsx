"use client";

import { useState, useRef, useCallback } from "react";
import { submitPhotoChallenge } from "@/lib/api";

interface PhotoChallengeCaptureProps {
  challengeId: string;
  sessionId: string;
  prompt: string;
  onSuccess: (pointsEarned: number) => void;
  onError?: (message: string) => void;
}

type CaptureState = "idle" | "preview" | "uploading" | "done" | "error";

export default function PhotoChallengeCapture({
  challengeId,
  sessionId,
  prompt,
  onSuccess,
  onError,
}: PhotoChallengeCaptureProps) {
  const [state, setState] = useState<CaptureState>("idle");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [pointsEarned, setPointsEarned] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      setErrorMsg("Please select an image file.");
      setState("error");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg("Image must be under 10 MB.");
      setState("error");
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setState("preview");
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleSubmit = useCallback(async () => {
    if (!previewUrl || state !== "preview") return;

    // Re-fetch the file from the input
    const input = fileInputRef.current ?? cameraInputRef.current;
    const file = input?.files?.[0];
    if (!file) return;

    setState("uploading");
    try {
      const result = await submitPhotoChallenge(challengeId, sessionId, file);
      setPointsEarned(result.points_earned ?? 0);
      setState("done");
      onSuccess(result.points_earned ?? 0);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Upload failed. Please try again.";
      setErrorMsg(msg);
      setState("error");
      onError?.(msg);
    }
  }, [challengeId, sessionId, previewUrl, state, onSuccess, onError]);

  const reset = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setState("idle");
    setErrorMsg("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  }, [previewUrl]);

  return (
    <section aria-labelledby="photo-challenge-heading" className="space-y-4">
      <h3 id="photo-challenge-heading" className="font-semibold text-white text-lg">
        📸 Photo Challenge
      </h3>
      <p className="text-slate-300 text-sm">{prompt}</p>

      {/* Idle — show capture options */}
      {state === "idle" && (
        <div className="grid grid-cols-2 gap-3">
          {/* Camera capture (mobile) */}
          <label className="flex flex-col items-center gap-2 bg-slate-700 hover:bg-slate-600 rounded-xl p-4 cursor-pointer transition-colors min-h-[44px] focus-within:ring-2 focus-within:ring-amber-400">
            <span className="text-2xl" aria-hidden="true">
              📷
            </span>
            <span className="text-sm text-white font-medium">Take Photo</span>
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="sr-only"
              onChange={handleInputChange}
              aria-label="Take a photo with camera"
            />
          </label>

          {/* File picker */}
          <label className="flex flex-col items-center gap-2 bg-slate-700 hover:bg-slate-600 rounded-xl p-4 cursor-pointer transition-colors min-h-[44px] focus-within:ring-2 focus-within:ring-amber-400">
            <span className="text-2xl" aria-hidden="true">
              🖼️
            </span>
            <span className="text-sm text-white font-medium">Choose File</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="sr-only"
              onChange={handleInputChange}
              aria-label="Choose an image from your device"
            />
          </label>
        </div>
      )}

      {/* Preview */}
      {state === "preview" && previewUrl && (
        <div className="space-y-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Photo preview — review before submitting"
            className="w-full rounded-xl object-cover max-h-64"
          />
          <div className="flex gap-3">
            <button
              onClick={reset}
              className="flex-1 py-3 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-700 transition-colors min-h-[44px] text-sm font-medium"
              aria-label="Retake or choose a different photo"
            >
              Retake
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold transition-colors min-h-[44px] text-sm"
              aria-label="Submit this photo"
            >
              Submit Photo
            </button>
          </div>
        </div>
      )}

      {/* Uploading */}
      {state === "uploading" && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center gap-3 bg-slate-700 rounded-xl p-4"
        >
          <span className="animate-spin text-xl" aria-hidden="true">
            ⏳
          </span>
          <span className="text-slate-300 text-sm">Uploading your photo…</span>
        </div>
      )}

      {/* Done */}
      {state === "done" && (
        <div
          role="status"
          aria-live="assertive"
          className="bg-green-900/40 border border-green-700 rounded-xl p-4 text-center"
        >
          <p className="text-2xl mb-1" aria-hidden="true">
            ✅
          </p>
          <p className="text-green-300 font-semibold">Photo submitted!</p>
          <p className="text-slate-400 text-sm mt-1">
            +{pointsEarned} points pending review
          </p>
        </div>
      )}

      {/* Error */}
      {state === "error" && (
        <div
          role="alert"
          className="bg-red-900/40 border border-red-700 rounded-xl p-4"
        >
          <p className="text-red-300 text-sm">{errorMsg}</p>
          <button
            onClick={reset}
            className="mt-3 text-amber-400 text-sm underline hover:no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400 rounded"
          >
            Try again
          </button>
        </div>
      )}
    </section>
  );
}
