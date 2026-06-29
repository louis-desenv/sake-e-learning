# Core Documentation - React Refactoring

Essential documentation for the React + Vite refactoring project.

## 📁 Contents

This folder contains the core planning and strategy documents:

### [README.md](../README.md)
**Main overview and quick start**
- Project goals
- Implementation timeline
- Success metrics
- Quick start guide

---

### [REFACTORING_PLAN.md](./REFACTORING_PLAN.md)
**Complete 8-week refactoring roadmap**

**Contents:**
- Phase-by-phase implementation plan
- Week-by-week breakdown
- Testing infrastructure
- State management strategy
- Design system setup
- Component decomposition
- Performance optimization
- Risk mitigation

**Key Highlights:**
- Target: All components < 300 lines
- 80%+ test coverage goal
- Zero ESLint/TypeScript errors
- Lighthouse score > 90

---

### [LIBRARY_RECOMMENDATIONS.md](./LIBRARY_RECOMMENDATIONS.md)
**Detailed library justifications and comparisons**

**Contents:**
- Testing libraries (Vitest vs Jest)
- State management (TanStack Query, Zustand vs Redux)
- UI components (Radix UI vs MUI/Chakra)
- Forms (React Hook Form vs Formik)
- Validation (Zod vs Yup)
- Utilities (date-fns, clsx, tailwind-merge)

**Key Highlights:**
- Bundle size impact analysis
- Feature comparison tables
- Code examples for each library

---

### [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)
**Step-by-step quick-start guide**

**Contents:**
- Day-by-day implementation tasks
- Copy-paste ready code examples
- Configuration files
- Component extraction examples
- Test writing examples
- Troubleshooting guide

**Key Highlights:**
- Phase 1: Foundation setup (Day 1-2)
- Phase 2: Code quality tools (Day 2-3)
- Phase 3: State management (Day 3-5)
- Phase 4: Design system (Day 5-7)
- Phase 5: Component decomposition (Day 7-14)

---

## 🗓️ Implementation Timeline

### Week 1-2: Foundation
- Testing infrastructure (Vitest, Testing Library)
- Code quality tools (ESLint, Prettier)
- Git hooks (Husky, lint-staged)
- TanStack Query + Zustand setup

### Week 2-3: State Management
- Migrate API calls to TanStack Query
- Create Zustand stores for UI state
- Refactor Context API usage

### Week 3-4: Design System
- Design tokens with Tailwind v4
- Base UI components (Button, Input, Modal)
- Radix UI primitives
- Form handling with React Hook Form

### Week 4-5: Component Decomposition
- Decompose TextChatUI (1,139 lines → 8 components)
- Extract chat components
- Extract TTS components

### Week 5-6: File Structure
- Consolidate util/ and utils/ into lib/
- Create feature modules (chat/, tts/, recording/)
- Update all imports

### Week 6-7: Performance
- Code splitting with React.lazy
- Memoization optimizations
- Virtual scrolling for long lists

### Week 7-8: Testing & Documentation
- Unit tests for components
- Unit tests for hooks
- Integration tests

---

## 📊 Success Metrics

### Code Quality
- [ ] All components < 300 lines
- [ ] 80%+ test coverage
- [ ] Zero ESLint errors
- [ ] Zero TypeScript errors

### Performance
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3s
- [ ] Bundle size reduced by 20%
- [ ] Lighthouse score > 90

---

## 🔗 Quick Links

**Other Documentation:**
- [Design System](../design/README.md) - Style guide and patterns
- [Architecture](../architecture/README.md) - System design
- [Testing](../testing/README.md) - Testing strategy
- [Performance](../performance/README.md) - Optimization guide
- [Configuration](../config/README.md) - Config files

---

**Back to [Main README](../README.md)**
