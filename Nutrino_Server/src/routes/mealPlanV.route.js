import { Router } from "express";
import { z } from "zod";
import geminiAI from "../lib/AI.js";
import prisma from "../lib/db.js";
import {FatSecretAPIClient} from "../utils/tools/fastSecretClient.cjs"
import { generateNutritionPlan } from "../utils/tools/nutritionTargetFound.js";
// import { tavilySearch } from "../utils/tavilyClient.js";

const router = Router()

const API_KEY = '2fda0b6078a34c29a29f82034e9cec79';
const API_SECRET = '5cb0f4050c4c4f628dd1a6b8fe31bb94';

// Create the client instance
const fatSecretClient = new FatSecretAPIClient(API_KEY, API_SECRET);

// Function to extract food items from nutrition plan recommendations
const extractFoodRecommendations = (nutritionTarget) => {
  const foodItems = new Set(); // Use Set to avoid duplicates
  
  try {
    // Handle both direct nutrition target and nested structure
    const data = nutritionTarget?.data || nutritionTarget;
    const recommendations = data?.nutritionTargets?.specificRecommendations || [];
    const mealPlanSuggestions = data?.mealPlanSuggestions || '';
    const healthInsights = data?.healthInsights || [];
    
    console.log('Extracting from:', {
      recommendationsCount: recommendations.length,
      mealPlanLength: mealPlanSuggestions.length,
      healthInsightsCount: healthInsights.length
    });
    
    // Define comprehensive food keywords to extract
    const foodKeywords = [
      // Proteins
      'chicken breast', 'chicken', 'fish', 'salmon', 'mackerel', 'tuna', 'cod', 'tilapia',
      'beans', 'lentils', 'chickpeas', 'black beans', 'kidney beans', 'tofu', 'tempeh',
      'lean protein', 'protein sources', 'lean meat', 'poultry',
      
      // Grains & Carbs
      'brown rice', 'quinoa', 'oats', 'oatmeal', 'barley', 'bulgur', 'farro',
      'sweet potatoes', 'potatoes', 'whole grain cereal', 'whole grains', 'cereals',
      'whole wheat', 'buckwheat', 'millet',
      
      // Fruits & Vegetables
      'bananas', 'banana', 'spinach', 'kale', 'broccoli', 'carrots', 'tomatoes',
      'berries', 'blueberries', 'strawberries', 'raspberries', 'blackberries',
      'apples', 'oranges', 'grapes', 'mangoes', 'pineapple',
      'leafy greens', 'vegetables', 'fruits', 'bell peppers', 'cucumber',
      
      // Healthy Fats
      'avocados', 'avocado', 'nuts', 'almonds', 'walnuts', 'cashews', 'pistachios',
      'seeds', 'chia seeds', 'flaxseeds', 'pumpkin seeds', 'sunflower seeds',
      'olive oil', 'coconut oil', 'fatty fish',
      
      // Dairy & Alternatives
      'milk', 'yogurt', 'greek yogurt', 'cheese', 'cottage cheese',
      'almond milk', 'soy milk', 'oat milk',
      
      // Other specific items from the plan
      'cereal', 'salad', 'steamed vegetables'
    ];
    
    // Function to extract foods from text
    const extractFromText = (text) => {
      if (!text) return;
      const lowerText = text.toLowerCase();
      
      foodKeywords.forEach(keyword => {
        if (lowerText.includes(keyword.toLowerCase())) {
          foodItems.add(keyword);
        }
      });
      
      // Also look for food patterns like "Include X" or "Choose X"
      const foodPatterns = [
        /include\s+([^,.\n]+)/gi,
        /choose\s+([^,.\n]+)/gi,
        /eat\s+([^,.\n]+)/gi,
        /consume\s+([^,.\n]+)/gi,
        /focus\s+on\s+([^,.\n]+)/gi
      ];
      
      foodPatterns.forEach(pattern => {
        const matches = text.match(pattern);
        if (matches) {
          matches.forEach(match => {
            foodKeywords.forEach(keyword => {
              if (match.toLowerCase().includes(keyword.toLowerCase())) {
                foodItems.add(keyword);
              }
            });
          });
        }
      });
    };
    
    // Extract from recommendations array
    recommendations.forEach(recommendation => {
      console.log('Processing recommendation:', recommendation.substring(0, 100) + '...');
      extractFromText(recommendation);
    });
    
    // Extract from meal plan suggestions
    console.log('Processing meal plan suggestions...');
    extractFromText(mealPlanSuggestions);
    
    // Extract from health insights
    healthInsights.forEach(insight => {
      extractFromText(insight.insight);
      insight.actionItems?.forEach(item => {
        extractFromText(item);
      });
    });
    
    // If still no foods found, add some defaults based on the meal plan structure
    if (foodItems.size === 0) {
      console.log('No foods extracted, adding defaults from meal plan structure');
      
      // Parse the basic meal structure from mealPlanSuggestions
      if (mealPlanSuggestions.includes('cereal')) foodItems.add('cereal');
      if (mealPlanSuggestions.includes('milk')) foodItems.add('milk');
      if (mealPlanSuggestions.includes('oatmeal')) foodItems.add('oatmeal');
      if (mealPlanSuggestions.includes('nuts')) foodItems.add('nuts');
      if (mealPlanSuggestions.includes('berries')) foodItems.add('berries');
      if (mealPlanSuggestions.includes('chicken')) foodItems.add('chicken');
      if (mealPlanSuggestions.includes('fish')) foodItems.add('fish');
      if (mealPlanSuggestions.includes('vegetables')) foodItems.add('vegetables');
      if (mealPlanSuggestions.includes('brown rice')) foodItems.add('brown rice');
      if (mealPlanSuggestions.includes('quinoa')) foodItems.add('quinoa');
      if (mealPlanSuggestions.includes('salad')) foodItems.add('salad');
      if (mealPlanSuggestions.includes('yogurt')) foodItems.add('yogurt');
    }
    
    const extractedArray = Array.from(foodItems);
    console.log('Final extracted foods:', extractedArray);
    
    return extractedArray;
  } catch (error) {
    console.error('Error extracting food recommendations:', error);
    return [];
  }
};

