# Plano de Implementação: Sistema de Gamificação

## Visão Geral

Implementação incremental do sistema de gamificação do Sakae E-Learning v3. O módulo é construído de dentro para fora: configuração → core engine (pure functions) → persistência → estado React → UI → integração com componentes existentes. Cada etapa é testável de forma independente antes de avançar.

## Tasks

- [x] 1. Criar schema SQL no Supabase
  - Executar o script SQL no SQL Editor do Supabase para criar a tabela `user_gamification_profile`
  - Criar a tabela com campos: `id` (UUID PK), `user_id` (TEXT NOT NULL), `total_xp` (INTEGER DEFAULT 0 CHECK >= 0), `current_level` (INTEGER DEFAULT 1 CHECK 1–5), `level_progress` (INTEGER DEFAULT 0 CHECK 0–100), `created_at`, `updated_at`
  - Adicionar constraint `UNIQUE (user_id)` para garantir unicidade por usuário
  - Criar índice `idx_gamification_user_id` em `user_id`
  - Habilitar RLS com política permissiva (`USING (true)`) alinhada ao padrão atual do projeto
  - _Requirements: 4.1, 4.4, 6.1, 6.2, 6.3_

- [x] 2. Implementar módulo de configuração
  - [x] 2.1 Criar `gamification/gamification.config.ts`
    - Definir interfaces `LevelThreshold`, `TopicAccessRule`, `GamificationConfig`
    - Exportar `DEFAULT_GAMIFICATION_CONFIG` com os 5 níveis (0/30/100/250/500 XP), `xpPerMinute: 1`, `minSessionSeconds: 60` e as 10 regras de acesso a tópicos
    - Implementar `validateConfig(config)` que lança `Error` descritivo para campos inválidos (`xpPerMinute <= 0`, `levelThresholds` vazio, etc.)
    - _Requirements: 8.1, 8.2, 8.6, 8.7_

  - [ ]* 2.2 Escrever testes de exemplo para `gamification.config.ts`
    - Verificar que `DEFAULT_GAMIFICATION_CONFIG` tem exatamente os 5 limiares corretos (Iniciante/Básico/Intermediário/Avançado/Fluente)
    - Verificar que `DEFAULT_GAMIFICATION_CONFIG` tem exatamente 10 regras de acesso com os níveis corretos
    - **Property 10: Validação de Configuração Inválida** — `validateConfig` lança `Error` para `xpPerMinute <= 0`, `levelThresholds` vazio, `topicAccessRules` vazio
    - **Validates: Requisito 8.7**

