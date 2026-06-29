# Análise do Sistema de Gamificação — Sakae E-Learning

**Data:** Abril 2026  
**Versão atual:** 1.0 (branch `main`)  
**Status:** Funcional em produção (testes ativos)

---

## 1. O que está implementado hoje

### Arquitetura
O sistema foi construído em 4 camadas independentes:

```
gamification.config.ts          ← regras centralizadas
core/ (pure functions)          ← XP, nível, acesso
repository/ (Supabase)          ← persistência
context/ + hooks/ + components/ ← UI e estado React
```

### Funcionalidades ativas
| Feature | Status |
|---|---|
| XP por tempo de sessão (text chat) | ✅ |
| 5 níveis com limiares configuráveis | ✅ |
| Desbloqueio progressivo de tópicos | ✅ |
| Persistência no Supabase | ✅ |
| Barra de XP no HomeDashboard | ✅ |
| Toast de XP ganho | ✅ |
| Modal de level up com tópicos desbloqueados | ✅ |
| Cards bloqueados com cadeado | ✅ |
| Nível e XP na página de perfil | ✅ |
| Voice chat bloqueado no Nível 1 | ✅ |
| Timer de 5 min no Voice Chat (Nível 2) | ✅ |
| Config modular (1 arquivo para mudar tudo) | ✅ |

---

## 2. Problemas identificados

### 2.1 XP só por tempo — sem qualidade
**Problema:** O usuário ganha XP apenas por ficar com o chat aberto. Não importa se ele está engajado, respondendo, ou deixou a aba aberta sem usar.

**Impacto:** Usuários podem "farmar" XP sem aprender nada. Desmotiva quem realmente pratica.

**Solução sugerida:** Adicionar XP por mensagens enviadas e por correções aceitas.

---

### 2.2 Sem streak (sequência de dias)
**Problema:** Não há incentivo para o usuário voltar todos os dias. Um usuário que pratica 1h por semana tem o mesmo progresso que um que pratica 10 min por dia.

**Impacto:** Baixa retenção diária — o maior problema de apps de idiomas.

**Solução sugerida:** Implementar streak diário com bônus de XP multiplicador.

---

### 2.3 Sem feedback de progresso dentro do chat
**Problema:** O usuário só vê o XP ganho depois que sai do chat (toast no HomeDashboard). Durante a sessão, não sabe quanto tempo já praticou nem quanto XP vai ganhar.

**Impacto:** Falta de motivação durante a sessão.

**Solução sugerida:** Mostrar um mini-indicador de tempo/XP dentro do `TextChatUI`.

---

### 2.4 Nível não reflete habilidade real
**Problema:** O nível atual é baseado apenas em tempo de uso, não em desempenho. Um usuário que erra muito sobe de nível igual a um que acerta tudo.

**Impacto:** O nível perde significado como indicador de proficiência.

**Solução sugerida:** Adicionar XP bônus por sessões sem erros de gramática, ou penalidade leve por muitas correções.

---

### 2.5 Sem conquistas (achievements)
**Problema:** Não há marcos além de subir de nível. Não existe reconhecimento por "primeira conversa", "10 sessões", "1 hora de prática", etc.

**Impacto:** Engajamento cai após o usuário atingir o nível máximo.

**Solução sugerida:** Sistema de badges/conquistas desbloqueáveis.

---

### 2.6 Sem ranking ou comparação social
**Problema:** A gamificação é completamente individual. Não há como o usuário se comparar com outros ou competir.

**Impacto:** Perde o componente social que é um dos maiores motivadores em apps como Duolingo.

**Solução sugerida:** Leaderboard semanal por XP ganho na semana.

---

### 2.7 XP não é salvo se o browser fechar abruptamente
**Problema:** O `useChatSession` usa `beforeunload` para tentar salvar, mas em mobile e em alguns browsers isso não é confiável. Se o app travar, o XP da sessão é perdido.

**Impacto:** Frustração do usuário ao perder progresso.

**Solução sugerida:** Salvar XP parcial a cada 60 segundos de sessão (heartbeat).

---

### 2.8 Sem animação de XP acumulando
**Problema:** O XP aparece instantaneamente no número. Não há animação de contagem.

**Impacto:** Feedback visual fraco — o usuário não "sente" o XP sendo ganho.

**Solução sugerida:** Animação de contador numérico ao atualizar o XP total.

---

### 2.9 Config de teste misturada com produção
**Problema:** Os valores atuais (`minSessionSeconds: 10`, `xpPerMinute: 5`) são de teste e estão no mesmo arquivo de produção. Fácil de esquecer de reverter antes de um deploy.

**Impacto:** Usuários reais sobem de nível em segundos, esvaziando o valor da progressão.

**Solução sugerida:** Separar config de desenvolvimento via variável de ambiente.

---

## 3. Melhorias prioritárias (roadmap sugerido)

### 🔴 Alta prioridade (impacto direto na retenção)

