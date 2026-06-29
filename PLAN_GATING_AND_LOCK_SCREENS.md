# Planejamento: bloqueio por plano, trial e telas de limite

## Objetivo

Padronizar o controle de acesso por plano entre frontend e WebAPI, usando o bloqueio do chat de voz como base visual e operacional. O resultado esperado é:

- Free, trial, standard, pro e super com regras explícitas.
- Backend como fonte de verdade para plano, trial, quotas e consumo diário.
- Frontend exibindo uma tela de bloqueio consistente, em vez de regras soltas por componente.
- Usuário free vendo uma tela de bloqueio parecida com a do chat de voz quando tentar acessar algo acima do limite.

## Diagnóstico atual

### Frontend

- `pages/chat/VoiceOnlyChat.tsx` já tem o melhor padrão de bloqueio:
  - página centralizada com `bv-page`;
  - card com `bv-card`;
  - ícone circular;
  - título direto;
  - descrição do motivo;
  - painel contextual com nível/XP ou limite;
  - CTA principal para trial/upgrade;
  - CTA secundário para voltar/praticar outra coisa.
- `pages/chat/WithAvatarChat.tsx` segue padrão parecido, mas duplica muito código.
- `components/LimitBlockedModal.tsx` cobre limite em modal para chat texto, mas está menos alinhado com o padrão do chat de voz e usa textos hardcoded.
- `components/TextChatUI.tsx` bloqueia free após limite local de mensagens. Isso precisa ser validado pela API, não só no estado do browser.
- `pages/AvailablePlans.tsx` mostra uma matriz de limites, mas ela ainda não é uma fonte única de regras.
- `services/scenarioGenerationApiService.ts` já recebe `entitlements` do backend para geração de cenários.

### WebAPI

Base analisada: `C:\Users\bielx\source\repos\www\SakaeElearning\SakaeELearning.WebAPI`.

- `Models/User.cs` já possui:
  - `ActivePlanId`, `ActivePlanType`, `ActivePlanCycle`;
  - `TrialStartDate`, `TrialEndDate`, `HasUsedTrial`;
  - `IsTrialActive`;
  - `VoiceSecondsUsedToday`, `LastVoiceChatDate`;
  - `AutomaticScenariosGeneratedToday`, `ManualScenariosGeneratedToday`.
- `Controllers/GamificationController.cs` já resolve limite de voz por plano:
  - trial: 180s/dia;
  - standard: 600s/dia;
  - pro: 1800s/dia;
  - super: ilimitado via `-1`;
  - free: 60s/dia.
- `Controllers/ScenarioGenerationController.cs` já calcula status de geração:
  - free: manual 0;
  - trial: manual 1;
  - standard: manual 3;
  - pro: manual 6;
  - super: manual 10.
- `Controllers/PaymentController.cs` inicia trial via webhook e converte para paid quando Stripe confirma pagamento.

O problema principal é que as regras estão espalhadas. A recomendação é criar um serviço único de entitlements na API e um componente único de bloqueio no frontend.

## Matriz recomendada de planos (Baseada em Padrões de Mercado)

O Sakae agora adota uma arquitetura simplificada e agressiva para retenção e conversão, baseada em práticas comuns de aplicativos de idiomas e IA:

1. **Free (Plano Base):** Projetado para engajamento diário. Oferece "degustações" contínuas para criar o hábito, mas com barreiras duras de cota.
2. **Trial (7 Dias):** Não é um plano separado, mas sim o **acesso temporário ao plano PRO ou Standard**.
3. **Standard/Pro (Assinaturas):** Projetados para prática fluente sem interrupções.

| Recurso | Free | Trial (Ex: 7-Day Pro) | Standard | Pro |
| --- | ---: | ---: | ---: | ---: |
| Chat texto | 10 mensagens/dia | 500 mensagens/mês | 100 mensagens/mês | 500 mensagens/mês |
| Chat voz | 1 min/dia | 30 min/dia | 10 min/dia | 30 min/dia |
| Avatar IA | 1 min total (teste único) | 30 min/dia | Bloqueado | 30 min/dia |
| Cenários automáticos | Permitido, 2/dia | 2/dia | 2/dia | 2/dia |
| Cenários manuais | Bloqueado | 6/dia | 3/dia | 6/dia |
| Feedback avançado | Bloqueado | Completo | Básico | Completo |

