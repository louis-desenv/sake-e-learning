/**
 * Voice Chat Page
 *
 * Container page for the GPT Voice Chat interface.
 * Wraps the VoiceChatUI component with a header.
 *
 * @fileoverview This page provides a wrapper for the voice chat UI component,
 * displaying a title and description above the actual voice chat interface.
 *
 * @dependencies react, ../components/VoiceChatUI
 *
 * @author SAke E-Learning Team
 * @version 3.0.0
 */

import React from 'react';
import VoiceChatUI from '../components/VoiceChatUI';

// ============================================================================
// PAGE COMPONENT
// ============================================================================

/**
 * Voice chat page component.
 *
 * Container page that displays the GPT voice chat interface with a header.
 * The actual voice chat functionality is provided by VoiceChatUI component.
 *
 * @component VoiceChat
 * @returns {JSX.Element} Voice chat page
 *
 * @example
 * ```tsx
 * <Route path="/voice-chat" element={<VoiceChat />} />
 * ```
 *
 * @remarks
 * - Describes the voice chat as powered by OpenAI GPT
 * - VoiceChatUI component handles all actual functionality
 * - Centered layout with constrained max-width
 */
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
