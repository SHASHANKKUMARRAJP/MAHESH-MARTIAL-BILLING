# 🥋 Karate Academy Manager

A production-quality, mobile-first application for managing students, monthly fees, WhatsApp fee reminders, and payment tracking for karate academies.

## Features

- **Dashboard** — Overview of stats, pending fees, and quick actions
- **Students** — Full CRUD with search, filter, and sort
- **WhatsApp Reminders** — Individual personalized reminders with two-step confirmation
- **Fee Management** — Monthly fee tracking with payment history
- **Reports** — Monthly collection reports with CSV export
- **Settings** — Academy info, message templates, theme
- **Dark Mode** — Light / Dark / System theme support
- **Mobile-first** — Touch-friendly bottom navigation, works on all screen sizes
- **Demo Mode** — Works out of the box without Supabase credentials

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure Supabase (optional for development)

Copy `.env.local` and add your credentials:

```
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

Without these, the app runs in **Demo Mode** with realistic mock data.

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run `supabase/schema.sql`
3. Get your URL and anon key from **Project Settings → API**
4. Add them to `.env.local`
5. Restart the dev server

The schema includes:
- All tables with proper foreign keys
- Row Level Security (RLS) policies
- Automatic profile + academy creation on user signup
- Indexes for performance

---

## Tech Stack

| Technology | Purpose |
|---|---|
| React 18 | UI framework |
| TypeScript | Type safety |
| Vite | Build tool |
| Tailwind CSS | Styling |
| Supabase | Auth + PostgreSQL database |
| Lucide React | Icons |
| React Router v6 | Navigation |

---

## WhatsApp Reminder Workflow

1. Open **Reminders** → Select month
2. Select one or multiple pending students
3. Tap **Send Reminders**
4. The app shows a sequential workflow: one student at a time
5. Tap **Open WhatsApp** → sends you to that parent's individual chat with the message pre-filled
6. After sending, return to the app and tap **Yes, Mark Sent**
7. The reminder is recorded in history

> The app uses `https://wa.me/<PHONE>?text=<MESSAGE>` deep links. It never automatically sends messages — the instructor always reviews and sends manually.

---

## Message Template Variables

| Variable | Replaced With |
|---|---|
| `{{parent_name}}` | Parent's name |
| `{{student_name}}` | Student's name |
| `{{month}}` | Month name (e.g., October) |
| `{{year}}` | Year (e.g., 2026) |
| `{{amount}}` | Monthly fee amount |

Edit the template in **Settings → WhatsApp**.

---

## Project Structure

```
src/
├── components/
│   ├── layout/        # AppShell, navigation
│   ├── students/      # StudentCard, StudentForm
│   └── ui/            # Button, Modal, Toast, Badges, etc.
├── contexts/          # Auth, Toast, Theme contexts
├── hooks/             # useStudents, usePayments, useReminders, useSettings
├── lib/               # Supabase client, utilities, demo data
├── pages/             # Dashboard, Students, Reminders, Fees, Reports, Settings
└── types/             # TypeScript types
supabase/
└── schema.sql         # Full PostgreSQL schema with RLS
```

---

## Build for Production

```bash
npm run build
```

Output in `dist/`. Deploy to Vercel, Netlify, or any static host.

---

## Business Rules

1. One fee record per student per month/year
2. Payment history is never overwritten
3. Reminders are independent of payment status
4. Sending a reminder does NOT mark the fee as paid
5. Marking paid does NOT send a reminder
6. Each parent receives their own personalized WhatsApp message
7. App never claims delivery — instructor confirms manually
