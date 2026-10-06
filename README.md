# CallLog Pro

CallLog Pro is a call-log management app for recording admin/IT support calls and guest support calls. It includes a React frontend, an Express API, and MongoDB persistence.

## Features

- Create, view, edit, and delete Admin Calls and Guest Calls.
- New Admin Calls default to `Done` status.
- Manage dropdown values from the Master Data page. Values created by a regular user are private to that user; admin-created values are shared.
- View a call's history, including who created or updated it, when the action happened, and the fields changed. Delete events are recorded in the audit log.
- Manage users and switch into a user's workspace as an administrator.
- Import and export call logs as Excel files, including date-filtered exports and sample templates.
- Set company name and logo for exported workbooks.
- Responsive layouts for call tables, call-history dialogs, Master Data, Import/Export, and User Management.
- Sidebar attribution for Karamveer Singh. The website and phone entries are placeholders and should be replaced before release.

## Technology

- Frontend: React 18 and React Router
- Backend: Node.js, Express 5, and Mongoose
- Database: MongoDB

## Requirements

- Node.js and npm
- A MongoDB instance accessible by the backend

## Configuration

Create `backend/.env` with your own MongoDB connection string and a private JWT secret. Do not commit real credentials.

```env
MONGO_URI=***
JWT_SECRET=***
PORT=5000
CLIENT_URL=http://localhost:3000
```

The frontend API client uses `http://localhost:5000/api` by default. If your backend runs elsewhere, update `frontend/src/services/api.js` to match.

## Run Locally

Open two terminals from the project root.

Backend:

```sh
cd backend
npm install
npm run dev
```

Frontend:

```sh
cd frontend
npm install
npm start
```

The frontend is available at `http://localhost:3000`. The backend listens on `http://localhost:5000` by default.

To create a production frontend build:

```sh
cd frontend
npm run build
```

## Optional Seed Data

`backend/src/utils/seed.js` creates sample users and shared Master Data values. **It deletes all existing users and Master Data before seeding.** Review the script before running it, and never run it against production data. Sample passwords are intentionally not included here.

## Main Directories

- `frontend/src/pages/`: app screens
- `frontend/src/components/`: shared UI components
- `frontend/src/styles/App.css`: application styling and responsive layouts
- `backend/src/controllers/`: API request handlers
- `backend/src/models/`: MongoDB models
- `backend/src/routes/`: API routes
- `backend/src/utils/`: audit logging and seed utilities
