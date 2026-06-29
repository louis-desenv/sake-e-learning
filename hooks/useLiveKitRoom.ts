/**
 * useLiveKitRoom Hook
 *
 * Custom React hook for managing LiveKit room connections with support for
 * audio/video tracks, real-time transcription, and participant management.
 *
 * @fileoverview Refactored with explicit agent identification, memory management,
 * and centralized cleanup for improved robustness and predictability.
 *
 * @dependencies react, livekit-client
 *
 * @author SAke E-Learning Team
 * @version 3.1.0
 */

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  type RefObject,
} from "react";
import {
  Room,
  RoomEvent,
  Track,
  RoomOptions,
  ConnectionState,
  Participant,
  RemoteTrack,
  RemoteTrackPublication,
  RemoteParticipant,
} from "livekit-client";

/* ==================================================================== */
/* CONSTANTS */
/* ==================================================================== */

/**
 * Maximum transcription segments to keep in memory.
 * Prevents unbounded memory growth during long sessions.
 */
const MAX_TRANSCRIPTION_SEGMENTS = 50;

/**
 * Agent identity prefixes.
 * LiveKit agents may have identities starting with "CA_" (custom) or "agent-" (auto-assigned).
 */
const AGENT_IDENTITY_PREFIXES = ["CA_", "agent-"];

/* ==================================================================== */
/* TYPES */
/* ==================================================================== */

interface UseLiveKitRoomReturn {
  isConnected: boolean;
  connectionState: ConnectionState;
  error: string | null;
  agentTranscript: string;
  userTranscript: string;
  isAgentSpeaking: boolean;
  participants: Participant[];
  connect: (serverUrl: string, token: string) => Promise<void>;
  disconnect: () => Promise<void>;
  toggleMicrophone: () => Promise<void>;
  startLocalPreview: () => Promise<void>;
  stopLocalPreview: () => void;
  isPreviewActive: boolean;
  room: Room | null;
  videoElementKey: number;
  audioTrackReady: boolean;
  videoTrackReady: boolean;
  tracksReady: boolean;
}

/* ==================================================================== */
/* UTILITIES */
/* ==================================================================== */

/**
 * Checks if a participant is an agent based on identity.
 * Agents have identities starting with "CA_" or "agent-".
 */
const isAgentParticipant = (participant: Participant | undefined): boolean => {
  const identity = participant?.identity;
  if (!identity) return false;
  return AGENT_IDENTITY_PREFIXES.some((prefix) => identity.startsWith(prefix));
};

/**
 * Updates transcription segments with memory limit.
 * Adds new segments and removes oldest if limit exceeded.
 */
const updateSegments = (
  prev: Map<string, any>,
  incoming: any[],
): Map<string, any> => {
  const next = new Map(prev);
  for (const s of incoming) {
    next.set(s.id, s);
  }
  // Remove oldest segments if over limit
  while (next.size > MAX_TRANSCRIPTION_SEGMENTS) {
    const firstKey = next.keys().next().value;
    next.delete(firstKey);
  }
  return next;
};

/**
 * Centralized media cleanup function.
 * Detaches tracks and clears audio/video elements.
 */
const cleanupMedia = (
  audioRef: RefObject<HTMLAudioElement>,
  videoTrackRef: RefObject<RemoteTrack>,
  videoElementId: string,
) => {
  // Cleanup audio
  if (audioRef.current) {
    audioRef.current.pause();
    audioRef.current = null;
  }

  // Cleanup video
  if (videoTrackRef.current) {
    const videoEl = document.getElementById(
      videoElementId,
    ) as HTMLVideoElement | null;
    if (videoEl) {
      try {
        videoTrackRef.current.detach(videoEl);
      } catch (e) {
        console.warn("Error detaching video:", e);
      }
      videoEl.srcObject = null;
    }
    videoTrackRef.current = null;
  }
};

/* ==================================================================== */
/* HOOK */
/* ==================================================================== */

