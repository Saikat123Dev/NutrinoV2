// utils/tavilyClient.js

import { tavily } from '@tavily/core';

const client = tavily({
  apiKey: "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"
});

/**
 * Perform a search using Tavily AI.
 *
 * @param {string} query - The search query.
 * @param {object} options - Optional search parameters.
 * @returns {Promise<object>} - Search results.
 */
export const tavilySearch = async (query, options = {}) => {
  try {
    if (!query || query.trim() === '') {
      throw new Error('Query must not be empty.');
    }

    const defaultOptions = {
      searchDepth: "advanced",
      maxResults: 6,
      timeRange: "year",
      includeAnswer: "advanced",
      ...options, // allow custom overrides if needed
    };

    const result = await client.search(query, defaultOptions);
    return result;
  } catch (error) {
    console.error("Tavily Search Error:", error.message);
    throw error; // Rethrow so caller can handle it too
  }
};
