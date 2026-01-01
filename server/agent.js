import { fileURLToPath } from "node:url";

import {
  JobContext, 
  WorkerOptions,
  cli,
  defineAgent,
  voice,
} from "@livekit/agents";
import * as bey from "@livekit/agents-plugin-bey";
import * as openai from "@livekit/agents-plugin-openai";
import * as silero from "@livekit/agents-plugin-silero";
  
// Set environment variables
process.env.BEY_AVATAR_ID = "";
process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || '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';

// BeyondPresence API key (must be BEY_API_KEY)
process.env.BEY_API_KEY = 'sk-ioKQP6TMmLufg-cpj8y7OvFES39_WSi01MdwpMdq1uo';

// LiveKit credentials for the agent to connect
process.env.LIVEKIT_API_KEY = 'API4DzuzbMC3E9X';
process.env.LIVEKIT_API_SECRET = 'DseZQ3MOPSmSILraZdlwjAuRNeNhuXhQBeWhWfSHYf8G';
process.env.LIVEKIT_URL = 'wss://sakae-5xpuk5nz.livekit.cloud';

const beyAvatarId = process.env.BEY_AVATAR_ID;

export default defineAgent({
  identity: 'CA_PRhwL82rAFvV',

  entry: async (ctx) => {
    console.log('Agent dispatched to room:', ctx.room.name);

    try {
      await ctx.connect();
      console.log('Agent connected to room successfully');
    } catch (error) {
      console.error('Failed to connect agent to room:', error);
      return;
    }

    console.log('Connected to room, starting voice session...');
    console.log('Creating voice agent session...');

    let voiceAgentSession, voiceAgent, beyAvatarSession;

    try {
      // 1) Load VAD once per entry
      const vad = await silero.VAD.load();
      console.log('VAD loaded successfully');

      voiceAgentSession = new voice.AgentSession({
        llm: new openai.realtime.RealtimeModel({
          // Use a voice that matches your avatar
          // Ref: https://platform.openai.com/docs/guides/text-to-speech#voice-options
          voice: "alloy",
        }),

        // Explicitly configure TTS for audio output
        tts: new openai.TTS({ model: 'tts-1', voice: 'alloy', speed: 1.2 }),

        // Configure STT for speech recognition
        stt: new openai.STT({ model: 'whisper-1', language: 'en' }),

        // // Uncomment for Silero VAD (better detects when to start/stop talking)
        // // Ref: https://docs.livekit.io/agents/build/turns/vad
        // // pnpm install @livekit/agents-plugin-silero
        // // import * as silero from '@livekit/agents-plugin-silero';
        // vad: await silero.VAD.load(),
      });

      voiceAgent = new voice.Agent({
        instructions: "You are a helpful language AI assistant. Listen to the user and respond naturally. Keep your responses brief and engaging. If you understand what they said, acknowledge it and provide relevant information.",
        vad
      });

      console.log('Starting voice agent...');
      await voiceAgentSession.start({ agent: voiceAgent, room: ctx.room });
      console.log('Voice agent started successfully');

      // Start Bey avatar session
      console.log('Starting Bey avatar session...');
      try {
        beyAvatarSession = new bey.AvatarSession({ beyAvatarId });
        console.log('Bey avatar session created');

        console.log('Starting Bey avatar...');
        await beyAvatarSession.start(voiceAgentSession, ctx.room);
        console.log('Bey avatar started successfully');

      } catch (error) {
        console.error('Error starting Bey avatar:', error);
        console.log('Continuing with voice agent only (avatar failed)');
      }

      // Handle participant events to properly cleanup sessions when users disconnect
      ctx.room.on('participantDisconnected', async (participant) => {
        console.log('🔴 PARTICIPANT DISCONNECTED EVENT:', participant.identity);
        const remainingParticipants = Array.from(ctx.room.remoteParticipants.values()).length;
        console.log('🔴 Remaining remote participants:', remainingParticipants);
        console.log('🔴 Total participants in room:', ctx.room.numParticipants);

        if (remainingParticipants === 0) {
          console.log('🔴 NO PARTICIPANTS LEFT - Starting emergency cleanup...');

          try {
            // Stop Bey avatar session first (most important for concurrency limit)
            if (beyAvatarSession) {
              console.log('🔴 Stopping Bey avatar session...');
              await beyAvatarSession.stop();
              console.log('✅ Bey avatar session stopped successfully');
              beyAvatarSession = null; // Clear reference
            }

            // Stop voice agent session
            if (voiceAgentSession) {
              console.log('🔴 Stopping voice agent session...');
              await voiceAgentSession.stop();
              console.log('✅ Voice agent session stopped successfully');
              voiceAgentSession = null; // Clear reference
            }

            console.log('✅ All sessions stopped - forcing agent exit');
            // Force exit the agent job
            process.exit(0);
          } catch (error) {
            console.error('❌ Error stopping sessions:', error);
            // Still try to exit
            process.exit(1);
          }
        }
      });

      // Also listen for room destruction as backup
      ctx.room.on('disconnected', () => {
        console.log('🔴 ROOM DISCONNECTED - Emergency cleanup');
        if (beyAvatarSession) {
          beyAvatarSession.stop().catch(console.error);
          beyAvatarSession = null;
        }
        if (voiceAgentSession) {
          voiceAgentSession.stop().catch(console.error);
          voiceAgentSession = null;
        }
        process.exit(0);
      });

      // Wait for room to end or disconnect
      console.log('Agent session active, waiting for participants...');

    } catch (error) {
      console.error('Error in agent session:', error);

      // Cleanup on error
      try {
        if (voiceAgentSession) {
          await voiceAgentSession.stop();
        }
        if (beyAvatarSession) {
          await beyAvatarSession.stop();
        }
      } catch (cleanupError) {
        console.error('Error during cleanup:', cleanupError);
      }
    }
  },
});

// Overwrite args for the LiveKit CLI
process.argv = [process.argv[0], process.argv[1], "dev"];
cli.runApp(new WorkerOptions({ agent: fileURLToPath(import.meta.url) }));
