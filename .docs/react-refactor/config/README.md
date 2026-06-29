# Configuration Documentation

All configuration files for React + Vite refactoring.

## 📁 Contents

### [REACT_CONFIG.md](./REACT_CONFIG.md)
**Complete configuration files reference**

**Contents:**
- package.json (all dependencies)
- vite.config.ts (build optimization)
- tailwind.config.js (design tokens)
- TypeScript configs
- Vitest testing setup
- ESLint + Prettier
- Environment variables
- Git hooks (Husky)
- Playwright E2E
- MSW mocking

---

## ⚙️ Quick Reference

### Core Configs

| File | Purpose |
|------|---------|
| `package.json` | Dependencies & scripts |
| `vite.config.ts` | Build & dev server |
| `tailwind.config.js` | Design tokens |
| `tsconfig.json` | TypeScript settings |
| `vitest.config.ts` | Test configuration |

### Quality Tools

| Tool | Purpose |
|------|---------|
| ESLint | Code linting |
| Prettier | Code formatting |
| Husky | Git hooks |
| lint-staged | Pre-commit checks |

---

## 🚀 Setup Commands

```bash
# Install all dependencies
npm install

# Run dev server
npm run dev

# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format
```

---

## 📝 Environment Variables

See [.env.example](../.env.example) for all required environment variables.

---

**Back to [Main README](../README.md)**