### Decisão Estratégica Aplicada:

- **Free com Limites Diários:** Ao invés de limites mensais ou vitalícios, o Free possui "10 mensagens de texto/dia" e "1 min de voz/dia". O bloqueio ocorre de forma imediata quando a cota é atingida, utilizando um Paywall (`FeatureLockScreen`) elegante e em tela cheia (como ocorria antes no Voice Chat, e como o ChatGPT faz). A cota renova à meia-noite (UTC).
- **Trial = Pro:** O usuário começa o Free, encontra a barreira (`FeatureLockScreen`) e assina o "Trial de 7 Dias do Pro". Durante esses 7 dias, a API reconhece o plano como `Pro`.
- **Bloqueio Padrão:** Qualquer esgotamento de cota no Free renderiza o `FeatureLockScreen` integrado, impedindo o uso e ofertando o upgrade.

## Estados de acesso

Toda checagem deveria retornar um dos estados abaixo:

| Estado | Significado | UI recomendada |
| --- | --- | --- |
| `allowed` | Usuário pode usar agora | Renderiza recurso normal |
| `trial_available` | Usuário free pode iniciar teste curto | Tela base do chat de voz com CTA "Iniciar teste" |
| `quota_exhausted` | Limite do período acabou | Tela de bloqueio com tempo de reset e CTA upgrade |
| `plan_required` | Plano atual não libera recurso | Tela de bloqueio com comparação de plano |
| `level_required` | Plano permite, mas nível ainda não | Tela de bloqueio com XP restante |
| `trial_expired` | Trial de assinatura acabou ou teste local acabou | Tela de bloqueio com CTA de upgrade |

## API recomendada

### 1. Criar serviço central de entitlements

Adicionar na WebAPI:

- `Services/IEntitlementService.cs`
- `Services/EntitlementService.cs`
- `DTOs/EntitlementDtos.cs`

Responsabilidade:

- Normalizar plano atual:
  - `free`, `trial`, `standard`, `pro`, `super`.
- Calcular limites por recurso.
- Calcular uso atual.
- Retornar decisão de acesso.
- Gerar motivo de bloqueio consistente para o frontend.

Formato sugerido:

```csharp
public sealed record EntitlementDecisionDto(
    string Feature,
    string Plan,
    string Status,
    int? Limit,
    int Used,
    int? Remaining,
    DateTime? ResetAtUtc,
    string? RequiredPlan,
    int? RequiredLevel,
    string ReasonCode
);
```

`Limit = null` significa ilimitado. `Remaining = null` também significa ilimitado.

### 2. Criar endpoint de status geral

Adicionar controller ou expandir um existente:

```http
GET /api/entitlements/status
```

Resposta:

```json
{
  "plan": "free",
  "isTrial": false,
  "trialEndsAtUtc": null,
  "features": {
    "text_chat": {
      "status": "allowed",
      "limit": 5,
      "used": 2,
      "remaining": 3,
      "resetAtUtc": "2026-07-01T00:00:00Z"
    },
    "voice_chat": {
      "status": "allowed",
      "limit": 60,
      "used": 0,
      "remaining": 60,
      "resetAtUtc": "2026-06-25T00:00:00Z"
    },
    "avatar_chat": {
      "status": "trial_available",
      "limit": 60,
      "used": 0,
      "remaining": 60
    },
    "manual_scenarios": {
      "status": "plan_required",
      "limit": 0,
      "used": 0,
      "remaining": 0,
      "requiredPlan": "trial"
    }
  }
}
```

### 3. Padronizar endpoints de consumo

Os endpoints que consomem quota devem validar no backend antes de executar:

- Texto:
  - criar `POST /api/chat/text/use` ou validar dentro do endpoint real de mensagem, se existir.
  - free não pode depender de contador local em `TextChatUI`.
- Voz:
  - manter `POST /api/Gamification/voice/use`, mas mover regra para `EntitlementService`.
  - retornar `429` com `entitlement` quando acabar.
- Avatar:
  - tratar como feature própria `avatar_chat`, mesmo que compartilhe segundos de voz.
  - recomendado separar consumo de avatar de consumo de voz para precificar melhor.
- Cenários:
  - `ScenarioGenerationController` já está perto do ideal.
  - mover `BuildStatus`, `NormalizePlan` e limites para `EntitlementService`.

