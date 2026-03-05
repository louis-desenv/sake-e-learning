import React from 'react';
import { useLocation, Link, useParams } from 'react-router-dom';
import { ChatIcon } from '../components/icons/NavIcons';
import TextChatUI from '../components/TextChatUI';
import VoiceChatUI from '../components/VoiceChatUI';
import { practiceTopicSlugs, getScenarioFromSlug, getTopicBySlug, topicSlugs } from '../constants/topicSlugs';

// ============================================================================
// GUIDED LEARNING TOPIC IDS
// ============================================================================
const guidedLearningTopicIds = ['grammar-essentials', 'vocabulary-builder', 'pronunciation-practice', 'business-english', 'travel-phrases', 'idioms-slang'];

const IaChat: React.FC = () => {
  const location = useLocation();
  const params = useParams();
  const { scenarioSlug, topicSlug } = params;

  // Determine which slug we're using (scenarioSlug for Real-Life, topicSlug for guided-learning)
  const slug = scenarioSlug || topicSlug;
  const isGuidedLearning = location.pathname.startsWith('/guided-learning/');

  // Check for legacy navigation via state
  const mode = location.state?.mode;
  const topic = location.state?.topic;

  // Voice mode (unchanged)
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

  // Topic via URL slug (new behavior)
  if (slug) {
    const selectedTopic = getTopicBySlug(slug);
    const scenario = getScenarioFromSlug(slug);

    if (!selectedTopic || !scenario) {
      // Invalid slug, redirect to appropriate home
      const redirectPath = isGuidedLearning ? '/guided-learning' : '/real-life';
      return <Link to={redirectPath} />;
    }

    const backTo = isGuidedLearning ? '/guided-learning' : '/real-life';

    return (
      <div className="p-4 sm:p-6 md:p-8 max-w-4xl mx-auto">
        <TextChatUI scenario={scenario} topicConfig={selectedTopic} backTo={backTo} />
      </div>
    );
  }

  // Legacy state-based navigation (backward compatibility)
  if (topic) {
    const selectedTopic = topicSlugs.find(t => t.id === topic);
    const scenario = getScenarioFromSlug(topic);

    if (selectedTopic && scenario) {
      const isGuided = guidedLearningTopicIds.includes(selectedTopic.id);
      const backTo = isGuided ? '/guided-learning' : '/real-life';

      return (
        <div className="p-4 sm:p-6 md:p-8 max-w-4xl mx-auto">
          <header className="mb-6">
            <Link
              to={backTo}
              className="text-blue-600 hover:text-blue-800 font-bold inline-flex items-center gap-2"
            >
              ← Back
            </Link>
          </header>

          <div className="w-full">
            <TextChatUI scenario={scenario} />
          </div>
        </div>
      );
    }
  }

  // Home page - list practice scenarios (only for /real-life)
  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-4xl mx-auto">
      <header className="text-center mb-6">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">Real-Life</h1>
        <p className="text-gray-500 mt-1">Choose a conversation pathway to start chatting</p>
      </header>
      <div className="w-full max-w-2xl mx-auto space-y-4">
        {practiceTopicSlugs.map((t) =>
          <Link
            key={t.id}
            to={`/real-life/${t.slug}`}
            className={`block p-6 rounded-2xl bg-white shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-t-4 ${t.borderColor}`}
          >
            <div className="flex items-center space-x-4">
              <div className="text-3xl"><ChatIcon className="text-gray-600" /></div>
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
                <div className={`${t.progressColor} h-2.5 rounded-full transition-all duration-300`} style={{ width: `${t.progress}%` }}></div>
              </div>
            </div>
          </Link>
        )}
      </div>
    </div>
  );
};

export default IaChat;
