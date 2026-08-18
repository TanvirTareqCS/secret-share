# 🚀 SecureShare — Ephemeral Pastebin & Secure Group Workspaces

This is a Next.js project bootstrapped with `create-next-app`. It is a lightning-fast, self-destructing text/code sharing web application paired with secure persistent group workspaces, built with zero-cost cloud storage and rich interactive animations.

---

## ✨ Features

### ⚡ Ephemeral Pastebin Mode
- **🚀 Turbo Paper Plane Share:** Features a high-speed animated flight path and synthesized audio feedback upon link generation.
- **💥 Explosive Destruction:** Receiver view features a custom bomb explosion animation, screen shake/rumble sound effect, and complete data obliteration.
- **🛡️ Military-Grade Encryption Mock:** Optional passcode protection featuring real-time Matrix-style text scrambling and character-to-asterisk masking.
- **⏱️ Auto-Destruct Timer:** Powered by Upstash Redis TTL (Time-To-Live), automatically purging text after 10 minutes or upon manual destruction.

### 💬 Group Workspaces Mode (New!)
- **👥 Registered User Hub:** Secure username registration tracking to ensure complete profile isolation.
- **🔒 Member-Locked Channels:** Create group workspaces and explicitly invite registered friends by username; unregistered users or non-members are strictly blocked.
- **⏱️ 1-Minute Smart Polling:** Lightweight background message sync designed to run safely within free database command limits.
- **🗑️ Sender-Only Deletion & Auto-Cleanup:** Users can only delete their own messages. Abandoned or empty groups (and logged-out user data) are automatically purged from the database to save space.

---

## 📸 Screenshots

### 1. Sender Side
- **Sender View (Main Form):**
  ![Sender View](./screenshots/sender%20view.png)

- **Password Sender View:**
  ![Password Sender View](./screenshots/password%20sender%20view.png)

- **Link Generated View:**
  ![Link View](./screenshots/link%20view.png)

---

### 2. Receiver & Group Workspace Side
- **Receiver View:**
  ![Receiver View](./screenshots/recever%20view.png)

- **Password Protected Receiver View:**
  ![Password Receiver View](./screenshots/password%20recever%20view.png)

- **Destruction / Obliterated View:**
  ![Destroy View](./screenshots/distroy%20view.png)

---

## 🛠️ Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (React / App Router)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Database:** [Upstash Redis](https://upstash.com/) (Serverless Key-Value store with native TTL and Sets)
- **Animations:** [Framer Motion](https://www.framer.com/motion/)
- **Audio:** Web Audio API (Browser-native sound effects)

---

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev