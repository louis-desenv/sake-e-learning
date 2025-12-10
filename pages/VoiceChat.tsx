import React from 'react';
import VoiceChatUI from '../components/VoiceChatUI';

const VoiceChat: React.FC = () => {
    return (
        <div className="p-4 sm:p-6 md:p-8 max-w-4xl mx-auto">
            <header className="text-center mb-6">
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">GPT Voice Chat</h1>
                <p className="text-gray-500 mt-1">Real-time voice conversation with your AI tutor powered by OpenAI GPT.</p>
            </header>
            <VoiceChatUI />
        </div>
    );
};

export default VoiceChat;
