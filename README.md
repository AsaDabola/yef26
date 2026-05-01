# YEF Evangelism Tracker

A mobile-first web app for tracking evangelism sessions, student contacts, goals, and chapter activity for Youth Evangelism Fellowship (YEF).

## Features

- **Session Tracking** — Start/stop live evangelism sessions with a built-in timer
- **Student Pipeline** — Track students from first contact through discipleship
- **Analytics** — Charts for hours, sessions, and students over time
- **Goals** — Set and monitor personal and chapter evangelism goals
- **Leaderboards** — Local, country, and global rankings
- **News Feed** — Chapter announcements and event posts
- **Bible Study Tracking** — Record topics and progress per student
- **Role-based access** — Admin, Evangelism Leader, and Member roles

## Tech Stack

- React 18 + Vite
- Firebase (Auth, Firestore, Storage)
- Tailwind CSS + shadcn/ui
- React Router, TanStack Query, Framer Motion

## Setup

1. Clone the repo and install dependencies:
   ```bash
   npm install
   ```

2. Copy `.env.local.example` to `.env.local` and fill in your Firebase project credentials:
   ```bash
   cp .env.local.example .env.local
   ```

3. Run the dev server:
   ```bash
   npm run dev
   ```

## Firebase Configuration

In your Firebase project enable:
- **Authentication** → Email/Password sign-in
- **Firestore Database**
- **Storage**

The app will auto-create user documents and required Firestore collections on first use.
