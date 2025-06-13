import { GoogleGenerativeAI } from "@google/generative-ai";
import express from 'express';
import prisma from "../lib/db.js";

const router = express.Router();

// Initialize the Gemini API client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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

    try {
      // Get response from Gemini
      const jsonResponse = await generateGeminiResponse(message, safeUser);

      // Save the conversation to the database
      const savedConversation = await prisma.healthConversation.create({
        data: {
          userId: user.id,
          userMessage: message,
          aiResponse: JSON.stringify(jsonResponse),
          usedWebSearch: false
        }
      });

      // Add metadata to the response
      jsonResponse.conversationId = savedConversation.id;
      jsonResponse.webSearchUsed = false;

      // Return the response
      res.json(jsonResponse);

    } catch (error) {
      console.error("Error generating response:", error);
      
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