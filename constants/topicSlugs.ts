/**
 * Topic Slugs Configuration
 *
 * Maps topic IDs to their URL slugs and associated metadata.
 * Used for creating descriptive URLs and color-coded progress bars.
 *
 * @fileoverview Central configuration for topic slugs, colors, and metadata
 */

import { ChatScenario } from '../types';

export interface TopicSlugConfig {
  id: string;
  slug: string;
  scenarioId: ChatScenario;
  title: string;
  description: string;
  goal: string;
  progress: number;
  // Border color for card top border
  borderColor: string;
  // Progress bar color classes
  progressColor: string;
  // Gradient colors for GuidedLearning cards
  gradientFrom: string;
  gradientTo: string;
}

/**
 * All topics with their slug configurations
 */
export const topicSlugs: TopicSlugConfig[] = [
  {
    id: 'phone-screen',
    slug: 'phonescreen',
    scenarioId: ChatScenario.PHONE_SCREEN,
    title: 'Phone Screen',
    description: 'Practice telephone conversations',
    goal: 'Complete phone screen practice',
    progress: 0,
    borderColor: 'border-t-blue-500',
    progressColor: 'bg-blue-500',
    gradientFrom: 'from-blue-400',
    gradientTo: 'to-blue-600',
  },
  {
    id: 'job-interviews',
    slug: 'jobinterviews',
    scenarioId: ChatScenario.JOB_INTERVIEWS,
    title: 'Job Interviews',
    description: 'Prepare for job interviews',
    goal: 'Master job interview skills',
    progress: 5,
    borderColor: 'border-t-green-500',
    progressColor: 'bg-green-500',
    gradientFrom: 'from-green-400',
    gradientTo: 'to-green-600',
  },
  {
    id: 'travel-conversations',
    slug: 'travelconversations',
    scenarioId: ChatScenario.TRAVEL_CONVERSATIONS,
    title: 'Travel Conversations',
    description: 'Learn travel-related conversations',
    goal: 'Become fluent in travel dialogues',
    progress: 20,
    borderColor: 'border-t-purple-500',
    progressColor: 'bg-purple-500',
    gradientFrom: 'from-purple-400',
    gradientTo: 'to-purple-600',
  },
  {
    id: 'business-meetings',
    slug: 'businessmeetings',
    scenarioId: ChatScenario.BUSINESS_MEETINGS,
    title: 'Business Meetings',
    description: 'Engage in business meeting simulations',
    goal: 'Excel in professional conversations',
    progress: 10,
    borderColor: 'border-t-orange-500',
    progressColor: 'bg-orange-500',
    gradientFrom: 'from-orange-400',
    gradientTo: 'to-orange-600',
  },
  {
    id: 'grammar-essentials',
    slug: 'grammaressentials',
    scenarioId: ChatScenario.GRAMMAR_SPECIALIST,
    title: 'Grammar Essentials',
    description: 'Master English grammar fundamentals',
    goal: 'Build strong grammar foundation',
    progress: 75,
    borderColor: 'border-t-blue-400',
    progressColor: 'bg-blue-400',
    gradientFrom: 'from-blue-400',
    gradientTo: 'to-blue-600',
  },
  {
    id: 'vocabulary-builder',
    slug: 'vocabularybuilder',
    scenarioId: ChatScenario.VOCABULARY_SPECIALIST,
    title: 'Vocabulary Builder',
    description: 'Expand your word power systematically',
    goal: 'Learn new words daily',
    progress: 40,
    borderColor: 'border-t-green-400',
    progressColor: 'bg-green-400',
    gradientFrom: 'from-green-400',
    gradientTo: 'to-green-600',
  },
  {
    id: 'pronunciation-practice',
    slug: 'pronunciationpractice',
    scenarioId: ChatScenario.PRONUNCIATION_SPECIALIST,
    title: 'Pronunciation Practice',
    description: 'Sound like a native speaker',
    goal: 'Perfect your pronunciation',
    progress: 60,
    borderColor: 'border-t-purple-400',
    progressColor: 'bg-purple-400',
    gradientFrom: 'from-purple-400',
    gradientTo: 'to-purple-600',
  },
  {
    id: 'business-english',
    slug: 'businessenglish',
    scenarioId: ChatScenario.BUSINESS_SPECIALIST,
    title: 'Business English',
    description: 'Professional communication skills',
    goal: 'Excel in business contexts',
    progress: 25,
    borderColor: 'border-t-yellow-400',
    progressColor: 'bg-yellow-400',
    gradientFrom: 'from-yellow-400',
    gradientTo: 'to-yellow-600',
  },
  {
    id: 'travel-phrases',
    slug: 'travelphrases',
    scenarioId: ChatScenario.TRAVEL_SPECIALIST,
    title: 'Travel Phrases',
    description: 'Essential travel expressions',
    goal: 'Travel with confidence',
    progress: 90,
    borderColor: 'border-t-red-400',
    progressColor: 'bg-red-400',
    gradientFrom: 'from-red-400',
    gradientTo: 'to-red-600',
  },
  {
    id: 'idioms-slang',
    slug: 'idiomsslang',
    scenarioId: ChatScenario.IDIOMS_SPECIALIST,
    title: 'Idioms & Slang',
    description: 'Sound like a local',
    goal: 'Master everyday expressions',
    progress: 15,
    borderColor: 'border-t-indigo-400',
    progressColor: 'bg-indigo-400',
    gradientFrom: 'from-indigo-400',
    gradientTo: 'to-indigo-600',
  },
];

/**
 * Topics shown on Real-Life home page (practice scenarios only)
 */
export const practiceTopicSlugs = topicSlugs.filter(topic =>
  ['phone-screen', 'job-interviews', 'travel-conversations', 'business-meetings'].includes(topic.id)
);

/**
 * Topics shown on Guided Learning page
 */
export const guidedLearningTopicSlugs = topicSlugs.filter(topic =>
  ['grammar-essentials', 'vocabulary-builder', 'pronunciation-practice', 'business-english', 'travel-phrases', 'idioms-slang'].includes(topic.id)
);

/**
 * Get topic configuration by ID
 */
export function getTopicById(id: string): TopicSlugConfig | undefined {
  return topicSlugs.find(topic => topic.id === id);
}

/**
 * Get topic configuration by slug
 */
export function getTopicBySlug(slug: string): TopicSlugConfig | undefined {
  return topicSlugs.find(topic => topic.slug === slug);
}

/**
 * Get ChatScenario from topic ID
 */
export function getScenarioFromTopic(topicId: string): ChatScenario | undefined {
  return getTopicById(topicId)?.scenarioId;
}

/**
 * Get ChatScenario from slug
 */
export function getScenarioFromSlug(slug: string): ChatScenario | undefined {
  return getTopicBySlug(slug)?.scenarioId;
}
