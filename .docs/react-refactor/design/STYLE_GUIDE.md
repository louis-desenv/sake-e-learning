# Style Guide - SAke E-Learning V3

## 📐 Design System Documentation

This document defines the visual design system for the SAke E-Learning platform, ensuring consistency across all components while maintaining the current visual appearance.

---

## 🎨 Color Palette

### Primary Colors

Based on the current application analysis:

```css
/* Brand Blue - Primary */
--color-primary-50: #eff6ff;
--color-primary-100: #dbeafe;
--color-primary-200: #bfdbfe;
--color-primary-300: #93c5fd;
--color-primary-400: #60a5fa;
--color-primary-500: #3b82f6;  /* Main brand color */
--color-primary-600: #2563eb;
--color-primary-700: #1d4ed8;
--color-primary-800: #1e40af;
--color-primary-900: #1e3a8a;

/* Secondary Purple */
--color-secondary-50: #faf5ff;
--color-secondary-100: #f3e8ff;
--color-secondary-200: #e9d5ff;
--color-secondary-300: #d8b4fe;
--color-secondary-400: #c084fc;
--color-secondary-500: #a855f7;  /* Main secondary */
--color-secondary-600: #9333ea;
--color-secondary-700: #7e22ce;
--color-secondary-800: #6b21a8;
--color-secondary-900: #581c87;

/* Accent Cyan */
--color-accent-50: #ecfeff;
--color-accent-100: #cffafe;
--color-accent-200: #a5f3fc;
--color-accent-300: #67e8f9;
--color-accent-400: #22d3ee;
--color-accent-500: #06b6d4;   /* Main accent */
--color-accent-600: #0891b2;
--color-accent-700: #0e7490;
--color-accent-800: #155e75;
--color-accent-900: #164e63;
```

### Semantic Colors

```css
/* Success (Green) */
--color-success-50: #f0fdf4;
--color-success-500: #22c55e;
--color-success-700: #15803d;

/* Warning (Yellow) */
--color-warning-50: #fefce8;
--color-warning-500: #eab308;
--color-warning-700: #a16207;

/* Error (Red) */
--color-error-50: #fef2f2;
--color-error-500: #ef4444;
--color-error-600: #dc2626;
--color-error-700: #b91c1c;

/* Info (Blue) */
--color-info-50: #eff6ff;
--color-info-500: #3b82f6;
--color-info-700: #1d4ed8;
```

### Neutral Grays

```css
/* Gray Scale */
--color-gray-50: #f9fafb;
--color-gray-100: #f3f4f6;
--color-gray-200: #e5e7eb;
--color-gray-300: #d1d5db;
--color-gray-400: #9ca3af;
--color-gray-500: #6b7280;
--color-gray-600: #4b5563;
--color-gray-700: #374151;
--color-gray-800: #1f2937;
--color-gray-900: #111827;
```

### Tailwind Configuration

```javascript
// tailwind.config.js
export default {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        secondary: {
          50: '#faf5ff',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7e22ce',
        },
        accent: {
          50: '#ecfeff',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
        },
        semantic: {
          success: '#22c55e',
          warning: '#eab308',
          error: '#ef4444',
          info: '#3b82f6',
        }
      }
    }
  }
}
```

---

## 📏 Typography

### Font Families

```css
/* Sans Serif (Default) */
--font-sans: 'Inter', system-ui, -apple-system, sans-serif;

/* Monospace (Code) */
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;
```

### Type Scale

```css
/* Text Sizes */
--text-xs: 0.75rem;      /* 12px */
--text-sm: 0.875rem;     /* 14px */
--text-base: 1rem;       /* 16px */
--text-lg: 1.125rem;     /* 18px */
--text-xl: 1.25rem;      /* 20px */
--text-2xl: 1.5rem;      /* 24px */
--text-3xl: 1.875rem;    /* 30px */
--text-4xl: 2.25rem;     /* 36px */
```

### Font Weights

```css
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### Tailwind Typography Classes

```javascript
// tailwind.config.js
export default {
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      }
    }
  }
}
```

---

## 📐 Spacing Scale

### Base Spacing (4px base unit)

```css
--spacing-0: 0;
--spacing-1: 0.25rem;   /* 4px */
--spacing-2: 0.5rem;    /* 8px */
--spacing-3: 0.75rem;   /* 12px */
--spacing-4: 1rem;      /* 16px */
--spacing-5: 1.25rem;   /* 20px */
--spacing-6: 1.5rem;    /* 24px */
--spacing-8: 2rem;      /* 32px */
--spacing-10: 2.5rem;   /* 40px */
--spacing-12: 3rem;     /* 48px */
--spacing-16: 4rem;     /* 64px */
--spacing-20: 5rem;     /* 80px */
```

### Component Spacing Patterns

```css
/* Cards */
--card-padding-sm: var(--spacing-4);
--card-padding-md: var(--spacing-6);
--card-padding-lg: var(--spacing-8);

