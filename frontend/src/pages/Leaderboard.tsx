import { useState, useEffect } from "react";
import { leaderboard } from "../api/client";
import type { LeaderboardEntry } from "../api/client";
import { useAuth } from "../contexts/AuthContext";

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return `${seconds}s`;
}

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    leaderboard
      .get()
      .then(setEntries)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="page-loading">Loading…</div>;
  }

  return (
    <div className="leaderboard-page">
      <h1>Leaderboard</h1>
      <p className="subtitle">Top studiers by total study time</p>
      <div className="leaderboard-table">
        <div className="leaderboard-header">
          <span>Rank</span>
          <span>User</span>
          <span>Study time</span>
        </div>
        {entries.map((e) => (
          <div
            key={e.user_id}
            className={`leaderboard-row ${e.user_id === user?.id ? "highlight" : ""}`}
          >
            <span className="rank">#{e.rank}</span>
            <span className="username">{e.username}</span>
            <span className="time">{formatTime(e.total_study_seconds)}</span>
          </div>
        ))}
      </div>
      {entries.length === 0 && (
        <p className="muted">No entries yet. Start studying!</p>
      )}
    </div>
  );
}