- [x] 3. Implementar core engine — pure functions
  - [x] 3.1 Criar `gamification/core/xpCalculator.ts`
    - Implementar `calculateXpFromDuration(durationSeconds, config)`: retorna 0 se `durationSeconds < config.minSessionSeconds`, caso contrário `Math.floor((durationSeconds / 60) * config.xpPerMinute)`
    - Implementar `accumulateXp(currentTotalXp, sessionXp)`: retorna `Math.max(0, currentTotalXp + Math.max(0, sessionXp))`
    - Chamar `validateConfig(config)` no início de `calculateXpFromDuration`
    - _Requirements: 1.2, 1.3, 1.4, 7.5, 7.6_

  - [ ]* 3.2 Escrever property tests para `xpCalculator.ts`
    - **Property 1: Proporcionalidade do XP ao Tempo** — para qualquer `durationSeconds` em `[0, 86400]`, `calculateXpFromDuration` retorna `floor(d/60 * xpPerMinute)` e nunca negativo
    - **Validates: Requisitos 1.2, 7.6**
    - **Property 4: Monotonicidade do XP** — para qualquer `currentXp >= 0` e `delta >= 0`, `accumulateXp(currentXp, delta) >= currentXp`
    - **Validates: Requisitos 6.1, 6.4**
    - Usar `fc.integer({ min: 0, max: 86400 })` e `numRuns: 100`

  - [x] 3.3 Criar `gamification/core/levelManager.ts`
    - Implementar `calculateLevel(totalXp, config)`: retorna o maior nível cujo `minXp <= totalXp`
    - Implementar `calculateProgress(totalXp, config)`: retorna `Math.round((earned / range) * 100)` clampado em `[0, 100]`; retorna 100 se nível máximo
    - Implementar `calculateLevelInfo(totalXp, config)`: retorna `LevelInfo` com `level`, `label`, `progress`, `currentLevelXp`, `xpToNextLevel`, `isMaxLevel`
    - Chamar `validateConfig(config)` em todas as funções exportadas
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

  - [ ]* 3.4 Escrever property tests para `levelManager.ts`
    - **Property 3: Completude e Bounds do LevelManager** — para qualquer `totalXp >= 0`, `calculateLevelInfo` produz `level` em `[1,5]`, `progress` em `[0,100]`, `xpToNextLevel >= 0`, `isMaxLevel` correto
    - **Validates: Requisitos 2.2, 2.3, 2.6, 2.7, 6.2, 6.3**
    - **Property 5: Consistência Nível-XP** — `calculateLevel(xp, config)` retorna o maior `n` tal que `levelThresholds[n].minXp <= xp`
    - **Validates: Requisitos 2.2, 6.5**
    - **Property 9: Round-Trip de Cálculo** — `calculateLevelInfo(xp).level == calculateLevel(xp)` e `calculateLevelInfo(xp).progress == calculateProgress(xp)` para qualquer `xp >= 0`
    - **Validates: Requisito 6.6**
    - Usar `fc.integer({ min: 0, max: 10000 })` e `numRuns: 100`

  - [x] 3.5 Criar `gamification/core/accessController.ts`
    - Implementar `isTopicUnlocked(userLevel, topicId, config)`: retorna `false` para tópico desconhecido (fail-safe), `userLevel >= rule.minLevel` para tópicos conhecidos
    - Implementar `getUnlockedTopics(userLevel, config)`: filtra `topicAccessRules` onde `userLevel >= minLevel`
    - Implementar `getAllTopicAccess(userLevel, totalXp, config)`: retorna array de `TopicAccessResult` com `isUnlocked`, `requiredLevel` e `xpRequired = Math.max(0, levelThreshold.minXp - totalXp)`
    - Chamar `validateConfig(config)` em todas as funções exportadas
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 5.4_

  - [ ]* 3.6 Escrever property tests para `accessController.ts`
    - **Property 6: Determinismo do AccessController** — `isTopicUnlocked(level, topicId, config)` chamado múltiplas vezes com os mesmos args sempre retorna o mesmo booleano
    - **Validates: Requisitos 3.2, 3.6**
    - **Property 7: Monotonicidade do Desbloqueio** — para qualquer `level` em `[1,4]`, `getUnlockedTopics(level+1).length >= getUnlockedTopics(level).length`
    - **Validates: Requisitos 3.5, 3.7**
    - **Property 11: XP Faltante para Desbloqueio** — `xpRequired` em `getAllTopicAccess` é `max(0, minXpForLevel - userXp)`; se tópico desbloqueado, `xpRequired == 0`
    - **Validates: Requisito 5.4**
    - Usar `fc.integer({ min: 1, max: 5 })` para nível e `numRuns: 100`

  - [ ]* 3.7 Escrever property tests cross-module (xpCalculator + levelManager)
    - **Property 2: Idempotência do Acúmulo de XP** — aplicar `accumulateXp` com a mesma sessão duas vezes não duplica XP (simular via estado imutável)
    - **Validates: Requisito 1.7**
    - **Property 8: Sensibilidade à Configuração** — para `config1.xpPerMinute != config2.xpPerMinute`, existe `d >= minSessionSeconds` tal que `calculateXpFromDuration(d, config1) != calculateXpFromDuration(d, config2)`
    - **Validates: Requisito 8.9**
    - Usar `fc.record({ xpPerMinute: fc.integer({ min: 1, max: 10 }) })` para gerar configs distintas

