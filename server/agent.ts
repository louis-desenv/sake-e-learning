import "dotenv/config";
import { fileURLToPath } from "node:url";
import { ServerOptions, cli, defineAgent, voice } from "@livekit/agents";
import * as bey from "@livekit/agents-plugin-bey";
import * as google from "@livekit/agents-plugin-google";
import * as deepgram from "@livekit/agents-plugin-deepgram";
import { createClient } from "@supabase/supabase-js";

/* ------------------------------------------------------------------ */
/* ENV CONFIGURATION */
/* ------------------------------------------------------------------ */

const {
  GOOGLE_API_KEY, // Gemini Live API para LLM
  DEEPGRAM_API_KEY, // Deepgram para STT (transcrição)
  BEY_API_KEY,
  BEY_AVATAR_ID,
  LIVEKIT_URL,
  LIVEKIT_API_KEY,
  LIVEKIT_API_SECRET,
  VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY,
} = process.env;

// Supabase client for saving conversation history
const SUPABASE_URL =
  VITE_SUPABASE_URL || "https://txtgebzqfqijgzcjfovu.supabase.co";
const SUPABASE_ANON_KEY =
  VITE_SUPABASE_ANON_KEY || "sb_publishable_5jXPObLTcGvs3zAiIzd63Q_XgD4h6TP";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

if (!GOOGLE_API_KEY) console.warn("⚠️ GOOGLE_API_KEY missing");
if (!DEEPGRAM_API_KEY) console.warn("⚠️ DEEPGRAM_API_KEY missing");
if (!LIVEKIT_URL) console.warn("⚠️ LIVEKIT_URL missing");
if (!LIVEKIT_API_KEY) console.warn("⚠️ LIVEKIT_API_KEY missing");
if (!LIVEKIT_API_SECRET) console.warn("⚠️ LIVEKIT_API_SECRET missing");

/* ------------------------------------------------------------------ */
/* UTILITIES */
/* ------------------------------------------------------------------ */

const log = (msg: string, extra?: any) =>
  console.log(`[AGENT] ${msg}`, extra ?? "");

/* ------------------------------------------------------------------ */
/* PROMPTS */
/* ------------------------------------------------------------------ */

const TEACHER_PROMPT = `You are an experienced language teacher who teaches primarily through natural conversation.

Your main goal is to help the user communicate with confidence, not to speak perfectly.

Core rules:
- Always respond in the same language the user is speaking.
- If the user switches languages, immediately switch with them.
- Never interrupt the user to correct mistakes.
- Focus on meaning first, accuracy second.

When the user makes a mistake:
1. First, respond naturally to what they meant, as in a real conversation.
2. Then, gently model the correct version of their sentence.
3. Only explain the correction if it affects understanding or if the user explicitly asks.

Teaching style:
- Use short, clear, spoken responses.
- Keep corrections subtle and natural.
- Occasionally include small teaching moments through examples or reformulation.
- Avoid long grammar explanations unless explicitly requested.
- Encourage the user to continue speaking.

Conversation behavior:
- Sound natural and human, not academic.
- Be patient, supportive, and calm.
- Never overcorrect.
- Never lecture.

Your role is to be a live language teacher, not a grammar checker.`;

/* ------------------------------------------------------------------ */
/* AGENT DEFINITION */
/* ------------------------------------------------------------------ */

