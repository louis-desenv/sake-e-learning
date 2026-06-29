/**
 * Audio Utility Functions
 *
 * Helper functions for encoding/decoding audio data in various formats.
 * Used primarily for processing audio from the Gemini Live API.
 *
 * @fileoverview This module provides utility functions for converting between
 * different audio data representations (Uint8Array, base64, AudioBuffer).
 * These are essential for working with audio streams in the browser.
 *
 * @author SAke E-Learning Team
 * @version 3.0.0
 */

// ============================================================================
// ENCODING FUNCTIONS
// ============================================================================

/**
 * Encodes a Uint8Array to a base64 string.
 * Converts binary audio data to a string representation for transmission.
 *
 * @function encode
 * @param {Uint8Array} bytes - Binary data to encode
 * @returns {string} Base64-encoded string representation
 *
 * @example
 * ```ts
 * const audioBytes = new Uint8Array([0x00, 0x01, 0x02]);
 * const base64 = encode(audioBytes);
 * // Returns: "AAEC"
 * ```
 */
export function encode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  // Convert each byte to a character
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  // Encode to base64
  return btoa(binary);
}

/**
 * Decodes a base64 string to a Uint8Array.
 * Converts a base64 string back to binary audio data.
 *
 * @function decode
 * @param {string} base64 - Base64-encoded string
 * @returns {Uint8Array} Decoded binary data
 *
 * @example
 * ```ts
 * const base64 = "AAEC";
 * const bytes = decode(base64);
 * // Returns: Uint8Array [0x00, 0x01, 0x02]
 * ```
 */
export function decode(base64: string): Uint8Array {
  // Decode from base64 to binary string
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  // Convert each character to a byte
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// ============================================================================
// AUDIO CONVERSION
// ============================================================================

/**
 * Decodes PCM audio data to a Web Audio API AudioBuffer.
 * Converts raw PCM Int16 samples to a format playable by the browser.
 *
 * @async
 * @function decodeAudioData
 * @param {Uint8Array} data - Raw PCM audio data (Int16 format)
 * @param {AudioContext} ctx - Web Audio API context for creating the buffer
 * @param {number} sampleRate - Desired sample rate for the output buffer (Hz)
 * @param {number} numChannels - Number of audio channels (1 = mono, 2 = stereo)
 * @returns {Promise<AudioBuffer>} Decoded audio buffer ready for playback
 *
 * @throws {Error} If buffer creation or data conversion fails
 *
 * @example
 * ```ts
 * const audioContext = new AudioContext({ sampleRate: 24000 });
 * const pcmData = new Uint8Array([0x00, 0x01, 0x02]); // raw PCM data
 * const audioBuffer = await decodeAudioData(pcmData, audioContext, 24000, 1);
 *
 * // Play the audio
 * const source = audioContext.createBufferSource();
 * source.buffer = audioBuffer;
 * source.connect(audioContext.destination);
 * source.start();
 * ```
 */
export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  // Interpret the data as 16-bit signed integers (PCM format)
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;

  // Create an empty audio buffer
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  // Fill each channel with normalized audio data
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      // Normalize from Int16 range [-32768, 32767] to Float32 range [-1, 1]
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}