/* Buttons */
--button-padding-sm: var(--spacing-2) var(--spacing-4);
--button-padding-md: var(--spacing-3) var(--spacing-6);
--button-padding-lg: var(--spacing-4) var(--spacing-8);

/* Form Elements */
--input-padding: var(--spacing-3) var(--spacing-4);
--form-gap: var(--spacing-4);
```

---

## 🔘 Border Radius

```css
--radius-none: 0;
--radius-sm: 0.25rem;    /* 4px */
--radius-base: 0.375rem; /* 6px */
--radius-md: 0.5rem;     /* 8px */
--radius-lg: 0.75rem;    /* 12px */
--radius-xl: 1rem;       /* 16px */
--radius-2xl: 1.5rem;    /* 24px */
--radius-full: 9999px;
```

### Component Border Patterns

```css
/* Buttons */
--button-radius: var(--radius-lg);

/* Cards */
--card-radius: var(--radius-2xl);

/* Inputs */
--input-radius: var(--radius-md);

/* Badges */
--badge-radius: var(--radius-full);
```

---

## 🌗 Shadows

```css
/* Shadow Scale */
--shadow-xs: 0 1px 2px rgb(0 0 0 / 0.05);
--shadow-sm: 0 1px 3px rgb(0 0 0 / 0.1), 0 1px 2px rgb(0 0 0 / 0.06);
--shadow-base: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
--shadow-md: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
--shadow-lg: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
--shadow-xl: 0 25px 50px -12px rgb(0 0 0 / 0.25);
--shadow-2xl: 0 50px 100px -20px rgb(0 0 0 / 0.25);

/* Colored Shadows */
--shadow-primary: 0 10px 15px -3px rgb(59 130 246 / 0.3);
--shadow-secondary: 0 10px 15px -3px rgb(168 85 247 / 0.3);
--shadow-accent: 0 10px 15px -3px rgb(6 182 212 / 0.3);
```

### Component Shadow Patterns

```css
/* Cards */
--card-shadow: var(--shadow-base);
--card-shadow-hover: var(--shadow-lg);

/* Modals */
--modal-shadow: var(--shadow-2xl);

/* Dropdowns */
--dropdown-shadow: var(--shadow-lg);
```

---

## 🎭 Component Styles

### Button Component

```tsx
// Button variants
type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';

type ButtonSize = 'sm' | 'md' | 'lg';

const buttonStyles = {
  primary: 'bg-primary-500 hover:bg-primary-600 text-white shadow-primary',
  secondary: 'bg-secondary-500 hover:bg-secondary-600 text-white shadow-secondary',
  outline: 'border-2 border-primary-500 text-primary-500 hover:bg-primary-50',
  ghost: 'text-primary-600 hover:bg-primary-50',
  destructive: 'bg-error-500 hover:bg-error-600 text-white shadow-error',
};

const buttonSizes = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg',
};
```

### Card Component

```tsx
// Card styles
const cardStyles = {
  base: 'bg-white rounded-2xl shadow-base hover:shadow-lg transition-all duration-300',
  padding: {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  },
  border: {
    blue: 'border-t-4 border-primary-500',
    purple: 'border-t-4 border-secondary-500',
    cyan: 'border-t-4 border-accent-500',
    green: 'border-t-4 border-semantic-success',
    yellow: 'border-t-4 border-semantic-warning',
    red: 'border-t-4 border-semantic-error',
  }
};
```

### Input Component

```tsx
// Input styles
const inputStyles = {
  base: 'w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all',
  error: 'border-error-500 focus:ring-error-500',
  disabled: 'bg-gray-100 cursor-not-allowed',
};
```

### Message Bubble Component

```tsx
// Chat message styles
const messageStyles = {
  user: {
    container: 'justify-end',
    bubble: 'bg-primary-500 text-white rounded-2xl rounded-tr-sm',
  },
  ai: {
    container: 'justify-start',
    bubble: 'bg-gray-100 text-gray-800 rounded-2xl rounded-tl-sm',
  },
  correction: {
    bubble: 'bg-accent-50 text-accent-700 border border-accent-200',
  }
};
```

---

## 🎬 Animations & Transitions

### Duration Scale

```css
--duration-fast: 150ms;
--duration-base: 200ms;
--duration-slow: 300ms;
--duration-slower: 500ms;
```

### Easing Functions

```css
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
```

### Common Transitions

```css
/* Hover transitions */
.transition-base {
  transition: all var(--duration-base) var(--ease-out);
}

