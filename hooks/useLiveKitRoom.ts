import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Room,
  RoomEvent,
  Track,
  RoomOptions,
  AudioPresets,
  ConnectionState,
  Participant,
  RemoteTrack,
  RemoteTrackPublication,
  RemoteParticipant,
  LocalParticipant,
  TrackPublication,
} from 'livekit-client';

export const useLiveKitRoom = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    ConnectionState.Disconnected,
  );
  const [error, setError] = useState<string | null>(null);
  const [agentTranscript, setAgentTranscript] = useState('');
  const [userTranscript, setUserTranscript] = useState('');
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  
  // 🔴 NEW: Add a video key to force re-render
  const [videoElementKey, setVideoElementKey] = useState(0);

  const roomRef = useRef<Room | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const currentVideoTrackRef = useRef<RemoteTrack | null>(null);

  const updateParticipants = useCallback(() => {
    if (roomRef.current) {
      const allParticipants: Participant[] = [
        roomRef.current.localParticipant,
        ...Array.from(roomRef.current.remoteParticipants.values()),
      ];
      setParticipants(allParticipants);
    }
  }, []);

  // 🔴 NEW: Force video element refresh
  const refreshVideoElement = useCallback(() => {
    console.log('Refreshing video element...');
    setVideoElementKey(prev => prev + 1);
  }, []);

  const handleTrackSubscribed = useCallback(
    (track: RemoteTrack, publication: RemoteTrackPublication, participant: RemoteParticipant) => {
      console.log('Track subscribed:', track.kind, 'from', participant.identity);

      if (track.kind === Track.Kind.Audio) {
        const audioElement = document.createElement('audio');
        audioElement.autoplay = true;
        track.attach(audioElement);
        audioElementRef.current = audioElement;
        console.log('Audio track attached');
      }

      if (track.kind === Track.Kind.Video) {
        console.log('Video track received...');
        
        // Store the track reference
        currentVideoTrackRef.current = track;
        
        // Try to attach immediately
        const tryAttach = () => {
          const videoEl = document.getElementById('bey-avatar-video') as HTMLVideoElement | null;
          
          if (videoEl) {
            console.log('Found video element, attaching track...');
            
            // Clear any existing content
            videoEl.srcObject = null;
            
            // Set properties
            videoEl.autoplay = true;
            videoEl.playsInline = true;
            videoEl.muted = true;
            videoEl.controls = false;
            
            try {
              track.attach(videoEl);
              console.log('Video track attached successfully');
              
              // Attempt to play
              videoEl.play()
                .then(() => {
                  console.log('Avatar video playing');
                  setTimeout(() => {
                    console.log('Video state:', {
                      videoWidth: videoEl.videoWidth,
                      videoHeight: videoEl.videoHeight,
                      readyState: videoEl.readyState,
                      currentTime: videoEl.currentTime
                    });
                  }, 1000);
                })
                .catch(err => {
                  console.warn('Video play error:', err);
                  // Retry play
                  setTimeout(() => {
                    videoEl.play().catch(e => console.error('Video play retry failed:', e));
                  }, 500);
                });
                
            } catch (attachError) {
              console.error('Failed to attach video track:', attachError);
            }
          } else {
            console.log('Video element not found, will retry...');
            // Retry after a short delay
            setTimeout(tryAttach, 100);
          }
        };

        // Start attachment attempt
        tryAttach();
      }
    },
    [],
  );

  const handleTrackUnsubscribed = useCallback(
    (track: RemoteTrack, publication: RemoteTrackPublication, participant: RemoteParticipant) => {
      console.log('Track unsubscribed:', track.kind, 'from', participant.identity);
      
      if (track.kind === Track.Kind.Audio && audioElementRef.current) {
        track.detach(audioElementRef.current);
        audioElementRef.current.pause();
        audioElementRef.current = null;
      } else if (track.kind === Track.Kind.Video) {
        const videoEl = document.getElementById('bey-avatar-video') as HTMLVideoElement | null;
        if (videoEl) {
          track.detach(videoEl);
          videoEl.srcObject = null;
        } else {
          track.detach();
        }
        currentVideoTrackRef.current = null;
      } else {
        track.detach();
      }
    },
    [],
  );

  const handleActiveSpeakersChanged = useCallback((speakers: Participant[]) => {
    const agentSpeaking = speakers.some(
      (speaker) => speaker !== roomRef.current?.localParticipant,
    );
    setIsAgentSpeaking(agentSpeaking);
  }, []);

  const handleDataReceived = useCallback((payload: Uint8Array, participant?: RemoteParticipant) => {
    try {
      const message = JSON.parse(new TextDecoder().decode(payload));
      console.log('Data received:', message);

      if (message.type === 'transcription') {
        if (message.source === 'agent') {
          setAgentTranscript((prev) => prev + message.text);
        } else if (message.source === 'user') {
          setUserTranscript(message.text);
        }
      }
    } catch {
      console.log('Non-JSON data received');
    }
  }, []);

  const disconnect = useCallback(async () => {
    console.log('Starting disconnect...');
    
    // Clean up audio
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current = null;
    }

    // Clean up video
    if (currentVideoTrackRef.current) {
      const videoEl = document.getElementById('bey-avatar-video') as HTMLVideoElement | null;
      if (videoEl) {
        try {
          currentVideoTrackRef.current.detach(videoEl);
        } catch (e) {
          console.warn('Error detaching video:', e);
        }
        videoEl.srcObject = null;
      }
      currentVideoTrackRef.current = null;
    }

    // Disconnect room
    if (roomRef.current) {
      try {
        await roomRef.current.disconnect();
      } catch (error) {
        console.warn('Error during disconnect:', error);
      }
      roomRef.current = null;
    }

    // 🔴 NEW: Refresh video element for next connection
    refreshVideoElement();

    // Reset state
    setIsConnected(false);
    setConnectionState(ConnectionState.Disconnected);
    setAgentTranscript('');
    setUserTranscript('');
    setParticipants([]);
    setIsAgentSpeaking(false);
    
    console.log('Disconnect complete');
  }, [refreshVideoElement]);

  const connect = useCallback(
    async (serverUrl: string, token: string) => {
      console.log('Starting connection...');
      
      if (roomRef.current) {
        await disconnect();
        // Wait a moment for cleanup
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      setError(null);
      setAgentTranscript('');
      setUserTranscript('');

      try {
        const roomOptions: RoomOptions = {
          audioCaptureDefaults: {
            autoGainControl: true,
            echoCancellation: true,
            noiseSuppression: true,
          },
          adaptiveStream: true,
          dynacast: true,
        };

        const room = new Room(roomOptions);
        roomRef.current = room;

        room.on(RoomEvent.ConnectionStateChanged, (state: ConnectionState) => {
          console.log('Connection state changed:', state);
          setConnectionState(state);
          setIsConnected(state === ConnectionState.Connected);
        });

        room.on(RoomEvent.TrackSubscribed, handleTrackSubscribed);
        room.on(RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed);
        room.on(RoomEvent.ActiveSpeakersChanged, handleActiveSpeakersChanged);
        room.on(RoomEvent.DataReceived, handleDataReceived);
        room.on(RoomEvent.ParticipantConnected, updateParticipants);
        room.on(RoomEvent.ParticipantDisconnected, updateParticipants);

        room.on(RoomEvent.Disconnected, () => {
          console.log('Disconnected from room');
          setIsConnected(false);
        });

        console.log('Connecting to LiveKit room...');
        await room.connect(serverUrl, token);
        console.log('Connected to room:', room.name);

        await room.localParticipant.setMicrophoneEnabled(true);
        console.log('Microphone enabled');

        updateParticipants();
        setIsConnected(true);
      } catch (e) {
        console.error('Failed to connect to LiveKit room:', e);
        setError(e instanceof Error ? e.message : 'Failed to connect to LiveKit room');
        setIsConnected(false);
      }
    },
    [
      handleTrackSubscribed,
      handleTrackUnsubscribed,
      handleActiveSpeakersChanged,
      handleDataReceived,
      updateParticipants,
      disconnect,
    ],
  );

  const toggleMicrophone = useCallback(async () => {
    if (roomRef.current) {
      const isEnabled = roomRef.current.localParticipant.isMicrophoneEnabled;
      await roomRef.current.localParticipant.setMicrophoneEnabled(!isEnabled);
    }
  }, []);

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
    room: roomRef.current,
    // 🔴 NEW: Export the video key for the component to use
    videoElementKey,
  };
};