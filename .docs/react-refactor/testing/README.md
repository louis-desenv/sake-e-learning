# Testing Documentation

Complete testing strategy for the React refactoring.

## 📁 Contents

### [TESTING_GUIDE.md](./TESTING_GUIDE.md)
**Complete testing strategy and examples**

**Contents:**
- Testing philosophy and pyramid
- Unit testing (Vitest + Testing Library)
- Integration testing (MSW)
- E2E testing (Playwright)
- Testing best practices
- Coverage targets (80%+)
- CI/CD integration

**Key Highlights:**
- Real-world test examples
- MSW handlers for API mocking
- Playwright E2E scenarios
- GitHub Actions workflows

---

## 🧪 Testing Stack

| Layer | Tool | Purpose |
|-------|------|---------|
| **Unit** | Vitest + Testing Library | Components, hooks, utils |
| **Integration** | Vitest + MSW | Feature integration |
| **E2E** | Playwright | User flows |
| **Coverage** | Vitest (v8) | Code coverage |

---

## 📊 Coverage Targets

| Category | Target | Priority |
|----------|--------|----------|
| Components | 80%+ | High |
| Hooks | 90%+ | High |
| Utilities | 95%+ | High |
| Services | 70%+ | Medium |
| Pages | 60%+ | Medium |

---

## 📖 Quick Start

### Run Tests

```bash
# Unit tests
npm test

# Watch mode
npm test -- --watch

# Coverage
npm run test:coverage

# E2E tests
npm run test:e2e
```

### Write a Test

```typescript
import { render, screen } from '@testing-library/react';
import { Button } from './Button';

it('renders button correctly', () => {
  render(<Button>Click me</Button>);
  expect(screen.getByRole('button')).toHaveTextContent('Click me');
});
```

---

**Back to [Main README](../README.md)**
