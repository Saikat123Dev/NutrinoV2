import { GoogleGenerativeAI } from "@google/generative-ai";
import express from 'express';
import prisma from "../lib/db.js";
import { tavily } from "@tavily/core";
import axios from 'axios';

const router = express.Router();

// Initialize APIs
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const tavilyClient = tavily({ apiKey: process.env.TAVILY_API_KEY });

// Helper function to categorize conversation type based on message content
function categorizeConversationType(message) {
  const lowerMessage = message.toLowerCase();
  
  // Nutrition related
  if (lowerMessage.includes('diet') || lowerMessage.includes('nutrition') || 
      lowerMessage.includes('food') || lowerMessage.includes('meal') ||
      lowerMessage.includes('calorie') || lowerMessage.includes('vitamin') ||
      lowerMessage.includes('protein') || lowerMessage.includes('carb')) {
    return 'NUTRITION';
  }
  
  // Fitness related
  if (lowerMessage.includes('exercise') || lowerMessage.includes('workout') ||
      lowerMessage.includes('fitness') || lowerMessage.includes('training') ||
      lowerMessage.includes('muscle') || lowerMessage.includes('strength')) {
    return 'FITNESS';
  }
  
  // Mental health related
  if (lowerMessage.includes('stress') || lowerMessage.includes('anxiety') ||
      lowerMessage.includes('depression') || lowerMessage.includes('mental') ||
      lowerMessage.includes('mood') || lowerMessage.includes('sleep')) {
    return 'MENTAL_HEALTH';
  }
  
  // Medical conditions
  if (lowerMessage.includes('symptom') || lowerMessage.includes('condition') ||
      lowerMessage.includes('disease') || lowerMessage.includes('medication') ||
      lowerMessage.includes('treatment') || lowerMessage.includes('doctor')) {
    return 'MEDICAL_CONDITION';
  }
  
  // Weight management
  if (lowerMessage.includes('weight') || lowerMessage.includes('lose') ||
      lowerMessage.includes('gain') || lowerMessage.includes('bmi') ||
      lowerMessage.includes('obesity') || lowerMessage.includes('fat')) {
    return 'WEIGHT_MANAGEMENT';
  }
  
  // Default to general health
  return 'GENERAL_HEALTH';
}

// Keywords that trigger web search for health topics
const SEARCH_TRIGGERS = [
  'latest', 'recent', 'new', 'current', 'updated', 'breakthrough', 'study', 'research',
  'news', 'today', 'this year', '2024', '2025', 'FDA', 'WHO', 'clinical trial',
  'approved', 'latest findings', 'recent study', 'new research', 'current guidelines'
];

// Helper function to determine if query needs web search
function shouldUseWebSearch(message) {
  const lowerMessage = message.toLowerCase();
  return SEARCH_TRIGGERS.some(trigger => lowerMessage.includes(trigger)) ||
         lowerMessage.includes('what\'s new') ||
         lowerMessage.includes('recent developments') ||
         lowerMessage.includes('current recommendations');
}

// Enhanced web search function using Tavily
async function performHealthSearch(query, userProfile) {
  try {
    // Create search query optimized for health information
    const searchQuery = `${query} health nutrition medical research evidence-based`;
    
    const searchResults = await tavilyClient.search(searchQuery, {
      searchDepth: "advanced",
      maxResults: 5,
      includeDomains: [
        "nih.gov", "who.int", "mayoclinic.org", "webmd.com", "healthline.com",
        "harvard.edu", "ncbi.nlm.nih.gov", "pubmed.ncbi.nlm.nih.gov",
        "cdc.gov", "fda.gov", "nutrition.org", "heart.org"
      ],
      excludeDomains: ["pinterest.com", "facebook.com", "twitter.com"],
      includeAnswer: true,
      includeRawContent: false
    });

    return {
      success: true,
      results: searchResults.results,
      answer: searchResults.answer,
      query: searchQuery
    };
  } catch (error) {
    console.error("Tavily search error:", error);
    
    // Fallback to alternative search methods
    try {
      const fallbackResults = await performFallbackSearch(query);
      return fallbackResults;
    } catch (fallbackError) {
      console.error("Fallback search error:", fallbackError);
      return {
        success: false,
        error: "Search services temporarily unavailable",
        results: []
      };
    }
  }
}

