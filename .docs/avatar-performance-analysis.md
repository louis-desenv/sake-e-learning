# Análise de Desempenho - Avatar Bey

## Problema
O avatar está demorando em média **1 minuto** para aparecer após o usuário clicar em "Start".

---

## Análise Técnica

### Fluxo Atual (do clique ao avatar visível)

```
1. Usuário clica "Start"
   ↓
2. Gerar token LiveKit (~100-200ms)
   ↓
3. Conectar ao LiveKit (~500ms-1s)
   ↓
4. Agent dispatch no servidor
   ↓
5. Agent inicializa:
   - Conectar ao room (~1s)
   - Criar voice session (~0.5s)
   - Inicializar Deepgram STT
   - Inicializar Gemini LLM
   - Inicializar Bey Avatar (~3-6s) ← PRIMEIRO GARGALO
   ↓
6. Agent publica video track
   ↓
7. Cliente recebe video track
   ↓
8. Video element anexa track
   ↓
9. Video ready (onCanPlay/onPlaying)
   ↓
10. UI atualiza (300ms delay)
```

### Tempos Observados (logs)

| Etapa | Tempo |
|-------|-------|
| Voice agent ready | ~0.4-0.5s |
| **Bey avatar ready** | **~3-6s** |
| Participant connected | ~6-8s |
| Tempo total (até aparecer) | **~60s** ⚠️ |

> O delay de 1 minuto ocorre porque o agente fica esperando algo antes de publicar o video track, ou o video track não está sendo publicado corretamente.

---

## Comparação: RealTimeMode vs VoiceChatUI

| Feature | RealTimeMode.tsx | VoiceChatUI.tsx |
|---------|------------------|-----------------|
| Spinner durante loading | ❌ Não | ✅ Sim |
| Avatar ready state | ❌ Não tem | ✅ Tem |
| Video track tracking | ❌ Não usa | ✅ Usa |
| onCanPlay handler | ❌ Não tem | ✅ Tem |
| Tempo para aparecer | ~60s | ~10-15s |

---

## Causas Identificadas

### 1. RealTimeMode não tem loading state
- Não mostra spinner enquanto espera o avatar
- Usuário vê tela preta por ~60s

### 2. Video element sempre visível
- Linha 241-250: vídeo sempre renderizado (z-0)
- Não espera `avatarReady` como VoiceChatUI

### 3. Audio bloqueado até video ready
- `useLiveKitRoom.ts` line 240: audio fica muted até video estar pronto

### 4. Delay artificial de 300ms
- `VoiceChatUI.tsx` lines 226-231: setTimeout de 300ms

### 5. Fallback audio-only
- Se video element não existe quando track chega, cai para audio-only

---

## Recomendações

### 🔴 Prioridade Alta (Corrigir Agora)

#### 1. Adicionar loading state no RealTimeMode
```tsx
// Similar ao VoiceChatUI
const [avatarReady, setAvatarReady] = useState(false);

const handleAvatarReady = () => {
  setTimeout(() => setAvatarReady(true), 300);
};

// Mostrar spinner enquanto !isConnected || !avatarReady
```

#### 2. Adicionar logs de tempo no cliente
```tsx
console.time('[Avatar] Total load time');
// Em cada etapa:
console.timeLog('[Avatar] Token generated');
console.timeLog('[Avatar] Connected to room');
console.timeLog('[Avatar] Video track received');
console.timeLog('[Avatar] Video ready');
```

#### 3. Timeout de fallback
- Se após 30s o avatar não aparecer, mostrar erro ou continuar mesmo assim

### 🟡 Prioridade Média (Próximas Sprints)

#### 4. Remover delay artificial de 300ms
- Lines 226-231 em VoiceChatUI.tsx

#### 5. Pre-conectar ao servidor
- Adicionar `<link rel="preconnect">` para LiveKit

#### 6. Warm-up do agente
- Manter agente "quente" entre sessões

### 🟢 Prioridade Baixa (Otimizações)

#### 7. Mover token generation para backend
- Atualmente é client-side (segurança)

#### 8. Cache de video element
- Evitar re-render completo

---

## Próximos Passos

1. **Imediato**: Adicionar logs no frontend para identificar onde está o gargalo exato
2. **Imediato**: Adicionar spinner no RealTimeMode (paridade com VoiceChatUI)
3. **Curto prazo**: Testar se o problema é no servidor ou cliente
4. **Médio prazo**: Otimizar inicialização do agente

---

## Dados para Coleta

Para diagnosticar exatamente onde está o problema, precisamos de:

1. **Logs do cliente** (console do navegador)
   - Tempo desde clique até conectar
   - Tempo até receber video track
   - Tempo até video pode play

2. **Logs do servidor** (já temos)
   - Bey avatar ready: ~3-6s
   - Participant connected: ~6-8s

3. **Network tab**
   - Verificar se há requests pendentes
   - Verificar tamanho do video stream
