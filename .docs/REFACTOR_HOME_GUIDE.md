# Refatoração da Home - Passo a Passo

**Para você executar e aprender**

Dependências já instaladas: ✅

---

## Passo 1: Criar Design Tokens (10 min)

### Criar o arquivo: `src/tokens/index.ts`

Você precisa criar uma pasta `src` na raiz do projeto (se não existir) e criar o arquivo `tokens/index.ts` com este código:

```typescript
// src/tokens/index.ts

// Cores baseadas no documento design-tokens-cores.md
export const colors = {
  // Primary - Azul da marca
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    900: '#1e3a8a',
    // Cor customizada da marca
    brand: '#4a7cf5',
    brandHover: '#3a6ce5',
    brandLight: '#6b9cf7',
  },

  // Secondary - Roxo
  secondary: {
    400: '#c084fc',
    500: '#a855f7',
    600: '#9333ea',
    700: '#7c3aed',
    800: '#6b21a8',
    900: '#581c87',
  },

  // Accent - Ciano
  accent: {
    50: '#ecfeff',
    500: '#06b6d4',
    600: '#0891b2',
  },

  // Gray - Neutros
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },

  // Semantic - Cores semânticas
  semantic: {
    success: {
      400: '#34d399',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
    },
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      500: '#eab308',
      600: '#ca8a04',
      800: '#a16207',
    },
    error: {
      400: '#f87171',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
    },
    info: {
      400: '#60a5fa',
    },
  },

  // Border colors dos cards
  borders: {
    green: '#22c55e',
    purple: '#a855f7',
    yellow: '#eab308',
    red: '#ef4444',
    blue: '#3b82f6',
    orange: '#f97316',
  },
};

// Espaçamento
export const spacing = {
  xs: '0.5rem',    // 8px
  sm: '0.75rem',   // 12px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  '2xl': '3rem',   // 48px
  '3xl': '4rem',   // 64px
};

// Border radius
export const radius = {
  sm: '0.5rem',   // 8px
  md: '0.75rem',  // 12px
  lg: '1rem',     // 16px
  xl: '1.5rem',   // 24px
  '2xl': '2rem',  // 32px
  full: '9999px', // round
};

// Shadow
export const shadow = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
};
```

**O que fazer:**
1. Crie a pasta `src` na raiz do projeto (se não existir)
2. Dentro de `src`, crie a pasta `tokens`
3. Crie o arquivo `index.ts` com o código acima

---

## Passo 2: Criar utilitário `cn()` (5 min)

### Criar o arquivo: `src/lib/cn.ts`

```typescript
// src/lib/cn.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combina classes Tailwind sem conflitos
 * @example cn("px-4 py-2", isActive && "bg-blue-500")
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

**O que fazer:**
1. Crie a pasta `src/lib` (se não existir)
2. Crie o arquivo `cn.ts` com o código acima

---

## Passo 3: Atualizar Tailwind Config (5 min)

### Editar: `tailwind.config.js`

```javascript
// tailwind.config.js
export default {
  content: ['./index.html', './**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          900: '#1e3a8a',
          brand: '#4a7cf5',
        },
        secondary: {
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7c3aed',
          800: '#6b21a8',
          900: '#581c87',
        },
        accent: {
          50: '#ecfeff',
          500: '#06b6d4',
          600: '#0891b2',
        },
      },
      borderRadius: {
        '2xl': '1.5rem',
      },
    },
  },
  plugins: [],
};
```

**O que fazer:**
1. Abra o arquivo `tailwind.config.js` na raiz
2. Substitua o conteúdo pelo código acima

---

## Passo 4: Separar componentes da Home (30 min)

### 4.1 Criar HeaderSection

Criar: `src/components/home/HeaderSection.tsx`

```typescript
// src/components/home/HeaderSection.tsx
import React from 'react';
import { cn } from '../../lib/cn';

interface HeaderSectionProps {
  userName: string;
}

export function HeaderSection({ userName }: HeaderSectionProps) {
  const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <header className="mb-8">
      <h1 className={cn(
        "text-3xl sm:text-4xl font-bold text-gray-800"
      )}>
        {getGreeting()}, {userName}!
      </h1>
      <p className="text-gray-500 mt-1">
        Ready to improve your English today?
      </p>
    </header>
  );
}
```

### 4.2 Criar FeaturedCard

Criar: `src/components/home/FeaturedCard.tsx`

```typescript
// src/components/home/FeaturedCard.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/cn';