// Function to search for recipes
const searchRecipesForFood = async (foodItem, fatSecretClient, maxResults = 3) => {
  try {
    console.log(`Searching for recipes: ${foodItem}`);
    
    const recipeResults = await fatSecretClient.getFoodRecipes(foodItem, maxResults);
    
    if (recipeResults.foods && recipeResults.foods.length > 0) {
      const recipes = recipeResults.foods.map(foodItem => {
        const recipe = {
          id: foodItem.basicInfo.food_id,
          name: foodItem.basicInfo.food_name,
          description: foodItem.basicInfo.food_description,
          type: foodItem.basicInfo.food_type,
          url: foodItem.basicInfo.food_url
        };
        
        // Add nutrition information if available
        if (foodItem.nutritionalDetails && !foodItem.error) {
          recipe.nutrition = fatSecretClient.formatNutritionalInfo(foodItem.nutritionalDetails);
        } else {
          recipe.nutrition = null;
          recipe.nutritionError = foodItem.error || 'Nutrition data not available';
        }
        
        return recipe;
      });
      
      return {
        success: true,
        totalResults: recipes.length,
        recipes: recipes
      };
    } else {
      return {
        success: true,
        totalResults: 0,
        recipes: [],
        message: 'No recipes found'
      };
    }
  } catch (error) {
    console.error(`Error searching recipes for ${foodItem}:`, error);
    return {
      success: false,
      error: error.message,
      recipes: []
    };
  }
};

