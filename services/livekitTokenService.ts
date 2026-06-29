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

import { EntitlementDecision } from "../hooks/useEntitlements";
import { getApiRootUrl } from "../utils/apiUrl";

interface TokenGeneratorOptions {
  apiKey: string;
  apiSecret: string;
  identity: string;
  roomName: string;
  ttl?: number;
  conversationId?: string;
}

export class LiveKitEntitlementError extends Error {
  entitlement: EntitlementDecision;

  constructor(message: string, entitlement: EntitlementDecision) {
    super(message);
    this.name = "LiveKitEntitlementError";
    this.entitlement = entitlement;
  }
}

export async function generateLiveKitToken(
  options: TokenGeneratorOptions,
): Promise<string> {
  const authToken = localStorage.getItem("authToken") || localStorage.getItem("auth_token");
  if (!authToken) {
    throw new Error("Authentication required to start a LiveKit session.");
  }

  const response = await fetch(`${getApiRootUrl()}/livekit/token`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${authToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      roomName: options.roomName,
      conversationId: options.conversationId,
    }),
  });

  if (response.status === 401) {
    window.dispatchEvent(new CustomEvent("auth:unauthorized"));
    throw new Error("Unauthorized");
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    if ((response.status === 403 || response.status === 429) && payload?.entitlement) {
      throw new LiveKitEntitlementError(
        payload.message || payload.entitlement.paywall?.title || "LiveKit access blocked",
        payload.entitlement,
      );
    }

    throw new Error(payload?.message || "Failed to generate LiveKit token.");
  }

  if (payload?.serverUrl) {
    LIVEKIT_CONFIG.serverUrl = payload.serverUrl;
  }

  if (!payload?.token) {
    throw new Error("LiveKit token response is missing token.");
  }

  return payload.token;
}

export const LIVEKIT_CONFIG = {
  serverUrl:
    import.meta.env.VITE_LIVEKIT_URL || "wss://sakae-5xpuk5nz.livekit.cloud",
  apiKey: import.meta.env.VITE_LIVEKIT_API_KEY || "",
  apiSecret: "",
  get roomName() {
    return `sakae-learning-${Date.now()}`;
  },
};
