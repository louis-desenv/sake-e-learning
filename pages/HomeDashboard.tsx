/**
 * Home Dashboard Page
 *
 * Main dashboard page displaying greeting, quick actions, and navigation cards.
 * Personalized greeting based on time of day and user profile.
 *
 * @fileoverview This page serves as the main hub after login, displaying personalized
 * greetings, featured content, and navigation cards to all major application features.
 *
 * @dependencies react, react-router-dom, ../components/Card, ../context/UserContext, ../components/icons/NavIcons
 *
 * @author SAke E-Learning Team
 * @version 3.0.0
 */

import React from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/Card';
import { useUser } from '../context/UserContext';
import { ChatIcon, BookOpenIcon, VideoCameraIcon, UserCircleIcon, MicrophoneIcon } from '../components/icons/NavIcons';

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Home dashboard page component.
 *
 * Displays personalized greeting based on time of day, featured content,
 * and navigation cards to all major application sections.
 *
 * @component HomeDashboard
 * @returns {JSX.Element} Home dashboard page
 *
 * @example
 * ```tsx
 * <Route path="/home" element={<HomeDashboard />} />
 * ```
 *
 * @remarks
 * - Greeting changes based on time of day (morning/afternoon/evening)
 * - Featured card promotes voice chat with avatar
 * - Responsive grid layout for navigation cards
 */
const HomeDashboard: React.FC = () => {
    const { user } = useUser();

    /**
     * Returns a time-appropriate greeting.
     * Good Morning (before 12), Good Afternoon (12-18), Good Evening (after 18).
     *
     * @function getGreeting
     * @returns {string} Time-appropriate greeting
     */
    const getGreeting = (): string => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good Morning";
        if (hour < 18) return "Good Afternoon";
        return "Good Evening";
    };

    return (
        <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">{getGreeting()}, {user.name}!</h1>
                <p className="text-gray-500 mt-1">Ready to improve your English today?</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                {/* Featured Card - Full Width */}
                <div className="lg:col-span-2">
                    <div className="bg-blue-600 text-white p-8 rounded-2xl shadow-lg flex flex-col md:flex-row items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold">Talk to a Ultra-realist Avatar</h2>
                            <p className="mt-2 opacity-80 max-w-lg">Practice your speaking and listening skills with a real-time voice chat with your AI tutor.</p>
                        </div>
                        <div className="mt-4 md:mt-0">
                            <Link to="/chat/with-avatar" className="bg-white text-blue-600 font-bold py-3 px-6 rounded-lg shadow-md hover:bg-gray-100 transition-transform transform hover:scale-105">
                                Talk Now
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Navigation Cards */}
                <Card
                    title="Real-Life"
                    description="Quick exercises and daily challenges."
                    icon={<ChatIcon />}
                    to="/real-life"
                    color="border-t-blue-400"
                />
                <Card
                    title="Voice"
                    description="AI voice chat powered by Google Gemini native audio."
                    icon={<MicrophoneIcon />}
                    to="/livekit-chat"
                    color="border-t-orange-400"
                />
                <Card
                    title="Learn"
                    description="Structured lessons on grammar, vocabulary, and more."
                    icon={<BookOpenIcon />}
                    to="/guided-learning"
                    color="border-t-green-400"
                />
                <Card
                    title="Profile"
                    description="Track your progress and achievements."
                    icon={<UserCircleIcon />}
                    to="/profile"
                    color="border-t-yellow-400"
                />
                {/* LIBRARY - Commented out */}
                {/* <Card
                    title="IA Library"
                    description="Explore videos and learning resources."
                    icon={<VideoCameraIcon />}
                    to="/library"
                    color="border-t-purple-500"
                /> */}
                {/* GPT Voice Chat - Commented out */}
                {/* <Card
                    title="GPT Voice Chat"
                    description="Real-time voice conversation with OpenAI GPT agent."
                    icon={<MicrophoneIcon />}
                    to="/voice-chat"
                    color="border-t-blue-500"
                /> */}
            </div>
        </div>
    );
};

export default HomeDashboard;