// Fallback search using alternative APIs
async function performFallbackSearch(query) {
  // Example using a medical/health-focused API
  // You can replace this with your preferred backup search service
  try {
    const response = await axios.get(`https://api.bing.microsoft.com/v7.0/search`, {
      headers: {
        'Ocp-Apim-Subscription-Key': process.env.BING_API_KEY
      },
      params: {
        q: `${query} site:nih.gov OR site:mayoclinic.org OR site:healthline.com`,
        count: 5,
        safeSearch: 'Strict'
      }
    });

    return {
      success: true,
      results: response.data.webPages?.value || [],
      answer: null,
      query: query,
      source: 'bing_fallback'
    };
  } catch (error) {
    throw new Error("All search services failed");
  }
}

// Enhanced Gemini response generation with search integration
async function generateEnhancedGeminiResponse(message, userProfile, searchData = null) {
  let prompt = `You are a knowledgeable and supportive AI Health and Nutrition Assistant designed to help users achieve their wellness goals through evidence-based advice and personalized guidance.

User Profile:
- Name: **${userProfile.name}**
- Age: **${userProfile.age}**
- Gender: **${userProfile.gender}**
- Health Goals: **${userProfile.healthGoals}**
- Dietary Restrictions: **${userProfile.dietaryRestrictions}**
- Allergies: **${userProfile.allergies}**
- Medical Conditions: **${userProfile.medicalConditions}**
- Activity Level: **${userProfile.activityLevel}**
- Preferred Cuisine: **${userProfile.preferredCuisine}**
- Nutrition Focus: **${userProfile.nutritionFocus}**

User Question: "${message}"`;

  // Add search context if available
  if (searchData && searchData.success) {
    prompt += `\n\nRecent Research and Information:`;
    
    if (searchData.answer) {
      prompt += `\nLatest Summary: ${searchData.answer}`;
    }
    
    if (searchData.results && searchData.results.length > 0) {
      prompt += `\n\nRecent Sources:`;
      searchData.results.forEach((result, index) => {
        prompt += `\n${index + 1}. ${result.title}\n   ${result.content}\n   Source: ${result.url}`;
      });
    }
    
    prompt += `\n\nPlease incorporate this latest information into your response while maintaining accuracy and proper medical disclaimers.`;
  }

  prompt += `\n\nYour task is to generate a structured JSON response in the following format:
{
  "success": true,
  "answer": "Clear, evidence-based answer incorporating latest research when available",
  "explanation": "Detailed explanation with scientific backing and practical tips",
  "feedback": "Supportive feedback acknowledging their health journey",
  "followUp": "A related follow-up question to encourage healthy habits",
  "safety": "Important safety note or disclaimer when appropriate",
  "sources": "List of credible sources referenced (if search was used)",
  "lastUpdated": "Current date to show information recency"
}

Guidelines:
- Provide **evidence-based** health and nutrition information
- **Prioritize recent research** and current guidelines when available
- Consider the user's profile when giving personalized advice
- Always include appropriate **disclaimers** for medical advice
- Suggest **practical, actionable steps** the user can take
- Be supportive and encouraging about their health journey
- **Cite credible sources** when using search results
- Focus on **prevention and wellness** rather than treatment
- Include **safety notes** for any recommendations that could have risks
- **Indicate if information is current** vs. general knowledge
- Output ONLY the raw JSON object without markdown formatting

IMPORTANT: If search results are provided, integrate them naturally and cite sources appropriately. Always maintain medical disclaimers and encourage consultation with healthcare professionals for specific medical advice.`;

  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      }
    });
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const cleanedText = text.replace(/```json|```/g, '').trim();
    const jsonResponse = JSON.parse(cleanedText);
    
    // Add metadata
    jsonResponse.lastUpdated = new Date().toISOString();
    jsonResponse.searchUsed = !!searchData;
    
    return jsonResponse;
  } catch (error) {
    console.error("Error generating Gemini response:", error);
    return {
      success: false,
      error: "Failed to generate response",
      message: error.message,
      lastUpdated: new Date().toISOString()
    };
  }
}

