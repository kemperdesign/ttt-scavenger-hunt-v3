// ─────────────────────────────────────────────────────────────────────────────
// St. Augustine TimeQuest — Typed API Client
// ─────────────────────────────────────────────────────────────────────────────

// Default to same-origin ("") so production traffic flows through the Next.js
// rewrite proxy (see next.config.js). Local dev sets NEXT_PUBLIC_API_URL in .env.local.
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";
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

export type Difficulty = "easy" | "medium" | "hard";
export type AdventureStatus = "draft" | "published" | "archived";
export type ChallengeType =
  | "gps_checkin"
  | "multiple_choice"
  | "text_answer"
  | "photo_submission"
  | "ai_conversation"
  | "sequence_puzzle"
  | "qr_code"
  | "branching_story";

export interface Adventure {
  id: string;
  title: string;
  slug: string;
  description: string;
  difficulty: Difficulty;
  estimated_duration_minutes: number;
  price: number;
  status: AdventureStatus;
  cover_image_url?: string;
  stop_count: number;
  created_at: string;
  updated_at: string;
}

export interface Stop {
  id: string;
  adventure_id: string;
  name: string;
  sequence_order: number;
  latitude: number;
  longitude: number;
  gps_radius_meters: number;
  historical_summary: string;
  extended_history?: string;
  accessibility_notes?: string;
  cover_photo_url?: string;
  historic_photo_url?: string;
  audio_url?: string;
  challenges: Challenge[];
}

export interface BaseChallenge {
  id: string;
  stop_id: string;
  challenge_type: ChallengeType;
  sequence_order: number;
  points_possible: number;
  hint_text?: string;
  is_required: boolean;
}

export interface MultipleChoiceChallenge extends BaseChallenge {
  challenge_type: "multiple_choice";
  question: string;
  options: string[];
  correct_index: number;
  explanation?: string;
}

export interface TextAnswerChallenge extends BaseChallenge {
  challenge_type: "text_answer";
  question: string;
  accepted_answers: string[];
  case_sensitive: boolean;
}

export interface PhotoChallenge extends BaseChallenge {
  challenge_type: "photo_submission";
  prompt: string;
  requires_review: boolean;
}

export interface AiConversationChallenge extends BaseChallenge {
  challenge_type: "ai_conversation";
  character_id: string;
  opening_prompt: string;
  min_exchanges: number;
}

export interface SequencePuzzleChallenge extends BaseChallenge {
  challenge_type: "sequence_puzzle";
  items: { id: string; label: string }[];
  // correct_order not sent to client
}

export interface QrCodeChallenge extends BaseChallenge {
  challenge_type: "qr_code";
  instruction: string;
}

export interface BranchingStoryChallenge extends BaseChallenge {
  challenge_type: "branching_story";
  narrative: string;
  choices: { id: string; label: string; description: string }[];
}

export interface GpsCheckinChallenge extends BaseChallenge {
  challenge_type: "gps_checkin";
}

export type Challenge =
  | MultipleChoiceChallenge
  | TextAnswerChallenge
  | PhotoChallenge
  | AiConversationChallenge
  | SequencePuzzleChallenge
  | QrCodeChallenge
  | BranchingStoryChallenge
  | GpsCheckinChallenge;

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

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  image_url?: string;
  earned_at: string;
}

export interface AiCharacter {
  id: string;
  name: string;
  display_name: string;
  era: string;
  personality: string;
  portrait_url?: string;
  source_count: number;
}

export interface PhotoSubmission {
  id: string;
  challenge_id: string;
  session_id: string;
  player_name: string;
  stop_name: string;
  challenge_prompt: string;
  photo_url: string;
  status: "pending" | "approved" | "rejected";
  submitted_at: string;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  completion_time_minutes: number;
  completed_at: string;
  is_current_user: boolean;
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
      const refreshRes = await fetch(`${API_URL}/api/auth/refresh`, {
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
  const data = await apiRequest<{ access_token: string; refresh_token: string }>(
    "/api/auth/login",
    { method: "POST", body: JSON.stringify({ email, password }) }
  );
  setTokens(data.access_token, data.refresh_token);
  return data;
}

export async function register(email: string, password: string, display_name: string) {
  return apiRequest<User>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password, display_name }),
  });
}

export async function logout() {
  try {
    await apiRequest("/api/auth/logout", { method: "POST" });
  } finally {
    clearTokens();
  }
}

export function getCurrentUser() {
  return apiRequest<User>("/api/auth/me");
}

// ── Adventures ────────────────────────────────────────────────────────────────

export function listAdventures() {
  return apiRequest<Adventure[]>("/api/adventures");
}

export function getAdventure(id: string) {
  return apiRequest<Adventure>(`/api/adventures/${id}`);
}

