
import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import TextChatUI from '../components/TextChatUI';
import VoiceChatUI from '../components/VoiceChatUI';
import { ChatIcon } from '../components/icons/NavIcons';

const IaChat: React.FC = () => {
  const location = useLocation();
  const mode = location.state?.mode;
  const topic = location.state?.topic;

  const chatTopics = [
    {
      id: 'phone-screen',
      title: 'Phone Screen',
      description: 'Practice telephone conversations',
      goal: 'Complete phone screen practice',
      progress: 0,
      icon: <ChatIcon className="text-blue-500" />,
      color: 'border-t-blue-500'
    },
    {
      id: 'job-interviews',
      title: 'Job Interviews',
      description: 'Prepare for job interviews',
      goal: 'Master job interview skills',
      progress: 5,
      icon: <ChatIcon className="text-green-500" />,
      color: 'border-t-green-500'
    },
    {
      id: 'travel-conversations',
      title: 'Travel Conversations',
      description: 'Learn travel-related conversations',
      goal: 'Become fluent in travel dialogues',
      progress: 20,
      icon: <ChatIcon className="text-purple-500" />,
      color: 'border-t-purple-500'
    },
    {
      id: 'business-meetings',
      title: 'Business Meetings',
      description: 'Engage in business meeting simulations',
      goal: 'Excel in professional conversations',
      progress: 10,
      icon: <ChatIcon className="text-orange-500" />,
      color: 'border-t-orange-500'
    },
  ];

  if (mode === 'voice') {
    return (
      <div className="p-4 sm:p-6 md:p-8 max-w-4xl mx-auto">
        <header className="text-center mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">Talk to a Ultra-realist Avatar</h1>
          <p className="text-gray-500 mt-1">Practice your skills with a ultra-realist Avatar.</p>
        </header>
        <div className="w-full">
          <VoiceChatUI />
        </div>
      </div>
    );
  }

  if (topic) {
    return (
      <div className="p-4 sm:p-6 md:p-8 max-w-4xl mx-auto">
        <header className="text-center mb-6 relative">
          <Link
            to="/chat"
            className="absolute left-0 top-1/2 transform -translate-y-1/2 text-blue-600 hover:text-blue-800 font-bold"
          >
            ← Back
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">{chatTopics.find(t => t.id === topic)?.title || 'Chat'}</h1>
          <p className="text-gray-500 mt-1">Chat with your AI tutor via text.</p>
        </header>
        <div className="w-full">
          <TextChatUI topic={topic} />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-4xl mx-auto">
      <header className="text-center mb-6">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">Chat</h1>
        <p className="text-gray-500 mt-1">Choose a conversation pathway to start chatting</p>
      </header>
      <div className="w-full max-w-2xl mx-auto space-y-4">
        {chatTopics.map((t) =>
          <Link
            key={t.id}
            to="/chat"
            state={{ mode: 'text', topic: t.id }}
            className={`block p-6 rounded-2xl bg-white shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-t-4 ${t.color}`}
          >
            <div className="flex items-center space-x-4">
              <div className="text-3xl">{t.icon}</div>
              <div>
                <h3 className="font-bold text-lg text-gray-800">{t.title}</h3>
                <p className="text-sm text-gray-500">{t.description}</p>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium opacity-80">{t.goal}</span>
                <span className="text-sm font-bold">{t.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${t.progress}%` }}></div>
              </div>
            </div>
          </Link>
        )}
      </div>
    </div>
  );
};

export default IaChat;
