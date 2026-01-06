import { useState, useRef, useCallback } from 'react';
// FIX: Removed LiveSession from import as it's not an exported member of '@google/genai'.
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';
import { useUser } from '../context/UserContext';
import { encode, decode, decodeAudioData } from '../util/audioUtils';

// Audio configuration
const INPUT_SAMPLE_RATE = 16000;
const OUTPUT_SAMPLE_RATE = 24000;
const BUFFER_SIZE = 4096;

// FIX: Defined a minimal LiveSession type, as it's not exported from the library.
// This interface includes only the methods used on the sessionRef in this file.
interface LiveSession {
    close: () => void;
}

export const useGeminiLive = () => {
    const userProfile = useUser();
    const [isSessionActive, setIsSessionActive] = useState(false);
    const [isAwaitingResponse, setIsAwaitingResponse] = useState(false);
    const [userTranscript, setUserTranscript] = useState('');
    const [aiTranscript, setAiTranscript] = useState('');
    const [error, setError] = useState<string | null>(null);

    const sessionRef = useRef<LiveSession | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const nextStartTimeRef = useRef(0);
    const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

    const stopAudioPlayback = () => {
        if (outputAudioContextRef.current) {
            audioSourcesRef.current.forEach(source => {
                source.stop();
            });
            audioSourcesRef.current.clear();
            nextStartTimeRef.current = 0;
        }
    };

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


    const startSession = async (analyserNodeCallback?: (analyser: AnalyserNode) => void) => {
        if (isSessionActive) return;
        setError(null);
        setUserTranscript('');
        setAiTranscript('');

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;

            // Fix: Cast window to 'any' to access webkitAudioContext for cross-browser compatibility without TypeScript errors.
            inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: INPUT_SAMPLE_RATE });
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: OUTPUT_SAMPLE_RATE });

            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

            const sessionPromise = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => {
                        const source = inputAudioContextRef.current!.createMediaStreamSource(stream);
                        mediaStreamSourceRef.current = source;
                        
                        if (analyserNodeCallback) {
                            const analyser = inputAudioContextRef.current!.createAnalyser();
                            analyser.fftSize = 2048;
                            source.connect(analyser);
                            analyserNodeCallback(analyser);
                        }

                        const scriptProcessor = inputAudioContextRef.current!.createScriptProcessor(BUFFER_SIZE, 1, 1);
                        scriptProcessorRef.current = scriptProcessor;

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
                    onmessage: async (message: LiveServerMessage) => {
                        if (message.serverContent?.inputTranscription) {
                            setUserTranscript(prev => prev + message.serverContent!.inputTranscription!.text);
                        }
                        if (message.serverContent?.outputTranscription) {
                            setIsAwaitingResponse(false);
                            setAiTranscript(prev => prev + message.serverContent!.outputTranscription!.text);
                        }
                        if (message.serverContent?.turnComplete) {
                            setUserTranscript('');
                            setAiTranscript('');
                        }

                        const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                        if (base64Audio) {
                            // Store the audio data for Beyond Presence
                            const audioData = base64Audio;
                            // We'll emit this to the parent component
                            if (window.dispatchEvent) {
                                window.dispatchEvent(new CustomEvent('geminiAudioReceived', {
                                    detail: { audioData, transcript: message.serverContent?.outputTranscription?.text || '' }
                                }));
                            }

                            // Still play the audio locally for immediate feedback
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

                        if (message.serverContent?.interrupted) {
                            stopAudioPlayback();
                        }
                    },
                    onerror: (e: ErrorEvent) => {
                        console.error('Session error:', e);
                        setError('An error occurred during the session.');
                        cleanup();
                    },
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

    const endSession = useCallback(() => {
        if (sessionRef.current) {
            sessionRef.current.close();
        }
        cleanup();
    }, [cleanup]);

    return { isSessionActive, isAwaitingResponse, userTranscript, aiTranscript, error, startSession, endSession };
};
