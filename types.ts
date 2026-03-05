/**
 * TypeScript Type Definitions
 *
 * Centralized type definitions for the SAke E-Learning application.
 * Contains user profile types, API interfaces, and LLM prompt system types.
 *
 * @fileoverview This file defines all shared TypeScript interfaces and types used
 * across the application, ensuring type consistency and enabling better developer
 * experience through IntelliSense and compile-time checking.
 *
 * @author SAke E-Learning Team
 * @version 3.0.0
 */

// ============================================================================
// USER PROFILE TYPES
// ============================================================================

/**
 * English proficiency levels available in the application.
 * Used to tailor content and difficulty to the user's abilities.
 *
 * @enum {string}
 * @readonly
 */
export enum EnglishLevel {
  /** Beginner level - Basic vocabulary and simple sentences */
  BEGINNER = 'Beginner',
  /** Intermediate level - Complex sentences and common expressions */
  INTERMEDIATE = 'Intermediate',
  /** Advanced level - Nuanced communication and professional language */
  ADVANCED = 'Advanced',
}

/**
 * Learning goals that users can select during onboarding.
 * Used to personalize the learning experience and content.
 *
 * @enum {string}
 * @readonly
 */
export enum LearningGoal {
  /** Career-focused English for professional development */
  CAREER = 'Career Development',
  /** Travel-related vocabulary and situations */
  TRAVEL = 'Travel Communication',
  /** Everyday conversation and casual communication */
  CONVERSATION = 'Daily Conversation',
  /** Preparation for English proficiency exams (IELTS, TOEFL, etc.) */
  EXAMS = 'Exam Preparation',
}

/**
 * Supported native languages for users.
 * Used for bilingual support and contextual translations.
 *
 * @type {string}
 */
export type Language =
  | 'Spanish'
  | 'French'
  | 'German'
  | 'Italian'
  | 'Portuguese'
  | 'Japanese'
  | 'Korean'
  | 'Chinese'
  | 'Russian'
  | 'Arabic';

/**
 * User profile containing learning preferences and personalization data.
 * Stored in localStorage and used throughout the app to customize the experience.
 *
 * @interface UserProfile
 */
export interface UserProfile {
  /** User's unique identifier */
  id?: string;
  /** User's display name */
  name: string;
  /** Current English proficiency level */
  level: EnglishLevel;
  /** Array of selected learning goals */
  goals: LearningGoal[];
  /** User's interests for personalized content (free text) */
  interests: string;
  /** User's native language for bilingual support */
  nativeLanguage: Language;
}

// ============================================================================
// API INTERFACES (Backend DTOs)
// ============================================================================

/**
 * Data Transfer Object for user information from the backend API.
 * Represents the safe, sanitized user data returned by the server.
 *
 * @interface ApiUserDto
 */
export interface ApiUserDto {
  /** Unique database identifier */
  id: number;
  /** User's display name */
  name: string;
  /** User's email address (used for login) */
  email: string;
  /** Whether the account is currently active */
  isActive: boolean;
}

/**
 * Standard API response wrapper for authentication operations.
 * Contains success status, messages, and optional authentication data.
 *
 * @interface AuthResponse
 */
export interface AuthResponse {
  /** Indicates if the operation completed successfully */
  success: boolean;
  /** Human-readable status message */
  message: string;
  /** JWT authentication token (present on successful login/register) */
  token?: string;
  /** User data (present on successful operations) */
  user?: ApiUserDto;
}

// ============================================================================
// LLM PROMPT SYSTEM TYPES
// ============================================================================

/**
 * Available chat scenarios for conversational practice.
 * Each scenario represents a different real-world communication context.
 *
 * @enum {string}
 * @readonly
 */