### 4. Resposta padrão de bloqueio

Todos os endpoints devem retornar `429` ou `403` no mesmo formato:

```json
{
  "message": "Voice daily limit reached.",
  "entitlement": {
    "feature": "voice_chat",
    "plan": "free",
    "status": "quota_exhausted",
    "limit": 60,
    "used": 60,
    "remaining": 0,
    "resetAtUtc": "2026-06-25T00:00:00Z",
    "requiredPlan": "standard",
    "reasonCode": "voice_daily_limit_reached"
  }
}
```

Uso recomendado de status HTTP:

- `403 Forbidden`: plano ou nível não libera o recurso.
- `429 Too Many Requests`: plano libera, mas quota acabou.
- `402 Payment Required`: opcional, mas menos confiável para clientes genéricos; eu usaria `403`.

## Dados que provavelmente precisam entrar na WebAPI

Hoje há uso diário de voz e cenários, mas não há quota persistida clara para texto/avatar. Recomendo adicionar:

```csharp
public DateTime? TextChatUsagePeriodStart { get; set; }
public int TextMessagesUsedThisPeriod { get; set; }

public DateTime? AvatarUsageDate { get; set; }
public int AvatarSecondsUsedToday { get; set; }
public int AvatarTrialSecondsUsedLifetime { get; set; }
```

Observações:

- Chat texto é melhor mensal, porque a matriz atual fala em mensagens/mês.
- Voz e avatar são melhores diários por custo e hábito.
- Trial local via `localStorage` deve virar API quando o usuário está logado, senão basta limpar navegador para ganhar novo teste.

## Frontend recomendado

### 1. Criar componente único de bloqueio

Criar:

- `components/access/FeatureLockScreen.tsx`

Esse componente deve substituir duplicações em:

- `pages/chat/VoiceOnlyChat.tsx`;
- `pages/chat/WithAvatarChat.tsx`;
- `components/LimitBlockedModal.tsx` quando o bloqueio for de página cheia.

Base visual: o bloco de `VoiceOnlyChat.tsx`.

Props sugeridas:

```ts
type FeatureLockStatus =
  | 'trial_available'
  | 'quota_exhausted'
  | 'plan_required'
  | 'level_required'
  | 'trial_expired';

interface FeatureLockScreenProps {
  feature: 'text' | 'voice' | 'avatar' | 'scenario' | 'history';
  status: FeatureLockStatus;
  title: string;
  description: string;
  currentPlanLabel: string;
  requiredPlanLabel?: string;
  limitLabel?: string;
  remainingLabel?: string;
  resetLabel?: string;
  xpToNextLevel?: number;
  primaryAction: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}
```

### 2. Criar hook de entitlements

Criar:

- `hooks/useEntitlements.ts`

Responsabilidade:

- buscar `GET /api/entitlements/status`;
- expor `canUse(feature)`;
- expor `getLock(feature)`;
- atualizar status após consumo;
- evitar regras duplicadas no componente.

### 3. Quando usar página vs modal

Usar tela de bloqueio de página cheia quando:

- usuário entra em uma rota bloqueada (`/chat/voice-only`, `/livekit-chat`, avatar, histórico premium);
- recurso é o conteúdo principal da página.

Usar modal quando:

- usuário já está dentro de uma experiência e bateu limite durante uso;
- exemplo: digitou a próxima mensagem e ultrapassou quota.

Mesmo no modal, visual e textos devem vir do mesmo `entitlement`.

## Fluxos recomendados

### Free abre chat de voz

1. Frontend chama status de entitlements.
2. API retorna `voice_chat.status = allowed` com `remaining = 60`, ou `trial_available` se quiser manter teste explícito.
3. UI mostra tela base do chat de voz com:
   - "Experimente voz por 1 minuto";
   - "Iniciar teste";
   - "Fazer upgrade".
4. Ao iniciar, frontend chama endpoint de uso/session start.
5. Ao finalizar, API registra segundos.
6. Se consumir tudo, próxima entrada mostra `quota_exhausted`.

### Free excede chat texto

1. Ao enviar mensagem, frontend chama endpoint normal.
2. API valida quota mensal.
3. Se excedeu, retorna `429` com `entitlement`.
4. UI abre modal ou substitui input por bloqueio:
   - "Limite de mensagens atingido";
   - "Você usou 5/5 mensagens do Free este mês";
   - "Standard libera 100 mensagens/mês";
   - CTA "Ver planos".

