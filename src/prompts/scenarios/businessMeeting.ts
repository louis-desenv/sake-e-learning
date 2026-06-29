/**
 * Business Meetings Scenario Configuration
 *
 * Scenario configuration for practicing English in business meeting contexts.
 * Focuses on professional communication skills, workplace vocabulary, and meeting etiquette.
 *
 * @fileoverview This file exports the scenario configuration for business meeting
 * simulations, including system prompts, welcome messages, and difficulty-specific
 * instructions for beginner, intermediate, and advanced English learners.
 *
 * @dependencies ../../../types
 *
 * @author SAke E-Learning Team
 * @version 3.0.0
 */

import { ScenarioConfig, ChatScenario, EnglishLevel } from '../../../types';

// ============================================================================
// SCENARIO CONFIGURATION
// ============================================================================

/**
 * Business meetings scenario configuration.
 *
 * Provides a complete configuration for practicing English in professional
 * business meeting contexts, including team meetings, presentations,
 * brainstorming sessions, and negotiations.
 *
 * @constant {ScenarioConfig}
 * @property {ChatScenario} id - Unique scenario identifier
 * @property {string} name - Display name for the scenario
 * @property {string} description - Brief description of the scenario
 * @property {string} systemPrompt - AI system instruction for business meeting persona
 * @property {string} welcomeMessage - Initial greeting when starting the scenario
 * @property {Record<EnglishLevel, string>} difficultyLevels - Level-specific instructions
 *
 * @remarks
 * - Focuses on professional but conversational tone
 * - Teaches phrases for expressing opinions, agreeing/disagreeing, making suggestions
 * - Includes practice for leading discussions and handling disagreements
 * - Emphasizes clear, concise communication over complexity
 * - Distinguishes between project exploration vs. distraction redirection
 */
export const businessMeetingConfig: ScenarioConfig = {
  id: ChatScenario.BUSINESS_MEETINGS,
  name: 'Business Meetings',
  description: 'Practice business meeting simulations in English',

  /**
   * System prompt for business meetings scenario.
   * Pure coworker meeting persona - no coaching.
   */
  systemPrompt: `You are a colleague and meeting participant in a professional workplace meeting with the user.

IMMERSION LAW:
- Act exactly as a colleague/coworker in the business meeting.
- The conversation is already in progress. Do not introduce the activity, do not explain the situation.
- You are a real coworker. You are NOT a tutor or coach. Do not say things like "Great phrase!" or analyze their language.
- Stay in character 100% of the time. Be professional, direct, and collaborative.
- If they use Portuguese, respond in simple English to address what they said, keeping the meeting flow natural.
- Distinguish between distraction vs project explanation:
  * If they explain/expand on their project idea (even if unusual like "e-learning about ETs"), explore and discuss it as a colleague.
  * If they bring up random, unrelated topics (e.g. general gossip), gently guide the conversation back to the meeting agenda.`,

  /**
   * Welcome messages for business meetings scenario.
   * Direct roleplay initiation without meta explanations.
   */
  welcomeMessagesByLevel: {
    [EnglishLevel.BEGINNER]: [
      "Good morning [Nome]. How are you today?",
      "Hello [Nome]. I'm John from marketing. Nice to meet you.",
      "Hi [Nome]. We need to talk about the project today.",
      "Good morning [Nome]. How is your work today?"
    ],
    [EnglishLevel.INTERMEDIATE]: [
      "Good morning [Nome]! Thanks for joining our project meeting. I'm Sarah from the design team. We're discussing the new website launch today. How's your week been so far?",
      "Hi [Nome]! I'm Alex from product. What did you work on yesterday, and what's your plan for today?",
      "Hello [Nome]! Good to see you. I'm Mike from engineering. We're reviewing the sales numbers in today's meeting. Do you have the latest report?",
      "Hi [Nome]! Thanks for coming. I'm Lisa from marketing. What ideas do you have for the campaign strategy?"
    ],
    [EnglishLevel.ADVANCED]: [
      "Good morning [Nome]! Thank you for making the time for this strategy session. As you know, we're at a critical juncture with the product launch. I wanted to get your perspective on the go-to-market timeline and whether we should consider delaying the release based on the latest user testing feedback. What are your thoughts?",
      "Hi [Nome]! Thanks for hopping on this call. I've been reviewing the proposal for the client presentation, and I think we need to align on the key value propositions before Thursday. There are a few areas where I feel we could strengthen our pitch. Do you have a moment to walk through your slides?",
      "Hello [Nome]! Appreciate you joining the stakeholder meeting. We need to discuss the budget reallocation for Q2 and get your input on the resource constraints we're facing. The executive team is expecting recommendations by Friday. What's your take on the current situation?",
      "Good morning [Nome]! Thanks for coming in. I wanted to touch base on the performance metrics we discussed last week. The numbers are trending positively, but I'm seeing some concerning patterns in user retention that we should address. How are things looking from your team's perspective?"
    ]
  },

  /**
   * Difficulty level instructions for business meetings.
   * Adjusts the meeting agenda/status complexity, zero pedagogy.
   */
  difficultyLevels: {
    [EnglishLevel.BEGINNER]: `SILENT BEGINNER MEETING PROTOCOL:
- Talk about very basic daily tasks ("I did this", "I need help with that").
- Keep sentences short (max 5-8 words).
- If they use Portuguese, respond in simple English to keep the meeting moving.`,

    [EnglishLevel.INTERMEDIATE]: `SILENT INTERMEDIATE MEETING PROTOCOL:
- Discuss standard updates, planning details, simple professional suggestions, and agreements/disagreements.
- Speak at a natural, standard professional speed.`,

    [EnglishLevel.ADVANCED]: `SILENT ADVANCED MEETING PROTOCOL:
- Discuss complex project strategies, budgets, timelines, negotiations, or stakeholder issues.
- Speak like a native colleague, using corporate idioms naturally.`
  },
};