export default defineAgent({
  // @ts-expect-error - identity exists in runtime but not in types
  identity: "CA_PRhwL82rAFvV",

  entry: async (ctx) => {
    // DEBUG: Log when entry point is called
    console.log("[DEBUG] 🎯 Agent entry point called!", {
      room: ctx.room.name,
      jobId: ctx.job.id,
    });

    // Error handlers to catch silent failures
    process.on("uncaughtException", (err: Error) => {
      console.error(
        "[AGENT] uncaughtException:",
        err && err.stack ? err.stack : err,
      );
    });
    process.on("unhandledRejection", (reason: unknown) => {
      console.error(
        "[AGENT] unhandledRejection:",
        reason && typeof reason === "object" && "stack" in reason
          ? reason.stack
          : reason,
      );
    });

    /* -------------------------------------------------------------- */
    /* STATE MACHINE - controle de transições validado                 */
    /* -------------------------------------------------------------- */

    type AgentState =
      | "initializing"
      | "connecting"
      | "ready"
      | "running"
      | "error"
      | "cleaning";

    let state: AgentState = "initializing";

    const setState = (next: AgentState): boolean => {
      const validTransitions: Record<AgentState, AgentState[]> = {
        initializing: ["connecting", "error"],
        connecting: ["ready", "error"],
        ready: ["running", "cleaning", "error"],
        running: ["cleaning", "error"],
        error: ["ready", "cleaning"],
        cleaning: [],
      };

      const allowed = validTransitions[state]?.includes(next);
      if (!allowed) {
        console.error(`❌ Invalid state transition: ${state} → ${next}`);
        metrics.errors++;
        return false;
      }

      logWithMetrics(`🔁 State: ${state} → ${next}`);
      state = next;
      return true;
    };

    let voiceSession: any = null;
    let beySession: any = null;
    let cleanupCalled = false;

    /* -------------------------------------------------------------- */
    /* METRICS - observabilidade estruturada                         */
    /* -------------------------------------------------------------- */

    const metrics = {
      sessionId: crypto.randomUUID(),
      startTime: Date.now(),
      sttCalls: 0,
      llmCalls: 0,
      turns: 0,
      interruptions: 0,
      errors: 0,
      lastActivityTime: Date.now(),
    };

    const logWithMetrics = (msg: string, data: Record<string, any> = {}) => {
      metrics.lastActivityTime = Date.now();
      console.log(`[AGENT:${metrics.sessionId.slice(0, 8)}] ${msg}`, {
        ...data,
        state,
        uptime: `${((Date.now() - metrics.startTime) / 1000).toFixed(1)}s`,
      });
    };

    const logFinalMetrics = () => {
      const duration = Date.now() - metrics.startTime;
      logWithMetrics("📊 SESSION METRICS", {
        duration: `${(duration / 1000).toFixed(1)}s`,
        turns: metrics.turns,
        interruptions: metrics.interruptions,
        errors: metrics.errors,
        avgTurnDuration:
          metrics.turns > 0
            ? `${(duration / metrics.turns / 1000).toFixed(1)}s`
            : "N/A",
        estimatedCost: `$${(metrics.llmCalls * 0.002).toFixed(4)}`,
      });
    };

    /* -------------------------------------------------------------- */
    /* CLEANUP - centralized, idempotent, always called              */
    /* -------------------------------------------------------------- */

    const cleanup = async () => {
      if (cleanupCalled) return;
      cleanupCalled = true;

      setState("cleaning");
      logWithMetrics("🧹 Cleaning up sessions...");

      // Log final metrics antes de limpar
      logFinalMetrics();

      try {
        if (beySession) {
          logWithMetrics("Clearing Bey avatar...");
          beySession = null;
        }
        if (voiceSession) {
          logWithMetrics("Stopping voice session...");
          voiceSession = null;
        }
      } catch (e) {
        console.error("Cleanup error:", e);
      }
    };

    /* -------------------------------------------------------------- */
    /* ASYNC STARTUP */
    /* -------------------------------------------------------------- */

    // conversationId is hoisted here so it's accessible from room event handlers
    let conversationId: string | null = null;

    try {
      setState("connecting");
      logWithMetrics("🔌 Connecting to LiveKit...");
      await ctx.connect();
      logWithMetrics(`✅ Connected to room: ${ctx.room.name}`);

      logWithMetrics("Creating voice session...");
      voiceSession = new voice.AgentSession({
        stt: new deepgram.STT({
          model: "nova-3",
          language: "multi",
          smartFormat: true,
          // @ts-expect-error - paragraphs exists in runtime but not in types
          paragraphs: true,
          numerals: true,
          // VAD (Voice Activity Detection) - reduz custo STT em 30-40%
          vad_events: true, // Emit eventos de VAD
          endpointing: 800, // 800ms silêncio = fim de frase
          utterance_end_ms: 1000, // 1s sem fala = fim de turno
          api_key: DEEPGRAM_API_KEY,
        }),
        llm: new google.beta.realtime.RealtimeModel({
          model: "gemini-2.5-flash-native-audio-preview-12-2025",
          voice: "Kore",
          temperature: 0.6,
          instructions: TEACHER_PROMPT,
          apiKey: GOOGLE_API_KEY,
        }),
      });

      const agent = new voice.Agent({
        instructions: TEACHER_PROMPT,
      });

      setState("ready");
      logWithMetrics("Starting voice agent...");

      await voiceSession.start({
        agent,
        room: ctx.room,
        outputOptions: {
          audioEnabled: true,
          transcriptionEnabled: true,
          syncTranscription: false, // Bey avatar intercepts audio — sync would block text
        },
      });

      // DEBUG: Log STT/LLM emission from the backend
      voiceSession.on("user_speech_committed", (msg: any) => {
        logWithMetrics(`[STT DEBUG] User speech committed:`, msg);
      });
      voiceSession.on("agent_speech_committed", (msg: any) => {
        logWithMetrics(`[STT DEBUG] Agent speech committed:`, msg);
      });

      // ---- BACKEND CONVERSATION SAVING ----
      // Read conversationId from participant metadata
      for (const participant of ctx.room.remoteParticipants.values()) {
        try {
          const meta = JSON.parse((participant as any).metadata || "{}");
          if (meta.conversationId) {
            conversationId = meta.conversationId;
            logWithMetrics(
              `📋 Found conversationId: ${conversationId} from ${(participant as any).identity}`,
            );
            break;
          }
        } catch {}
      }

      // Save messages via conversation_item_added event
      voiceSession.on("conversation_item_added", async (ev: any) => {
        const item = ev.item;
        if (!item || !conversationId) return;

        const role = item.role === "assistant" ? "assistant" : "user";
        const content = item.textContent || item.content?.[0]?.text || "";

        if (!content.trim()) return;

        logWithMetrics(
          `💾 Saving ${role} message: "${content.substring(0, 50)}..."`,
        );

        try {
          const { error } = await supabase.from("messages").insert({
            conversation_id: conversationId,
            role,
            content: content.trim(),
            message_type: role === "user" ? "user" : "system",
            category: "avatar",
            scenario: "free-conversation",
          });

          if (error) {
            console.error("[AGENT] Supabase save error:", error);
          } else {
            logWithMetrics(`✅ Message saved to Supabase (${role})`);
          }
        } catch (err) {
          console.error("[AGENT] Failed to save message:", err);
        }
      });

      setState("running");
      logWithMetrics("✅ Voice agent ready");

      // Start Bey after voice is ready
      if (BEY_API_KEY && BEY_AVATAR_ID) {
        logWithMetrics("🤖 Initializing Bey avatar...");
        try {
          const session = new bey.AvatarSession({
            apiKey: BEY_API_KEY,
            avatarId: BEY_AVATAR_ID,
          });
          beySession = session;
          await beySession.start(voiceSession, ctx.room);
          logWithMetrics("✅ Bey avatar ready");
        } catch (beyError) {
          console.error("[AGENT] Bey failed to start:", beyError);
          metrics.errors++;
          beySession = null;
        }
      }
    } catch (err) {
      setState("error");
      console.error("❌ Agent startup error:", err);
      metrics.errors++;
    }

    /* ------------------- ROOM EVENT HANDLERS ----------------- */
    logWithMetrics("✅ Agent running and waiting for participants...");

    let disconnectTimeout: NodeJS.Timeout | null = null;

    ctx.room.on("participantDisconnected", (participant: any) => {
      logWithMetrics(`🔴 Participant disconnected: ${participant.identity}`, {
        remaining: ctx.room.remoteParticipants.size,
      });

      if (ctx.room.remoteParticipants.size === 0) {
        logWithMetrics(
          "⏰ No participants left - starting 30s cleanup timeout...",
        );

        if (disconnectTimeout) clearTimeout(disconnectTimeout);
        disconnectTimeout = setTimeout(() => {
          logWithMetrics("⏰ Cleanup timeout expired - exiting");
          cleanup();
        }, 30000);
      }
    });

    ctx.room.on("participantConnected", (participant: any) => {
      metrics.turns++; // Conta uma nova sessão/conversa
      logWithMetrics("🟢 Participant connected", {
        totalTurns: metrics.turns,
      });
      if (disconnectTimeout) {
        clearTimeout(disconnectTimeout);
        disconnectTimeout = null;
        logWithMetrics("✅ Cleanup timeout cleared");
      }

      // Try to read conversationId from metadata if not already set
      if (!conversationId && participant.metadata) {
        try {
          const meta = JSON.parse(participant.metadata);
          if (meta.conversationId) {
            conversationId = meta.conversationId;
            logWithMetrics(
              `📋 Found conversationId: ${conversationId} from ${participant.identity}`,
            );
          }
        } catch {}
      }
    });

    ctx.room.on("disconnected", () => {
      logWithMetrics("🔴 Room disconnected - emergency cleanup");
      cleanup();
    });
  },
});

/* ------------------------------------------------------------------ */
/* WORKER CONFIGURATION */
/* ------------------------------------------------------------------ */

const port = parseInt(process.env.AGENT_PORT || "8085", 10);

log(`Starting agent worker on port ${port}...`);

const serverOptions = new ServerOptions({
  agent: fileURLToPath(import.meta.url),
  agentName: "sakae-teacher",
  initializeProcessTimeout: 120_000,
  port,
  apiKey: LIVEKIT_API_KEY,
  apiSecret: LIVEKIT_API_SECRET,
  wsURL: LIVEKIT_URL,
  production: false, // Enable debug logs
  loadThreshold: 0.99,
  requestFunc: async (req) => {
    log(`📥 Received job request for room: ${req.room?.name || "unknown"}`);
    await req.accept();
  },
});

cli.runApp(serverOptions);
