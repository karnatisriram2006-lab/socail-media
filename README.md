# Social Media Platform

A full-stack social media platform built with React, Node.js, Express, MongoDB, Firebase Auth, and Socket.IO. Production-ready with Docker, CI/CD, security hardening, and content moderation.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Vite, Tailwind CSS, Framer Motion, Zustand |
| **Backend** | Node.js, Express, Socket.IO (real-time) |
| **Database** | MongoDB (Mongoose ODM) |
| **Auth** | Firebase Authentication (email + Google OAuth) |
| **Media** | Cloudinary (images & videos) |
| **Realtime** | Socket.IO (chat, notifications, status) |
| **DevOps** | Docker, Docker Compose, Nginx, GitHub Actions |

## Features

- 📱 **Social Feed** — Post images/videos with likes, comments, hashtags
- 💬 **Real-time Chat** — Direct messaging with typing indicators, read receipts
- 🔔 **Notifications** — Real-time push for likes, comments, follows
- 👥 **User Profiles** — Bio, followers/following, post grid
- 🔒 **User Blocking** — Block/unblock users with automatic unfollow
- 🚩 **Content Reporting** — Report posts with 8 reason categories + admin review
- 🎨 **Rich UI** — Animations, glassmorphism, gradients, dark-ready
- 📱 **PWA** — Service worker, offline support via vite-plugin-pwa

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Firebase project (with Auth enabled)
- Cloudinary account

### 1. Clone & Install

```bash
git clone <repo-url>
cd social-media

# Install backend
cd backend && npm install

# Install frontend
cd ../frontend && npm install
```

### 2. Environment Variables

Create `backend/.env` from the example:

```bash
cp backend/.env.example backend/.env
```

Required values:
```
MONGODB_URI=mongodb+srv://...
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
CLIENT_URL=http://localhost:5173
```

Create `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

### 3. Run (Development)

```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
cd frontend && npm run dev
```

Visit `http://localhost:5173`

## Docker Deployment (Production)

```bash
docker compose up -d
```

This starts:
- **MongoDB 7** — Database
- **Backend API** — Express on port 5000
- **Cleanup Cron** — Daily DB cleanup at 3 AM

## Production Deployment

### Using Nginx + Docker Compose

1. Set `CLIENT_URL` to your domain in `backend/.env`
2. Set `NODE_ENV=production`
3. Configure `nginx.conf` with your domain and SSL certs
4. Run `docker compose up -d`
5. Place `nginx.conf` in `/etc/nginx/sites-available/`

### CI/CD (GitHub Actions)

The `.github/workflows/deploy.yml` pipeline:
1. Lints backend & frontend
2. Runs backend tests with MongoDB service
3. Builds frontend
4. Builds & pushes Docker images to DockerHub
5. SSH-deploys to your VPS

**Required GitHub Secrets:**
- `DOCKER_USERNAME` / `DOCKER_PASSWORD`
- `DEPLOY_HOST` / `DEPLOY_USER` / `DEPLOY_SSH_KEY`

## Project Structure

```
social-media/
├── backend/
│   ├── config/          # DB, Firebase, Cloudinary configs
│   ├── controllers/     # Route handlers
│   ├── jobs/            # Cron jobs (cleanup.js)
│   ├── middleware/       # Auth, validation
│   ├── models/          # Mongoose schemas
│   ├── routes/          # Express routes
│   ├── __tests__/       # Jest tests
│   └── server.js        # Entry point
├── frontend/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page layouts
│   │   ├── services/    # API, Socket clients
│   │   ├── store/       # Zustand state
│   │   └── config/      # Firebase config
│   └── Dockerfile
├── .github/workflows/   # CI/CD
├── Dockerfile           # Backend image
├── docker-compose.yml   # Full stack
└── nginx.conf           # Reverse proxy
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/google` | Google OAuth |
| GET | `/api/auth/me` | Current user |
| PUT | `/api/users/profile` | Update profile |
| POST | `/api/users/:id/follow` | Follow/unfollow |
| POST | `/api/users/block/:id` | Block/unblock |
| GET | `/api/users/:id` | Get user profile |
| GET | `/api/posts` | Get feed |
| POST | `/api/posts` | Create post |
| POST | `/api/posts/:id/like` | Like/unlike |
| POST | `/api/posts/:id/comment` | Add comment |
| POST | `/api/reports` | Report content |

## Security Features

- ✅ Helmet CSP headers (production)
- ✅ CORS whitelist (single origin in production)
- ✅ Rate limiting (global, auth, per-endpoint)
- ✅ MongoDB injection sanitization
- ✅ Request body size limits
- ✅ Environment validation (fail-fast startup)
- ✅ Non-root Docker user
- ✅ Nginx security headers (X-Frame-Options, HSTS, etc.)

## License

MIT