/**
 * Travel Conversations Scenario Configuration
 *
 * Scenario configuration for practicing English for travel situations.
 * Focuses on practical travel skills including airports, hotels, restaurants, and emergencies.
 *
 * @fileoverview This file exports the scenario configuration for travel conversation
 * practice, including system prompts, welcome messages, and difficulty-specific
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
 * Travel conversations scenario configuration.
 *
 * Provides a complete configuration for practicing English for real travel
 * situations, including airports, hotels, restaurants, shopping, transportation,
 * and emergencies. Emphasizes practical, real-world communication.
 *
 * @constant {ScenarioConfig}
 * @property {ChatScenario} id - Unique scenario identifier
 * @property {string} name - Display name for the scenario
 * @property {string} description - Brief description of the scenario
 * @property {string} systemPrompt - AI system instruction for travel companion persona
 * @property {string} welcomeMessage - Initial greeting when starting the scenario
 * @property {Record<EnglishLevel, string>} difficultyLevels - Level-specific instructions
 *
 * @remarks
 * - Focuses on practical English for getting things done while traveling
 * - Teaches essential phrases that work everywhere
 * - Includes cultural tips when relevant
 * - Emphasizes being understood over grammatical perfection
 * - Allows flexible destination changes based on user preference
 * - Asks user to clarify when showing indecision about destinations
 */
export const travelConfig: ScenarioConfig = {
  id: ChatScenario.TRAVEL_CONVERSATIONS,
  name: 'Travel Conversations',
  description: 'Learn travel-related conversations in English',

  /**
   * System prompt for travel conversations scenario.
   * Pure traveler / local roleplay - no coaching.
   */
  systemPrompt: `You roleplay as various characters the user meets while traveling (hotel staff, waiters, flight attendants, customs officers, locals, etc.).

IMMERSION LAW:
- Act exactly as the character in the travel scenario.
- The conversation is already in progress. Do not introduce the activity, do not explain the situation.
- You are a real person. You are NOT a tutor. Do not mention practicing, lessons, language learning, or educational goals.
- Stay in character 100% of the time.
- If they use Portuguese, respond in simple English to address what they said, keeping the dialogue flow natural.
- When they show indecision or mention multiple destinations (e.g., "Japan or France?"), ask which they prefer instead of deciding for them.`,

  /**
   * Welcome messages for travel conversations scenario.
   * Direct roleplay initiation without meta explanations.
   */
  welcomeMessagesByLevel: {
    [EnglishLevel.BEGINNER]: [
      "Hello. I am the hotel receptionist. Your room is ready. Your name please?",
      "Welcome to the restaurant. Table for one? Or two people?",
      "Airport check-in. Your passport please. Where are you going today?",
      "Hello. Taxi service. Where do you want to go? Address please?"
    ],
    [EnglishLevel.INTERMEDIATE]: [
      "Welcome to Hotel Paris! I'm the receptionist. How may I help you today? Are you checking in or do you have a question about your reservation?",
      "Good afternoon! Welcome to Café Milano. Here's the menu. Would you like to order something to drink first? Or do you need a few minutes?",
      "Hi there! Airport information desk. Where are you traveling to today? I can help you find your gate and check flight status.",
      "Hello! Tourist information center here. Welcome to London! What would you like to see? I can recommend museums, restaurants, and attractions."
    ],
    [EnglishLevel.ADVANCED]: [
      "Good morning! Welcome to the Grand Hotel Tokyo. I see you have a premium suite reservation for 5 nights. I hope your flight from Narita was comfortable. Would you like me to arrange your airport transfer pickup, or shall we proceed directly to check-in? I can also provide recommendations for local dining if you're interested.",
      "Welcome to Le Petit Bistro in Paris! My name is Marie, and I'll be your server this evening. I see you've booked our terrace seating - excellent choice for this beautiful weather. Our specials today include the coq au vin and the fresh catch from Brittany. May I start you with an apéritif, or would you prefer still or sparkling water?",
      "Good afternoon and welcome to Emirates Airlines business class check-in. I can see you're traveling to Dubai with a connection to Singapore. Your flight EK205 departs in 2 hours from Terminal 3, Gate A12. I've confirmed your seat preference and special meal request. May I see your passport and visa? Would you also like me to check you through to your final destination?",
      "Hi! Sydney Visitor Information Centre here. G'day and welcome to Australia! I see you're here for two weeks - fantastic! What sort of experiences are you interested in? We can arrange everything from harbour cruises and wildlife sanctuaries to day trips to the Blue Mountains. Also, did you know there's a food festival on this weekend if you're interested in local cuisine?"
    ]
  },

  /**
   * Difficulty level instructions for travel conversations.
   * Adjusts situation complexity naturally, zero pedagogy.
   */
  difficultyLevels: {
    [EnglishLevel.BEGINNER]: `SILENT BEGINNER TRAVEL PROTOCOL:
- Use simple greetings, numbers, and basic nouns.
- Keep sentences short (max 5-8 words).
- Make simple, clear requests as hotel staff / server.
- If they use Portuguese, reply simply in-character in English with parentheses translations naturally if needed.`,

    [EnglishLevel.INTERMEDIATE]: `SILENT INTERMEDIATE TRAVEL PROTOCOL:
- Roleplay standard travel scenarios (making bookings, explaining needs, detailing minor room/food issues).
- Speak at natural casual speed.`,

    [EnglishLevel.ADVANCED]: `SILENT ADVANCED TRAVEL PROTOCOL:
- Roleplay complex travel scenarios (luggage claims, severe complaints, complex tickets, local tours, medical help).
- Speak like a native with regional expressions or accents where appropriate.`
  },
};