- [ ] 4. Checkpoint — Core engine completo
  - Garantir que todos os testes do core engine passam com `npx vitest run gamification/core`
  - Verificar que as 11 propriedades de corretude estão cobertas pelos testes
  - Perguntar ao usuário se há ajustes nas regras de negócio antes de avançar para a camada de persistência

- [x] 5. Implementar camada de persistência
  - [x] 5.1 Criar `gamification/repository/IGamificationRepository.ts`
    - Definir interface `GamificationProfile` com campos: `user_id`, `total_xp`, `current_level`, `level_progress`, `created_at?`, `updated_at?`
    - Definir interface `IGamificationRepository` com métodos: `getProfile(userId)`, `upsertProfile(profile)`, `getOrCreateProfile(userId)`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 5.2 Criar `gamification/repository/GamificationRepository.ts`
    - Implementar `GamificationRepository` como classe que implementa `IGamificationRepository`
    - `getProfile`: query `supabase.from('user_gamification_profile').select('*').eq('user_id', userId).single()`; retorna `null` em erro (exceto PGRST116)
    - `upsertProfile`: `supabase.upsert({ ...profile, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })`
    - `getOrCreateProfile`: chama `getProfile`; se `null`, chama `upsertProfile` com valores padrão; fallback em memória se persistência falhar
    - Exportar singleton `gamificationRepository`
    - _Requirements: 4.2, 4.3, 4.4, 4.5, 4.6, 1.5, 1.6_

  - [ ]* 5.3 Escrever testes de integração para `GamificationRepository.ts`
    - Mockar o cliente Supabase com `vi.mock`
    - Testar que `upsertProfile` chama `supabase.upsert` com `onConflict: 'user_id'` e `updated_at` preenchido
    - Testar que `getOrCreateProfile` retorna perfil padrão em memória quando `upsertProfile` falha
    - Testar que `getProfile` retorna `null` para erro PGRST116 (not found) sem logar erro

