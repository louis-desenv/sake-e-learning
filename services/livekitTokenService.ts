import * as jose from 'jose';

interface TokenGeneratorOptions {
    apiKey: string;
    apiSecret: string;
    identity: string;
    roomName: string;
    ttl?: number; // Time to live in seconds, default 6 hours
}

/**
 * Generates a LiveKit access token using jose library, structured according to livekit-server-sdk
 *
 * Note: In production, token generation should happen on your backend server
 * to protect your API secret. This is for development/demo purposes.
 */
export async function generateLiveKitToken(options: TokenGeneratorOptions): Promise<string> {
    const {
        apiKey,
        apiSecret,
        identity,
        roomName,
        ttl = 6 * 60 * 60, // 6 hours default
    } = options;

    const now = Math.floor(Date.now() / 1000);
    const claims = {
        iss: apiKey,
        sub: identity,
        iat: now,
        nbf: now,
        exp: now + ttl,
        video: {
            room: roomName,
            roomJoin: true,
            canPublish: true,
            canPublishData: true,
            canSubscribe: true,
        },
        sip: {
            admin: true,
            call: true,
        },
        name: identity,
        metadata: JSON.stringify({ client: 'sake-e-learning' }),
    };

    const secret = new TextEncoder().encode(apiSecret);

    const token = await new jose.SignJWT(claims)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt(now)
        .sign(secret);

    return token;
}

// Default configuration
// NOTE: In production, token generation should be done on your backend server
// to protect your API credentials. This is for development/demo purposes only.
export const LIVEKIT_CONFIG = {
    // LiveKit Cloud URL
    serverUrl: 'wss://sakae-5xpuk5nz.livekit.cloud',

    // API credentials
    apiKey: 'API4DzuzbMC3E9X',
    apiSecret: 'DseZQ3MOPSmSILraZdlwjAuRNeNhuXhQBeWhWfSHYf8G',

    // Default room name - use unique room for each session to avoid conflicts
    get roomName() {
        return `sakae-learning-${Date.now()}`;
    }
};