// Function to search for multiple foods with recipes
const searchMultipleFoodsWithRecipes = async (foodItems, fatSecretClient, maxResultsPerFood = 3, includeRecipes = true) => {
  const searchResults = {};
  const errors = [];
  
  for (const foodItem of foodItems) {
    try {
      console.log(`Searching for: ${foodItem}`);
      
      // Search for basic food information
      const searchResult = await fatSecretClient.searchFoods(foodItem, maxResultsPerFood);
      
      let foodData = {
        success: true,
        totalResults: 0,
        foods: [],
        recipes: null
      };
      
      if (searchResult.foods && searchResult.foods.food) {
        const foods = Array.isArray(searchResult.foods.food)
          ? searchResult.foods.food
          : [searchResult.foods.food];
        
        const cleanResults = foods.map(food => ({
          id: food.food_id,
          name: food.food_name,
          description: food.food_description,
          type: food.food_type,
          url: food.food_url
        }));
        
        foodData = {
          success: true,
          totalResults: cleanResults.length,
          foods: cleanResults,
          recipes: null
        };
      } else {
        foodData = {
          success: true,
          totalResults: 0,
          foods: [],
          message: 'No foods found',
          recipes: null
        };
      }
      
      // Search for recipes if requested
      if (includeRecipes) {
        await new Promise(resolve => setTimeout(resolve, 200)); // Delay between API calls
        const recipeData = await searchRecipesForFood(foodItem, fatSecretClient, maxResultsPerFood);
        foodData.recipes = recipeData;
      }
      
      searchResults[foodItem] = foodData;
      
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 300));
      
    } catch (error) {
      console.error(`Error searching for ${foodItem}:`, error);
      errors.push({ foodItem, error: error.message });
      searchResults[foodItem] = {
        success: false,
        error: error.message,
        foods: [],
        recipes: null
      };
    }
  }
  
  return { searchResults, errors };
};

// Backward compatibility function
const searchMultipleFoods = async (foodItems, fatSecretClient, maxResultsPerFood = 3) => {
  return searchMultipleFoodsWithRecipes(foodItems, fatSecretClient, maxResultsPerFood, false);
};

// Updated route handler with recipe integration
router.post("/v2/meal/generator", async (req, res) => {
  try {
    const { clerkId, duration = 7, healthGoals = [], searchFoods = false, includeRecipes = false } = req.body;
    
    if (!clerkId) {
      return res.status(400).json({ message: "Clerk ID is required" });
    }

    const userDetails = await prisma.user.findUnique({
      where: { clerkId },
      include: {
        healthProfile: true,
        badHabits: true,
        sleepPatterns: true,
        stressFactors: true,
        mentalHealth: true,
        HealthReport: true,
        mealPlan: true,
      },
    });

    if (!userDetails) {
      return sendErrorResponse(res, 404, "User not found");
    }

    const nutritionTarget = await generateNutritionPlan(userDetails);
    console.log("Nutrition Target:", nutritionTarget);

    let foodSearchResults = null;
    let extractedFoods = [];

    // If searchFoods flag is true, extract and search for foods
    if (searchFoods) {
      extractedFoods = extractFoodRecommendations(nutritionTarget);
      console.log("Extracted foods:", extractedFoods);

      if (extractedFoods.length > 0) {
        // Use the new function that includes recipes
        const { searchResults, errors } = await searchMultipleFoodsWithRecipes(
          extractedFoods, 
          fatSecretClient, 
          3, // maxResultsPerFood
          includeRecipes // whether to include recipes
        );
        
        foodSearchResults = {
          extractedFoods,
          searchResults,
          errors: errors.length > 0 ? errors : undefined,
          includeRecipes
        };
      }
    }

    return res.status(200).json({
      message: "Meal plan generated successfully",
      data: {
        nutritionTarget,
        ...(foodSearchResults && { foodSearch: foodSearchResults })
      },
    });

  } catch (error) {
    return sendErrorResponse(res, 500, "An error occurred while generating the meal plan", error);
  }
});

