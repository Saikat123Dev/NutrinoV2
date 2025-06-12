import { GoogleGenerativeAI } from "@google/generative-ai";
import express from 'express';
import prisma from "../lib/db.js";
import { tavily } from "@tavily/core";

const router = express.Router();

// Initialize the Gemini API client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Initialize Tavily client
const tavilyClient = tavily({ apiKey: process.env.TAVILY_API_KEY });

// Helper function to clean and validate search queries
function cleanSearchQuery(input) {
  if (typeof input !== 'string') {
    input = String(input);
  }
  // Remove phrases that might cause API errors
  return input
    .replace(/please give me|some website about|documentation/g, '')
    .trim()
    .substring(0, 100); // Limit to 100 chars
}

// Helper function to perform web search using Tavily
async function searchWithTavily(query) {
  try {
    const cleanQuery = cleanSearchQuery(query);
    
    if (!cleanQuery) {
      throw new Error("Search query cannot be empty");
    }

    console.log("Searching with query:", cleanQuery);

    const response = await tavilyClient.search({
      query: cleanQuery,
      search_depth: "basic",
      include_images: false,
      include_answer: true,
      max_results: 3,
      include_domains: [
        "mayoclinic.org",
        "webmd.com",
        "healthline.com",
        "nih.gov",
        "who.int",
        "harvard.edu",
        "nutrition.gov",
        "usda.gov"
      ]
    });
    
    return {
      success: true,
      answer: response.answer || "No specific answer found, but found relevant information.",
      sources: (response.results || []).map(result => ({
        title: result.title || "Untitled",
        url: result.url || "",
        content: result.content || result.snippet || ""
      }))
    };
  } catch (error) {
    console.error("Tavily search error:", {
      error: error.message,
      stack: error.stack,
      query: typeof query === 'string' ? query : JSON.stringify(query),
      timestamp: new Date().toISOString()
    });
    return {
      success: false,
      error: error.message || "Web search failed"
    };
  }
}

// Helper function to detect if Gemini response indicates uncertainty or failure
function isGeminiResponseUncertain(response) {
  if (typeof response !== 'string') {
    try {
      response = JSON.stringify(response);
    } catch {
      return true; // If we can't stringify, consider it uncertain
    }
  }

  const uncertaintyIndicators = [
    "i don't know",
    "i'm not sure",
    "i cannot provide",
    "consult a doctor",
    "see a healthcare professional",
    "i'm unable to",
    "insufficient information",
    "unclear",
    "uncertain"
  ];
  
  const responseText = response.toLowerCase();
  return uncertaintyIndicators.some(indicator => responseText.includes(indicator));
}

// Helper function to generate Gemini response
async function generateGeminiResponse(message, userProfile) {
  const prompt = `You are a knowledgeable and supportive AI Health and Nutrition Assistant designed to help users achieve their wellness goals through evidence-based advice and personalized guidance.

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

Instructions:
The user has asked: "${message}"

Your task is to generate a structured JSON response in the following format:
{
  "success": true,
  "answer": "Clear, evidence-based answer to their health/nutrition question",
  "explanation": "Detailed explanation with scientific backing and practical tips",
  "feedback": "Supportive feedback acknowledging their health journey",
  "followUp": "A related follow-up question to encourage healthy habits",
  "safety": "Important safety note or disclaimer when appropriate"
}

Guidelines:
- Provide **evidence-based** health and nutrition information
- Consider the user's profile when giving personalized advice
- Always include appropriate **disclaimers** for medical advice
- Suggest **practical, actionable steps** the user can take
- Be supportive and encouraging about their health journey
- If you're uncertain about specific medical advice, clearly state limitations
- Focus on **prevention and wellness** rather than treatment
- Include **safety notes** for any recommendations that could have risks
- Output ONLY the raw JSON object without markdown formatting

IMPORTANT: If you cannot provide a confident answer due to the complexity of the question or need for current research, indicate this clearly in your response.`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const cleanedText = text.replace(/```json|```/g, '').trim();
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error("Error generating Gemini response:", error);
    return {
      success: false,
      error: "Failed to generate response",
      message: error.message
    };
  }
}

