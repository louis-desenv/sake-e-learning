/**
 * Gemini AI Service
 *
 * Service layer for interacting with Google's Gemini AI API.
 * Provides text-based chat functionality with context-aware prompts and scenario-based conversations.
 *
 * @fileoverview This service handles all communications with the Gemini API, including
 * chat message processing, prompt building, and error handling for AI interactions.
 *
 * @dependencies @google/genai, ../types, ../src/prompts/builders/promptBuilder
 *
 * @author SAke E-Learning Team
 * @version 3.0.0
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { ChatScenario } from '../types';
import { buildPrompt, buildPromptWithCorrectionMode, getWelcomeMessage } from '../src/prompts/builders/promptBuilder';
import { buildRAGPrompt, RAGContext } from './contextBuilder';

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Gemini API key from environment variables.
 * In Vite, environment variables must be prefixed with VITE_ to be accessible.
 *
 * @constant {string | undefined}
 */
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

/**
 * Validation check for API key presence.
 * Logs warnings if the API key is missing to help with debugging.
 */
if (!API_KEY) {
  console.warn('⚠️ VITE_GEMINI_API_KEY not found in .env file');
  console.warn('Create a .env file with: VITE_GEMINI_API_KEY=your_key_here');
}

/**
 * Initialized Gemini AI client instance.
 * Configured with the API key for making requests to Google's Gemini API.
 *
 * @constant {GoogleGenerativeAI}
 */
const genAI = new GoogleGenerativeAI(API_KEY || '');

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Fetches a daily English learning tip from the AI.
 * Uses Gemini to generate practical and encouraging learning tips.
 *
 * @async
 * @function getTipOfTheDay
 * @returns {Promise<string>} A short, practical English learning tip.
 * Returns an error message if the request fails.
 *
 * @throws {Error} When the API request fails (caught and handled internally)
 *
 * @example
 * ```ts
 * const tip = await getTipOfTheDay();
 * console.log(tip); // "Try to learn 5 new words every day..."
 * ```
 */
export const getTipOfTheDay = async (): Promise<string> => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const response = await model.generateContent(
      'Provide a short, interesting English learning tip of the day. Make it practical and encouraging.'
    );
    return response.response.text();
  } catch (error) {
    console.error('Error fetching tip of the day:', error);
    return 'Could not fetch a tip right now. Please try again later.';
  }
};

/**
 * Sends a chat message to the AI and receives a response.
 * Supports both generic chat and scenario-based conversations with context awareness.
 *
 * @async
 * @function sendChatMessage
 * @param {string} message - The user's message to send to the AI
 * @param {string[]} [conversationHistory=[]] - Array of previous messages for context.
 * Format: ["User: Hello", "Tutor: Hi there", "User: How are you?"]
 * @param {ChatScenario} [scenario] - Optional scenario ID for specialized conversations.
 * Uses generic tutor behavior if not provided.
 * @param {boolean} [correctionsEnabled=true] - Whether grammar corrections are enabled.
 * @param {RAGContext} [ragContext] - Optional RAG context for personalized responses.
 *
 * @returns {Promise<string>} The AI's response to the message.
 * Returns an error message if the request fails.
 *
 * @throws {Error} When the API request fails (caught and handled internally)
 *
 * @example
 * ```ts
 * // Generic chat
 * const response = await sendChatMessage("Hello, how are you?");
 *
 * // Scenario-based chat with history
 * const history = ["User: I'm preparing for a job interview", "Tutor: That's great! Let's practice."];
 * const response = await sendChatMessage("What should I expect?", history, ChatScenario.JOB_INTERVIEWS, true);
 * ```
 */
export const sendChatMessage = async (
  message: string,
  conversationHistory: string[] = [],
  scenario?: ChatScenario,
  correctionsEnabled: boolean = true,
  ragContext?: RAGContext,
): Promise<string> => {
  try {
    const scenarioString = scenario?.toString() || 'real-life';

    // Generic conversation mode (legacy behavior)
    if (!scenario) {
      const basePrompt = `You are an AI English tutor. `;
      const prompt =
        conversationHistory.length > 0
          ? `${basePrompt}Continue this conversation:\n${conversationHistory.join('\n')}\nUser: ${message}\nTutor:`
          : `${basePrompt}Respond to this message: ${message}`;

      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const response = await model.generateContent(prompt);
      return response.response.text();
    }

    // Scenario-based conversation (new behavior with prompt builder)
    let systemPrompt = buildPromptWithCorrectionMode(scenario, correctionsEnabled);

    // If RAG context is available, enhance the prompt with personalized context
    if (ragContext) {
      systemPrompt = buildRAGPrompt(
        systemPrompt,
        scenarioString,
        ragContext,
        conversationHistory,
        message
      );
      console.log('[GeminiService] Using RAG context - Level:', ragContext.learningFocus.currentLevel);
    }

    // Return welcome message for first interaction in a scenario
    if (conversationHistory.length === 0 && !message) {
      return await getWelcomeMessage(scenario);
    }

    // Build prompt with conversation history
    const fullPrompt =
      conversationHistory.length > 0
        ? `${systemPrompt}\n\n--- CONVERSATION HISTORY ---\n${conversationHistory.join('\n')}\n--- NEW MESSAGE ---\nUser: ${message}\n\nTutor:`
        : `${systemPrompt}\n\n--- FIRST MESSAGE ---\nUser: ${message}\n\nTutor:`;

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const response = await model.generateContent(fullPrompt);

    return response.response.text();
  } catch (error) {
    console.error('Error sending chat message:', error);
    return "Sorry, I couldn't process your message. Please try again.";
  }
};

