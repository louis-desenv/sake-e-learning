import React, { useState } from 'react';
import { sendChatMessage } from '../services/geminiService';

interface Message {
    sender: 'user' | 'ai';
    text: string;
}

interface TextChatUIProps {
    topic?: string;
}

const TextChatUI: React.FC<TextChatUIProps> = ({ topic }) => {
    const topicLabel = topic ? topic.replace(/-/g, ' ') : undefined;
    const [messages, setMessages] = useState<Message[]>([
        { sender: 'ai', text: topicLabel ? `Hello! I'm your AI English tutor specializing in ${topicLabel}. How can I help you today?` : 'Hello! I\'m your AI English tutor. How can I help you learn today?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage = { sender: 'user' as const, text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const conversationHistory = messages.map(m => `${m.sender === 'user' ? 'User' : 'Tutor'}: ${m.text}`);
            const aiResponse = await sendChatMessage(userMessage.text, conversationHistory, topic);
            setMessages(prev => [...prev, { sender: 'ai', text: aiResponse }]);
        } catch (error) {
            setMessages(prev => [...prev, { sender: 'ai', text: 'Sorry, there was an error. Please try again.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex flex-col h-full max-h-screen p-4">
            <div className="flex-1 overflow-y-auto mb-4 space-y-3">
                {messages.map((message, index) => (
                    <div key={index} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.sender === 'user'
                                ? 'bg-blue-500 text-white rounded-br-none'
                                : 'bg-gray-200 text-gray-800 rounded-bl-none'
                        }`}>
                            <p className="whitespace-pre-wrap">{message.text}</p>
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg rounded-bl-none max-w-xs lg:max-w-md">
                            <div className="flex items-center space-x-2">
                                <div className="animate-pulse">●</div>
                                <div className="animate-pulse">●</div>
                                <div className="animate-pulse">●</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <div className="flex space-x-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isLoading}
                />
                <button
                    onClick={handleSend}
                    disabled={isLoading || !input.trim()}
                    className="px-6 py-2 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                    Send
                </button>
            </div>
        </div>
    );
};

export default TextChatUI;
