# LockedIn

Focus app: lock in on studies. Start a session to block distractions, track time, compete with friends, and climb the leaderboard.

## Features

- **Study sessions** – Start/end sessions; duration tracked for leaderboard
- **Friends** – Send/accept friend requests and see friends list
- **Leaderboard** – Rankings by total study time

## Project structure

```
LockedIn/
├── backend/          # Python FastAPI
│   ├── app/
│   │   ├── api/      # Auth, sessions, friends, leaderboard
│   │   ├── models/   # User, StudySession, FriendRequest, Friendship
│   │   ├── schemas/  # Pydantic request/response
│   │   ├── services/ # Auth (JWT, bcrypt)
│   │   ├── config.py
│   │   ├── database.py
│   │   └── main.py
│   ├── requirements.txt
│   └── run.py
├── frontend/         # React + TypeScript (Vite)
└── README.md
```

## Backend (Python / FastAPI)

### Setup

1. Create a virtualenv and install deps:

   ```bash
   cd backend
   python -m venv .venv
   source .venv/bin/activate   # Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. PostgreSQL: create a DB and set its URL (default: `postgresql+asyncpg://postgres:postgres@localhost:5432/lockedin`).

   Optional: copy `.env.example` to `.env` and set:

   ```bash
   DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/lockedin
   SECRET_KEY=your-secret-key
   ```

3. Run the server:

   ```bash
   python run.py
   ```

   API: http://localhost:8000  
   Docs: http://localhost:8000/docs

### API overview

| Area        | Endpoints |
|------------|-----------|
| **Auth**   | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` |
| **Sessions** | `POST /api/sessions` (start), `PATCH /api/sessions/{id}/end`, `GET /api/sessions`, `GET /api/sessions/current` |
| **Friends**  | `POST /api/friends/requests`, `GET /api/friends/requests`, `PATCH /api/friends/requests/{id}`, `GET /api/friends` |
| **Leaderboard** | `GET /api/leaderboard` |

All session/friend/leaderboard endpoints require `Authorization: Bearer <token>` (from login).

## Frontend (React + TypeScript)

```bash
cd frontend
npm install
npm run dev
```

Runs at http://localhost:5173. Vite proxy forwards `/api` to the backend at port 8000.

## Data models

- **User** – id, email, username, hashed_password, created_at
- **StudySession** – id, user_id, started_at, ended_at, duration_seconds
- **FriendRequest** – from_user_id, to_user_id, status (pending/accepted/rejected)
- **Friendship** – user_id, friend_id (bidirectional row per pair when accepted)

Leaderboard is computed from `StudySession.duration_seconds` per user.

## License

Private / your choice.