// Main enhanced ask route
// Main enhanced ask route
router.post("/ask", async (req, res) => {
  try {
    const { email, message } = req.body;

    if (!email || !message) {
      return res.status(400).json({
        success: false,
        error: "Email and message are required"
      });
    }

    // Find user with complete profile information
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        healthProfile: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }

    // Create a safe user profile object
    const safeUser = {
      name: user.name || "User",
      age: user.healthProfile?.age?.toString() || "Not specified",
      gender: user.healthProfile?.gender || "Not specified",
      healthGoals: user.healthProfile?.healthGoals || "General wellness",
      dietaryRestrictions: user.healthProfile?.dietaryPreferences?.join(", ") || "None",
      allergies: user.healthProfile?.allergies?.join(", ") || "None",
      medicalConditions: user.healthProfile?.medicalConditions?.join(", ") || "None",
      activityLevel: user.healthProfile?.activityLevel || "MODERATELY_ACTIVE",
      preferredCuisine: user.healthProfile?.preferredCuisine || "Various",
      nutritionFocus: user.healthProfile?.nutritionFocus || "Balanced nutrition"
    };

    let searchData = null;
    let webSearchUsed = false;
    const conversationType = categorizeConversationType(message);

    // Determine if web search is needed
    if (shouldUseWebSearch(message)) {
      console.log("Performing web search for:", message);
      searchData = await performHealthSearch(message, safeUser);
      webSearchUsed = searchData.success;
    }

    try {
      // Generate response with or without search data
      const jsonResponse = await generateEnhancedGeminiResponse(message, safeUser, searchData);

      // Prepare conversation data
      const conversationData = {
        userId: user.id,
        userMessage: message,
        aiResponse: JSON.stringify(jsonResponse),
        usedWebSearch: webSearchUsed,
        conversationType: conversationType
      };

      // Add search metadata if search was used
      if (webSearchUsed && searchData) {
        conversationData.searchQuery = searchData.query;
        conversationData.searchResults = JSON.stringify(searchData.results);
      }

      const savedConversation = await prisma.healthConversation.create({
        data: conversationData
      });

      // Add metadata to the response
      jsonResponse.conversationId = savedConversation.id;
      jsonResponse.webSearchUsed = webSearchUsed;
      jsonResponse.timestamp = new Date().toISOString();

      // Return the enhanced response
      res.json(jsonResponse);

    } catch (error) {
      console.error("Error generating response:", error);
      
      // Enhanced fallback response
      res.status(500).json({
        success: false,
        error: "I'm having trouble processing your request right now. Please try again later or consult with a healthcare professional for immediate concerns.",
        message: error.message,
        timestamp: new Date().toISOString(),
        fallback: true
      });
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      success: false,
      error: "Internal Server Error",
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get conversation history for a user
router.get("/conversations/:email", async (req, res) => {
  try {
    const { email } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }

    const conversations = await prisma.healthConversation.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset),
      select: {
        id: true,
        userMessage: true,
        aiResponse: true,
        usedWebSearch: true,
        sources: true,
        isFallback: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Parse JSON responses for easier frontend consumption
    const parsedConversations = conversations.map(conv => ({
      ...conv,
      aiResponse: JSON.parse(conv.aiResponse),
      sources: conv.sources ? JSON.parse(conv.sources) : null
    }));

    res.json({
      success: true,
      conversations: parsedConversations,
      total: await prisma.healthConversation.count({ where: { userId: user.id } })
    });

  } catch (error) {
    console.error("Error fetching conversations:", error);
    res.status(500).json({
      success: false,
      error: "Internal Server Error",
      message: error.message
    });
  }
});

// Delete a specific conversation
router.delete("/conversations/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { email } = req.query;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: "Conversation ID is required"
      });
    }

    // Verify the user owns this conversation if email is provided
    if (email) {
      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: "User not found"
        });
      }

      const conversation = await prisma.healthConversation.findUnique({
        where: { id: parseInt(id) },
        select: { userId: true }
      });

      if (!conversation) {
        return res.status(404).json({
          success: false,
          error: "Conversation not found"
        });
      }

      if (conversation.userId !== user.id) {
        return res.status(403).json({
          success: false,
          error: "You don't have permission to delete this conversation"
        });
      }
    }

    // Delete the conversation
    await prisma.healthConversation.delete({
      where: { id: parseInt(id) }
    });

    return res.json({
      success: true,
      message: "Conversation deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting conversation:", error);
    res.status(500).json({
      success: false,
      error: "Internal Server Error",
      message: error.message
    });
  }
});