/* Color transitions */
.transition-colors {
  transition: color var(--duration-base) var(--ease-out),
              background-color var(--duration-base) var(--ease-out),
              border-color var(--duration-base) var(--ease-out);
}

/* Transform transitions */
.transition-transform {
  transition: transform var(--duration-base) var(--ease-out);
}
```

### Animation Patterns

```css
/* Pulse animation */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Bounce animation */
@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-25%); }
}

/* Spin animation */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Fade in */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Slide up */
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### Tailwind Animation Classes

```javascript
// tailwind.config.js
export default {
  theme: {
    extend: {
      animation: {
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 1s infinite',
        'spin-slow': 'spin 3s linear infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      }
    }
  }
}
```

---

## 🧩 Responsive Breakpoints

```javascript
// tailwind.config.js
export default {
  theme: {
    screens: {
      'xs': '475px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    }
  }
}
```

### Responsive Patterns

```css
/* Mobile-first approach */
.container {
  padding: var(--spacing-4);  /* Mobile default */
}

@media (min-width: 640px) {
  .container {
    padding: var(--spacing-6);  /* Small and up */
  }
}

@media (min-width: 1024px) {
  .container {
    padding: var(--spacing-8);  /* Large and up */
  }
}
```

---

## 🎨 Component Examples

### Example: Navigation Card (Home Dashboard)

```tsx
<Card className="hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
  <Card.Border color="blue" />
  <Card.Content className="p-6">
    <Card.Title className="text-xl font-semibold text-gray-800">
      Practice Zone
    </Card.Title>
    <Card.Description className="text-gray-600 mt-2">
      Voice-only practice sessions
    </Card.Description>
  </Card.Content>
</Card>
```

### Example: Voice Chat Button

```tsx
<button className={cn(
  "w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300",
  isRecording
    ? "bg-error-500 shadow-error scale-110"
    : "bg-primary-500 shadow-primary hover:scale-105"
)}>
  <MicIcon className="w-8 h-8 text-white" />
</button>
```

### Example: Chat Message

```tsx
<div className={cn(
  "flex gap-3 mb-4",
  isUser && "flex-row-reverse"
)}>
  <Avatar src={avatar} alt={name} />
  <div className={cn(
    "max-w-[70%] px-4 py-3 rounded-2xl",
    isUser
      ? "bg-primary-500 text-white rounded-tr-sm"
      : "bg-gray-100 text-gray-800 rounded-tl-sm"
  )}>
    <p className="text-base">{message}</p>
  </div>
</div>
```

---

## 📱 Dark Mode Support (Future)

While the current design doesn't use dark mode, the design system is prepared for future implementation:

```css
[data-theme="dark"] {
  --color-gray-50: #111827;
  --color-gray-900: #f9fafb;
  /* Inverted colors for dark mode */
}
```

---

## 🎯 Usage Guidelines

### Do's
- ✅ Use semantic color names (primary, secondary, semantic-error)
- ✅ Follow spacing scale (4px base unit)
- ✅ Use consistent border radius by component type
- ✅ Apply transitions with consistent duration
- ✅ Use semantic HTML elements

### Don'ts
- ❌ Don't use hardcoded colors (use design tokens)
- ❌ Don't mix different spacing patterns
- ❌ Don't skip responsive breakpoints
- ❌ Don't use arbitrary values in production
- ❌ Don't override styles with !important

---

## 🔄 Migration Strategy

### Phase 1: Design Tokens (Week 1)
1. Create `src/tokens/` directory
2. Define color, spacing, typography tokens
3. Update Tailwind config with tokens

### Phase 2: Component Library (Week 2-3)
1. Create base UI components
2. Apply design tokens consistently
3. Document component variants

### Phase 3: Migration (Week 4-5)
1. Replace hardcoded styles with tokens
2. Migrate to new UI components
3. Update all pages and features

---

## 📚 Resources

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Radix UI Primitives](https://www.radix-ui.com/primitives)
- [Figma Design System](https://www.figma.com/design-system)

---

**Document Version:** 1.0
**Last Updated:** 2025-01-29
**Authors:** SAke E-Learning Team