#### 3.1 Streak diário
```
Lógica:
- Registrar data da última sessão no user_gamification_profile
- Se o usuário praticou ontem → streak continua
- Se não praticou → streak zera
- Bônus: streak de 3 dias = +50% XP, 7 dias = +100% XP
```

**Tabela:** Adicionar `current_streak`, `longest_streak`, `last_practice_date` em `user_gamification_profile`.

---

#### 3.2 XP por engajamento (não só tempo)
```
Fontes de XP adicionais:
- +1 XP por mensagem enviada no text chat
- +2 XP por sessão sem nenhuma correção de gramática
- +3 XP por completar uma sessão de 5+ minutos
- +5 XP por primeiro acesso ao dia (daily bonus)
```

**Implementação:** Adicionar `xpSources` na `GamificationConfig` com multiplicadores por tipo de ação.

---

#### 3.3 Salvar XP parcial (heartbeat)
```typescript
// Em useChatSession — salvar a cada 60s
useEffect(() => {
  const heartbeat = setInterval(() => {
    const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
    const xp = calculateXpFromDuration(elapsed, config);
    if (xp > lastSavedXp) {
      savePartialXp(xp - lastSavedXp);
      lastSavedXp = xp;
    }
  }, 60_000);
  return () => clearInterval(heartbeat);
}, []);
```

---

### 🟡 Média prioridade (melhora a experiência)

#### 3.4 Mini-indicador de sessão no chat
Mostrar dentro do `TextChatUI` um pequeno badge no canto:
```
⏱ 3:42 · +3 XP estimado
```

---

#### 3.5 Animação de XP
Usar `react-spring` ou CSS `@keyframes` para animar o número de XP subindo quando o toast aparece.

---

#### 3.6 Separar config de teste/produção
```typescript
// gamification.config.ts
const IS_DEV = import.meta.env.DEV;

export const DEFAULT_GAMIFICATION_CONFIG: GamificationConfig = {
  xpPerMinute:       IS_DEV ? 10  : 1,
  minSessionSeconds: IS_DEV ? 10  : 60,
  levelThresholds: IS_DEV
    ? [ /* limiares baixos */ ]
    : [ /* limiares reais  */ ],
  ...
};
```

---

### 🟢 Baixa prioridade (nice to have)

#### 3.7 Sistema de conquistas (badges)
```typescript
interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  condition: (profile: GamificationProfile) => boolean;
}

const ACHIEVEMENTS: Achievement[] = [
  { id: 'first-session',   title: 'Primeira Conversa', condition: p => p.total_xp > 0 },
  { id: 'streak-3',        title: '3 Dias Seguidos',   condition: p => p.current_streak >= 3 },
  { id: 'level-5',         title: 'Fluente!',          condition: p => p.current_level === 5 },
  { id: 'hour-practice',   title: '1 Hora de Prática', condition: p => p.total_time_seconds >= 3600 },
];
```

---

#### 3.8 Leaderboard semanal
- Tabela `weekly_xp` no Supabase com `user_id`, `week`, `xp_this_week`
- Reset automático toda segunda-feira via Supabase Edge Function
- Exibir top 10 na página de perfil

---

#### 3.9 XP por tipo de chat
Diferenciar XP por modalidade para incentivar variedade:
```
Text Chat:  1x XP base
Voice Chat: 2x XP base (mais difícil, mais valioso)
Avatar Chat: 3x XP base (mais imersivo)
```

---

## 4. Débitos técnicos

| Item | Descrição | Esforço |
|---|---|---|
| Testes unitários | Property-based tests com fast-check não foram implementados | Médio |
| Snapshot tests | Componentes de UI sem testes de snapshot | Baixo |
| Config dev/prod | Valores de teste no arquivo de produção | Baixo |
| `beforeunload` mobile | Não confiável em iOS Safari | Alto |
| Retry de persistência | Sem retry automático em falha de rede | Médio |

---

## 5. Métricas para acompanhar após lançamento

Para validar se a gamificação está funcionando, monitorar:

1. **Taxa de retorno diário** — usuários que voltam no dia seguinte
2. **Sessões por usuário por semana** — média de sessões semanais
3. **Tempo médio de sessão** — se aumentou após gamificação
4. **Taxa de conclusão de nível** — % de usuários que chegam ao Nível 3+
5. **Churn por nível** — em qual nível os usuários param de usar o app

---

## 6. Config de produção recomendada

Quando sair do modo de teste, usar estes valores:

```typescript
xpPerMinute: 1,
minSessionSeconds: 60,
levelThresholds: [
  { level: 1, label: 'Iniciante',     minXp: 0    },
  { level: 2, label: 'Básico',        minXp: 30   },
  { level: 3, label: 'Intermediário', minXp: 100  },
  { level: 4, label: 'Avançado',      minXp: 250  },
  { level: 5, label: 'Fluente',       minXp: 500  },
],
voiceChatLimitByLevel: {
  1: 0,      // bloqueado
  2: 300,    // 5 min
  3: 600,    // 10 min
  4: null,   // ilimitado
  5: null,
},
```

---

*Documento gerado em Abril 2026 — atualizar conforme o sistema evolui.*
