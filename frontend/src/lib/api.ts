// ─────────────────────────────────────────────────────────────────────────────
// St. Augustine TimeQuest — Typed API Client
// ─────────────────────────────────────────────────────────────────────────────

// Browser fetches default to same-origin ("") so they flow through the Next.js
// rewrite proxy (see next.config.js) — that avoids CORS/mixed-content issues.
// But a relative URL can't be resolved by a server-side fetch (Server Components /
// edge functions run inside the Cloudflare Worker, with no browser "current page"
// to be relative to), so those must hit the backend directly instead — this is a
// server-to-server call, so CORS/mixed-content don't apply there anyway.
// Local dev sets NEXT_PUBLIC_API_URL in .env.local, which overrides both cases.
const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  (typeof window === "undefined"
    ? process.env.BACKEND_ORIGIN || "https://173-230-128-241.nip.io"
    : "");
const TOKEN_KEY = "tq_access_token";
const REFRESH_KEY = "tq_refresh_token";

// ── Token helpers ─────────────────────────────────────────────────────────────

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setTokens(access: string, refresh: string) {
  localStorage.setItem(TOKEN_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
}

export function clearTokens() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

// ── Types ─────────────────────────────────────────────────────────────────────

// Backend stores this as a plain string (default "moderate"); not a fixed enum.
export type Difficulty = string;
export type ChallengeType =
  | "gps_checkin"
  | "multiple_choice"
  | "text_answer"
  | "photo_submission"
  | "ai_conversation"
  | "sequence_puzzle"
  | "qr_code"
  | "branching_story";

// Matches backend AdventureOut (app/api/adventures.py) exactly.
export interface Adventure {
  id: string;
  title: string;
  slug: string;
  description?: string;
  short_description?: string;
  difficulty: Difficulty;
  estimated_duration_minutes: number;
  cover_image_url?: string;
  start_lat?: number;
  start_lng?: number;
  tags: string[];
  is_published: boolean;
  is_featured: boolean;
  total_points: number;
  created_at: string;
  updated_at: string;
}

// Matches backend StopOut (app/api/stops.py) exactly.
export interface Stop {
  id: string;
  adventure_id: string;
  title: string;
  description?: string;
  historical_content?: string;
  order_index: number;
  lat: number;
  lng: number;
  gps_radius_meters: number;
  image_url?: string;
  audio_url?: string;
  ai_character_id?: string | null;
  points: number;
  hint_text?: string;
  created_at: string;
  updated_at: string;
}

// Matches backend ChallengeOut (app/api/challenges.py) exactly.
export interface Challenge {
  id: string;
  stop_id: string;
  challenge_type: ChallengeType;
  title: string;
  prompt: string;
  order_index: number;
  points: number;
  is_required: boolean;
  hint_text?: string;
  config: Record<string, unknown>;
}

export interface ChallengeAttempt {
  id: string;
  challenge_id: string;
  session_id: string;
  is_correct: boolean;
  points_awarded: number;
  hint_used: boolean;
  submitted_at: string;
}

export interface Team {
  id: string;
  name: string;
  join_code: string;
  adventure_id: string;
  member_count: number;
  members: { id: string; display_name: string }[];
  created_at: string;
}

export interface Session {
  id: string;
  adventure_id: string;
  team_id?: string;
  user_id: string;
  current_stop_index: number;
  total_score: number;
  started_at: string;
  completed_at?: string;
  metadata: Record<string, unknown>;
}

// Alias — the player pages import this name; it's the same shape as Session.
export type GameSession = Session;

// Matches backend BadgeOut (app/api/badges.py) exactly.
export interface Badge {
  id: string;
  name: string;
  description?: string;
  icon_url?: string;
  icon_emoji?: string;
  adventure_id?: string;
  earned_at?: string;
}

// Matches backend CharacterOut (app/api/characters.py) exactly.
export interface AiCharacter {
  id: string;
  name: string;
  display_name: string;
  era: string;
  personality: string;
  greeting: string;
}

// Matches backend SubmissionOut (app/api/submissions.py) exactly.
export interface PhotoSubmission {
  id: string;
  user_id: string;
  challenge_id: string;
  session_id: string;
  image_url: string;
  status: string;
  reviewer_notes?: string;
  submitted_at: string;
}

// Matches backend LeaderboardEntry (app/api/adventures.py). Note: the backend
// does not return a per-row id, so user_id is left optional/undefined here —
// the leaderboard page uses it as a React key, which is a pre-existing gap.
export interface LeaderboardEntry {
  rank: number;
  username: string;
  total_points: number;
  completed_at?: string;
  user_id?: string;
}

// Matches backend TeamLeaderboardEntry (app/api/adventures.py).
export interface TeamLeaderboardEntry {
  rank: number;
  team_name: string;
  member_count: number;
  total_points: number;
  completed_at?: string;
}

export interface User {
  id: string;
  email: string;
  display_name: string;
  is_admin: boolean;
  created_at: string;
}

export interface AiMessage {
  role: "user" | "assistant";
  content: string;
  sources?: { title: string; date: string }[];
  uncertain?: boolean;
}

// ── Base request ──────────────────────────────────────────────────────────────

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    // Try refresh
    const refreshToken = localStorage.getItem(REFRESH_KEY);
    if (refreshToken) {
      const refreshRes = await fetch(`${API_URL}/api/v1/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      if (refreshRes.ok) {
        const data = await refreshRes.json();
        setTokens(data.access_token, data.refresh_token);
        headers["Authorization"] = `Bearer ${data.access_token}`;
        const retryRes = await fetch(`${API_URL}${path}`, { ...options, headers });
        if (retryRes.ok) return retryRes.json() as Promise<T>;
      }
    }
    clearTokens();
    if (typeof window !== "undefined") window.location.href = "/admin/login";
    throw new ApiError(401, "Unauthorized");
  }

  if (!res.ok) {
    const body = await res.text();
    throw new ApiError(res.status, body || res.statusText);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function login(email: string, password: string) {
  // Backend /auth/token uses OAuth2 form encoding (username field carries the email)
  const res = await fetch(`${API_URL}/api/v1/auth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ username: email, password }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new ApiError(res.status, body || res.statusText);
  }
  const data: { access_token: string; refresh_token: string } = await res.json();
  setTokens(data.access_token, data.refresh_token);
  return data;
}

