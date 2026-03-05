/**
 * LiveKit Token Service
 *
 * Client-side token generation for LiveKit real-time video/audio rooms.
 * Uses JWT signing with the jose library to create access tokens.
 *
 * @fileoverview This service generates LiveKit access tokens for room participation.
 * WARNING: In production, token generation MUST occur on the backend to protect
 * API secrets. This client-side implementation is for development/demo only.
 *
 * @dependencies jose
 *
 * @author SAke E-Learning Team
 * @version 3.0.0
 * @security Warning: API secrets should never be exposed in client-side code.
 */

import * as jose from "jose";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Configuration options for generating a LiveKit access token.
 *
 * @interface TokenGeneratorOptions
 */
interface TokenGeneratorOptions {
  /** LiveKit API key */
  apiKey: string;
  /** LiveKit API secret (keep confidential!) */
  apiSecret: string;
  /** Unique identifier for the participant */
  identity: string;
  /** Name of the room to join */
  roomName: string;
  /** Token time-to-live in seconds (default: 6 hours) */
  ttl?: number;
  /** Conversation ID to pass to the agent via metadata */
  conversationId?: string;
}

// ============================================================================
// TOKEN GENERATION
// ============================================================================

/**
 * Generates a LiveKit access token using JWT signing.
 * Creates a token with video, SIP, and agent dispatch permissions.
 *
 * @async
 * @function generateLiveKitToken
 * @param {TokenGeneratorOptions} options - Token generation configuration
 * @returns {Promise<string>} Signed JWT access token for LiveKit
 *
 * @throws {Error} When token signing fails
 *
 * @example
 * ```ts
 * const token = await generateLiveKitToken({
 *   apiKey: 'APIxxx',
 *   apiSecret: 'secretxxx',
 *   identity: 'user-123',
 *   roomName: 'interview-room'
 * });
 * ```
 *
 * @warning In production, this MUST be done server-side to protect secrets.
 * Client-side token generation exposes your API secret to users.
 */
export async function generateLiveKitToken(
  options: TokenGeneratorOptions,
): Promise<string> {
  const {
    apiKey,
    apiSecret,
    identity,
    roomName,
    ttl = 6 * 60 * 60, // 6 hours default
    conversationId,
  } = options;

  // Current timestamp for token claims
  const now = Math.floor(Date.now() / 1000);

  // JWT claims for LiveKit room access
  const claims = {
    iss: apiKey, // Issuer (API key)
    sub: identity, // Subject (participant identity)
    iat: now, // Issued at
    nbf: now, // Not valid before
    exp: now + ttl, // Expiration time
    video: {
      room: roomName, // Target room name
      roomJoin: true, // Allow joining the room
      roomCreate: true, // Allow creating the room if it doesn't exist
      canPublish: true, // Allow publishing audio/video tracks
      canPublishData: true, // Allow publishing data messages
      canSubscribe: true, // Allow subscribing to tracks
    },
    // Agent dispatch via roomConfig - dispatches agent on participant connection
    roomConfig: {
      agents: [
        {
          agentName: "sakae-teacher",
        },
      ],
    },
    sip: {
      admin: true, // SIP admin permissions
      call: true, // SIP call permissions
    },
    name: identity, // Display name
    metadata: JSON.stringify({
      client: "sake-e-learning",
      conversationId: conversationId || null,
    }), // Client metadata + conversation ID for agent
  };

  // Encode secret for JWT signing
  const secret = new TextEncoder().encode(apiSecret);

  // Sign the JWT with HS256 algorithm
  const token = await new jose.SignJWT(claims)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(now)
    .sign(secret);

  return token;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * LiveKit configuration object.
 * Contains server URL and API credentials for token generation.
 *
 * @remarks WARNING: These credentials are exposed in client-side code.
 * In production, implement server-side token generation.
 */
export const LIVEKIT_CONFIG = {
  /**
   * LiveKit Cloud WebSocket server URL.
   * Falls back to hardcoded production URL if not in environment.
   *
   * @constant {string}
   */
  serverUrl:
    import.meta.env.VITE_LIVEKIT_URL || "wss://sakae-5xpuk5nz.livekit.cloud",

  /**
   * LiveKit API key for authentication.
   *
   * @constant {string}
   * @warning Exposed in client code - move to backend for production.
   */
  apiKey: import.meta.env.VITE_LIVEKIT_API_KEY || "API4DzuzbMC3E9X",

  /**
   * LiveKit API secret for token signing.
   *
   * @constant {string}
   * @warning Exposed in client code - move to backend for production.
   */
  apiSecret:
    import.meta.env.VITE_LIVEKIT_API_SECRET ||
    "DseZQ3MOPSmSILraZdlwjAuRNeNhuXhQBeWhWfSHYf8G",

  /**
   * Generates a unique room name for each session.
   * Uses timestamp to prevent conflicts between sessions.
   *
   * @returns {string} Unique room name in format "sakae-learning-{timestamp}"
   *
   * @example
   * ```ts
   * const room = LIVEKIT_CONFIG.roomName;
   * // Returns: "sakae-learning-1704067200000"
   * ```
   */
  get roomName() {
    return `sakae-learning-${Date.now()}`;
  },
};
