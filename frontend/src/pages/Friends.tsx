import { useState, useEffect } from "react";
import { friends } from "../api/client";
import type { FriendRequest, UserPublic } from "../api/client";

export default function Friends() {
  const [friendList, setFriendList] = useState<UserPublic[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [toUserId, setToUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const [fl, rq] = await Promise.all([
        friends.list(),
        friends.listRequests(),
      ]);
      setFriendList(fl);
      setRequests(rq);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const sendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = parseInt(toUserId, 10);
    if (isNaN(id) || id < 1) {
      setError("Enter a valid user ID");
      return;
    }
    setError("");
    setActionLoading(true);
    try {
      await friends.sendRequest(id);
      setToUserId("");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send request");
    } finally {
      setActionLoading(false);
    }
  };

  const respond = async (requestId: number, status: "accepted" | "rejected") => {
    setActionLoading(true);
    try {
      await friends.respondToRequest(requestId, status);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className="page-loading">Loading…</div>;
  }

  return (
    <div className="friends-page">
      <h1>Friends</h1>

      <section className="add-friend">
        <h2>Add friend</h2>
        <form onSubmit={sendRequest} className="inline-form">
          <input
            type="number"
            placeholder="User ID"
            value={toUserId}
            onChange={(e) => setToUserId(e.target.value)}
            min={1}
          />
          <button type="submit" disabled={actionLoading} className="btn-primary">
            Send request
          </button>
        </form>
        {error && <p className="error">{error}</p>}
        <p className="hint">Ask your friend for their user ID (visible on their profile).</p>
      </section>

      <section>
        <h2>Pending requests</h2>
        {requests.length === 0 ? (
          <p className="muted">No pending requests</p>
        ) : (
          <ul className="request-list">
            {requests.map((r) => (
              <li key={r.id}>
                <span>User #{r.from_user_id}</span>
                <div>
                  <button
                    onClick={() => respond(r.id, "accepted")}
                    disabled={actionLoading}
                    className="btn-sm btn-primary"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => respond(r.id, "rejected")}
                    disabled={actionLoading}
                    className="btn-sm btn-outline"
                  >
                    Reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2>Friends</h2>
        {friendList.length === 0 ? (
          <p className="muted">No friends yet</p>
        ) : (
          <ul className="friend-list">
            {friendList.map((f) => (
              <li key={f.id}>{f.username} (#{f.id})</li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
