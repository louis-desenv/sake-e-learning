# Deploy do Agente LiveKit no Modal.com

## Visão Geral

Este documento descreve como fazer deploy do agente de voz LiveKit (Sakae E-Learning) na plataforma Modal.com.

O Modal.com é uma plataforma serverless que suporta WebSockets persistentes, tornando-o adequado para agentes LiveKit que requerem conexões de longa duração.

## Pré-requisitos

### Conta e CLI

1. **Criar conta no Modal.com:**
   - Acesse https://modal.com/signup
   - Configure o método de pagamento (plano free tem $30/mês)

2. **Instalar CLI:**
   ```bash
   pip install modal
   modal setup
   ```

3. **Autenticar:**
   ```bash
   modal token new
   ```

### Ambiente Local

1. **Construir o projeto:**
   ```bash
   pnpm install
   pnpm build
   ```

2. **Verificar o arquivo `agent.js` gerado:**
   ```bash
   ls dist/server/agent.js
   ```

---

## Secrets Necessários

O agente requer as seguintes variáveis de ambiente:

| Variável | Descrição | Obrigatório |
|----------|-----------|--------------|
| `LIVEKIT_URL` | URL do servidor LiveKit (wss://xxx.livekit.cloud) | ✅ |
| `LIVEKIT_API_KEY` | Chave API do LiveKit | ✅ |
| `LIVEKIT_API_SECRET` | Segredo API do LiveKit | ✅ |
| `GOOGLE_API_KEY` | Chave API do Google/Gemini | ✅ |
| `DEEPGRAM_API_KEY` | Chave API do Deepgram (STT) | ✅ |
| `BEY_API_KEY` | Chave API do Bey Avatar (opcional) | ❌ |
| `BEY_AVATAR_ID` | ID do Avatar Bey (opcional) | ❌ |

### Criar Secrets no Modal

```bash
# Secret para LiveKit
modal secret create sakae-livekit-secret \
  LIVEKIT_URL=wss://sua-url.livekit.cloud \
  LIVEKIT_API_KEY=sua-api-key \
  LIVEKIT_API_SECRET=sua-api-secret

# Secret para provedores de IA
modal secret create sakae-ai-secret \
  GOOGLE_API_KEY=sua-google-key \
  DEEPGRAM_API_KEY=sua-deepgram-key

# Secret opcional para Bey Avatar
modal secret create sakae-bey-secret \
  BEY_API_KEY=sua-bey-key \
  BEY_AVATAR_ID=seu-avatar-id
```

---

## Arquivo de Configuração

### `modal_agent.py`

Crie o arquivo `modal_agent.py` na raiz do projeto:

```python
"""
Deploy do Sakae E-Learning Agent no Modal.com
=============================================

Este arquivo configura o deploy do agente de voz LiveKit no Modal.com.
O agente conecta ao servidor LiveKit via WebSocket e participa das salas
como um participante programático.

Referências:
- https://modal.com/docs
- https://docs.livekit.io/agents/
- https://modal.com/blog/livekit-modal
"""

import modal
import os
import subprocess
import signal
import sys

# ============================================================
# CONFIGURAÇÃO DA IMAGEM
# ============================================================

# Imagem base: Node.js 22 (LTS)
# Usamos debian-slim para manter a imagem pequena
image = modal.Image.from_registry("node:22-slim")

# Instalar pnpm globalmente
image = image.run_commands("npm install -g pnpm")

# ============================================================
# DIRETÓRIO DE TRABALHO
# ============================================================

# Copiar arquivos do projeto para /app
# Isso inclui: package.json, tsconfig, código fonte, etc.
image = image.copy(".", "/app")

# Definir diretório de trabalho
image = image.workdir("/app")

# ============================================================
# INSTALAÇÃO DE DEPENDÊNCIAS
# ============================================================

# Instalar dependências do projeto
# --frozen-lockfile garante reprodutibilidade
image = image.run_commands("pnpm install --frozen-lockfile")

# Build do TypeScript
image = image.run_commands("pnpm build")

# ============================================================
# CONFIGURAÇÃO DA APLICAÇÃO
# ============================================================

# Nome da aplicação no Modal
APP_NAME = "sakae-agent"

# Criar a aplicação
app = modal.App(APP_NAME, image=image)

# ============================================================
# FUNÇÃO PRINCIPAL
# ============================================================

@app.function(
    # Secrets necessários para o agente
    secrets=[
        # LiveKit
        modal.Secret.from_name("sakae-livekit-secret"),
        # Provedores de IA
        modal.Secret.from_name("sakae-ai-secret"),
        # Bey Avatar (opcional)
        modal.Secret.from_name("sakae-bey-secret"),
    ],
    # Configurações de runtime
    timeout=86400,  # 24 horas (máximo para funções de longa duração)
    cpu=2,          # 2 CPUs
    memory=4096,   # 4GB RAM (recomendado para agentes com IA)
)
@modal.concurrent(max_inputs=1000)
def run_agent():
    """
    Função principal que executa o agente LiveKit.
    
    O agente:
    1. Conecta ao servidor LiveKit via WebSocket
    2. Registra-se como worker disponível
    3. Aguarda dispatch para salas de aula
    4. Participa como agente de voz
    
    Esta função fica em execução permanente, processando
    múltiplas sessões de agente simultaneamente.
    """
    
    print("=" * 60)
    print("🚀 Iniciando Sakae E-Learning Agent")
    print("=" * 60)
    
    # Verificar variáveis de ambiente
    required_env = [
        "LIVEKIT_URL",
        "LIVEKIT_API_KEY", 
        "LIVEKIT_API_SECRET",
    ]
    
    missing = [var for var in required_env if not os.environ.get(var)]
    if missing:
        print(f"❌ ERRO: Variáveis de ambiente faltando: {missing}")
        sys.exit(1)
    
    print(f"✅ LIVEKIT_URL: {os.environ.get('LIVEKIT_URL')}")
    print(f"✅ LIVEKIT_API_KEY: {os.environ.get('LIVEKIT_API_KEY')[:10]}...")
    
    # Verificar Google API Key
    if os.environ.get("GOOGLE_API_KEY"):
        print("✅ GOOGLE_API_KEY configurada")
    else:
        print("⚠️ GOOGLE_API_KEY não configurada")
    
    # Verificar Deepgram API Key
    if os.environ.get("DEEPGRAM_API_KEY"):
        print("✅ DEEPGRAM_API_KEY configurada")
    else:
        print("⚠️ DEEPGRAM_API_KEY não configurada")
    
    print("-" * 60)
    print("📡 Conectando ao servidor LiveKit...")
    print("-" * 60)
    
    # Executar o agente
    # O comando 'start' inicia o worker que fica aguardando jobs
    try:
        result = subprocess.run(
            ["node", "dist/server/agent.js", "start"],
            env=os.environ,
            cwd="/app",
        )
    except KeyboardInterrupt:
        print("\n🛑 Agente encerrado pelo usuário")
    except Exception as e:
        print(f"❌ ERRO ao executar agente: {e}")
        sys.exit(1)

# ============================================================
# WEBHOOK (para health checks)
# ============================================================

@app.function()
@app.asgi_app()
def webhook():
    """
    Servidor HTTP simples para health checks.
    
    O Modal usa isso para verificar se a aplicação
    estáhealthy.
    """
    from fastapi import FastAPI
    from fastapi.responses import JSONResponse
    
    fast_api = FastAPI()
    
    @fast_api.get("/health")
    async def health():
        return JSONResponse({"status": "healthy"})
    
    @fast_api.get("/")
    async def root():
        return JSONResponse({
            "name": "Sakae E-Learning Agent",
            "status": "running",
            "version": "1.0.0"
        })
    
    return fast_api


# ============================================================
# NOTAS
# ============================================================

"""
ARQUITETURA DO DEPLOY:

┌─────────────────────────────────────────────────────────────┐
│                      Modal.com                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Container (sakae-agent)                 │   │
│  │  ┌───────────────────────────────────────────────┐  │   │
│  │  │         Node.js Runtime                       │  │   │
│  │  │  ┌─────────────────────────────────────────┐ │  │   │
│  │  │  │     LiveKit Agent Worker                │ │  │   │
│  │  │  │     (WebSocket Connection)              │ │  │   │
│  │  │  │                                        │ │  │   │
│  │  │  │  • Aguarda dispatch do LiveKit        │ │  │   │
│  │  │  │  • Cria instâncias de agente por sala │ │  │   │
│  │  │  │  • Gerencia sessões de voz/áudio      │ │  │   │
│  │  │  └─────────────────────────────────────────┘ │  │   │
│  │  └───────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
              ▲
              │ WebSocket (wss://)
              │
┌─────────────────────────────────────────────────────────────┐
│                   LiveKit Cloud                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  • Room management                                   │   │
│  │  • WebRTC media streaming                           │   │
│  │  • Agent dispatch                                    │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘

FLUXO DE FUNCIONAMENTO:

1. Agente inicia e conecta ao LiveKit via WebSocket
2. LiveKit registra o agente como worker disponível
3. Usuário entra em uma sala (room)
4. LiveKit dispatcha o agente para a sala
5. Agente cria uma sessão de voz (VoicePipelineAgent)
6. Usuário e agente conversam em tempo real
7. Sala fecha quando o usuário sai
8. Agente fica disponível para próxima sessão

ESCALONAMENTO:

- Para múltiplos agentes: ajustar 'max_inputs' ou usar múltiplos containers
- Modal escala automaticamente baseado em requisições
- Para WebSocket: cada conexão é mantida em um container dedicado

CUSTO ESTIMADO:

- Modal: $0.0001 por segundo por CPU
- Exemplo: 1 container rodando 24h/dia = ~$8.64/mês
- Custo adicional de outbound bandwidth para WebRTC

REFERÊNCIAS:

- Documentação Modal: https://modal.com/docs
- LiveKit Agents: https://docs.livekit.io/agents/
- Deploy LiveKit no Modal: https://modal.com/blog/livekit-modal
- LiveKit Node.js Examples: https://github.com/livekit-examples/multimodal-agent-node
"""
```

---

## Deploy

### 1. Construir o projeto

```bash
pnpm build
```

### 2. Fazer deploy

```bash
modal deploy modal_agent.py
```

### 3. Verificar status

```bash
modal app info sakae-agent
```

### 4. Ver logs

```bash
modal logs sakae-agent
```

### 5. Parar o agente

```bash
modal cancel sakae-agent
```

---

## Atualização do Agente

Para atualizar o agente após mudanças no código:

```bash
# 1. Rebuild
pnpm build

# 2. Redeploy
modal deploy modal_agent.py
```

---

## Troubleshooting

### Problema: Agente não conecta ao LiveKit

**Verificar:**
- Secrets estão configurados corretamente
- `LIVEKIT_URL` está no formato correto (wss://...)
- API Key e Secret estão válidos

### Problema: Container reinicia constantemente

**Verificar:**
- Memória insuficiente → aumentar `memory=4096`
- CPU insuficiente → aumentar `cpu=2`
- Erros no código → verificar logs com `modal logs sakae-agent`

### Problema: Cold start lento

**Solução:**
- Manter pelo menos 1 instância quente
- Usar plano pago do Modal para evitar cold starts

---

## Segurança

### Observações Importantes

1. **Nunca exponha secrets no código**
   - Sempre usar `modal.Secret.from_name()`
   - Secrets são criptografados pelo Modal

2. **API Keys em produção**
   - Usar chaves específicas para produção
   - Não misturar chaves de desenvolvimento

3. **Monitoramento**
   - Verificar logs regularmente
   - Configurar alertas para erros

---

## Custo

### Estimativa de Custo Mensal

| Recurso | Quantidade | Custo Estimado |
|---------|------------|----------------|
| Container (2 CPU, 4GB) | 1 instância | ~$8-15/mês |
| Bandwidth | Variável | ~$2-5/mês |
| **Total** | | **~$10-20/mês** |

*Valores aproximados para uso moderado (8-12 horas/dia)*

---

## Referências

- [Modal.com Docs](https://modal.com/docs)
- [LiveKit Agents Docs](https://docs.livekit.io/agents/)
- [Blog: Deploy LiveKit on Modal](https://modal.com/blog/livekit-modal)
- [LiveKit Examples - Node.js](https://github.com/livekit-examples/multimodal-agent-node)
- [Agent Starter Node](https://github.com/livekit-examples/agent-starter-node)