export async function register(email: string, password: string, display_name: string) {
  const data = await apiRequest<{ access_token: string; refresh_token: string }>(
    "/api/v1/auth/register",
    {
      method: "POST",
      body: JSON.stringify({ email, username: display_name, password }),
    }
  );
  setTokens(data.access_token, data.refresh_token);
  return data;
}

export async function logout() {
  try {
    await apiRequest("/api/v1/auth/logout", { method: "POST" });
  } finally {
    clearTokens();
  }
}

export function getCurrentUser() {
  return apiRequest<User>("/api/v1/auth/me");
}

// ── Adventures ────────────────────────────────────────────────────────────────

export function listAdventures(publishedOnly = true) {
  return apiRequest<Adventure[]>(`/api/v1/adventures?published_only=${publishedOnly}`);
}

export function getAdventure(id: string) {
  return apiRequest<Adventure>(`/api/v1/adventures/${id}`);
}

export function createAdventure(data: Partial<Adventure>) {
  return apiRequest<Adventure>("/api/v1/adventures", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateAdventure(id: string, data: Partial<Adventure>) {
  return apiRequest<Adventure>(`/api/v1/adventures/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteAdventure(id: string) {
  return apiRequest<void>(`/api/v1/adventures/${id}`, { method: "DELETE" });
}

export function publishAdventure(id: string) {
  return apiRequest<Adventure>(`/api/v1/adventures/${id}/publish`, { method: "POST" });
}

export function unpublishAdventure(id: string) {
  return apiRequest<Adventure>(`/api/v1/adventures/${id}/unpublish`, { method: "POST" });
}

export function getLeaderboard(
  adventureId: string,
  options?: { type?: "player" | "team"; limit?: number }
) {
  const type = options?.type || "player";
  const limit = options?.limit || 20;
  const qs = `?type=${type}&limit=${limit}`;
  return apiRequest<LeaderboardEntry[] | TeamLeaderboardEntry[]>(
    `/api/v1/adventures/${adventureId}/leaderboard${qs}`
  );
}

// ── Stops ─────────────────────────────────────────────────────────────────────

export function listStops(adventureId: string) {
  return apiRequest<Stop[]>(`/api/v1/stops?adventure_id=${adventureId}`);
}

// Alias used by the admin adventure-detail page.
export const getStops = listStops;

export function getStop(stopId: string) {
  return apiRequest<Stop>(`/api/v1/stops/${stopId}`);
}

export function createStop(adventureId: string, data: Partial<Stop>) {
  return apiRequest<Stop>(`/api/v1/stops`, {
    method: "POST",
    body: JSON.stringify({ ...data, adventure_id: adventureId }),
  });
}

export function updateStop(stopId: string, data: Partial<Stop>) {
  return apiRequest<Stop>(`/api/v1/stops/${stopId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteStop(stopId: string) {
  return apiRequest<void>(`/api/v1/stops/${stopId}`, { method: "DELETE" });
}

// ── Challenges ────────────────────────────────────────────────────────────────

export function submitChallenge(
  challengeId: string,
  answer: unknown,
  sessionId: string
) {
  return apiRequest<ChallengeAttempt>(`/api/v1/challenges/${challengeId}/submit`, {
    method: "POST",
    body: JSON.stringify({ answer, session_id: sessionId }),
  });
}

export function useHint(challengeId: string, sessionId: string) {
  return apiRequest<{ hint_text: string; points_deducted: number }>(
    `/api/v1/challenges/${challengeId}/hint`,
    {
      method: "POST",
      body: JSON.stringify({ session_id: sessionId }),
    }
  );
}

export function getChallenges(stopId: string) {
  return apiRequest<Challenge[]>(`/api/v1/challenges?stop_id=${stopId}`);
}

export function createChallenge(data: {
  stop_id: string;
  challenge_type: string;
  points: number;
  config: Record<string, unknown>;
  is_required: boolean;
  title?: string;
  prompt?: string;
  order_index?: number;
  hint_text?: string;
}) {
  return apiRequest<Challenge>("/api/v1/challenges", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateChallenge(
  challengeId: string,
  data: Partial<Omit<Challenge, "id">>
) {
  return apiRequest<Challenge>(`/api/v1/challenges/${challengeId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteChallenge(challengeId: string) {
  return apiRequest<void>(`/api/v1/challenges/${challengeId}`, { method: "DELETE" });
}

// ── GPS Check-in ──────────────────────────────────────────────────────────────

export function gpsCheckin(params: {
  stop_id: string;
  session_id: string;
  lat: number;
  lng: number;
  simulated?: boolean;
}) {
  return apiRequest<{
    success: boolean;
    distance_meters: number;
    required_radius: number;
    message: string;
  }>("/api/v1/gps/checkin", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

// ── Sessions ──────────────────────────────────────────────────────────────────

export function createSession(adventureId: string, teamId?: string) {
  return apiRequest<Session>("/api/v1/sessions", {
    method: "POST",
    body: JSON.stringify({ adventure_id: adventureId, team_id: teamId }),
  });
}

export function getSession(sessionId: string) {
  return apiRequest<Session>(`/api/v1/sessions/${sessionId}`);
}

export function completeSession(sessionId: string) {
  return apiRequest<Session>(`/api/v1/sessions/${sessionId}/complete`, { method: "POST" });
}

// ── Teams ─────────────────────────────────────────────────────────────────────

export function createTeam(adventureId: string, name: string) {
  return apiRequest<Team>("/api/v1/teams", {
    method: "POST",
    body: JSON.stringify({ adventure_id: adventureId, name }),
  });
}

export function joinTeam(joinCode: string) {
  return apiRequest<Team>("/api/v1/teams/join", {
    method: "POST",
    body: JSON.stringify({ join_code: joinCode }),
  });
}

export function getTeam(teamId: string) {
  return apiRequest<Team>(`/api/v1/teams/${teamId}`);
}

// ── AI Historian ──────────────────────────────────────────────────────────────

// Return shape uses `response` (not the backend's raw `reply`) to match the
// one real call site (AIChatChallenge.tsx: `response.response`).
export async function chatWithCharacter(
  characterId: string,
  message: string,
  history: AiMessage[] = [],
  adventureId?: string
): Promise<{ response: string; character_id: string; character_name: string }> {
  const data = await apiRequest<{ reply: string; character_id: string; character_name: string }>(
    "/api/v1/characters/chat",
    {
      method: "POST",
      body: JSON.stringify({
        character_id: characterId,
        message,
        history: history.map((m) => ({ role: m.role, content: m.content })),
        adventure_id: adventureId,
      }),
    }
  );
  return { response: data.reply, character_id: data.character_id, character_name: data.character_name };
}

export function listCharacters() {
  return apiRequest<AiCharacter[]>("/api/v1/characters");
}

// ── Badges ────────────────────────────────────────────────────────────────────

export function checkBadges(sessionId: string) {
  return apiRequest<Badge[]>(`/api/v1/badges/check/${sessionId}`, { method: "POST" });
}

export function listBadges(_sessionId?: string) {
  // Backend returns the current user's earned badges (not session-scoped)
  return apiRequest<Badge[]>("/api/v1/badges");
}

// ── Photo Submissions ─────────────────────────────────────────────────────────

// Backend (app/api/submissions.py) returns the submission record, not a score —
// photos are scored on admin approval, not at upload time. points_earned is
// reported as 0 until that review workflow exists on the frontend.
export async function submitPhotoChallenge(challengeId: string, sessionId: string, file: File) {
  const form = new FormData();
  form.append("challenge_id", challengeId);
  form.append("session_id", sessionId);
  form.append("file", file);

  const token = getToken();
  const res = await fetch(`${API_URL}/api/v1/submissions`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: form,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new ApiError(res.status, body || res.statusText);
  }
  const submission = await res.json();
  return { ...submission, points_earned: 0 };
}

export function listSubmissions(status?: string) {
  const qs = status ? `?status=${encodeURIComponent(status)}` : "";
  return apiRequest<PhotoSubmission[]>(`/api/v1/submissions${qs}`);
}

export function approveSubmission(id: string) {
  return apiRequest<PhotoSubmission>(`/api/v1/submissions/${id}/review`, {
    method: "POST",
    body: JSON.stringify({ action: "approve" }),
  });
}

export function rejectSubmission(id: string, notes?: string) {
  return apiRequest<PhotoSubmission>(`/api/v1/submissions/${id}/review`, {
    method: "POST",
    body: JSON.stringify({ action: "reject", notes }),
  });
}

// ── Account ───────────────────────────────────────────────────────────────────

export function exportAccountData() {
  return fetch(`${API_URL}/api/v1/account/export`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
}

export function deleteAccount() {
  return apiRequest<void>("/api/v1/account/delete", { method: "DELETE" });
}
