/**
 * useLiveKitGemini Hook
 *
 * Custom React hook for managing configurable real-time audio conversations
 * with Google's Gemini Live API. Provides flexible configuration options for
 * model selection, voice, temperature, and system instructions.
 *
 * @fileoverview This hook provides a highly configurable interface for Gemini Live API
 * integration, supporting custom models, voices, and instructions while maintaining
 * full audio chat functionality with real-time transcription.
 *
 * @dependencies react, @google/genai, ../util/audioUtils
 *
 * @author SAke E-Learning Team
 * @version 3.0.0
 */

import { useState, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';
import { encode, decode, decodeAudioData } from '../utils/audioUtils';

// ============================================================================
// AUDIO CONFIGURATION
// ============================================================================

/**
 * Input audio sample rate for microphone capture.
 * Gemini Live API expects 16kHz PCM audio.
 *
 * @constant {number}
 */
const INPUT_SAMPLE_RATE = 16000;

/**
 * Output audio sample rate for playback.
 * Gemini returns audio at 24kHz for better quality.
 *
 * @constant {number}
 */
const OUTPUT_SAMPLE_RATE = 24000;

/**
 * Buffer size for audio processing.
 * Larger buffers reduce CPU usage but increase latency.
 *
 * @constant {number}
 */
const BUFFER_SIZE = 4096;

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Minimal LiveSession interface.
 * Defined locally because LiveSession is not exported from @google/genai library.
 *
 * @interface LiveSession
 */
interface LiveSession {
  /** Closes the live session and releases resources */
  close: () => void;
}

/**
 * Configuration options for the useLiveKitGemini hook.
 * Allows customization of model, voice, temperature, and instructions.
 *
 * @interface UseLiveKitGeminiOptions
 */
interface UseLiveKitGeminiOptions {
  /** Gemini model ID to use (default: 'gemini-2.5-flash-native-audio-preview-09-2025') */
  model?: string;
  /** Voice name for TTS (default: 'Puck') */
  voice?: string;
  /** Temperature for response randomness 0-1 (default: 0.8) */
  temperature?: number;
  /** System instruction/prompt for the AI (default: generic helper) */
  instructions?: string;
}

/**
 * Return type of the useLiveKitGemini hook.
 * Contains session state, transcripts, errors, control functions, and current config.
 *
 * @interface UseLiveKitGeminiReturn
 */
interface UseLiveKitGeminiReturn {
  /** Whether a session is currently active */
  isSessionActive: boolean;
  /** Whether the AI is currently processing a response */
  isAwaitingResponse: boolean;
  /** Cumulative transcript of user speech during current turn */
  userTranscript: string;
  /** Cumulative transcript of AI responses during current turn */
  aiTranscript: string;
  /** Error message if session failed */
  error: string | null;
  /** Starts a new Gemini Live session */
  startSession: (analyserNodeCallback?: (analyser: AnalyserNode) => void) => Promise<void>;
  /** Ends the current session and cleans up resources */
  endSession: () => void;
  /** Current configuration being used */
  config: {
    model: string;
    voice: string;
    temperature: number;
    instructions: string;
  };
}

// ============================================================================
// HOOK DEFINITION
// ============================================================================

/**
 * Custom hook for managing configurable Gemini Live API sessions.
 *
 * Provides flexible audio chat functionality with configurable model selection,
 * voice options, temperature settings, and custom system instructions.
 *
 * @function useLiveKitGemini
 * @param {UseLiveKitGeminiOptions} [options] - Optional configuration for the session
 * @returns {UseLiveKitGeminiReturn} Session state, transcripts, control functions, and config
 *
 * @example
 * ```tsx
 * // Default configuration
 * const { startSession, endSession, isSessionActive } = useLiveKitGemini();
 *
 * // Custom configuration
 * const chat = useLiveKitGemini({
 *   model: 'gemini-2.5-flash-native-audio-preview-09-2025',
 *   voice: 'Zephyr',
 *   temperature: 0.5,
 *   instructions: 'You are a helpful Spanish tutor.'
 * });
 * ```
 *
 * @remarks
 * - Automatically handles microphone permissions and audio context setup
 * - Errors are logged but don't throw, setting error state instead
 * - Temperature values closer to 0 are more deterministic, closer to 1 are more creative
 * - Voice options include: 'Puck', 'Zephyr', and others available in Gemini API
 */
export const useLiveKitGemini = (options?: UseLiveKitGeminiOptions): UseLiveKitGeminiReturn => {
  const {
    model = 'gemini-2.5-flash-native-audio-preview-09-2025',
    voice = 'Puck',
    temperature = 0.8,
    instructions = 'You are a helpful assistant',
  } = options || {};

  // Session state
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isAwaitingResponse, setIsAwaitingResponse] = useState(false);
  const [userTranscript, setUserTranscript] = useState('');
  const [aiTranscript, setAiTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Refs for managing resources across renders
  const sessionRef = useRef<LiveSession | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const nextStartTimeRef = useRef(0);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  /**
   * Stops all currently playing audio buffers.
   * Ignores errors from already stopped sources.
   *
   * @function stopAudioPlayback
   * @private
   */
  const stopAudioPlayback = () => {
    if (outputAudioContextRef.current) {
      audioSourcesRef.current.forEach(source => {
        try {
          source.stop();
        } catch (e) {
          // Ignore errors from already stopped sources
        }
      });
      audioSourcesRef.current.clear();
      nextStartTimeRef.current = 0;
    }
  };

  /**
   * Cleans up all resources and resets state.
   * Stops audio processing, closes contexts, disconnects media streams, and closes session.
   *
   * @function cleanup
   * @private
   */
  const cleanup = useCallback(() => {
    stopAudioPlayback();

    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }
    if (mediaStreamSourceRef.current) {
      mediaStreamSourceRef.current.disconnect();
      mediaStreamSourceRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
      inputAudioContextRef.current.close();
      inputAudioContextRef.current = null;
    }
    if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
      outputAudioContextRef.current.close();
      outputAudioContextRef.current = null;
    }
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }

    setIsSessionActive(false);
    setIsAwaitingResponse(false);
  }, []);

  /**
   * Starts a new Gemini Live session with the configured options.
   *
   * Captures microphone input, establishes WebSocket connection to Gemini Live API,
   * and sets up audio processing pipeline with real-time transcription.
   *
   * @async
   * @function startSession
   * @param {(analyser: AnalyserNode) => void} [analyserNodeCallback] - Optional callback
   * to receive the audio analyser node for visualization purposes
   *
   * @throws Will set error state if microphone access fails or API connection fails
   *
   * @remarks
   * - Logs configuration to console for debugging
   * - Uses configured model, voice, temperature, and instructions
   * - Creates separate AudioContexts for input (16kHz) and output (24kHz)
   * - Uses ScriptProcessorNode for audio capture (deprecated but widely supported)
   */
  const startSession = async (analyserNodeCallback?: (analyser: AnalyserNode) => void) => {
    if (isSessionActive) return;
    setError(null);
    setUserTranscript('');
    setAiTranscript('');

    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      // Create separate audio contexts for input and output with different sample rates
      // Cast to 'any' for webkitAudioContext cross-browser compatibility
      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: INPUT_SAMPLE_RATE });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: OUTPUT_SAMPLE_RATE });

      // Initialize Gemini AI client
      const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

      // Log session configuration for debugging
      console.log('Starting LiveKit Gemini session with config:', {
        model,
        voice,
        temperature,
        instructions
      });

      // Connect to Gemini Live API
      const sessionPromise = ai.live.connect({
        model: model,
        callbacks: {
          /**
           * Called when WebSocket connection is established.
           * Sets up audio processing pipeline with script processor.
           */
          onopen: () => {
            console.log('LiveKit Gemini session opened');
            const source = inputAudioContextRef.current!.createMediaStreamSource(stream);
            mediaStreamSourceRef.current = source;

            // Optional analyser node for visualization
            if (analyserNodeCallback) {
              const analyser = inputAudioContextRef.current!.createAnalyser();
              analyser.fftSize = 2048;
              source.connect(analyser);
              analyserNodeCallback(analyser);
            }

            // Create script processor for audio capture
            const scriptProcessor = inputAudioContextRef.current!.createScriptProcessor(BUFFER_SIZE, 1, 1);
            scriptProcessorRef.current = scriptProcessor;

            /**
             * Process audio input and send to Gemini Live API.
             * Converts float32 audio to int16 PCM and encodes to base64.
             */
            scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
              const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const pcmBlob: Blob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              sessionPromise.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContextRef.current!.destination);
          },

          /**
           * Called when server sends a message.
           * Handles transcription updates and audio responses.
           */
          onmessage: async (message: LiveServerMessage) => {
            // User transcription (what Gemini heard)
            if (message.serverContent?.inputTranscription) {
              setUserTranscript(prev => prev + message.serverContent!.inputTranscription!.text);
            }
            // AI transcription (what Gemini said)
            if (message.serverContent?.outputTranscription) {
              setIsAwaitingResponse(false);
              setAiTranscript(prev => prev + message.serverContent!.outputTranscription!.text);
            }
            // Turn complete - clear transcripts for next turn
            if (message.serverContent?.turnComplete) {
              setUserTranscript('');
              setAiTranscript('');
            }

            // Handle audio response
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
              // Play audio locally for immediate feedback
              if (outputAudioContextRef.current) {
                const ctx = outputAudioContextRef.current;
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, OUTPUT_SAMPLE_RATE, 1);

                const source = ctx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(ctx.destination);

                source.addEventListener('ended', () => {
                  audioSourcesRef.current.delete(source);
                });

                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += audioBuffer.duration;
                audioSourcesRef.current.add(source);
              }
            }

            // Handle interruption
            if (message.serverContent?.interrupted) {
              stopAudioPlayback();
            }
          },

          /**
           * Called when an error occurs during the session.
           */
          onerror: (e: ErrorEvent) => {
            console.error('LiveKit Gemini session error:', e);
            setError('An error occurred during the session.');
            cleanup();
          },

          /**
           * Called when the session closes.
           */
          onclose: () => {
            console.log('LiveKit Gemini session closed');
            cleanup();
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } },
          },
          systemInstruction: instructions,
          generationConfig: {
            temperature: temperature,
          },
        },
      });

      sessionRef.current = await sessionPromise;
      setIsSessionActive(true);
      setIsAwaitingResponse(true);
    } catch (e) {
      console.error('Failed to start LiveKit Gemini session:', e);
      setError('Could not access microphone or start session. Please check your API key and microphone permissions.');
      cleanup();
    }
  };

  /**
   * Ends the current Gemini Live session.
   * Closes the session and triggers cleanup of all resources.
   *
   * @function endSession
   */
  const endSession = useCallback(() => {
    if (sessionRef.current) {
      sessionRef.current.close();
    }
    cleanup();
  }, [cleanup]);

  return {
    isSessionActive,
    isAwaitingResponse,
    userTranscript,
    aiTranscript,
    error,
    startSession,
    endSession,
    config: { model, voice, temperature, instructions }
  };
};
