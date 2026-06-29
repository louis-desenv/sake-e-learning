# Modal Secrets Setup
# ====================

# Execute os seguintes comandos para configurar os secrets no Modal:

# 1. Criar secret para LiveKit
modal secret create sakae-livekit-secret \
  LIVEKIT_URL=wss://SEU-PROJETO.livekit.cloud \
  LIVEKIT_API_KEY=SUA-API-KEY \
  LIVEKIT_API_SECRET=SUA-API-SECRET

# 2. Criar secret para provedores de IA
modal secret create sakae-ai-secret \
  GOOGLE_API_KEY=SUA-GOOGLE-API-KEY \
  DEEPGRAM_API_KEY=SUA-DEEPGRAM-API-KEY

# 3. (Opcional) Bey Avatar
modal secret create sakae-bey-secret \
  BEY_API_KEY=SUA-BEY-API-KEY \
  BEY_AVATAR_ID=SEU-AVATAR-ID

# =============================================
# Verificar secrets criados
# =============================================
modal secret list

# =============================================
# Deploy do agente
# =============================================
modal deploy modal_agent.py

# =============================================
# Ver logs
# =============================================
modal logs sakae-agent

# =============================================
# Parar o agente
# =============================================
modal cancel sakae-agent
