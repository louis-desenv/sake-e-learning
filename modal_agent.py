"""
Deploy do Sakae E-Learning Agent no Modal.com
=============================================

Este arquivo configura o deploy do agente de voz LiveKit no Modal.com.
O agente conecta ao servidor LiveKit via WebSocket e participa das salas
como um participante programático.

Uso:
    modal deploy modal_agent.py

Referências:
    - https://modal.com/docs
    - https://docs.livekit.io/agents/
    - https://modal.com/blog/livekit-modal
"""

import modal
import os
import subprocess
import sys

# ============================================================
# CONFIGURAÇÃO DA IMAGEM
# ============================================================

# Imagem base: Node.js 22 (LTS)
image = modal.Image.from_registry("node:22-slim")

# Instalar pnpm globalmente
image = image.run_commands("npm install -g pnpm")

# Copiar arquivos do projeto para /app
image = image.copy(".", "/app")

# Definir diretório de trabalho
image = image.workdir("/app")

# Instalar dependências e fazer build
image = image.run_commands("pnpm install --frozen-lockfile")
image = image.run_commands("pnpm build")

# ============================================================
# CONFIGURAÇÃO DA APLICAÇÃO
# ============================================================

APP_NAME = "sakae-agent"

app = modal.App(APP_NAME, image=image)

# ============================================================
# FUNÇÃO PRINCIPAL
# ============================================================

@app.function(
    secrets=[
        modal.Secret.from_name("sakae-livekit-secret"),
        modal.Secret.from_name("sakae-ai-secret"),
        modal.Secret.from_name("sakae-bey-secret"),
    ],
    timeout=86400,  # 24 horas
    cpu=2,
    memory=4096,
)
@modal.concurrent(max_inputs=1000)
def run_agent():
    """
    Executa o agente LiveKit.
    
    O agente:
    1. Conecta ao servidor LiveKit via WebSocket
    2. Registra-se como worker disponível
    3. Aguarda dispatch para salas de aula
    4. Participa como agente de voz
    """
    
    print("=" * 60)
    print("🚀 Iniciando Sakae E-Learning Agent")
    print("=" * 60)
    
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
    
    if os.environ.get("GOOGLE_API_KEY"):
        print("✅ GOOGLE_API_KEY configurada")
    
    if os.environ.get("DEEPGRAM_API_KEY"):
        print("✅ DEEPGRAM_API_KEY configurada")
    
    print("-" * 60)
    print("📡 Conectando ao servidor LiveKit...")
    print("-" * 60)
    
    try:
        result = subprocess.run(
            ["pnpm", "run", "start:agent"],
            env=os.environ,
            cwd="/app",
        )
    except KeyboardInterrupt:
        print("\n🛑 Agente encerrado pelo usuário")
    except Exception as e:
        print(f"❌ ERRO ao executar agente: {e}")
        sys.exit(1)

# ============================================================
# HEALTH CHECK
# ============================================================

@app.function()
@app.asgi_app()
def webhook():
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
