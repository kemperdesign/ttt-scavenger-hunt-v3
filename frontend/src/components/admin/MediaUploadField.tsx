"use client";

import { useRef, useState } from "react";
import { uploadStopMedia } from "@/lib/api";

interface MediaUploadFieldProps {
  stopId: string;
  mediaType: "image" | "audio";
  currentUrl?: string | null;
  onUploaded: (url: string) => void;
}

const ACCEPT = {
  image: "image/jpeg,image/png,image/gif,image/webp",
  audio: "audio/mpeg,audio/wav,audio/ogg",
};

export function MediaUploadField({
  stopId,
  mediaType,
  currentUrl,
  onUploaded,
}: MediaUploadFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const label = mediaType === "image" ? "Image" : "Audio Narration";

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");
    try {
      const updated = await uploadStopMedia(stopId, mediaType, file);
      const url = mediaType === "image" ? updated.image_url : updated.audio_url;
      if (url) onUploaded(url);
    } catch {
      setError(`Failed to upload ${mediaType}. Check file type and size.`);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-1">
        {label}
      </label>

      {currentUrl && mediaType === "image" && (
        <img
          src={currentUrl}
          alt=""
          className="w-full max-h-40 object-cover rounded-lg mb-2 border border-slate-600"
        />
      )}

      {currentUrl && mediaType === "audio" && (
        <audio controls src={currentUrl} className="w-full mb-2 h-10">
          Your browser does not support audio playback.
        </audio>
      )}

      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT[mediaType]}
          onChange={handleFileChange}
          disabled={uploading}
          className="flex-1 text-sm text-slate-300 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-amber-500 file:text-slate-900 file:text-sm file:font-medium hover:file:bg-amber-400 disabled:opacity-50"
        />
        {uploading && (
          <span className="text-xs text-slate-400 shrink-0">Uploading…</span>
        )}
      </div>

      {error && (
        <p role="alert" className="text-red-400 text-xs mt-1">
          {error}
        </p>
      )}

      <p className="text-xs text-slate-500 mt-1">
        {mediaType === "image"
          ? "JPEG, PNG, GIF, or WebP — max 10 MB"
          : "MP3, WAV, or OGG — max 25 MB"}
      </p>
    </div>
  );
}