// Main ask route with health and nutrition focus
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

    // Create a safe user profile object with all necessary fields
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

    let jsonResponse;
    let usedWebSearch = false;

    try {
      // First, try to get response from Gemini
      jsonResponse = await generateGeminiResponse(message, safeUser);

      // Check if Gemini response indicates uncertainty
      if (!jsonResponse.success || isGeminiResponseUncertain(jsonResponse.answer)) {
        console.log("Gemini response uncertain, attempting web search...");
        
        // Construct a clean search query
        const searchQuery = `${cleanSearchQuery(message)} health nutrition research`;
        console.log("Search query being sent:", searchQuery);
        
        const tavilyResult = await searchWithTavily(searchQuery);
        
        if (tavilyResult.success && tavilyResult.answer) {
          usedWebSearch = true;
          // Enhance the response with web search results
          jsonResponse = {
            ...jsonResponse,
            answer: tavilyResult.answer,
            explanation: `Based on current health and nutrition research: ${tavilyResult.answer}${jsonResponse.explanation ? '. ' + jsonResponse.explanation : ''}`,
            sources: tavilyResult.sources || [],
            webSearchUsed: true,
            note: "This information was enhanced with current research from trusted health sources."
          };
        } else {
          console.log("Web search failed or returned no results:", tavilyResult.error);
        }
      }

      // Save the conversation to the database
      const savedConversation = await prisma.healthConversation.create({
        data: {
          userId: user.id,
          userMessage: message,
          aiResponse: JSON.stringify(jsonResponse),
          usedWebSearch: usedWebSearch,
          sources: jsonResponse.sources ? JSON.stringify(jsonResponse.sources) : null
        }
      });

      // Add metadata to the response
      jsonResponse.conversationId = savedConversation.id;
      jsonResponse.webSearchUsed = usedWebSearch;

      // Return the response
      res.json(jsonResponse);

    } catch (error) {
      console.error("Error generating response:", error);

      // Fallback: try web search if Gemini completely fails
      try {
        const searchQuery = `${cleanSearchQuery(message)} health nutrition advice`;
        console.log("Fallback search query:", searchQuery);
        
        const tavilyResult = await searchWithTavily(searchQuery);
        
        if (tavilyResult.success) {
          const fallbackResponse = {
            success: true,
            answer: tavilyResult.answer || "I found some information, but please consult with a healthcare professional for personalized advice.",
            explanation: "This information is based on current research from trusted health sources.",
            feedback: "Great question! It's always good to seek evidence-based health information.",
            followUp: "Would you like more specific information about any aspect of this topic?",
            safety: "Please consult with a healthcare professional for personalized medical advice.",
            sources: tavilyResult.sources || [],
            webSearchUsed: true,
            fallbackUsed: true
          };

          // Save the fallback response
          const savedConversation = await prisma.healthConversation.create({
            data: {
              userId: user.id,
              userMessage: message,
              aiResponse: JSON.stringify(fallbackResponse),
              usedWebSearch: true,
              sources: JSON.stringify(fallbackResponse.sources),
              isFallback: true
            }
          });

          fallbackResponse.conversationId = savedConversation.id;
          return res.json(fallbackResponse);
        }
      } catch (searchError) {
        console.error("Web search also failed:", searchError);
      }

      // Final fallback response
      res.status(500).json({
        success: false,
        error: "I'm having trouble processing your request right now. Please try again later or consult with a healthcare professional.",
        message: error.message
      });
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      success: false,
      error: "Internal Server Error",
      message: error.message
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
        let finalResponse = geminiResponse;
        let usedWebSearch = false;

        // Check if Gemini response is uncertain and use Tavily if needed
        if (isGeminiResponseUncertain(geminiResponse.answer)) {
          console.log("Gemini response uncertain, trying web search...");
          const searchQuery = `${conversation.userMessage.substring(0, 80)} health nutrition`.trim();
          const tavilyResult = await searchWithTavily(searchQuery);
          
          if (tavilyResult.success && tavilyResult.answer) {
            usedWebSearch = true;
            finalResponse = {
              ...geminiResponse,
              answer: tavilyResult.answer || geminiResponse.answer,
              explanation: `Based on current health and nutrition research: ${tavilyResult.answer}${geminiResponse.explanation ? '. ' + geminiResponse.explanation : ''}`,
              sources: tavilyResult.sources || [],
              webSearchUsed: true
            };
          }
        }

        // Update the conversation with the new response
        const updatedConversation = await prisma.healthConversation.update({
          where: { id: parseInt(id) },
          data: {
            aiResponse: JSON.stringify(finalResponse),
            usedWebSearch: usedWebSearch,
            sources: finalResponse.sources ? JSON.stringify(finalResponse.sources) : null,
            updatedAt: new Date()
          }
        });

        return res.json({
          success: true,
          message: "Conversation updated successfully",
          data: {
            ...finalResponse,
            conversationId: parseInt(id),
            webSearchUsed: usedWebSearch
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

    // Search for detailed nutrition information
    const searchQuery = `${foodQuery.substring(0, 50)} nutrition facts calories protein`.trim();
    console.log("Nutrition search query:", searchQuery);
    
    const nutritionData = await searchWithTavily(searchQuery);

    if (nutritionData.success) {
      // Save the nutrition query as a conversation
      const savedConversation = await prisma.healthConversation.create({
        data: {
          userId: user.id,
          userMessage: `Nutrition facts for: ${foodQuery}`,
          aiResponse: JSON.stringify({
            success: true,
            foodItem: foodQuery,
            nutritionInfo: nutritionData.answer,
            sources: nutritionData.sources,
            note: "Nutrition information from trusted sources. Values may vary based on preparation and serving size."
          }),
          usedWebSearch: true,
          sources: JSON.stringify(nutritionData.sources),
          conversationType: 'NUTRITION_FACTS'
        }
      });

      return res.json({
        success: true,
        foodItem: foodQuery,
        nutritionInfo: nutritionData.answer,
        sources: nutritionData.sources,
        conversationId: savedConversation.id,
        note: "Nutrition information from trusted sources. Values may vary based on preparation and serving size."
      });
    } else {
      return res.status(500).json({
        success: false,
        error: "Unable to fetch nutrition information at this time"
      });
    }
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