import { Outlet, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="layout">
      <nav className="nav">
        <Link to="/" className="brand">
          LockedIn
        </Link>
        <div className="nav-links">
          <Link to="/">Dashboard</Link>
          <Link to="/friends">Friends</Link>
          <Link to="/leaderboard">Leaderboard</Link>
          <span className="user">{user?.username}</span>
          <button type="button" onClick={handleLogout} className="btn-outline">
            Log out
          </button>
        </div>
      </nav>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
