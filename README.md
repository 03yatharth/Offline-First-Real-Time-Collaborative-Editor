# Offline-First Real-Time Collaborative Editor

An offline-first, real-time collaborative text editor built with React, Node.js, Socket.IO, Yjs (CRDTs), and MongoDB.

---

## Features

- **Real-Time Collaboration**: Multiple users can edit the same document concurrently with conflict-free synchronization powered by Yjs.
- **Offline-First Architecture**: Changes made while offline are stored locally in IndexedDB and automatically synchronized once reconnected.
- **Collaborator Presence**: Live awareness showing active users currently working in the document.
- **Document Management**: Create, rename, delete, and manage documents with ownership access controls.
- **Authentication**: User registration and login using JWT and password hashing with bcrypt.

---

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, TipTap, Yjs, y-indexeddb, Socket.IO Client, Lucide React
- **Backend**: Node.js, Express 5, TypeScript, Socket.IO, Yjs, Mongoose (MongoDB), JWT, bcrypt
- **Shared**: Shared protocol constants and message types
- **Database / Infra**: MongoDB 8 (Docker Compose)

---

## Project Structure

```text
├── client/           # React frontend application (TipTap + Yjs + Vite)
├── server/           # Express & Socket.IO backend (Yjs session manager + MongoDB)
├── shared/           # Shared TypeScript constants and communication protocols
├── docker-compose.yml# Local MongoDB configuration
└── README.md
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later recommended)
- [npm](https://www.npmjs.com/) or [pnpm](https://pnpm.io/)
- [Docker](https://www.docker.com/) (for MongoDB container) or a local MongoDB instance

---

### 1. Start MongoDB

Run MongoDB using Docker Compose:

```bash
docker compose up -d
```

---

### 2. Configure Environment Variables

Create a `.env` file in the `server` directory:

```env
PORT=4000
CLIENT_ORIGIN=http://localhost:5173
MONGODB_URI=mongodb://admin:password@localhost:27017/collab_editor?authSource=admin
JWT_SECRET=your_jwt_secret_key_here
```

*(Optional)* Create a `.env` file in the `client` directory if using a custom backend URL:

```env
VITE_SERVER_URL=http://localhost:4000
```

---

### 3. Install Dependencies

Install dependencies for all workspaces (`shared`, `server`, and `client`):

```bash
# Install shared package dependencies
cd shared
npm install
npm run build

# Install server dependencies
cd ../server
npm install

# Install client dependencies
cd ../client
npm install
```

---

### 4. Run the Application

Start the backend server and frontend client in separate terminals:

**Terminal 1 (Backend Server):**
```bash
cd server
npm run dev
```

**Terminal 2 (Frontend Client):**
```bash
cd client
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser to start collaborating.
