# Configuration Documentation - Next.js 15

All configuration files for Next.js 15 migration.

## 📁 Contents

### [NEXTJS_15_CONFIG.md](./NEXTJS_15_CONFIG.md)
**Complete configuration files reference**

**Contents:**
- next.config.ts (Next.js configuration)
- tailwind.config.ts (Tailwind CSS v4)
- tsconfig.json (TypeScript configuration)
- .env.example (Environment variables)
- middleware.ts (Authentication middleware)
- Provider components setup
- Root layouts and error boundaries
- Complete package.json
- Common patterns quick reference
- Performance and security checklists

---

## ⚙️ Quick Reference

### Core Configs

| File | Purpose |
|------|---------|
| `next.config.ts` | Next.js settings |
| `tailwind.config.ts` | Design tokens |
| `tsconfig.json` | TypeScript settings |
| `.env.local` | Environment variables |
| `middleware.ts` | Auth & routing |

### New in Next.js 15

- **Turbopack** (faster builds)
- **Partial Prerendering** (PPR)
- **Server Actions** (type-safe mutations)
- **Enhanced App Router**

---

## 🚀 Setup Commands

```bash
# Create Next.js app
npx create-next-app@latest

# Install dependencies
npm install @tanstack/react-query zustand
npm install @auth/prisma-adapter next-auth@beta
npm install prisma @prisma/client

# Initialize Prisma
npx prisma init

# Run dev server
npm run dev

# Run tests
npm test
```

---

## 📝 Environment Variables

Key environment variables needed:

```bash
# Database
DATABASE_URL=

# NextAuth
NEXTAUTH_SECRET=
NEXTAUTH_URL=

# LiveKit
LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=
LIVEKIT_URL=

# Gemini
GEMINI_API_KEY=

# ElevenLabs
ELEVENLABS_API_KEY=
```

---

## 🎯 Key Differences from React + Vite

| Aspect | React + Vite | Next.js 15 |
|--------|--------------|------------|
| **Routing** | React Router | File-based (App Router) |
| **Data Fetching** | useEffect/TanStack Query | Server Components + fetch |
| **API** | Axios + API routes | Server Actions |
| **CSS** | Tailwind global | Tailwind per component |
| **Env Variables** | VITE_ prefix | NEXT_PUBLIC_ prefix |

---

**[← Back to Migration README](../README.md)**