// Update a conversation (regenerate response)
router.put("/conversations/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { email, regenerateResponse = false } = req.body;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: "Conversation ID is required"
      });
    }

    // Verify the user owns this conversation
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        healthProfile: true
      }
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }

    const conversation = await prisma.healthConversation.findUnique({
      where: { id: parseInt(id) }
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: "Conversation not found"
      });
    }

    if (conversation.userId !== user.id) {
      return res.status(403).json({
        success: false,
        error: "You don't have permission to update this conversation"
      });
    }

    // If client requests a new AI response, generate one
    if (regenerateResponse) {
      // Create user profile for prompt
      const safeUser = {
        name: user.name || "User",
        age: user.healthProfile?.age?.toString() || "Not specified",
        gender: user.healthProfile?.gender || "Not specified",
        healthGoals: "General wellness",
        dietaryRestrictions: user.healthProfile?.dietaryPreferences?.join(", ") || "None",
        allergies: user.healthProfile?.allergies?.join(", ") || "None",
        medicalConditions: user.healthProfile?.medicalConditions?.join(", ") || "None",
        activityLevel: user.healthProfile?.activityLevel || "MODERATELY_ACTIVE",
        preferredCuisine: "Various",
        nutritionFocus: "Balanced nutrition"
      };

      try {
        // Generate new response
        const geminiResponse = await generateGeminiResponse(conversation.userMessage, safeUser);

        // Update the conversation with the new response
        const updatedConversation = await prisma.healthConversation.update({
          where: { id: parseInt(id) },
          data: {
            aiResponse: JSON.stringify(geminiResponse),
            usedWebSearch: false,
            updatedAt: new Date()
          }
        });

        return res.json({
          success: true,
          message: "Conversation updated successfully",
          data: {
            ...geminiResponse,
            conversationId: parseInt(id),
            webSearchUsed: false
          }
        });
      } catch (llmError) {
        console.error("Error regenerating response:", llmError);
        return res.status(500).json({
          success: false,
          error: "Failed to regenerate response",
          message: llmError.message
        });
      }
    } else {
      return res.json({
        success: true,
        message: "No regeneration requested",
        data: {
          ...JSON.parse(conversation.aiResponse),
          conversationId: parseInt(id)
        }
      });
    }
  } catch (error) {
    console.error("Error updating conversation:", error);
    res.status(500).json({
      success: false,
      error: "Internal Server Error",
      message: error.message
    });
  }
});

// Route to get nutrition facts for foods
router.post("/nutrition-facts", async (req, res) => {
  try {
    const { email, foodQuery } = req.body;

    if (!email || !foodQuery) {
      return res.status(400).json({
        success: false,
        error: "Email and food query are required"
      });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }

    // Create a basic user profile for the prompt
    const safeUser = {
      name: "User",
      age: "Not specified",
      gender: "Not specified",
      healthGoals: "General wellness",
      dietaryRestrictions: "None",
      allergies: "None",
      medicalConditions: "None",
      activityLevel: "MODERATELY_ACTIVE",
      preferredCuisine: "Various",
      nutritionFocus: "Nutrition facts"
    };

    // Generate response from Gemini
    const nutritionResponse = await generateGeminiResponse(
      `Provide detailed nutrition facts for: ${foodQuery}`,
      safeUser
    );

    // Save the nutrition query as a conversation
    const savedConversation = await prisma.healthConversation.create({
      data: {
        userId: user.id,
        userMessage: `Nutrition facts for: ${foodQuery}`,
        aiResponse: JSON.stringify(nutritionResponse),
        usedWebSearch: false,
        conversationType: 'NUTRITION_FACTS'
      }
    });

    return res.json({
      ...nutritionResponse,
      conversationId: savedConversation.id
    });
  } catch (error) {
    console.error("Error fetching nutrition facts:", error);
    res.status(500).json({
      success: false,
      error: "Internal Server Error",
      message: error.message
    });
  }
});

export default router;