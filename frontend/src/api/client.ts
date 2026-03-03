const API_BASE = "/api";

function getToken(): string | null {
  return localStorage.getItem("token");
}

export async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };
  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || String(err) || "Request failed");
  }
  return res.json();
}

// Auth
export const auth = {
  register: (email: string, username: string, password: string) =>
    api<{ id: number; email: string; username: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, username, password }),
    }),

  login: (email: string, password: string) =>
    api<{ access_token: string; token_type: string; user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  me: () => api<User>("/auth/me"),
};

// Sessions
export const sessions = {
  start: () =>
    api<{ id: number; user_id: number; started_at: string }>("/sessions", {
      method: "POST",
    }),

  end: (id: number) =>
    api<StudySession>(`/sessions/${id}/end`, { method: "PATCH" }),

  list: () => api<StudySession[]>("/sessions"),

  current: () =>
    api<{ id: number; user_id: number; started_at: string } | null>(
      "/sessions/current"
    ),
};

// Friends
export const friends = {
  sendRequest: (to_user_id: number) =>
    api<FriendRequest>("/friends/requests", {
      method: "POST",
      body: JSON.stringify({ to_user_id }),
    }),

  listRequests: () => api<FriendRequest[]>("/friends/requests"),

  respondToRequest: (id: number, status: "accepted" | "rejected") =>
    api<FriendRequest>(`/friends/requests/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  list: () => api<UserPublic[]>("/friends"),
};

// Leaderboard
export const leaderboard = {
  get: (limit = 50) =>
    api<LeaderboardEntry[]>(`/leaderboard?limit=${limit}`),
};

// Types
export interface User {
  id: number;
  email: string;
  username: string;
  created_at: string;
}

export interface UserPublic {
  id: number;
  username: string;
}

export interface StudySession {
  id: number;
  user_id: number;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
}

export interface FriendRequest {
  id: number;
  from_user_id: number;
  to_user_id: number;
  status: string;
  created_at: string;
}

export interface LeaderboardEntry {
  rank: number;
  user_id: number;
  username: string;
  total_study_seconds: number;
}