export enum ChatScenario {
  /** Telephone conversation practice and screening calls */
  PHONE_SCREEN = 'phone-screen',
  /** Job interview preparation and practice */
  JOB_INTERVIEWS = 'job-interviews',
  /** Travel-related conversations and situations */
  TRAVEL_CONVERSATIONS = 'travel-conversations',
  /** Professional meeting and business communication */
  BUSINESS_MEETINGS = 'business-meetings',
  /** Grammar specialist coach */
  GRAMMAR_SPECIALIST = 'grammar-specialist',
  /** Vocabulary specialist coach */
  VOCABULARY_SPECIALIST = 'vocabulary-specialist',
  /** Pronunciation specialist coach */
  PRONUNCIATION_SPECIALIST = 'pronunciation-specialist',
  /** Business English specialist coach */
  BUSINESS_SPECIALIST = 'business-specialist',
  /** Travel phrases specialist coach */
  TRAVEL_SPECIALIST = 'travel-specialist',
  /** Idioms and slang specialist coach */
  IDIOMS_SPECIALIST = 'idioms-specialist',
}

/**
 * Available lesson subjects for guided learning.
 * Each subject has specialized prompts and lesson content.
 *
 * @enum {string}
 * @readonly
 */
export enum SubjectId {
  /** English grammar fundamentals and rules */
  GRAMMAR_ESSENTIALS = 'grammar-essentials',
  /** Vocabulary building and acquisition */
  VOCABULARY_BUILDER = 'vocabulary-builder',
  /** Pronunciation practice and phonetics */
  PRONUNCIATION_PRACTICE = 'pronunciation-practice',
  /** Professional business English communication */
  BUSINESS_ENGLISH = 'business-english',
  /** Travel phrases and situational language */
  TRAVEL_PHRASES = 'travel-phrases',
  /** Idiomatic expressions and slang */
  IDIOMS_SLANG = 'idioms-slang',
}

/**
 * Complete configuration for a conversation scenario.
 * Contains all prompts and messages needed for a specific chat scenario.
 *
 * @interface ScenarioConfig
 */
export interface ScenarioConfig {
  /** Unique identifier for this scenario */
  id: ChatScenario;
  /** Display name shown to users */
  name: string;
  /** Brief description of the scenario */
  description: string;
  /** System prompt that defines the AI's behavior in this scenario */
  systemPrompt: string;
  /** Initial greeting when starting a chat in this scenario (deprecated, use welcomeMessagesByLevel) */
  welcomeMessage?: string;
  /** Direct roleplay welcome messages organized by English proficiency level */
  welcomeMessagesByLevel: Record<EnglishLevel, string[]>;
  /** Difficulty adaptations for each English proficiency level */
  difficultyLevels: Record<EnglishLevel, string>;
}

/**
 * User context information used for building personalized prompts.
 * Provides the LLM with relevant user data for context-aware responses.
 *
 * @interface PromptUserContext
 */
export interface PromptUserContext {
  /** User's display name */
  name: string;
  /** User's English proficiency level */
  level: EnglishLevel;
  /** User's native language (for translations and clarifications) */
  nativeLanguage: Language;
  /** User's learning objectives */
  goals: LearningGoal[];
  /** Optional specific interests for further personalization */
  interests?: string;
}

/**
 * Final constructed prompt ready to send to the LLM.
 * Contains the system message and metadata about the prompt construction.
 *
 * @interface BuiltPrompt
 */
export interface BuiltPrompt {
  /** The complete system message (system prompt) for the LLM */
  systemMessage: string;
  /** Metadata about when and how the prompt was constructed */
  metadata: {
    /** The scenario this prompt was built for */
    scenario: ChatScenario;
    /** The user's English level used for construction */
    userLevel: EnglishLevel;
    /** Timestamp when the prompt was created */
    timestamp: Date;
  };
}

// ============================================================================
// GRAMMAR CORRECTION TYPES
// ============================================================================

/**
 * Represents a single grammar correction for user's text.
 *
 * @interface GrammarCorrection
 */
export interface GrammarCorrection {
  /** The original text from the user */
  original: string;
  /** The corrected version */
  corrected: string;
  /** Brief explanation of the correction */
  explanation: string;
}

/**
 * Extended message type with optional grammar corrections.
 * Enhances the basic message interface with correction metadata for UI rendering.
 *
 * @interface MessageWithCorrections
 */
export interface MessageWithCorrections {
  /** Either 'user' or 'ai' indicating who sent the message */
  sender: 'user' | 'ai';
  /** The message content */
  text: string;
  /** Optional grammar corrections (only for AI messages) */
  corrections?: GrammarCorrection[];
}