- [x] 6. Implementar React Context e hooks
  - [x] 6.1 Criar `gamification/context/GamificationContext.tsx`
    - Definir interfaces `GamificationState` e `GamificationContextType`
    - Implementar `GamificationProvider` com props: `children`, `userId`, `config?`, `repository?` (injeção de dependência para testes)
    - `useEffect` para carregar perfil via `repository.getOrCreateProfile(userId)` quando `userId` muda
    - Derivar `levelInfo` e `topicAccess` via `calculateLevelInfo` e `getAllTopicAccess` a partir do `profile`
    - Implementar `addXp(xpGained)`: atualização otimista do estado → `upsertProfile` no Supabase (fail-safe: erro não reverte estado)
    - Detectar level up comparando `previousLevel` com `newLevelInfo.level`; calcular `newlyUnlockedTopics`
    - Implementar `dismissLevelUp()` e `dismissXpToast()`
    - Exportar `useGamificationContext()` com guard de contexto
    - _Requirements: 1.4, 1.5, 1.6, 2.2, 2.4, 3.4, 4.6, 5.2, 5.3_

  - [x] 6.2 Criar `gamification/hooks/useGamification.ts`
    - Implementar `useGamification()` que consome `useGamificationContext()` e expõe API simplificada
    - Retornar: `totalXp`, `level`, `levelLabel`, `progress`, `xpToNextLevel`, `isMaxLevel`, `isLoading`, `lastXpGained`, `didLevelUp`, `newlyUnlockedTopics`, `topicAccess`, `isTopicUnlocked(topicId)`, `addXp`, `dismissLevelUp`, `dismissXpToast`
    - `isTopicUnlocked(topicId)`: busca em `topicAccess` pelo `topicId` e retorna `isUnlocked ?? false`
    - _Requirements: 3.2, 5.1, 5.2, 5.3, 5.4, 5.6_

  - [x] 6.3 Criar `gamification/hooks/useChatSession.ts`
    - Implementar `useChatSession({ userId, topicId, onSessionEnd, config? })`
    - `useEffect`: registra `startTimeRef = Date.now()` ao montar; adiciona listener `beforeunload`; no cleanup, calcula `durationSeconds`, chama `calculateXpFromDuration` e invoca `onSessionEnd(xpGained, durationSeconds)`
    - Ignorar sessões com `userId` nulo (no-op silencioso)
    - Ignorar sessões com `durationSeconds <= 0`
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [-] 7. Implementar componentes de UI
  - [x] 7.1 Criar `gamification/components/XpProgressBar.tsx`
    - Props: `totalXp`, `level`, `levelLabel`, `progress` (0–100), `xpToNextLevel`, `isMaxLevel`
    - Exibir `LevelBadge` com nível e label, barra de progresso animada com Tailwind, XP total e XP faltante
    - Se `isMaxLevel`, exibir "Nível Máximo Atingido" no lugar da barra de progresso (Requisito 5.6)
    - _Requirements: 5.1, 5.6_

  - [x] 7.2 Criar `gamification/components/LevelBadge.tsx`
    - Props: `level`, `label`, `size?: 'sm' | 'md' | 'lg'`
    - Cores por nível: 1=cinza (`bg-gray-100 text-gray-700`), 2=verde (`bg-green-100 text-green-700`), 3=azul (`bg-blue-100 text-blue-700`), 4=roxo (`bg-purple-100 text-purple-700`), 5=dourado (`bg-yellow-100 text-yellow-700`)
    - _Requirements: 5.1_

  - [x] 7.3 Criar `gamification/components/LockedTopicCard.tsx`
    - Props: `topicId`, `title`, `description`, `requiredLevel`, `xpRequired`, `borderColor`
    - Renderizar card não-clicável com ícone de cadeado, título, descrição, nível necessário e XP faltante
    - Estilo visual consistente com os cards existentes em `GuidedLearning.tsx` e `IaChat.tsx` (mesma estrutura de `border-t-4`, `rounded-2xl`, `shadow-lg`)
    - _Requirements: 3.3, 5.4_

  - [x] 7.4 Criar `gamification/components/XpGainToast.tsx`
    - Props: `xpGained`, `onDismiss`
    - Auto-dismiss após 3 segundos via `useEffect` com `setTimeout`
    - Exibir "+N XP" com animação de entrada (ex: `animate-bounce` ou `translate-y`)
    - _Requirements: 5.2_

  - [x] 7.5 Criar `gamification/components/LevelUpModal.tsx`
    - Props: `newLevel`, `newLevelLabel`, `newlyUnlockedTopics`, `onDismiss`
    - Modal com overlay, mensagem de parabéns, novo nível e lista de tópicos desbloqueados
    - Botão "Continuar" que chama `onDismiss`
    - _Requirements: 5.3_

  - [ ]* 7.6 Escrever snapshot tests para componentes de UI
    - Snapshot de `XpProgressBar` com nível intermediário e com `isMaxLevel = true`
    - Snapshot de `LevelBadge` para cada um dos 5 níveis
    - Snapshot de `LockedTopicCard` com dados de exemplo
    - Snapshot de `XpGainToast` com `xpGained = 3`
    - Snapshot de `LevelUpModal` com novos tópicos desbloqueados

- [ ] 8. Checkpoint — Módulo gamification completo
  - Garantir que todos os testes passam com `npx vitest run gamification`
  - Verificar que os componentes renderizam corretamente de forma isolada
  - Perguntar ao usuário se há ajustes visuais antes de integrar com os componentes existentes