// Enhanced food search endpoint with recipe integration
router.post("/v2/meal/search-foods", async (req, res) => {
  try {
    const { nutritionTarget, maxResultsPerFood = 3, includeRecipes = true } = req.body;

    if (!nutritionTarget) {
      return res.status(400).json({ 
        message: "Nutrition target data is required",
        example: "Pass the nutritionTarget object from the meal generator response"
      });
    }

    console.log('Received nutrition target structure:', {
      hasData: !!nutritionTarget.data,
      hasNutritionTargets: !!(nutritionTarget.data?.nutritionTargets),
      hasRecommendations: !!(nutritionTarget.data?.nutritionTargets?.specificRecommendations),
      recommendationsLength: nutritionTarget.data?.nutritionTargets?.specificRecommendations?.length,
      hasMealPlan: !!(nutritionTarget.data?.mealPlanSuggestions),
      mealPlanLength: nutritionTarget.data?.mealPlanSuggestions?.length,
      includeRecipes
    });

    const extractedFoods = extractFoodRecommendations(nutritionTarget);
    
    if (extractedFoods.length === 0) {
      const debugInfo = {
        recommendationsFound: nutritionTarget.data?.nutritionTargets?.specificRecommendations?.length || 0,
        mealPlanFound: nutritionTarget.data?.mealPlanSuggestions ? 'yes' : 'no',
        sampleRecommendation: nutritionTarget.data?.nutritionTargets?.specificRecommendations?.[0]?.substring(0, 100)
      };
      
      return res.json({
        success: true,
        message: "No specific food recommendations found to search for",
        extractedFoods: [],
        searchResults: {},
        debugInfo
      });
    }

    // Use the enhanced search function that includes recipes
    const { searchResults, errors } = await searchMultipleFoodsWithRecipes(
      extractedFoods, 
      fatSecretClient, 
      maxResultsPerFood,
      includeRecipes
    );

    // Calculate summary statistics
    const summary = {
      totalFoodCategories: extractedFoods.length,
      successfulSearches: Object.values(searchResults).filter(r => r.success).length,
      failedSearches: errors.length,
      totalFoodsFound: Object.values(searchResults).reduce((sum, result) => 
        sum + (result.foods?.length || 0), 0),
      totalRecipesFound: includeRecipes ? Object.values(searchResults).reduce((sum, result) => 
        sum + (result.recipes?.totalResults || 0), 0) : 0
    };

    return res.json({
      success: true,
      message: `Found food data for ${Object.keys(searchResults).length} food categories`,
      extractedFoods,
      searchResults,
      errors: errors.length > 0 ? errors : undefined,
      summary,
      includeRecipes
    });

  } catch (error) {
    console.error('Food search error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to search for recommended foods',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Standalone recipe search endpoint
router.get("/v2/recipes/search", async (req, res) => {
  try {
    const { q: searchTerm, limit = 5 } = req.query;
    
    if (!searchTerm || searchTerm.trim().length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Search term is required. Please provide a "q" parameter.',
        example: '/api/recipes/search?q=chicken%20salad'
      });
    }
    
    // Limit recipe searches to fewer results since we're getting detailed info
    const maxResults = Math.min(Math.max(parseInt(limit) || 5, 1), 10);
    console.log(`Searching for recipes: "${searchTerm}" (limit: ${maxResults})`);
    
    // Use our comprehensive recipe search method
    const recipeResults = await fatSecretClient.getFoodRecipes(searchTerm, maxResults);
    
    if (recipeResults.foods && recipeResults.foods.length > 0) {
      // Transform the results into a clean, consistent format
      const recipes = recipeResults.foods.map(foodItem => {
        const recipe = {
          id: foodItem.basicInfo.food_id,
          name: foodItem.basicInfo.food_name,
          description: foodItem.basicInfo.food_description,
          type: foodItem.basicInfo.food_type,
          url: foodItem.basicInfo.food_url
        };
        
        // Add nutrition information if available
        if (foodItem.nutritionalDetails && !foodItem.error) {
          recipe.nutrition = fatSecretClient.formatNutritionalInfo(foodItem.nutritionalDetails);
        } else {
          recipe.nutrition = null;
          recipe.nutritionError = foodItem.error || 'Nutrition data not available';
        }
        
        return recipe;
      });
      
      res.json({
        success: true,
        searchTerm,
        totalResults: recipes.length,
        recipes: recipes
      });
    } else {
      res.json({
        success: true,
        searchTerm,
        totalResults: 0,
        recipes: [],
        message: 'No recipes found matching your search term'
      });
    }
  } catch (error) {
    console.error('Recipe search error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to search for recipes. Please try again later.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Helper function to get food details by ID (if needed)
router.get("/v2/foods/:foodId", async (req, res) => {
  try {
    const { foodId } = req.params;
    
    if (!foodId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Food ID is required'
      });
    }

    // Get detailed food information
    const foodDetails = await fatSecretClient.getFoodDetails(foodId);
    
    res.json({
      success: true,
      food: foodDetails
    });

  } catch (error) {
    console.error('Get food details error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get food details',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;