export function createAdventure(data: Partial<Adventure>) {
  return apiRequest<Adventure>("/api/adventures", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateAdventure(id: string, data: Partial<Adventure>) {
  return apiRequest<Adventure>(`/api/adventures/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteAdventure(id: string) {
  return apiRequest<void>(`/api/adventures/${id}`, { method: "DELETE" });
}

export function publishAdventure(id: string) {
  return apiRequest<Adventure>(`/api/adventures/${id}/publish`, { method: "POST" });
}

export function unpublishAdventure(id: string) {
  return apiRequest<Adventure>(`/api/adventures/${id}/unpublish`, { method: "POST" });
}

export function getLeaderboard(adventureId: string) {
  return apiRequest<LeaderboardEntry[]>(`/api/adventures/${adventureId}/leaderboard`);
}

// ── Stops ─────────────────────────────────────────────────────────────────────

export function listStops(adventureId: string) {
  return apiRequest<Stop[]>(`/api/adventures/${adventureId}/stops`);
}

export function getStop(stopId: string) {
  return apiRequest<Stop>(`/api/stops/${stopId}`);
}

export function createStop(adventureId: string, data: Partial<Stop>) {
  return apiRequest<Stop>(`/api/adventures/${adventureId}/stops`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateStop(stopId: string, data: Partial<Stop>) {
  return apiRequest<Stop>(`/api/stops/${stopId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteStop(stopId: string) {
  return apiRequest<void>(`/api/stops/${stopId}`, { method: "DELETE" });
}

// ── Challenges ────────────────────────────────────────────────────────────────

export function submitChallenge(
  challengeId: string,
  answer: unknown,
  sessionId: string
) {
  return apiRequest<ChallengeAttempt>(`/api/challenges/${challengeId}/submit`, {
    method: "POST",
    body: JSON.stringify({ answer, session_id: sessionId }),
  });
}

export function useHint(challengeId: string, sessionId: string) {
  return apiRequest<{ hint_text: string }>(`/api/challenges/${challengeId}/hint`, {
    method: "POST",
    body: JSON.stringify({ session_id: sessionId }),
  });
}

// ── GPS Check-in ──────────────────────────────────────────────────────────────

export function gpsCheckin(stopId: string, sessionId: string, lat: number, lng: number) {
  return apiRequest<{ checked_in: boolean; distance_meters: number }>(
    "/api/checkin",
    {
      method: "POST",
      body: JSON.stringify({ stop_id: stopId, session_id: sessionId, lat, lng }),
    }
  );
}

// ── Sessions ──────────────────────────────────────────────────────────────────

export function createSession(adventureId: string, teamId?: string) {
  return apiRequest<Session>("/api/sessions", {
    method: "POST",
    body: JSON.stringify({ adventure_id: adventureId, team_id: teamId }),
  });
}

export function getSession(sessionId: string) {
  return apiRequest<Session>(`/api/sessions/${sessionId}`);
}

export function completeSession(sessionId: string) {
  return apiRequest<Session>(`/api/sessions/${sessionId}/complete`, { method: "POST" });
}

// ── Teams ─────────────────────────────────────────────────────────────────────

export function createTeam(adventureId: string, name: string) {
  return apiRequest<Team>("/api/teams", {
    method: "POST",
    body: JSON.stringify({ adventure_id: adventureId, name }),
  });
}

export function joinTeam(joinCode: string) {
  return apiRequest<Team>("/api/teams/join", {
    method: "POST",
    body: JSON.stringify({ join_code: joinCode }),
  });
}

export function getTeam(teamId: string) {
  return apiRequest<Team>(`/api/teams/${teamId}`);
}

// ── AI Historian ──────────────────────────────────────────────────────────────

export function chatWithCharacter(
  characterId: string,
  message: string,
  history: AiMessage[],
  adventureId?: string
) {
  return apiRequest<AiMessage>("/api/ai/chat", {
    method: "POST",
    body: JSON.stringify({ character_id: characterId, message, history, adventure_id: adventureId }),
  });
}

export function listCharacters() {
  return apiRequest<AiCharacter[]>("/api/ai/characters");
}

// ── Badges ────────────────────────────────────────────────────────────────────

export function checkBadges(sessionId: string, event: string, eventData: Record<string, unknown>) {
  return apiRequest<{ awarded: Badge[] }>(`/api/sessions/${sessionId}/badges/check`, {
    method: "POST",
    body: JSON.stringify({ event, event_data: eventData }),
  });
}

export function listBadges(sessionId: string) {
  return apiRequest<Badge[]>(`/api/sessions/${sessionId}/badges`);
}

// ── Photo Submissions ─────────────────────────────────────────────────────────

export function listSubmissions(params?: { adventure_id?: string; status?: string }) {
  const qs = params ? "?" + new URLSearchParams(params as Record<string, string>).toString() : "";
  return apiRequest<PhotoSubmission[]>(`/api/admin/submissions${qs}`);
}

export function approveSubmission(id: string) {
  return apiRequest<PhotoSubmission>(`/api/admin/submissions/${id}/approve`, { method: "POST" });
}

export function rejectSubmission(id: string) {
  return apiRequest<PhotoSubmission>(`/api/admin/submissions/${id}/reject`, { method: "POST" });
}

// ── Account ───────────────────────────────────────────────────────────────────

export function exportAccountData() {
  return fetch(`${API_URL}/api/account/export`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
}

export function deleteAccount() {
  return apiRequest<void>("/api/account", { method: "DELETE" });
}
