import React, { useState, useEffect } from 'react';
import { useLiveKitRoom } from '../hooks/useLiveKitRoom';
import { generateLiveKitToken, LIVEKIT_CONFIG } from '../services/livekitTokenService';
import { ConnectionState } from 'livekit-client';
import { useUser } from '../context/UserContext';

const LiveKitChat: React.FC = () => {
    const { user } = useUser();
    const {
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
    } = useLiveKitRoom();

    const [isGeneratingToken, setIsGeneratingToken] = useState(false);
    const [tokenError, setTokenError] = useState<string | null>(null);

    const handleConnect = async () => {
        setIsGeneratingToken(true);
        setTokenError(null);

        try {
            // Generate token with user's name as identity
            const token = await generateLiveKitToken({
                apiKey: LIVEKIT_CONFIG.apiKey,
                apiSecret: LIVEKIT_CONFIG.apiSecret,
                identity: user.name || 'User',
                roomName: LIVEKIT_CONFIG.roomName,
            });

            console.log('Generated LiveKit token for:', user.name);
            console.log('Connecting to:', LIVEKIT_CONFIG.serverUrl);
            console.log('Room:', LIVEKIT_CONFIG.roomName);

            // Connect to the room
            await connect(LIVEKIT_CONFIG.serverUrl, token);
        } catch (e) {
            console.error('Failed to generate token or connect:', e);
            setTokenError(e instanceof Error ? e.message : 'Failed to generate token');
        } finally {
            setIsGeneratingToken(false);
        }
    };

    const handleDisconnect = async () => {
        await disconnect();
    };

    const getConnectionStateText = () => {
        if (isGeneratingToken) return 'Generating token...';
        switch (connectionState) {
            case ConnectionState.Connected:
                return 'Connected';
            case ConnectionState.Connecting:
                return 'Connecting...';
            case ConnectionState.Reconnecting:
                return 'Reconnecting...';
            case ConnectionState.Disconnected:
                return 'Disconnected';
            default:
                return 'Unknown';
        }
    };

    const getButtonState = () => {
        if (isGeneratingToken) {
            return { text: 'Generating Token...', color: 'bg-yellow-500', animate: true };
        }
        if (connectionState === ConnectionState.Connecting) {
            return { text: 'Connecting...', color: 'bg-yellow-500', animate: true };
        }
        if (!isConnected) {
            return { text: 'Start Voice Session', color: 'bg-orange-600', animate: false };
        }
        if (isAgentSpeaking) {
            return { text: 'Agent Speaking...', color: 'bg-purple-500', animate: true };
        }
        return { text: 'Listening...', color: 'bg-green-500', animate: true };
    };

    const buttonState = getButtonState();
    const isLoading = isGeneratingToken || connectionState === ConnectionState.Connecting;

    return (
        <div className="p-4 sm:p-6 md:p-8 max-w-4xl mx-auto">
            <header className="text-center mb-6">
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">LiveKit Voice Agent</h1>
                <p className="text-gray-500 mt-1">Connected to LiveKit Server with Gemini Agent</p>
                <div className="mt-2 inline-flex items-center space-x-2 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
                    <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : isLoading ? 'bg-yellow-500 animate-pulse' : 'bg-gray-400'}`}></span>
                    <span>{getConnectionStateText()}</span>
                </div>
            </header>

            <div className="flex flex-col items-center justify-center">
                <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg p-6 space-y-4">

                    {/* Connection Info Banner */}
                    <div className={`p-4 rounded-xl border ${isConnected ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' : 'bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200'}`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="text-3xl">{isConnected ? '🎙️' : '🔊'}</div>
                                <div>
                                    <h3 className="font-semibold text-gray-800">
                                        {isConnected ? 'LiveKit Voice Agent' : 'Ready to Connect'}
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                        {isConnected
                                            ? `${participants.length} participant(s) in room`
                                            : `Room: ${LIVEKIT_CONFIG.roomName}`
                                        }
                                    </p>
                                </div>
                            </div>
                            {isConnected && (
                                <button
                                    onClick={toggleMicrophone}
                                    className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                                >
                                    Toggle Mic
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Voice Visualizer / Avatar Video */}
                    <div className="h-64 relative rounded-lg bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center overflow-hidden">
                        {/* Always render the video element so the hook can attach to it. 
                            We control visibility or styling, but the DOM node must exist. */}
                        <video 
                            id="bey-avatar-video" 
                            className="absolute inset-0 w-full h-full object-cover" 
                            autoPlay 
                            playsInline 
                            muted // Muted because audio comes from a separate track
                        />

                        {!isConnected ? (
                            <div className="text-center z-10">
                                <div className="text-4xl mb-2">🎤</div>
                                <p className="text-sm text-gray-600">
                                    Click below to connect as <strong>{user.name}</strong>
                                </p>
                            </div>
                        ) : (
                            // Only show visualizer fallback if we want, or overlay it. 
                            // For now, let's keep the visualizer as a fallback or overlay if video isn't opaque yet.
                            // But usually, once video plays, it covers this.
                            <div className="flex items-center space-x-2 z-10 opacity-50 pointer-events-none">
                                {[...Array(5)].map((_, i) => (
                                    <div
                                        key={i}
                                        className={`w-2 bg-orange-500 rounded-full transition-all duration-150 ${isAgentSpeaking ? 'animate-pulse' : ''
                                            }`}
                                        style={{
                                            height: isAgentSpeaking
                                                ? `${20 + Math.random() * 40}px`
                                                : '20px',
                                            animationDelay: `${i * 0.1}s`
                                        }}
                                    />
                                ))}
                                <span className="ml-4 text-gray-600 font-medium bg-white/50 px-2 py-1 rounded">
                                    {isAgentSpeaking ? 'Agent is speaking...' : 'Listening to you...'}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Transcript Display */}
                    <div className="text-center min-h-[80px] p-3 border-t border-b border-gray-200 flex flex-col justify-center">
                        <p className="text-lg text-gray-500 font-medium mb-1">
                            <span className="font-bold text-gray-800">You: </span>
                            {userTranscript || <span className="italic text-gray-400">...</span>}
                        </p>
                        <p className="text-lg text-orange-600 font-medium">
                            <span className="font-bold">Agent: </span>
                            {agentTranscript || (isConnected ? <span className="italic text-orange-300">Listening...</span> : <span className="italic text-gray-400">...</span>)}
                        </p>
                    </div>

                    {/* Error Display */}
                    {(error || tokenError) && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-600 text-center text-sm">{error || tokenError}</p>
                        </div>
                    )}

                    {/* Connect/Disconnect Button */}
                    <button
                        onClick={isConnected ? handleDisconnect : handleConnect}
                        disabled={isLoading}
                        className={`w-full py-4 px-6 text-white font-bold rounded-xl text-lg transition-all duration-300 transform hover:scale-105 ${buttonState.color} ${isConnected ? 'shadow-lg' : 'shadow-md'} disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
                    >
                        <div className="flex items-center justify-center space-x-3">
                            {buttonState.animate && <span className="animate-pulse">●</span>}
                            <span>{isConnected ? 'Disconnect' : buttonState.text}</span>
                        </div>
                    </button>

                    <p className="text-xs text-center text-gray-400 mt-2">
                        Connects to LiveKit room "{LIVEKIT_CONFIG.roomName}" with your hosted Gemini agent.
                    </p>

                    {/* Participants List */}
                    {isConnected && participants.length > 0 && (
                        <details className="mt-4">
                            <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
                                Room Participants ({participants.length})
                            </summary>
                            <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                                <ul className="space-y-1">
                                    {participants.map((p, i) => (
                                        <li key={i} className="text-xs text-gray-600 flex items-center space-x-2">
                                            <span className={`w-2 h-2 rounded-full ${p.isSpeaking ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                                            <span>{p.identity || 'Unknown'}</span>
                                            {p === participants[0] && <span className="text-gray-400">(you)</span>}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </details>
                    )}

                    {/* Technical Details */}
                    <details className="mt-4">
                        <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
                            Connection Details
                        </summary>
                        <div className="mt-2 p-3 bg-gray-50 rounded-lg text-xs font-mono text-gray-600">
                            <pre>{JSON.stringify({
                                serverUrl: LIVEKIT_CONFIG.serverUrl,
                                roomName: LIVEKIT_CONFIG.roomName,
                                identity: user.name,
                                connectionState: connectionState,
                            }, null, 2)}</pre>
                        </div>
                    </details>
                </div>
            </div>
        </div>
    );
};

export default LiveKitChat;
