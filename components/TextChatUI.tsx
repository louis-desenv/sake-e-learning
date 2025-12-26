import React, { useState, useRef, useEffect } from 'react';
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
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const [messages, setMessages] = useState<Message[]>([
        {
            sender: 'ai',
            text: topicLabel
                ? `Hi there 👋 I'm your English tutor for ${topicLabel}. How can I help you today?`
                : "Hi there 👋 If you need any assistance, I'm always here."
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: Message = { sender: 'user', text: input };
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
        <div className="flex flex-col h-full max-h-screen bg-gradient-to-b from-[#4a7cf5] via-[#6b9cf7] to-white">
            {/* Header */}
            <div className="px-4 py-5 flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center overflow-hidden border-2 border-white/30">
                    <span className="text-white text-xl">🤖</span>
                </div>
                <div className="flex-1">
                    <p className="text-white/80 text-sm">Chat with</p>
                    <p className="text-white font-semibold text-lg">AI Tutor</p>
                </div>
            </div>

            {/* Online status */}
            <div className="px-4 pb-4">
                <span className="text-white/90 text-sm">● We are online!</span>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {messages.map((message, index) => (
                    <div key={index} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                            message.sender === 'user'
                                ? 'bg-[#4a7cf5] text-white rounded-br-sm'
                                : 'bg-white text-gray-800 rounded-bl-sm shadow-sm'
                        }`}>
                            <p className="text-[15px] whitespace-pre-wrap">{message.text}</p>
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm">
                            <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="bg-white px-4 py-4">
                <div className="flex items-center space-x-3">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Enter your message..."
                        className="flex-1 px-4 py-3 bg-gray-100 rounded-full focus:outline-none text-gray-800 border border-gray-200"
                        disabled={isLoading}
                    />
                    <button
                        onClick={handleSend}
                        disabled={isLoading || !input.trim()}
                        className="w-12 h-12 bg-[#4a7cf5] text-white rounded-full hover:bg-[#3a6ce5] disabled:bg-gray-300 flex items-center justify-center shadow-lg"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TextChatUI;
