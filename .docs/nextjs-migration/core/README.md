# Core Documentation - Next.js 15 Migration

Essential documentation for the Next.js 15 migration.

## 📁 Contents

This folder contains the core planning and strategy documents:

### Overview

- **[README.md](../README.md)** - Main overview and quick start

---

### [NEXTJS_15_ARCHITECTURE.md](./NEXTJS_15_ARCHITECTURE.md)
**Complete Next.js 15 architecture**

**Contents:**
- Project structure and file organization
- Library recommendations (Zustand, TanStack Query, shadcn/ui)
- Server vs Client Components strategy
- Data fetching and state management
- API routes and Server Actions
- Authentication with NextAuth.js v5
- Real-time features (LiveKit, Gemini)
- Performance optimizations
- 12-week migration roadmap

**Key Highlights:**
- 81% JavaScript bundle reduction
- 66% faster Time to Interactive
- Perfect SEO score (90-100)
- Lighthouse score 95

---

### [NEXTJS_15_MIGRATION_GUIDE.md](./NEXTJS_15_MIGRATION_GUIDE.md)
**Step-by-step migration examples**

**Contents:**
- Component migration examples
- API route examples
- Before/after code comparisons
- Authentication migration
- Database integration
- Real-time features
- Service layer architecture

**Key Highlights:**
- AuthContext → NextAuth.js v5
- UserContext → Server Components
- TextChatUI → Server Components pattern
- API calls → Server Actions

---

## 🗓️ Migration Timeline

### Phase 1: Foundation (Week 1-2)
- Next.js 15 setup
- Database design
- Authentication setup

### Phase 2: Core Pages (Week 2-3)
- Server Components
- App Router structure
- UI library (shadcn/ui)

### Phase 3: Chat Features (Week 3-4)
- Server Actions
- Real-time features
- State management

### Phase 4: Advanced Features (Week 4-5)
- Avatar integration
- LiveKit setup
- TTS integration

### Phase 5: Performance (Week 5-6)
- Caching strategies
- Code splitting
- Image optimization

### Phase 6: Testing (Week 6-8)
- Unit tests
- Integration tests
- E2E tests

---

## 📊 Success Metrics

| Metric | Current (React) | Target (Next.js) | Improvement |
|--------|----------------|------------------|-------------|
| **Bundle Size** | 800KB | 150KB | -81% |
| **TTI** | 3.5s | 1.2s | -66% |
| **FCP** | 2.0s | 0.8s | -60% |
| **SEO Score** | 0-40 | 90-100 | +125% |
| **Lighthouse** | 60 | 95 | +58% |

---

## 🔗 Quick Links

**Other Documentation:**
- [Architecture](../architecture/README.md) - System design
- [Configuration](../config/README.md) - Config files
- [Database](../database/README.md) - Database schema

---

**[← Back to Migration README](../README.md)**