export function FeaturedCard() {
  return (
    <div className="lg:col-span-2">
      <div className={cn(
        "bg-primary-600 text-white p-8 rounded-2xl shadow-lg",
        "flex flex-col md:flex-row items-center justify-between"
      )}>
        <div>
          <h2 className="text-2xl font-bold">
            Talk to a Ultra-realist Avatar
          </h2>
          <p className="mt-2 opacity-80 max-w-lg">
            Practice your speaking and listening skills with a real-time
            voice chat with your AI tutor.
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <Link
            to="/chat/with-avatar"
            className={cn(
              "bg-white text-primary-600 font-bold",
              "py-3 px-6 rounded-lg shadow-md",
              "hover:bg-gray-100",
              "transition-transform transform hover:scale-105"
            )}
          >
            Talk Now
          </Link>
        </div>
      </div>
    </div>
  );
}
```

### 4.3 Criar NavigationGrid

Criar: `src/components/home/NavigationGrid.tsx`

```typescript
// src/components/home/NavigationGrid.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/cn';

interface NavCardProps {
  title: string;
  description: string;
  to: string;
  borderColor: string;
  icon: React.ReactNode;
}

function NavCard({ title, description, to, borderColor, icon }: NavCardProps) {
  return (
    <Link to={to} className={cn(
      "block p-6 rounded-2xl bg-white shadow-lg",
      "hover:shadow-xl hover:-translate-y-1",
      "transition-all duration-300",
      "border-t-4",
      borderColor
    )}>
      <div className="flex items-center space-x-4">
        <div className="text-3xl">{icon}</div>
        <div>
          <h3 className="font-bold text-lg text-gray-800">{title}</h3>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>
    </Link>
  );
}

const navItems = [
  {
    title: "Guided Learning",
    description: "Structured lessons on grammar, vocabulary, and more.",
    to: "/guided-learning",
    borderColor: "border-t-green-500",
    icon: "📚", // BookOpenIcon
  },
  {
    title: "IA Library",
    description: "Explore videos and learning resources.",
    to: "/library",
    borderColor: "border-t-purple-500",
    icon: "🎬", // VideoCameraIcon
  },
  {
    title: "My Profile",
    description: "Track your progress and achievements.",
    to: "/profile",
    borderColor: "border-t-yellow-500",
    icon: "👤", // UserCircleIcon
  },
  {
    title: "Practice Zone",
    description: "Quick exercises and daily challenges.",
    to: "/chat",
    borderColor: "border-t-red-500",
    icon: "💬", // ChatIcon
  },
  {
    title: "GPT Voice Chat",
    description: "Real-time voice conversation with OpenAI GPT agent.",
    to: "/voice-chat",
    borderColor: "border-t-blue-500",
    icon: "🎤", // MicrophoneIcon
  },
  {
    title: "LiveKit Voice Agent",
    description: "AI voice chat powered by Google Gemini native audio.",
    to: "/livekit-chat",
    borderColor: "border-t-orange-500",
    icon: "🎙️", // MicrophoneIcon
  },
];

export function NavigationGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
      {navItems.map((item) => (
        <NavCard
          key={item.to}
          title={item.title}
          description={item.description}
          to={item.to}
          borderColor={item.borderColor}
          icon={item.icon}
        />
      ))}
    </div>
  );
}
```

---

## Passo 5: Refatorar HomeDashboard.tsx (10 min)

### Substituir o conteúdo de: `pages/HomeDashboard.tsx`

```typescript
// pages/HomeDashboard.tsx
/**
 * Home Dashboard Page - Refatorado
 *
 * @version 3.1.0
 */

import React from 'react';
import { useUser } from '../context/UserContext';
import { HeaderSection } from '../src/components/home/HeaderSection';
import { FeaturedCard } from '../src/components/home/FeaturedCard';
import { NavigationGrid } from '../src/components/home/NavigationGrid';

const HomeDashboard: React.FC = () => {
  const { user } = useUser();

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">
      <HeaderSection userName={user.name} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {/* Featured Card - Full Width */}
        <FeaturedCard />

        {/* Navigation Cards */}
        <NavigationGrid />
      </div>
    </div>
  );
};

export default HomeDashboard;
```

---

## Resumo do que você precisa fazer:

### ✅ Checklist

1. [ ] Criar pasta `src/` (se não existir)
2. [ ] Criar `src/tokens/index.ts` com as cores
3. [ ] Criar `src/lib/cn.ts` com a função `cn()`
4. [ ] Editar `tailwind.config.js`
5. [ ] Criar `src/components/home/HeaderSection.tsx`
6. [ ] Criar `src/components/home/FeaturedCard.tsx`
7. [ ] Criar `src/components/home/NavigationGrid.tsx`
8. [ ] Editar `pages/HomeDashboard.tsx`
9. [ ] Testar rodando `npm run dev`

---

## Comandos para testar:

```bash
# Rodar o projeto
npm run dev

# Acessar no navegador
http://localhost:3000/#/home
```

---

**Dúvidas? Me pergunte!**