### Free tenta gerar cenário manual

1. `ScenarioGenerationController` retorna `403` ou `429` com `manual_scenarios.status = plan_required`.
2. UI mostra tela/modal:
   - "Cenários personalizados manuais são premium";
   - Trial libera 1 por dia;
   - Standard libera 3 por dia.

### Trial expira sem converter

1. Webhook ou rotina de leitura detecta `TrialEndDate <= UtcNow`.
2. `IsTrialActive` fica falso automaticamente.
3. `HasUsedTrial` continua true.
4. Plano normalizado vira `free`.
5. UI mostra:
   - "Seu trial terminou";
   - "Assine para continuar com os recursos Pro";
   - sem CTA de iniciar novo trial.

## Ordem de implementação recomendada

### Fase 1: Contrato e fonte de verdade

1. Criar DTOs de entitlement na WebAPI.
2. Criar `IEntitlementService`.
3. Mover regras de voz e cenário para esse serviço.
4. Criar `GET /api/entitlements/status`.
5. Adicionar testes unitários para matriz de planos.

### Fase 2: Consumo e bloqueio real

1. Adicionar colunas de uso para chat texto e avatar.
2. Validar quota no backend antes de:
   - enviar mensagem;
   - iniciar/registrar voz;
   - iniciar/registrar avatar;
   - gerar cenário.
3. Padronizar erro `403/429` com `entitlement`.

### Fase 3: Padronização visual

1. Criar `FeatureLockScreen`.
2. Migrar `VoiceOnlyChat` para usar esse componente.
3. Migrar `WithAvatarChat`.
4. Atualizar `LimitBlockedModal` para receber dados padronizados.
5. Remover textos hardcoded e adicionar traduções.

### Fase 4: UX de planos

1. Atualizar `AvailablePlans` para usar a mesma matriz de produto.
2. Mostrar "seu plano atual" e "próximo desbloqueio".
3. Em cada bloqueio, levar para `/plans?from=voice_chat&required=standard`.
4. Destacar automaticamente o plano recomendado.

## Critérios de aceite

- Free não consegue ultrapassar limite limpando `localStorage`.
- Trial vencido volta para regras Free sem permitir novo trial.
- Todos os bloqueios de rota principal usam o mesmo layout base do chat de voz.
- Todo bloqueio vindo da API carrega `feature`, `status`, `limit`, `used`, `remaining`, `resetAtUtc` e `requiredPlan` quando aplicável.
- `AvailablePlans` mostra os mesmos limites que a API aplica.
- Chat texto, voz, avatar e cenários não têm regras de plano duplicadas em componentes.

## Riscos e decisões pendentes

- Definir se Avatar consome o mesmo limite de voz ou quota separada. Minha recomendação: quota separada, porque custo e valor percebido são diferentes.
- Definir se Free terá histórico bloqueado totalmente ou limitado às últimas 3 sessões. Minha recomendação: últimas 3 sessões para dar valor e incentivar upgrade.
- Definir se Super é realmente ilimitado ou "fair use". Minha recomendação técnica: usar ilimitado na UI, mas manter proteção interna alta para evitar abuso.
- Definir reset mensal de texto: primeiro dia do mês UTC é simples; ciclo de assinatura é mais justo, mas exige mais complexidade.

## Arquivos prováveis de mudança

Frontend:

- `components/access/FeatureLockScreen.tsx`
- `hooks/useEntitlements.ts`
- `services/entitlementApiService.ts`
- `pages/chat/VoiceOnlyChat.tsx`
- `pages/chat/WithAvatarChat.tsx`
- `components/LimitBlockedModal.tsx`
- `components/TextChatUI.tsx`
- `pages/AvailablePlans.tsx`
- `translations/pt.json`
- `translations/en.json`

WebAPI:

- `DTOs/EntitlementDtos.cs`
- `Services/IEntitlementService.cs`
- `Services/EntitlementService.cs`
- `Controllers/EntitlementsController.cs`
- `Controllers/GamificationController.cs`
- `Controllers/ScenarioGenerationController.cs`
- `Controllers/PaymentController.cs`
- `Models/User.cs`
- `Data/AppDbContext.cs`
- nova migration para uso de texto/avatar
