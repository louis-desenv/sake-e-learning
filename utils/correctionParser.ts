/**
 * Grammar Correction Parser
 *
 * Parses correction data from AI response text using regex patterns.
 * Extracts structured correction data from <CORRECTION> blocks.
 *
 * @fileoverview This utility provides functions to parse and validate
 * grammar corrections embedded in AI response text.
 *
 * @dependencies ../types
 *
 * @author SAke E-Learning Team
 * @version 3.0.0
 */

import { GrammarCorrection } from '../types';

/**
 * Regular expression to match correction blocks in AI response text.
 * Matches: <CORRECTION>{...JSON...}</CORRECTION>
 *
 * Pattern breakdown:
 * - <CORRECTION> - Opening tag
 * - (.*?) - Non-greedy capture for JSON content (including braces)
 * - </CORRECTION> - Closing tag
 */
const CORRECTION_BLOCK_REGEX = /<CORRECTION>(.*?)<\/CORRECTION>/gis;

/**
 * Parses correction blocks from AI response text.
 * Extracts all valid <CORRECTION> blocks and returns structured data.
 *
 * @function parseCorrectionsFromResponse
 * @param {string} response - The AI's response text potentially containing corrections
 * @returns {{ corrections: GrammarCorrection[], cleanedText: string }} Parsed corrections and text with blocks removed
 */
export function parseCorrectionsFromResponse(
  response: string
): { corrections: GrammarCorrection[]; cleanedText: string } {
  const corrections: GrammarCorrection[] = [];
  let cleanedText = response;

  // Find all correction blocks
  const matches = Array.from(response.matchAll(CORRECTION_BLOCK_REGEX));

  for (const match of matches) {
    try {
      // match[1] is the content between <CORRECTION> and </CORRECTION>
      // It should be a JSON object like {"original":"...","corrected":"...","explanation":"..."}
      let jsonStr = match[1].trim();

      // Remove outer braces if they exist (the regex captures the content)
      if (!jsonStr.startsWith('{')) {
        jsonStr = '{' + jsonStr;
      }
      if (!jsonStr.endsWith('}')) {
        jsonStr = jsonStr + '}';
      }

      const correctionData = JSON.parse(jsonStr);

      // Validate the correction structure
      if (
        typeof correctionData.original === 'string' &&
        typeof correctionData.corrected === 'string' &&
        typeof correctionData.explanation === 'string'
      ) {
        corrections.push({
          original: correctionData.original.trim(),
          corrected: correctionData.corrected.trim(),
          explanation: correctionData.explanation.trim(),
        });

        // Remove this correction block from cleaned text
        cleanedText = cleanedText.replace(match[0], '');
      } else {
        console.warn('Invalid correction structure:', correctionData);
      }
    } catch (error) {
      console.error('Failed to parse correction block:', error, 'Raw match:', match[0]);
    }
  }

  // Clean up extra whitespace left after removing blocks
  cleanedText = cleanedText
    .replace(/\s+/g, ' ')  // Collapse multiple spaces
    .replace(/\s+([.!?])/g, '$1')  // Remove space before punctuation
    .trim();

  return { corrections, cleanedText };
}

/**
 * Checks if a response contains any correction blocks.
 * Useful for UI decisions without full parsing.
 *
 * @function hasCorrections
 * @param {string} response - The response text to check
 * @returns {boolean} True if <CORRECTION> blocks are present
 */
export function hasCorrections(response: string): boolean {
  return CORRECTION_BLOCK_REGEX.test(response);
}

/**
 * Strips correction blocks from response without parsing.
 * Use this when you only need clean text for display.
 *
 * @function stripCorrectionBlocks
 * @param {string} response - The response text
 * @returns {string} Response with correction blocks removed
 */
export function stripCorrectionBlocks(response: string): string {
  return response
    .replace(CORRECTION_BLOCK_REGEX, '')
    .replace(/\s+/g, ' ')
    .trim();
}
