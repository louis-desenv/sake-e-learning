/**
 * useGeminiLive Hook
 *
 * Custom React hook for managing real-time audio conversations with Google's Gemini Live API.
 * Handles microphone input, audio playback, transcription, and session lifecycle management.
 *
 * @fileoverview This hook provides a complete interface for Gemini Live API integration,
 * including audio capture, real-time streaming, transcription handling, and Beyond Presence
 * avatar integration through custom events.
 *
 * @dependencies react, @google/genai, ../context/UserContext, ../util/audioUtils
 *
 * @author SAke E-Learning Team
 * @version 3.0.0
 */

import { useState, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';
import { useUser } from '../context/UserContext';
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
 * Includes only the methods used in this hook.
 *
 * @interface LiveSession
 */
interface LiveSession {
  /** Closes the live session and releases resources */
  close: () => void;
}

/**
 * Return type of the useGeminiLive hook.
 * Contains session state, transcripts, errors, and control functions.
 *
 * @interface UseGeminiLiveReturn
 */
interface UseGeminiLiveReturn {
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
  /** Full history of the conversation */
  chatHistory: Array<{ sender: 'user' | 'ai'; text: string; id: string }>;
  /** Whether the agent's audio is currently actively playing in the speaker/headset */
  isAgentSpeaking: boolean;
}

// ============================================================================
// HOOK DEFINITION
// ============================================================================

/**
 * Custom hook for managing Gemini Live API sessions.
 *
 * Provides complete audio chat functionality with real-time transcription,
 * bidirectional audio streaming, and integration with Beyond Presence avatar.
 *
 * @function useGeminiLive
 * @returns {UseGeminiLiveReturn} Session state, transcripts, and control functions
 *
 * @example
 * ```tsx
 * const { isSessionActive, userTranscript, aiTranscript, startSession, endSession } = useGeminiLive();
 *
 * <button onClick={() => startSession(analyser => setAnalyser(analyser))}>
 *   Start Chat
 * </button>
 * <p>User: {userTranscript}</p>
 * <p>AI: {aiTranscript}</p>
 * ```
 *
 * @remarks
 * - Automatically handles microphone permissions and audio context setup
 * - Sends custom events for Beyond Presence avatar integration
 * - Transcripts are cleared when a turn completes (turnComplete event)
 * - Audio playback is scheduled to prevent gaps
 */
export const useGeminiLive = (): UseGeminiLiveReturn => {
  const { user: userProfile } = useUser();

  // Session state
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isAwaitingResponse, setIsAwaitingResponse] = useState(false);
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [userTranscript, setUserTranscript] = useState('');
  const [aiTranscript, setAiTranscript] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ sender: 'user' | 'ai'; text: string; id: string }>>([]);
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
   * Used when interrupted or during cleanup.
   *
   * @function stopAudioPlayback
   * @private
   */
  const stopAudioPlayback = () => {
    if (outputAudioContextRef.current) {
      audioSourcesRef.current.forEach(source => {
        source.stop();
      });
      audioSourcesRef.current.clear();
      nextStartTimeRef.current = 0;
      setIsAgentSpeaking(false);
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
   * Starts a new Gemini Live session.
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
   * - Creates separate AudioContexts for input (16kHz) and output (24kHz)
   * - Uses ScriptProcessorNode for audio capture (deprecated but widely supported)
   * - Dispatches 'geminiAudioReceived' custom events for avatar integration
   * - Personalizes system instruction based on user profile
   */
  const startSession = async (analyserNodeCallback?: (analyser: AnalyserNode) => void) => {
    if (isSessionActive) return;
    setError(null);
    setUserTranscript('');
    setAiTranscript('');
    setChatHistory([]);

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

      // Connect to Gemini Live API
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          /**
           * Called when WebSocket connection is established.
           * Sets up audio processing pipeline with script processor.
           */
          onopen: () => {
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
              // Capture final user transcript if any
              setUserTranscript(prevUser => {
                const finalUserText = prevUser.trim();
                if (finalUserText) {
                  setChatHistory(h => {
                    const lastUserMsg = h.filter(m => m.sender === 'user').pop();
                    if (lastUserMsg?.text !== finalUserText) {
                      return [...h, { sender: 'user', text: finalUserText, id: Date.now().toString() + '-' + Math.random().toString(36).substring(2, 9) + '-user' }];
                    }
                    return h;
                  });
                }
                return '';
              });

              // Capture final ai transcript if any
              setAiTranscript(prevAi => {
                const finalAiText = prevAi.trim();
                if (finalAiText) {
                  setChatHistory(h => {
                    const lastAiMsg = h.filter(m => m.sender === 'ai').pop();
                    if (lastAiMsg?.text !== finalAiText) {
                      return [...h, { sender: 'ai', text: finalAiText, id: Date.now().toString() + '-' + Math.random().toString(36).substring(2, 9) + '-ai' }];
                    }
                    return h;
                  });
                }
                return '';
              });
            }

            // Handle audio response
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
              // Store audio data for Beyond Presence avatar integration
              const audioData = base64Audio;
              if (window.dispatchEvent) {
                window.dispatchEvent(new CustomEvent('geminiAudioReceived', {
                  detail: { audioData, transcript: message.serverContent?.outputTranscription?.text || '' }
                }));
              }

              // Play audio locally for immediate feedback
              if (outputAudioContextRef.current) {
                const ctx = outputAudioContextRef.current;

                // Provide a small 50ms jitter buffer (safety margin) if the queue ran dry.
                // Scheduling exactly at `ctx.currentTime` cuts off the first milliseconds of the chunk due to event loop delays.
                if (nextStartTimeRef.current < ctx.currentTime) {
                  nextStartTimeRef.current = ctx.currentTime + 0.05;
                }

                const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, OUTPUT_SAMPLE_RATE, 1);

                const source = ctx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(ctx.destination);

                source.addEventListener('ended', () => {
                  audioSourcesRef.current.delete(source);
                  if (audioSourcesRef.current.size === 0) {
                    setIsAgentSpeaking(false);
                  }
                });

                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += audioBuffer.duration;
                audioSourcesRef.current.add(source);
                setIsAgentSpeaking(true);
              }
            }

            // Handle interruption
            if (message.serverContent?.interrupted) {
              stopAudioPlayback();

              // Force clear transcripts if interrupted prematurely
              setUserTranscript(prevUser => {
                const finalUserText = prevUser.trim();
                if (finalUserText) {
                  setChatHistory(h => {
                    const lastUserMsg = h.filter(m => m.sender === 'user').pop();
                    if (lastUserMsg?.text !== finalUserText) {
                      return [...h, { sender: 'user', text: finalUserText, id: Date.now().toString() + '-' + Math.random().toString(36).substring(2, 9) + '-user' }];
                    }
                    return h;
                  });
                }
                return '';
              });

              setAiTranscript(prevAi => {
                const finalAiText = prevAi.trim();
                if (finalAiText) {
                  setChatHistory(h => {
                    const lastAiMsg = h.filter(m => m.sender === 'ai').pop();
                    if (lastAiMsg?.text !== finalAiText) {
                      return [...h, { sender: 'ai', text: finalAiText, id: Date.now().toString() + '-' + Math.random().toString(36).substring(2, 9) + '-ai' }];
                    }
                    return h;
                  });
                }
                return '';
              });
            }
          },

          /**
           * Called when an error occurs during the session.
           */
          onerror: (e: ErrorEvent) => {
            console.error('Session error:', e);
            setError('An error occurred during the session.');
            cleanup();
          },

          /**
           * Called when the session closes.
           */
          onclose: () => {
            cleanup();
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          systemInstruction: `You are SAke, a friendly and professional AI English tutor. The user's name is ${userProfile.name}, their English level is ${userProfile.level}, their native language is ${userProfile.nativeLanguage}, and their learning goals are ${userProfile.goals.join(', ')}. Tailor your conversation to their level. For beginners, use simple language and occasionally use their native language for clarification. Keep responses concise. Start the conversation with a warm, bilingual greeting.`,
        },
      });

      sessionRef.current = await sessionPromise;
      setIsSessionActive(true);
      setIsAwaitingResponse(true);
    } catch (e) {
      console.error('Failed to start session:', e);
      setError('Could not access microphone or start session.');
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

  return { isSessionActive, isAwaitingResponse, userTranscript, aiTranscript, isAgentSpeaking, error, startSession, endSession, chatHistory };
};