interface UseLiveKitRoomOptions {
  onMessageComplete?: (role: "user" | "assistant", text: string, timestamp: number) => void;
}

export const useLiveKitRoom = (
  options?: UseLiveKitRoomOptions,
): UseLiveKitRoomReturn => {
  // Connection state
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    ConnectionState.Disconnected,
  );
  const [error, setError] = useState<string | null>(null);

  // Transcription state with memory management
  const [agentSegments, setAgentSegments] = useState<Map<string, any>>(
    new Map(),
  );
  const [userSegments, setUserSegments] = useState<Map<string, any>>(new Map());

  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);

  // Track readiness for lip sync
  const [audioTrackReady, setAudioTrackReady] = useState(false);
  const [videoTrackReady, setVideoTrackReady] = useState(false);
  const [tracksReady, setTracksReady] = useState(false);

  // Derived transcripts
  const agentTranscript = Array.from(agentSegments.values())
    .sort(
      (a: any, b: any) =>
        (a.firstReceivedTime || 0) - (b.firstReceivedTime || 0),
    )
    .map((s: any) => s.text)
    .join(" ");

  const userTranscript = Array.from(userSegments.values())
    .sort(
      (a: any, b: any) =>
        (a.firstReceivedTime || 0) - (b.firstReceivedTime || 0),
    )
    .map((s: any) => s.text)
    .join(" ");

  // Video element key for forcing re-render
  const [videoElementKey, setVideoElementKey] = useState(0);

  // Refs
  const roomRef = useRef<Room | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const currentVideoTrackRef = useRef<RemoteTrack | null>(null);
  const savedSegmentIdsRef = useRef<Set<string>>(new Set());

  // Local preview refs
  const localPreviewRef = useRef<HTMLVideoElement | null>(null);
  const localVideoTrackRef = useRef<MediaStreamTrack | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const [isPreviewActive, setIsPreviewActive] = useState(false);

  /* --------------------------------------------------------------- */
  /* EFFECTS */
  /* --------------------------------------------------------------- */

  // Sync audio/video track readiness
  useEffect(() => {
    if (audioTrackReady && videoTrackReady) {
      console.log("✅ Both audio and video tracks ready");
      setTracksReady(true);

      // Unmute audio for lip sync
      if (audioElementRef.current?.muted) {
        console.log("🔊 Unmuting audio for lip sync");
        audioElementRef.current.muted = false;
        audioElementRef.current
          .play()
          .catch((e) => console.warn("Audio play error:", e));
      }
    }
  }, [audioTrackReady, videoTrackReady]);

  // Reset track readiness on disconnect
  useEffect(() => {
    if (!isConnected) {
      setAudioTrackReady(false);
      setVideoTrackReady(false);
      setTracksReady(false);
    }
  }, [isConnected]);

  /* --------------------------------------------------------------- */
  /* CALLBACKS */
  /* --------------------------------------------------------------- */

  const updateParticipants = useCallback(() => {
    if (roomRef.current) {
      const allParticipants: Participant[] = [
        roomRef.current.localParticipant,
        ...Array.from(roomRef.current.remoteParticipants.values()),
      ];
      setParticipants(allParticipants);
    }
  }, []);

  const refreshVideoElement = useCallback(() => {
    console.log("Refreshing video element...");
    setVideoElementKey((prev) => prev + 1);
  }, []);

  /* --------------------------------------------------------------- */
  /* TRACK HANDLERS */
  /* --------------------------------------------------------------- */

  const handleTrackSubscribed = useCallback(
    (
      track: RemoteTrack,
      publication: RemoteTrackPublication,
      participant: RemoteParticipant,
    ) => {
      const isAgent = isAgentParticipant(participant);
      console.log(
        `Track subscribed: ${track.kind} from ${participant.identity} (agent: ${isAgent})`,
      );

      if (track.kind === Track.Kind.Audio) {
        const audioElement = document.createElement("audio");
        audioElement.autoplay = true;
        audioElement.muted = false;
        track.attach(audioElement);
        audioElementRef.current = audioElement;
        console.log("🎵 Audio track attached");

        // Mark audio ready when it can play
        const markAudioReady = () => {
          console.log("✅ Audio track ready");
          setAudioTrackReady(true);
        };

        audioElement.addEventListener("canplay", markAudioReady);
        audioElement.addEventListener("loadeddata", markAudioReady);
        audioElement.addEventListener("play", markAudioReady);
        audioElement.addEventListener("error", (e) =>
          console.error("❌ Audio error:", e),
        );
      }

      if (track.kind === Track.Kind.Video) {
        console.log(
          "[DEBUG] Video track received from:",
          participant.identity,
          {
            trackId: track.sid,
          },
        );
        currentVideoTrackRef.current = track;

        const attachVideo = () => {
          if (currentVideoTrackRef.current !== track) {
            console.log("Track changed, stopping attachment retries.");
            return;
          }

          const videoEl = document.getElementById(
            "bey-avatar-video",
          ) as HTMLVideoElement | null;

          if (!videoEl) {
            console.log("⚠️ Video element not found, retrying in 100ms...");
            setTimeout(attachVideo, 100);
            return;
          }

          console.log("Attaching video track...");
          videoEl.srcObject = null;
          videoEl.autoplay = true;
          videoEl.playsInline = true;
          videoEl.muted = true;
          videoEl.controls = false;

          try {
            track.attach(videoEl);

            const markVideoReady = () => {
              console.log("✅ Video track ready");
              setVideoTrackReady(true);
            };

            videoEl.addEventListener("loadedmetadata", markVideoReady);
            videoEl.addEventListener("canplay", markVideoReady);

            videoEl
              .play()
              .then(() => console.log("Avatar video playing"))
              .catch((err) => console.warn("Video play error:", err));
          } catch (attachError) {
            console.error("Failed to attach video track:", attachError);
          }
        };

        attachVideo();
      }
    },
    [],
  );

  const handleTrackUnsubscribed = useCallback(
    (
      track: RemoteTrack,
      publication: RemoteTrackPublication,
      participant: RemoteParticipant,
    ) => {
      console.log(
        `Track unsubscribed: ${track.kind} from ${participant.identity}`,
      );

      if (track.kind === Track.Kind.Audio) {
        if (audioElementRef.current) {
          track.detach(audioElementRef.current);
          audioElementRef.current.pause();
          audioElementRef.current = null;
        }
      } else if (track.kind === Track.Kind.Video) {
        const videoEl = document.getElementById(
          "bey-avatar-video",
        ) as HTMLVideoElement | null;
        if (videoEl) {
          track.detach(videoEl);
          videoEl.srcObject = null;
        }
        currentVideoTrackRef.current = null;
      } else {
        track.detach();
      }
    },
    [],
  );

  /* --------------------------------------------------------------- */
  /* TRANSCRIPTION HANDLERS */
  /* --------------------------------------------------------------- */

  const handleActiveSpeakersChanged = useCallback((speakers: Participant[]) => {
    // Use explicit agent identification
    const agentSpeaking = speakers.some((p) => isAgentParticipant(p));
    setIsAgentSpeaking(agentSpeaking);
  }, []);

  const handleTranscriptionReceived = useCallback(
    (
      segments: import("livekit-client").TranscriptionSegment[],
      participant?: Participant,
    ) => {
      const isAgent = isAgentParticipant(participant);

      // Agent transcriptions are fully handled by registerTextStreamHandler("lk.transcription").
      // Processing them here causes duplicates and out-of-order messages, so we skip agents.
      if (isAgent) return;

      const role = "user";

      // DEBUG: Log Raw Transcription Events
      console.log(
        `[useLiveKitRoom] 📝 Transcription from USER (${participant?.identity}):`,
        segments.map((s) => ({ text: s.text, final: s.final })),
      );

      setUserSegments((prevMap) => {
        const nextMap = new Map(prevMap);

        segments.forEach((seg) => {
          const oldSeg = nextMap.get(seg.id) as any;
          // Call onMessageComplete when a user segment transitions to final
          if (seg.final && (!oldSeg || !oldSeg.final)) {
            if (
              seg.text.trim() &&
              options?.onMessageComplete &&
              !savedSegmentIdsRef.current.has(seg.id)
            ) {
              savedSegmentIdsRef.current.add(seg.id);
              // Use firstReceivedTime if available, otherwise Date.now()
              const ts = (seg as any).firstReceivedTime ?? Date.now();
              options.onMessageComplete(role, seg.text.trim(), ts);
            }
          }

          // If this is a new non-final segment, clear all old finalized segments
          // This makes the transcript show only the current utterance
          if (!seg.final && !nextMap.has(seg.id)) {
            for (const [key, existing] of nextMap.entries()) {
              if ((existing as any).final) {
                nextMap.delete(key);
              }
            }
          }

          nextMap.set(seg.id, seg);
        });

        return nextMap;
      });
    },
    [options],
  );

  /* --------------------------------------------------------------- */
  /* LOCAL PREVIEW */
  /* --------------------------------------------------------------- */

  const startLocalPreview = useCallback(async () => {
    if (isPreviewActive) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      console.warn("getUserMedia not available");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: false,
      });
      localStreamRef.current = stream;
      localVideoTrackRef.current = stream.getVideoTracks()[0] || null;

      const localEl = document.getElementById(
        "local-preview",
      ) as HTMLVideoElement | null;
      if (localEl) {
        localEl.srcObject = stream;
        localEl.muted = true;
        localEl.play().catch(() => {});
      }

      setIsPreviewActive(true);
      console.log("Local preview started");
    } catch (err) {
      console.warn("Local preview error:", err);
    }
  }, [isPreviewActive]);

  const stopLocalPreview = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => {
        try {
          t.stop();
        } catch (e) {}
      });
      localStreamRef.current = null;
    }
    if (localVideoTrackRef.current) {
      try {
        localVideoTrackRef.current.stop();
      } catch (e) {}
      localVideoTrackRef.current = null;
    }
    const localEl = document.getElementById(
      "local-preview",
    ) as HTMLVideoElement | null;
    if (localEl) {
      localEl.pause();
      localEl.srcObject = null;
    }
    setIsPreviewActive(false);
    console.log("Local preview stopped");
  }, []);

  /* --------------------------------------------------------------- */
  /* CONNECT / DISCONNECT */
  /* --------------------------------------------------------------- */

  const disconnect = useCallback(async () => {
    console.log("Disconnecting...");

    // Centralized media cleanup
    cleanupMedia(audioElementRef, currentVideoTrackRef, "bey-avatar-video");

    // Disconnect room
    if (roomRef.current) {
      try {
        await roomRef.current.disconnect();
      } catch (e) {
        console.warn("Disconnect error:", e);
      }
      roomRef.current = null;
    }

    // Refresh video element for next connection
    refreshVideoElement();

    // Reset state
    setIsConnected(false);
    setConnectionState(ConnectionState.Disconnected);
    setAgentSegments(new Map());
    setUserSegments(new Map());
    setParticipants([]);
    setIsAgentSpeaking(false);
    savedSegmentIdsRef.current.clear();

    console.log("Disconnect complete");
  }, [refreshVideoElement]);

  const connect = useCallback(
    async (serverUrl: string, token: string) => {
      console.log("Connecting to LiveKit...");

      if (roomRef.current) {
        await disconnect();
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      setError(null);
      setAgentSegments(new Map());
      setUserSegments(new Map());

      try {
        const roomOptions: RoomOptions = {
          audioCaptureDefaults: {
            autoGainControl: true,
            echoCancellation: true,
            noiseSuppression: true,
            channelCount: 1,
            sampleRate: 16000,
          },
          adaptiveStream: true,
          dynacast: true,
        };

        const room = new Room(roomOptions);
        roomRef.current = room;

        // Event handlers
        room.on(RoomEvent.ConnectionStateChanged, (state: ConnectionState) => {
          console.log("Connection state:", state);
          setConnectionState(state);
          setIsConnected(state === ConnectionState.Connected);
        });

        room.on(RoomEvent.TrackSubscribed, handleTrackSubscribed);
        room.on(RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed);
        room.on(RoomEvent.ActiveSpeakersChanged, handleActiveSpeakersChanged);
        room.on(RoomEvent.TranscriptionReceived, handleTranscriptionReceived);
        room.on(RoomEvent.ParticipantConnected, updateParticipants);
        room.on(RoomEvent.ParticipantDisconnected, updateParticipants);

        room.on(RoomEvent.Disconnected, () => {
          console.log("Room disconnected");
          setIsConnected(false);
        });

        // Register text stream handler for agent transcriptions (LiveKit Agents 1.0+)
        // Agent transcriptions are published via "lk.transcription" text streams
        room.registerTextStreamHandler(
          "lk.transcription",
          async (reader, participantInfo) => {
            const identity = participantInfo.identity;
            const isAgent = AGENT_IDENTITY_PREFIXES.some((p) =>
              identity.startsWith(p),
            );

            console.log(
              `[useLiveKitRoom] 📨 Text stream from ${isAgent ? "AGENT" : "USER"} (${identity})`,
            );

            if (isAgent) {
              // Clear previous agent segments for fresh display
              setAgentSegments(new Map());

              const streamId = `stream-${Date.now()}`;
              // Capture start time so agent messages are timestamped at the beginning of the stream,
              // ensuring correct ordering vs user messages in the conversation history.
              const streamStartTime = Date.now();
              let fullText = "";

              // Use async iteration for real-time text updates
              for await (const chunk of reader) {
                fullText += chunk; // Accumulate incremental chunks
                setAgentSegments(
                  new Map([
                    [streamId, { id: streamId, text: fullText, final: false }],
                  ]),
                );
              }

              // Mark as final when stream completes
              if (fullText.trim()) {
                setAgentSegments(
                  new Map([
                    [streamId, { id: streamId, text: fullText, final: true }],
                  ]),
                );

                // Save to conversation history with the stream start timestamp
                if (options?.onMessageComplete) {
                  options.onMessageComplete("assistant", fullText.trim(), streamStartTime);
                }
              }
            }
          },
        );

        await room.connect(serverUrl, token);
        console.log("Connected to room:", room.name);

        // Enable microphone
        await room.localParticipant.setMicrophoneEnabled(true);
        console.log("Microphone enabled");

        updateParticipants();
        setIsConnected(true);
      } catch (e) {
        console.error("Connection failed:", e);
        setError(e instanceof Error ? e.message : "Connection failed");
        setIsConnected(false);
      }
    },
    [
      disconnect,
      handleTrackSubscribed,
      handleActiveSpeakersChanged,
      handleTranscriptionReceived,
      updateParticipants,
      refreshVideoElement,
    ],
  );

  const toggleMicrophone = useCallback(async () => {
    if (roomRef.current) {
      const isEnabled = roomRef.current.localParticipant.isMicrophoneEnabled;
      await roomRef.current.localParticipant.setMicrophoneEnabled(!isEnabled);
    }
  }, []);

  /* --------------------------------------------------------------- */
  /* CLEANUP ON UNMOUNT */
  /* --------------------------------------------------------------- */

  useEffect(() => {
    return () => {
      if (roomRef.current) {
        roomRef.current.disconnect();
      }
    };
  }, []);

  return {
    isConnected,
    connectionState,
    error,
    agentTranscript,
    userTranscript,
    isAgentSpeaking,
    participants,
    connect,
    disconnect,
    toggleMicrophone,
    startLocalPreview,
    stopLocalPreview,
    isPreviewActive,
    room: roomRef.current,
    videoElementKey,
    audioTrackReady,
    videoTrackReady,
    tracksReady,
  };
};
