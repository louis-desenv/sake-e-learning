/**
 * My Profile Page
 *
 * User profile page displaying account info, learning goals, and activity statistics.
 * Includes logout functionality and progress visualization with charts.
 *
 * @fileoverview This page shows the user's profile information including their name,
 * English level, learning goals, native language, and weekly learning activity chart.
 *
 * @dependencies react, recharts, ../context/UserContext
 *
 * @author SAke E-Learning Team
 * @version 3.0.0
 */

import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { conversationService, Conversation, ConversationWithMessages, Message } from '../services/conversationService';

// ============================================================================
// CONVERSATION CARD COMPONENT
// ============================================================================

interface ConversationCardProps {
    conversationId: string;
    category?: string;
    scenario: string;
    startedAt: string;
    durationSeconds: number | null;
}

const ConversationCard: React.FC<ConversationCardProps> = ({ 
    conversationId, 
    category,
    scenario, 
    startedAt, 
    durationSeconds 
}) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        const loadMessages = async () => {
            const data = await conversationService.getConversationWithMessages(conversationId);
            if (data) {
                setMessages(data.messages);
            }
            setLoading(false);
        };
        loadMessages();
    }, [conversationId]);

    const formatDuration = (seconds: number | null) => {
        if (!seconds) return '0m';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        if (mins > 0) {
            return `${mins}m ${secs}s`;
        }
        return `${secs}s`;
    };

    const formatScenario = (scenario: string, category?: string) => {
        const slugToTitle: Record<string, string> = {
            'phone-screen': 'Phone Screen',
            'job-interviews': 'Job Interviews',
            'travel-conversations': 'Travel Conversations',
            'business-meetings': 'Business Meetings',
            'grammar-specialist': 'Grammar Essentials',
            'vocabulary-specialist': 'Vocabulary Builder',
            'pronunciation-specialist': 'Pronunciation Practice',
            'business-specialist': 'Business English',
            'travel-specialist': 'Travel Phrases',
            'idioms-specialist': 'Idioms & Slang',
        };
        
        const scenarioLower = scenario.toLowerCase();
        const specificTitle = slugToTitle[scenarioLower] || scenario.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        
        if (category === 'learn') {
            return { category: 'Learn', specific: specificTitle };
        }
        
        if (category === 'real-life' || scenarioLower === 'real-life' || scenarioLower.startsWith('real-life-')) {
            return { category: 'Real-Life', specific: specificTitle !== 'Real life' ? specificTitle : null };
        }
        
        return { category: null, specific: specificTitle };
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const downloadConversation = () => {
        if (!messages.length) return;

        const { category: fmtCategory, specific } = formatScenario(scenario, category);
        const scenarioTitle = category 
            ? `${category}${specific ? ' - ' + specific : ''}`
            : (specific || scenario.replace(/-/g, ' '));
        
        let content = `=${scenarioTitle.toUpperCase()}=\n`;
        content += `Data: ${formatDate(startedAt)}\n`;
        content += `Duração: ${formatDuration(durationSeconds)}\n`;
        content += `${'='.repeat(40)}\n\n`;

        messages.forEach(msg => {
            const sender = msg.role === 'user' ? 'VOCÊ' : 'IA (TUTOR)';
            content += `[${sender}]\n${msg.content}\n\n`;
        });

        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${scenario}-${startedAt.split('T')[0]}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    if (loading) {
        return (
            <div className="bg-gray-50 rounded-lg p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div 
                className="bg-gray-100 px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-200 transition-colors"
                onClick={() => setExpanded(!expanded)}
            >
                <div>
                    <div className="flex items-center gap-3">
                        {(() => {
                            const { category: fmtCategory, specific } = formatScenario(scenario, category);
                            return (
                                <span className="font-medium text-gray-800">
                                    {fmtCategory && (
                                        <span className="text-purple-600">{fmtCategory}</span>
                                    )}
                                    {fmtCategory && specific && <span className="text-gray-400 mx-1">•</span>}
                                    {specific && <span className="capitalize">{specific}</span>}
                                    {!fmtCategory && !specific && <span className="capitalize">{scenario.replace(/-/g, ' ')}</span>}
                                </span>
                            );
                        })()}
                        <span className="text-xs text-gray-500">
                            {formatDate(startedAt)} • {formatDuration(durationSeconds)}
                        </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                        {messages.length} mensagens
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            downloadConversation();
                        }}
                        className="p-2 text-gray-500 hover:text-purple-600 hover:bg-gray-200 rounded-lg transition-colors"
                        title="Baixar conversa"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="7,10 12,15 17,10"/>
                            <line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                    </button>
                    <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className={`h-5 w-5 text-gray-500 transition-transform ${expanded ? 'rotate-180' : ''}`} 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2"
                    >
                        <polyline points="6,9 12,15 18,9"/>
                    </svg>
                </div>
            </div>

            {/* Messages */}
            {expanded && (
                <div className="p-4 space-y-4 max-h-96 overflow-y-auto bg-white">
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[85%] p-3 rounded-lg ${
                                    msg.role === 'user'
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-gray-100 text-gray-800 border border-gray-200'
                                }`}
                            >
                                <div className={`text-xs font-medium mb-1 ${
                                    msg.role === 'user' ? 'text-purple-200' : 'text-gray-500'
                                }`}>
                                    {msg.role === 'user' ? 'Você' : 'IA Tutor'}
                                </div>
                                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// ============================================================================
// DATA
// ============================================================================

/**
 * Weekly learning activity data for the chart.
 * Shows hours spent learning per day.
 *
 * @constant {Array<{name: string, hours: number}>}
 */
const data = [
    { name: 'Mon', hours: 2 },
    { name: 'Tue', hours: 3 },
    { name: 'Wed', hours: 1.5 },
    { name: 'Thu', hours: 4 },
    { name: 'Fri', hours: 2.5 },
    { name: 'Sat', hours: 5 },
    { name: 'Sun', hours: 1 },
];

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * User profile page component.
 *
 * Displays user avatar, profile information, learning goals,
 * and a weekly activity chart showing learning time.
 *
 * @component MyProfile
 * @returns {JSX.Element} Profile page or null if no user
 *
 * @example
 * ```tsx
 * <Route path="/profile" element={<MyProfile />} />
 * ```
 *
 * @remarks
 * - Returns null if no user is authenticated
 * - Uses Recharts for activity visualization
 * - Random avatar image generated based on username seed
 * - Logout button in header with icon
 */
const MyProfile: React.FC = () => {
    const { user, logout } = useUser();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loadingConversations, setLoadingConversations] = useState(false);
    const [showHistory, setShowHistory] = useState(false);

    // Fetch conversations when user is loaded
    useEffect(() => {
        if (user?.name && showHistory) {
            loadConversations();
        }
    }, [user?.name, showHistory]);

    const loadConversations = async () => {
        if (!user?.name) return;
        
        setLoadingConversations(true);
        try {
            // Get all conversations (no scenario filter)
            const data = await conversationService.getConversations(user.name, 50);
            setConversations(data);
        } catch (error) {
            console.error('[MyProfile] Error loading conversations:', error);
        } finally {
            setLoadingConversations(false);
        }
    };

    if (!user) return null;

    return (
        <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">
            <header className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-4">
                    <img src={`https://picsum.photos/seed/${user.name}/100/100`} alt="User Avatar" className="h-24 w-24 rounded-full shadow-lg" />
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">{user.name}</h1>
                        <p className="text-gray-500 mt-1">{user.level} Learner</p>
                    </div>
                </div>
                <button
                    onClick={logout}
                    className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium text-sm flex items-center gap-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                    </svg>
                    Logout
                </button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Weekly Performance Chart */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-lg">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Weekly Performance</h2>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip cursor={{ fill: 'rgba(239, 246, 255, 0.6)' }} />
                                <Bar dataKey="hours" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Learning Goals & Native Language */}
                <div className="bg-white p-6 rounded-2xl shadow-lg">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Learning Goals</h2>
                    <ul className="space-y-3">
                        {user.goals.map(goal => (
                            <li key={goal} className="flex items-center space-x-3 bg-blue-50 p-3 rounded-lg">
                                <span className="text-blue-500">✓</span>
                                <span className="text-gray-700">{goal}</span>
                            </li>
                        ))}
                    </ul>
                    <h2 className="text-xl font-bold text-gray-800 mt-6 mb-4">Native Language</h2>
                    <div className="bg-gray-100 p-3 rounded-lg">
                        <p className="text-gray-700">{user.nativeLanguage}</p>
                    </div>
                </div>
            </div>

            {/* Conversation History Section */}
            <div className="mt-8 bg-white p-6 rounded-2xl shadow-lg">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-800">Conversation History</h2>
                    <button
                        onClick={() => {
                            setShowHistory(!showHistory);
                            if (!showHistory && conversations.length === 0) {
                                loadConversations();
                            }
                        }}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                    >
                        {showHistory ? 'Hide History' : 'Show History'}
                    </button>
                </div>

                {showHistory && (
                    <div className="space-y-6">
                        {loadingConversations ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                            </div>
                        ) : conversations.length === 0 ? (
                            <p className="text-gray-500 py-4">No conversations yet. Start practicing!</p>
                        ) : (
                            conversations.map((conv) => (
                                <ConversationCard 
                                    key={conv.id} 
                                    conversationId={conv.id}
                                    category={conv.category}
                                    scenario={conv.scenario}
                                    startedAt={conv.started_at}
                                    durationSeconds={conv.duration_seconds}
                                />
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyProfile;
