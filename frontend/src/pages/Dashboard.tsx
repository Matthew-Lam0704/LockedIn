import { useState, useEffect } from "react";
import { sessions } from "../api/client";

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function formatElapsed(started: string) {
  const start = new Date(started).getTime();
  const now = Date.now();
  return formatDuration(Math.floor((now - start) / 1000));
}

export default function Dashboard() {
  const [current, setCurrent] = useState<{
    id: number;
    user_id: number;
    started_at: string;
  } | null>(null);
  const [history, setHistory] = useState<
    { id: number; duration_seconds: number | null; started_at: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [, setElapsed] = useState(0);

  const load = async () => {
    try {
      const [cur, hist] = await Promise.all([
        sessions.current(),
        sessions.list(),
      ]);
      setCurrent(cur);
      setHistory(hist.slice(0, 10));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!current) return;
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(interval);
  }, [current?.id]);

  const startSession = async () => {
    setActionLoading(true);
    try {
      const s = await sessions.start();
      setCurrent(s);
      setElapsed(0);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to start");
    } finally {
      setActionLoading(false);
    }
  };

  const endSession = async () => {
    if (!current) return;
    setActionLoading(true);
    try {
      await sessions.end(current.id);
      setCurrent(null);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to end");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className="page-loading">Loading…</div>;
  }

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>
      <div className="session-card">
        {current ? (
          <>
            <div className="session-active">
              <div className="timer">{formatElapsed(current.started_at)}</div>
              <p>Session in progress — stay focused</p>
              <button
                onClick={endSession}
                disabled={actionLoading}
                className="btn-danger"
              >
                {actionLoading ? "Ending…" : "End session"}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="session-idle">
              <p>Ready to lock in?</p>
              <button
                onClick={startSession}
                disabled={actionLoading}
                className="btn-primary btn-large"
              >
                {actionLoading ? "Starting…" : "Start session"}
              </button>
            </div>
          </>
        )}
      </div>
      <section className="recent-sessions">
        <h2>Recent sessions</h2>
        {history.length === 0 ? (
          <p className="muted">No sessions yet. Start one above.</p>
        ) : (
          <ul className="session-list">
            {history.map((s) => (
              <li key={s.id}>
                <span className="date">
                  {new Date(s.started_at).toLocaleDateString()}
                </span>
                <span className="duration">
                  {s.duration_seconds != null
                    ? formatDuration(s.duration_seconds)
                    : "—"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
