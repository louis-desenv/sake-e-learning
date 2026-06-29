import React, { useState, useEffect, useRef } from 'react';
import { AudioVisualizer, AudioPulse } from './AudioVisualizer';
import { useTranslation } from 'react-i18next';

/* ================= ICONS ================= */

const MicIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-14 0M12 19v4m-4 0h8m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
  </svg>
);

const StopIcon = () => (
  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
    <rect x="6" y="6" width="12" height="12" rx="2" />
  </svg>
);

const PlayIcon = () => (
  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
    <path d="M8 5v14l11-7z" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

/* ================= MAIN COMPONENT ================= */

type RecordingState = 'idle' | 'recording' | 'paused' | 'reviewing';

interface PracticeModeProps {
  onToggleSettings: () => void;
}

export const PracticeMode: React.FC<PracticeModeProps> = ({ onToggleSettings }) => {
  const { t } = useTranslation();
  const [state, setState] = useState<RecordingState>('idle');
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout>();
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        setTranscript(finalTranscript || interimTranscript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'no-speech') {
          // Ignore no-speech errors
          return;
        }
        setState('idle');
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Timer for recording
  useEffect(() => {
    if (state === 'recording') {
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [state]);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Start recording
  const startRecording = async () => {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Set up audio analyzer for visualizer
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);

      // Update audio level for visualizer
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      const updateAudioLevel = () => {
        if (state === 'recording' && analyserRef.current) {
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setAudioLevel(Math.min(100, (average / 128) * 100));
          requestAnimationFrame(updateAudioLevel);
        }
      };
      updateAudioLevel();

      // Start speech recognition
      if (recognitionRef.current) {
        recognitionRef.current.start();
      }

      setRecordingTime(0);
      setTranscript('');
      setFeedback(null);
      setState('recording');
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert(t('practice.micPermission'));
    }
  };

  // Pause recording
  const pauseRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setState('paused');
  };

  // Resume recording
  const resumeRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.start();
    }
    setState('recording');
  };

  // Stop and analyze
  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    setState('reviewing');
    setAudioLevel(0);

    // Simulate feedback (in real implementation, send to AI)
    setTimeout(() => {
      setFeedback('Great job! Your pronunciation is improving. Try to focus on the "th" sound next time.');
    }, 1000);
  };

  // Delete and reset
  const deleteRecording = () => {
    setRecordingTime(0);
    setTranscript('');
    setFeedback(null);
    setState('idle');
  };

  return (
    <>
      {/* TIMER DISPLAY */}
      {(state === 'recording' || state === 'paused') && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30">
          <div className={`flex items-center space-x-4 ${state === 'paused' ? 'opacity-50' : ''}`}>
            {/* Recording indicator */}
            {state === 'recording' && (
              <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
            )}

            {/* Time */}
            <span className="text-white text-6xl font-light tracking-wider" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {formatTime(recordingTime)}
            </span>

            {/* Paused label */}
            {state === 'paused' && (
              <span className="text-white/60 text-sm uppercase tracking-widest">{t('practice.paused')}</span>
            )}
          </div>
        </div>
      )}

      {/* TRANSCRIPT DISPLAY */}
      {(state === 'recording' || state === 'paused' || state === 'reviewing') && transcript && (
        <div className="absolute bottom-40 left-1/2 -translate-x-1/2 max-w-md w-full px-6 z-30 animate-fade-in">
          <div className="bg-black/50 backdrop-blur-md text-white text-center px-6 py-4 rounded-xl border border-white/10">
            <p className="text-white/60 text-xs uppercase tracking-wider mb-2">{t('practice.whatYouSaid')}</p>
            <p className="text-lg">"{transcript}"</p>
          </div>
        </div>
      )}

      {/* FEEDBACK DISPLAY (reviewing state) */}
      {state === 'reviewing' && feedback && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-md w-full px-6 z-30 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl p-6">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800 mb-1">{t('practice.feedback')}</h3>
                <p className="text-gray-600 text-sm">{feedback}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONTROLS */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-24 flex items-center justify-center space-x-4 z-40">

        {/* IDLE STATE → Start recording */}
        {state === 'idle' && (
          <div className="flex flex-col items-center space-y-4">
            {/* Tooltip */}
            <div className="relative bg-gray-700 rounded-2xl px-6 py-3 shadow-2xl">
              <p className="text-white text-base font-medium">{t('practice.tapToRecord')}</p>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-t-8 border-t-gray-700" />
            </div>

            {/* Record button */}
            <button
              onClick={startRecording}
              className="
                w-20 h-20 rounded-full flex items-center justify-center
                shadow-2xl text-white transition-all duration-200
                bg-gradient-to-br from-purple-500 to-purple-700
                hover:from-purple-400 hover:to-purple-600 hover:scale-105
              "
            >
              <MicIcon />
            </button>
          </div>
        )}

        {/* RECORDING STATE → Pause/Stop */}
        {state === 'recording' && (
          <div className="flex items-center space-x-4 animate-fade-in">
            {/* Pause */}
            <button
              onClick={pauseRecording}
              className="
                w-14 h-14 rounded-full bg-yellow-600
                flex items-center justify-center shadow-lg text-white
                transition-all duration-200 hover:scale-105 hover:bg-yellow-500
              "
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" rx="1" />
              </svg>
            </button>

            {/* Stop */}
            <button
              onClick={stopRecording}
              className="
                w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-red-600
                flex items-center justify-center shadow-xl text-white
                transition-all duration-200 hover:from-red-400 hover:to-red-500 hover:scale-105
              "
            >
              <StopIcon />
            </button>
          </div>
        )}

        {/* PAUSED STATE → Resume/Stop */}
        {state === 'paused' && (
          <div className="flex items-center space-x-4 animate-fade-in">
            {/* Resume */}
            <button
              onClick={resumeRecording}
              className="
                w-14 h-14 rounded-full bg-purple-600
                flex items-center justify-center shadow-lg text-white
                transition-all duration-200 hover:scale-105 hover:bg-purple-500
              "
            >
              <PlayIcon />
            </button>

            {/* Stop */}
            <button
              onClick={stopRecording}
              className="
                w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-red-600
                flex items-center justify-center shadow-xl text-white
                transition-all duration-200 hover:from-red-400 hover:to-red-500 hover:scale-105
              "
            >
              <StopIcon />
            </button>
          </div>
        )}

        {/* REVIEWING STATE → Delete/Settings */}
        {state === 'reviewing' && (
          <div className="flex items-center space-x-4 animate-fade-in">
            {/* Delete/Reset */}
            <button
              onClick={deleteRecording}
              className="
                w-14 h-14 rounded-full bg-gray-700
                flex items-center justify-center shadow-lg text-white
                transition-all duration-200 hover:scale-105 hover:bg-gray-600
              "
            >
              <TrashIcon />
            </button>

            {/* Settings */}
            <button
              onClick={onToggleSettings}
              className="
                w-14 h-14 rounded-full bg-purple-700
                flex items-center justify-center shadow-lg text-white
                transition-all duration-200 hover:scale-105 hover:bg-purple-600
              "
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>

            {/* New recording */}
            <button
              onClick={startRecording}
              className="
                w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-purple-700
                flex items-center justify-center shadow-xl text-white
                transition-all duration-200 hover:from-purple-400 hover:to-purple-600 hover:scale-105
              "
            >
              <MicIcon />
            </button>
          </div>
        )}
      </div>

      {/* STYLES */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.4s ease-out forwards;
        }
      `}</style>
    </>
  );
};

export default PracticeMode;
