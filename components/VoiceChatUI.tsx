import React, { useRef, useEffect, useState } from "react";
import { useLiveKitRoom } from "../hooks/useLiveKitRoom";
import {
  generateLiveKitToken,
  LIVEKIT_CONFIG,
} from "../services/livekitTokenService";
import { useUser } from "../context/UserContext";
import { Star, Volume2, History, ChevronRight, Clock, X } from "lucide-react";
import avatarVideo from "../video/avatar-video.mp4";
import {
  conversationService,
  Conversation,
  Message,
} from "../services/conversationService";

/**
 * Helper function to get consistent user ID from Auth ctx
 */
const getUserId = (user: { id?: string; name?: string } | null): string => {
  if (!user) return "guest";
  return user.id || user.name || "guest";
};

/* ================= FREE SVG ICONS ================= */

const CameraIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
    />
  </svg>
);

const CameraOffIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
    />
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
  </svg>
);

const MicIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M19 11a7 7 0 01-14 0M12 19v4m-4 0h8m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
    />
  </svg>
);

const ChatIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
    />
  </svg>
);

const PhoneIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24 11.36 11.36 0 003.58.57 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1 11.36 11.36 0 00.57 3.58 1 1 0 01-.24 1.01l-2.21 2.2z" />
  </svg>
);

const HangUpIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08a.956.956 0 010-1.36C3.46 8.61 7.53 7 12 7s8.54 1.61 11.71 4.72c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.1-.7-.28a11.27 11.27 0 00-2.66-1.85.996.996 0 01-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z" />
  </svg>
);

/* ================= FANCY CONNECTING SPINNER ================= */