- [x] 9. Integrar `GamificationProvider` no `App.tsx`
  - Importar `GamificationProvider` de `./gamification/context/GamificationContext`
  - Envolver o bloco de rotas protegidas (`{activeUser && <Route element={<AppLayout />}>...}`) com `<GamificationProvider userId={activeUser.id || activeUser.name}>`
  - O `GamificationProvider` deve ficar dentro do `UserProvider` existente e fora do `HashRouter` não — dentro, após o `UserProvider`
  - Garantir que `userId` é derivado de `activeUser.id || activeUser.name` (consistente com o padrão `getUserId` do `TextChatUI`)
  - _Requirements: 4.2, 4.6_

- [x] 10. Integrar `useChatSession` no `TextChatUI.tsx`
  - Importar `useChatSession` de `../gamification/hooks/useChatSession`
  - Importar `useGamification` de `../gamification/hooks/useGamification`
  - Adicionar após os hooks existentes: `const { addXp } = useGamification()`
  - Derivar `topicId` como `topicConfig?.id ?? scenario?.toString() ?? 'unknown'`
  - Chamar `useChatSession({ userId, topicId, onSessionEnd: (xpGained) => { if (xpGained > 0) addXp(xpGained); } })`
  - Nenhuma outra alteração no componente é necessária
  - _Requirements: 1.1, 1.2, 7.1, 7.2, 7.3, 7.4_

- [x] 11. Integrar progresso de gamificação no `HomeDashboard.tsx`
  - Importar `useGamification`, `XpProgressBar`, `LevelUpModal`, `XpGainToast`
  - Desestruturar do hook: `totalXp`, `level`, `levelLabel`, `progress`, `xpToNextLevel`, `isMaxLevel`, `lastXpGained`, `didLevelUp`, `newlyUnlockedTopics`, `dismissLevelUp`, `dismissXpToast`
  - Inserir `<XpProgressBar .../>` após o `<header>` existente
  - Renderizar `<XpGainToast>` condicionalmente quando `lastXpGained > 0`
  - Renderizar `<LevelUpModal>` condicionalmente quando `didLevelUp = true`
  - _Requirements: 5.1, 5.2, 5.3, 5.6_

- [x] 12. Integrar `LockedTopicCard` no `GuidedLearning.tsx`
  - Importar `useGamification` e `LockedTopicCard`
  - Desestruturar `isTopicUnlocked` e `topicAccess` do hook
  - No `map` de `guidedLearningTopicSlugs`: se `!isTopicUnlocked(topic.id)`, renderizar `<LockedTopicCard>` com dados do `topicAccess`; caso contrário, renderizar o `<Link>` existente sem alteração
  - _Requirements: 3.2, 3.3, 5.4_

- [x] 13. Integrar `LockedTopicCard` no `IaChat.tsx`
  - Importar `useGamification` e `LockedTopicCard`
  - Desestruturar `isTopicUnlocked` e `topicAccess` do hook
  - No `map` de `practiceTopicSlugs` (lista de Real-Life): aplicar a mesma lógica condicional do passo 12
  - _Requirements: 3.2, 3.3, 5.4_

- [x] 14. Checkpoint final — Garantir que todos os testes passam
  - Executar `npx vitest run` para rodar toda a suite de testes
  - Verificar que a integração não quebrou nenhum comportamento existente
  - Confirmar que o fluxo completo funciona: abrir chat → encerrar → XP acumulado → toast exibido → nível atualizado no HomeDashboard

## Notas

- Tasks marcadas com `*` são opcionais e podem ser puladas para um MVP mais rápido
- Cada task referencia requisitos específicos para rastreabilidade
- O core engine (Tasks 2–3) é completamente testável sem Supabase ou React
- A injeção de dependência no `GamificationProvider` (`repository?`) permite testes unitários sem mock global do Supabase
- O padrão fail-safe garante que erros de persistência nunca interrompem a experiência de aprendizado
- `userId` deve ser consistente com o padrão atual: `user.id || user.name` (ver `getUserId` em `TextChatUI.tsx`)