const ConnectingSpinner = () => (
  <div className="flex flex-col items-center justify-center space-y-6">
    {/* Multi-ring spinner */}
    <div className="relative w-32 h-32">
      {/* Glow effect */}
      <div className="absolute inset-0 rounded-full bg-purple-500/30 blur-2xl animate-pulse" />

      {/* Ring 1 - outer (slow) */}
      <div
        className="absolute inset-0 rounded-full border-4 border-purple-500/20"
        style={{
          borderTopColor: "#a855f7",
          borderRightColor: "#7c3aed",
          animation: "spin 3s linear infinite",
        }}
      />

      {/* Ring 2 - middle (medium, reverse) */}
      <div
        className="absolute inset-4 rounded-full border-4 border-purple-500/20"
        style={{
          borderTopColor: "#c084fc",
          borderLeftColor: "#8b5cf6",
          animation: "spin 2s linear infinite reverse",
        }}
      />

      {/* Ring 3 - inner (fast) */}
      <div
        className="absolute inset-8 rounded-full border-4 border-purple-500/20"
        style={{
          borderTopColor: "#e9d5ff",
          borderBottomColor: "#a855f7",
          animation: "spin 1s linear infinite",
        }}
      />

      {/* Center icon with pulse */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative">
          <div className="absolute inset-0 w-10 h-10 rounded-full bg-purple-500 animate-ping opacity-40" />
          <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>

    {/* Status text with animated dots */}
    <div className="text-center">
      <p className="text-gray-900 text-xl font-medium tracking-wide flex items-center justify-center">
        Preparing your session
        <span className="flex ml-1 space-x-1">
          <span
            className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
            style={{ animationDelay: "0ms" }}
          />
          <span
            className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
            style={{ animationDelay: "150ms" }}
          />
          <span
            className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
            style={{ animationDelay: "300ms" }}
          />
        </span>
      </p>
      <p className="text-gray-500 text-sm mt-3">
        Loading avatar, please wait...
      </p>
    </div>

    {/* Progress bar (fake, for visual feedback) */}
    <div className="w-48 h-1 bg-gray-200 rounded-full overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-purple-500 to-purple-300 rounded-full"
        style={{
          animation: "progress 2s ease-in-out infinite",
        }}
      />
    </div>
  </div>
);

/* ================= MAIN COMPONENT ================= */

const VoiceChatUI: React.FC = () => {
  const { user } = useUser();
  const userId = getUserId(user);

  // Active session refs
  const currentConversationIdRef = useRef<string | null>(null);
  const conversationStartTime = useRef<Date | null>(null);

  const {
    isConnected,
    agentTranscript,
    userTranscript,
    participants,
    connect,
    disconnect,
    toggleMicrophone,
    videoElementKey,
    videoTrackReady,
  } = useLiveKitRoom({
    // Saving is handled by the agent backend via conversation_item_added
  });

  const [isGeneratingToken, setIsGeneratingToken] = useState(false);
  const [micOn, setMicOn] = useState(true);

  // Avatar ready state
  const [avatarReady, setAvatarReady] = useState(false);

  // Timing logs
  const connectionStartTime = useRef<number | null>(null);

  // Local camera preview
  const [cameraOn, setCameraOn] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Modals and settings
  const [activeModal, setActiveModal] = useState<"points" | "audio" | null>(
    null,
  );
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [userPoints, setUserPoints] = useState(1250);

  // History State
  const [showHistory, setShowHistory] = useState(false);
  const [historyConversations, setHistoryConversations] = useState<
    Conversation[]
  >([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [expandedConversationId, setExpandedConversationId] = useState<
    string | null
  >(null);
  const [conversationMessages, setConversationMessages] = useState<
    Record<string, Message[]>
  >({});
  const [historyFullscreen, setHistoryFullscreen] = useState(false);

  // Derived state: Show spinner when connected but avatar not ready
  const showSpinner = isConnected && !avatarReady;

  // Derived state: Call is fully ready (connected + avatar loaded)
  const isCallReady = isConnected && avatarReady;

  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });
      streamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        await localVideoRef.current.play();
      }
      setCameraOn(true);
    } catch {
      alert("Camera permission denied");
    }
  };

  const closeCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    setCameraOn(false);
  };

  const handleToggleMic = () => {
    toggleMicrophone();
    setMicOn(!micOn);
  };

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      disconnect();
    };
  }, [disconnect]);

  const handleConnect = async () => {
    setIsGeneratingToken(true);
    setAvatarReady(false); // Reset avatar state
    connectionStartTime.current = Date.now();
    console.log("[Avatar] ⏱️ Starting connection...");
    try {
      // Criar a conversa no banco ANTES de gerar o token
      let conversationId: string | undefined;
      if (userId !== "guest") {
        const conv = await conversationService.createConversation(
          userId,
          "free-conversation",
          "avatar",
        );
        if (conv) {
          currentConversationIdRef.current = conv.id;
          conversationStartTime.current = new Date();
          conversationId = conv.id;
        }
      }

      // Gerar token com conversationId no metadata
      const token = await generateLiveKitToken({
        apiKey: LIVEKIT_CONFIG.apiKey,
        apiSecret: LIVEKIT_CONFIG.apiSecret,
        identity: user.name || "User",
        roomName: LIVEKIT_CONFIG.roomName,
        conversationId,
      });
      console.log(
        "[Avatar] ✅ Token generated in",
        Date.now() - connectionStartTime.current,
        "ms",
      );

      await connect(LIVEKIT_CONFIG.serverUrl, token);
      console.log(
        "[Avatar] ✅ Connected to LiveKit in",
        Date.now() - connectionStartTime.current,
        "ms",
      );
    } finally {
      setIsGeneratingToken(false);
    }
  };

  const handleDisconnect = async () => {
    // Save duration or delete if empty if we have a valid session
    if (currentConversationIdRef.current && conversationStartTime.current) {
      const durationSeconds = Math.floor(
        (new Date().getTime() - conversationStartTime.current.getTime()) / 1000,
      );
      try {
        // Check if there are messages for this conversation
        const convWithMessages = await conversationService.getConversationWithMessages(currentConversationIdRef.current);
        
        if (convWithMessages && convWithMessages.messages.length === 0) {
          // No messages were saved, user just clicked and left. Delete the empty conversation.
          await conversationService.deleteConversation(currentConversationIdRef.current);
          console.log("[VoiceChatUI] Deleted empty conversation on disconnect:", currentConversationIdRef.current);
        } else {
          // Standard finish updating the duration
          await conversationService.endConversation(
            currentConversationIdRef.current,
            durationSeconds,
          );
        }
      } catch (err) {
        console.error("[VoiceChatUI] Error ending/deleting conversation on click:", err);
      }
      currentConversationIdRef.current = null;
    }

    await disconnect();
    setAvatarReady(false);

    if (userId !== "guest") {
      loadConversationsByScenario();
    }
  };

  // Handler for avatar video ready
  const handleAvatarReady = () => {
    const elapsed = connectionStartTime.current
      ? Date.now() - connectionStartTime.current
      : 0;
    console.log("[Avatar] ✅ Avatar video ready! Total time:", elapsed, "ms");
    // Small delay for smoother transition
    setTimeout(() => {
      setAvatarReady(true);
    }, 300);
  };

  // Sync avatarReady with videoTrackReady from hook (fallback if onPlaying doesn't fire)
  useEffect(() => {
    if (videoTrackReady) {
      setAvatarReady(true);
    }
  }, [videoTrackReady]);

  // ============================================================================
  // HISTORY LOGIC
  // ============================================================================

  // Load conversations when history panel opens
  useEffect(() => {
    if (showHistory && userId !== "guest") {
      loadConversationsByScenario();
    }
  }, [showHistory, userId]);

  const loadConversationsByScenario = async () => {
    if (userId === "guest") return;

    setLoadingHistory(true);
    try {
      // Buscar do bd pela Categoria "avatar"
      const data = await conversationService.getConversationsByCategory(
        userId,
        "avatar",
        50,
      );

      // Filtrar pelo cenário "free-conversation" no frontend
      const avatarFreeConversations = data.filter(
        (conv) => conv.scenario === "free-conversation",
      );

      setHistoryConversations(avatarFreeConversations);
    } catch (error) {
      console.error("[VoiceChatUI] Error loading history:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const loadConversationMessages = async (conversationId: string) => {
    if (conversationMessages[conversationId]) return;
    const data =
      await conversationService.getConversationWithMessages(conversationId);
    if (data) {
      setConversationMessages((prev) => ({
        ...prev,
        [conversationId]: data.messages,
      }));
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "0m";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      {/* INITIAL CARD STATE - Visible when not connected or avatar not ready */}
      {!isCallReady && (
        <div className="w-full h-full flex items-center justify-center bg-gray-50 p-4 relative z-40">
          <div className="w-full max-w-3xl bg-white rounded-2xl shadow-lg border-t-4 border-t-purple-500 flex flex-col overflow-hidden transition-all hover:shadow-xl relative z-50">
            {/* Header */}
            <div className="p-6 pb-2 flex items-center justify-between border-b border-gray-50/50">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-purple-50 rounded-full text-purple-600">
                  <MicIcon className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-bold text-xl text-gray-800">
                    Just Avatar
                  </h3>
                  <p className="text-sm text-gray-500">
                    Tap below and start speaking...
                  </p>
                </div>
              </div>

              {/* History Button (Always available, like real-life) */}
              <button
                onClick={() => setShowHistory(true)}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-colors bg-gray-100 hover:bg-gray-200 shadow-sm border border-gray-200"
                title="Ver histórico"
              >
                <History className="h-5 w-5 text-gray-600" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-8 min-h-[500px] relative bg-white overflow-hidden">
              {/* Background */}
              <div className="absolute inset-4 rounded-2xl bg-gradient-to-br from-purple-50 to-indigo-50 overflow-hidden" />
              <div className="absolute inset-4 pointer-events-none rounded-2xl bg-gradient-to-t from-white/30 via-transparent to-transparent" />

              {/* Initial specific content - VIDEO CENTERED */}
              {!isConnected && (
                <div className="absolute inset-0 flex flex-col items-center justify-center z-40 p-6">
                  {/* Video Container - Responsive */}
                  <div className="relative w-full max-w-[280px] aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl border-4 border-white ring-4 ring-purple-100 mb-8">
                    <video
                      src={avatarVideo}
                      autoPlay
                      muted
                      loop
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Start Button Group - Centered Below */}
                  <div className="flex flex-col items-center space-y-2">
                    {/* Tooltip balloon */}
                    <div className="relative bg-white rounded-xl px-5 py-2 shadow-md border border-gray-200">
                      <p className="text-gray-700 text-xs font-medium">
                        Tap to start conversation
                      </p>
                      {/* Arrow pointing down */}
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-6 border-l-transparent border-r-6 border-r-transparent border-t-6 border-t-white" />
                    </div>

                    {/* Microphone button */}
                    <button
                      onClick={handleConnect}
                      disabled={isGeneratingToken}
                      className={`
                        w-16 h-16 rounded-full flex items-center justify-center shadow-lg text-white transition-all duration-300
                        ${
                          isGeneratingToken
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-400 hover:to-purple-500 hover:scale-105"
                        }
                      `}
                    >
                      {isGeneratingToken ? (
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <MicIcon className="w-9 h-9" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Spinner */}
              {showSpinner && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/50 backdrop-blur-sm animate-fade-in">
                  <ConnectingSpinner />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODALS (Global) */}
      {/* Points Modal */}
      {activeModal === "points" && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-800">
                Seu Progresso
              </h2>
              <button
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center"
              >
                <svg
                  className="w-5 h-5 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="text-center">
                <div className="text-5xl font-bold text-purple-600 mb-2">
                  {userPoints}
                </div>
                <div className="text-gray-600">Pontos totais</div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-purple-50 p-4 rounded-xl">
                  <div className="text-2xl font-bold text-purple-700">12</div>
                  <div className="text-sm text-gray-600">Nível</div>
                </div>
                <div className="bg-green-50 p-4 rounded-xl">
                  <div className="text-2xl font-bold text-green-700">8</div>
                  <div className="text-sm text-gray-600">Conversas hoje</div>
                </div>
              </div>
              <div className="text-center text-sm text-gray-500">
                Tempo de prática: 45min
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Audio Settings Modal */}
      {activeModal === "audio" && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-800">
                Configurações
              </h2>
              <button
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center"
              >
                <svg
                  className="w-5 h-5 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Ativar som</span>
                <button
                  onClick={() => setTtsEnabled(!ttsEnabled)}
                  className={`w-12 h-6 rounded-full transition-colors ${ttsEnabled ? "bg-purple-600" : "bg-gray-300"}`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${ttsEnabled ? "translate-x-6" : "translate-x-0.5"}`}
                  />
                </button>
              </div>
              <hr />
              <p className="text-sm text-gray-600">
                Nota: Mais configurações disponíveis em breve!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* FULL SCREEN ACTIVE CALL WRAPPER */}
      {/* Always render, but hide if not connected/ready to keep connection alive */}
      <div
        className={`fixed inset-0 bg-black overflow-hidden ${!isCallReady ? "invisible pointer-events-none opacity-0" : "visible pointer-events-auto opacity-100"} transition-opacity duration-500`}
      >
        {/* LIVEKIT AVATAR VIDEO — DO NOT CHANGE ID */}
        <video
          id="bey-avatar-video"
          key={videoElementKey}
          autoPlay
          playsInline
          muted
          onCanPlay={handleAvatarReady}
          onPlaying={handleAvatarReady}
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Soft vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/30 pointer-events-none" />

        {/* Participants (only show when call ready) */}
        {isCallReady && (
          <div className="absolute top-4 right-4 flex space-x-2 z-30 animate-fade-in">
            {participants.slice(0, 4).map((p, i) => (
              <div
                key={i}
                className="w-9 h-9 rounded-full bg-white/90 flex items-center justify-center text-xs font-bold"
              >
                {p.identity?.[0]?.toUpperCase() || "?"}
              </div>
            ))}
          </div>
        )}

        {/* Self preview (only show when call ready) */}
        {isCallReady && (
          <div className="absolute bottom-40 left-6 w-32 h-40 rounded-xl overflow-hidden bg-gray-900 shadow-xl z-30 animate-fade-in">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
              style={{
                display: cameraOn ? "block" : "none",
                transform: "scaleX(-1)",
              }}
            />
            {!cameraOn && (
              <div className="w-full h-full flex flex-col items-center justify-center text-white text-sm">
                <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center mb-2 text-lg font-bold">
                  {user.name?.[0]?.toUpperCase() || "U"}
                </div>
                <span className="text-gray-400 text-xs">Camera off</span>
              </div>
            )}
          </div>
        )}

        {/* Transcript (only show when call ready) */}
        {isCallReady && (agentTranscript || userTranscript) && (
          <div className="absolute bottom-40 right-6 max-w-sm bg-black/50 backdrop-blur text-white text-sm px-4 py-3 rounded-xl z-30 animate-fade-in">
            <div>
              <strong>Agent:</strong> {agentTranscript || "..."}
            </div>
            <div className="opacity-70 mt-1">
              <strong>You:</strong> {userTranscript || "..."}
            </div>
          </div>
        )}

        {/* CONTROLS */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-24 flex items-center space-x-4 z-40">
          {/* AFTER CALL READY → FULL CONTROLS */}
          {isCallReady && (
            <div className="flex items-center space-x-4 animate-fade-in">
              {/* Camera */}
              <button
                onClick={cameraOn ? closeCamera : openCamera}
                className={`
                w-14 h-14 rounded-full
                flex items-center justify-center
                shadow-lg text-white
                transition-all duration-200
                hover:scale-105
                ${cameraOn ? "bg-purple-600" : "bg-purple-800"}
              `}
              >
                {cameraOn ? (
                  <CameraIcon className="w-6 h-6" />
                ) : (
                  <CameraOffIcon className="w-6 h-6" />
                )}
              </button>

              {/* Mic */}
              <button
                onClick={handleToggleMic}
                className={`
                w-14 h-14 rounded-full
                flex items-center justify-center
                shadow-lg text-white
                transition-all duration-200
                hover:scale-105
                ${micOn ? "bg-purple-600" : "bg-purple-800"}
              `}
              >
                <MicIcon className="w-6 h-6" />
              </button>

              {/* Chat */}
              <button
                className="
                w-14 h-14 rounded-full
                bg-purple-700
                flex items-center justify-center
                shadow-lg text-white
                transition-all duration-200
                hover:scale-105
              "
              >
                <ChatIcon className="w-6 h-6" />
              </button>

              {/* Hang Up */}
              <button
                onClick={handleDisconnect}
                className="
                w-16 h-16 rounded-full
                bg-gradient-to-br from-red-500 to-red-600
                flex items-center justify-center
                shadow-xl text-white
                transition-all duration-200
                hover:from-red-400 hover:to-red-500
                hover:scale-105
              "
              >
                <HangUpIcon className="w-7 h-7" />
              </button>
            </div>
          )}
        </div>

        {/* STYLES */}
        <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes progress {
          0% { width: 0%; margin-left: 0%; }
          50% { width: 60%; margin-left: 20%; }
          100% { width: 0%; margin-left: 100%; }
        }

        .animate-fade-in {
          animation: fade-in 0.4s ease-out forwards;
        }
      `}</style>
      </div>

      {/* History Panel Modal */}
      {showHistory && (
        <div
          className={`fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 ${historyFullscreen ? "p-0" : "p-4"}`}
        >
          <div
            className={`bg-white shadow-2xl w-full flex flex-col ${historyFullscreen ? "h-full rounded-none" : "rounded-2xl max-w-2xl min-h-[50vh] max-h-[90vh]"}`}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-gray-50 flex-shrink-0">
              <h2 className="text-lg font-semibold text-gray-800">
                Histórico de Conversas
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setHistoryFullscreen(!historyFullscreen)}
                  className="w-8 h-8 rounded-full hover:bg-gray-200 flex items-center justify-center transition-colors"
                  title={
                    historyFullscreen ? "Sair da tela cheia" : "Tela cheia"
                  }
                >
                  {historyFullscreen ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-gray-600"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-gray-600"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                    </svg>
                  )}
                </button>
                <button
                  onClick={() => setShowHistory(false)}
                  className="w-8 h-8 rounded-full hover:bg-gray-200 flex items-center justify-center transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {loadingHistory ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                </div>
              ) : historyConversations.length === 0 ? (
                <div className="text-center py-8 flex flex-col items-center justify-center h-full text-gray-400">
                  <History className="h-12 w-12 text-gray-300 mb-3" />
                  <p className="text-gray-500">Nenhuma conversa ainda.</p>
                  <p className="text-sm">History will appear here...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Past Conversations List */}
                  {historyConversations.map((conv) => (
                    <div
                      key={conv.id}
                      className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden"
                    >
                      {/* Header */}
                      <div
                        className="bg-gray-100 px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-200 transition-colors"
                        onClick={() => {
                          if (expandedConversationId === conv.id) {
                            setExpandedConversationId(null);
                          } else {
                            setExpandedConversationId(conv.id);
                            loadConversationMessages(conv.id);
                          }
                        }}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            {/* Assume Avatar acts as 'free-conversation' like VoiceChat */}
                            <span className="font-medium text-gray-800 capitalize">
                              {conv.scenario.replace(/-/g, " ")}
                            </span>
                            <span className="text-gray-400">•</span>
                            <span className="text-xs text-gray-500">
                              {formatDate(conv.started_at)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                            <Clock className="w-3 h-3" />
                            <span>{formatDuration(conv.duration_seconds)}</span>
                            <span className="text-gray-300">•</span>
                            <span>
                              {conversationMessages[conv.id]?.length || 0}{" "}
                              mensagens
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              alert(
                                "Função de download será implementada em breve.",
                              );
                            }}
                            className="p-2 text-gray-500 hover:text-purple-600 hover:bg-gray-200 rounded-lg transition-colors"
                            title="Baixar conversa"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                              <polyline points="7,10 12,15 17,10" />
                              <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                          </button>
                          <ChevronRight
                            className={`h-5 w-5 text-gray-500 transition-transform ${expandedConversationId === conv.id ? "rotate-90" : ""}`}
                          />
                        </div>
                      </div>

                      {/* Messages */}
                      {expandedConversationId === conv.id && (
                        <div className="p-4 space-y-3 max-h-96 overflow-y-auto bg-white border-t border-gray-200 custom-scrollbar">
                          {conversationMessages[conv.id] === undefined ? (
                            <p className="text-gray-400 text-sm text-center py-2">
                              Carregando mensagens...
                            </p>
                          ) : conversationMessages[conv.id].length === 0 ? (
                            <p className="text-gray-400 text-sm text-center py-2">
                              Nenhuma mensagem nesta conversa.
                            </p>
                          ) : (
                            conversationMessages[conv.id].map((msg) => (
                              <div
                                key={msg.id}
                                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                              >
                                <div
                                  className={`max-w-[85%] p-3 rounded-lg text-sm leading-relaxed ${
                                    msg.role === "user"
                                      ? "bg-purple-600 text-white"
                                      : "bg-gray-100 text-gray-800 border border-gray-200"
                                  }`}
                                >
                                  <div
                                    className={`text-[10px] ${msg.role === "user" ? "text-purple-200" : "text-gray-500"} mb-1 ml-1 font-medium select-none`}
                                  >
                                    {msg.role === "user" ? "Você" : "IA Tutor"}
                                  </div>
                                  <p className="whitespace-pre-wrap">
                                    {msg.content}
                                  </p>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default VoiceChatUI;
