// Enhanced Nutrition Calculator with Gemini AI Integration and Water Intake - ES Modules Version
import { GoogleGenerativeAI } from '@google/generative-ai';

// Use environment variable for API key, fallback to hardcoded for now
const geminiApiKey = process.env.GEMINI_API_KEY || 'AIzaSyA-PQ45fXSE_WPXcmig-fDQ6O8ti8sEu98';

// Rate limiting and error tracking
let lastApiCall = 0;
let consecutiveErrors = 0;
const MIN_TIME_BETWEEN_CALLS = 2000; // 2 seconds
const MAX_CONSECUTIVE_ERRORS = 3;

/**
 * Generate AI-enhanced nutrition recommendations for a user
 * @param {Object} userDetails - Complete user profile including health data
 * @param {string} geminiApiKey - Your Google Gemini API key
 * @returns {Promise<Object>} Enhanced nutrition recommendations with AI insights
 */
export async function generateNutritionPlan(userDetails) {
  // Initialize Gemini AI

  const genAI = new GoogleGenerativeAI(geminiApiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  // Helper functions
  function calculateBMR(weight, height, age, gender) {
    if (gender === 'MALE') {
      return (10 * weight) + (6.25 * height) - (5 * age) + 5;
    } else {
      return (10 * weight) + (6.25 * height) - (5 * age) - 161;
    }
  }

  function calculateTDEE(bmr, activityLevel) {
    const activityMultipliers = {
      'SEDENTARY': 1.2,
      'LIGHTLY_ACTIVE': 1.375,
      'MODERATELY_ACTIVE': 1.55,
      'VERY_ACTIVE': 1.725,
      'EXTREMELY_ACTIVE': 1.9
    };
    return bmr * (activityMultipliers[activityLevel] || 1.55);
  }

  function calculateWaterIntake(userDetails) {
    const { healthProfile, badHabits, stressFactors } = userDetails;
    const { weight, activityLevel, medicalConditions } = healthProfile;

    // Base water requirement: 35ml per kg body weight (more accurate than 30ml)
    let baseWaterML = weight * 35;

    // Activity level adjustments
    const activityMultipliers = {
      'SEDENTARY': 1.0,
      'LIGHTLY_ACTIVE': 1.15,
      'MODERATELY_ACTIVE': 1.3,
      'VERY_ACTIVE': 1.5,
      'EXTREMELY_ACTIVE': 1.7
    };

    baseWaterML *= activityMultipliers[activityLevel] || 1.3;

    // Medical condition adjustments
    if (medicalConditions) {
      // Hypertension - increase water for better blood pressure management
      if (medicalConditions.some(condition =>
        condition.toLowerCase().includes('hypertension'))) {
        baseWaterML *= 1.2;
      }

      // Kidney conditions - increase water (unless contraindicated)
      if (medicalConditions.some(condition =>
        condition.toLowerCase().includes('kidney'))) {
        baseWaterML *= 1.25;
      }

      // Diabetes - increase water for better glucose management
      if (medicalConditions.some(condition =>
        condition.toLowerCase().includes('diabetes'))) {
        baseWaterML *= 1.15;
      }

      // Respiratory conditions - increase water for mucus thinning
      if (medicalConditions.some(condition =>
        condition.toLowerCase().includes('asthma') ||
        condition.toLowerCase().includes('respiratory'))) {
        baseWaterML *= 1.1;
      }
    }

    // Bad habits adjustments
    if (badHabits) {
      badHabits.forEach(habit => {
        if (habit.habitType.toLowerCase().includes('smoking')) {
          // Smoking increases dehydration
          baseWaterML *= 1.25;
        }
        if (habit.habitType.toLowerCase().includes('alcohol')) {
          // Alcohol is dehydrating
          baseWaterML *= 1.2;
        }
        if (habit.habitType.toLowerCase().includes('caffeine')) {
          // Excessive caffeine can be dehydrating
          baseWaterML *= 1.1;
        }
      });
    }

    // Stress factor adjustment
    if (stressFactors && stressFactors[0]?.stressLevel > 6) {
      // High stress increases water needs
      baseWaterML *= 1.1;
    }

    // Convert to liters and round to nearest 0.25L
    const waterLiters = Math.round((baseWaterML / 1000) * 4) / 4;

    // Minimum 2.5L, Maximum 5L for safety
    const finalWaterIntake = Math.max(2.5, Math.min(5.0, waterLiters));

    return {
      dailyWaterIntakeML: Math.round(finalWaterIntake * 1000),
      dailyWaterIntakeLiters: finalWaterIntake,
      dailyWaterIntakeCups: Math.round(finalWaterIntake * 4.2), // 1L = ~4.2 cups
      recommendations: generateWaterRecommendations(userDetails, finalWaterIntake)
    };
  }

  function generateWaterRecommendations(userDetails, waterIntakeLiters) {
    const recommendations = [];
    const { healthProfile, badHabits } = userDetails;

    // Basic timing recommendations
    recommendations.push("Start your day with 1-2 glasses of water upon waking");
    recommendations.push("Drink water 30 minutes before meals to aid digestion");
    recommendations.push("Sip water throughout the day rather than drinking large amounts at once");

    // Activity-specific recommendations
    if (healthProfile.activityLevel === 'VERY_ACTIVE' || healthProfile.activityLevel === 'EXTREMELY_ACTIVE') {
      recommendations.push("Drink 500ml of water 2 hours before exercise");
      recommendations.push("Consume 150-250ml every 15-20 minutes during exercise");
      recommendations.push("Rehydrate with 500-750ml for every pound lost during exercise");
    }

    // Medical condition specific recommendations
    if (healthProfile.medicalConditions?.some(condition =>
      condition.toLowerCase().includes('hypertension'))) {
      recommendations.push("Adequate hydration helps maintain healthy blood pressure");
      recommendations.push("Monitor urine color - aim for pale yellow");
    }

    if (healthProfile.medicalConditions?.some(condition =>
      condition.toLowerCase().includes('asthma'))) {
      recommendations.push("Stay well-hydrated to help thin mucus secretions");
      recommendations.push("Drink warm water if cold water triggers symptoms");
    }

    // Bad habit specific recommendations
    if (badHabits?.some(habit => habit.habitType.toLowerCase().includes('smoking'))) {
      recommendations.push("Increase water intake to help flush toxins from smoking");
      recommendations.push("Drink water instead of reaching for cigarettes when stressed");
    }

    // Quality recommendations
    recommendations.push("Choose filtered or bottled water when possible");
    recommendations.push("Add lemon, cucumber, or mint for variety without calories");
    recommendations.push("Set hourly reminders to maintain consistent hydration");

    return recommendations;
  }

  function generateHealthProfilePrompt(userDetails) {
    const { healthProfile, badHabits, sleepPatterns, stressFactors, HealthReport } = userDetails;
    const waterIntake = calculateWaterIntake(userDetails);

    return `As a clinical nutritionist and physician, provide precise nutritional recommendations for this patient:

PATIENT PROFILE:
- Name: ${userDetails.name}
- Age: ${healthProfile.age} years
- Gender: ${healthProfile.gender}
- Height: ${healthProfile.height} cm
- Weight: ${healthProfile.weight} kg
- BMI: ${(healthProfile.weight / Math.pow(healthProfile.height / 100, 2)).toFixed(1)}
- Activity Level: ${healthProfile.activityLevel}

MEDICAL CONDITIONS:
- Primary: ${healthProfile.medicalConditions?.join(', ') || 'None'}
- Allergies: ${healthProfile.allergies?.join(', ') || 'None'}
- Food Allergies: ${healthProfile.foodAllergies?.join(', ') || 'None'}
- Digestive Issues: ${healthProfile.digestiveIssues?.join(', ') || 'None'}

LIFESTYLE FACTORS:
- Bad Habits: ${badHabits?.map(h => `${h.habitType} (${h.frequency}, ${h.quantityPerOccasion} ${h.unit})`).join(', ') || 'None'}
- Sleep: ${sleepPatterns?.[0]?.averageHours || 8}h average, quality: ${sleepPatterns?.[0]?.sleepQuality || 'GOOD'}
- Stress Level: ${stressFactors?.[0]?.stressLevel || 5}/10 (${stressFactors?.[0]?.stressType || 'General'})

CALCULATED WATER NEEDS:
- Daily Water Target: ${waterIntake.dailyWaterIntakeLiters}L (${waterIntake.dailyWaterIntakeML}ml)
- This accounts for medical conditions, activity level, and lifestyle factors

CURRENT HEALTH CONCERNS:
${HealthReport?.areasForImprovement?.map(area => `- ${area}`).join('\n') || '- General health optimization'}

Please provide EXACT numerical values for:
1. Daily Calorie Target (consider weight management, medical conditions, and lifestyle)
2. Protein Target (grams) - considering muscle maintenance, medical conditions, and activity
3. Carbohydrate Target (grams) - optimized for energy needs and health conditions
4. Fat Intake Target (grams): Must prioritize heart-healthy fats (monounsaturated, polyunsaturated). Ensure not less than 20% of total calories and provide exact gram amount broken into saturated vs. unsaturated.
5. Fiber Target (grams) - for digestive health and cardiovascular benefits
6. Sodium Limit (mg) - considering any cardiovascular conditions
7. Potassium Target (mg) - essential for overall health
8. Magnesium Target (mg) - for cardiovascular and general health
9.Water Intake Target (liters): Please CONFIRM or ADJUST the calculated ${waterIntake.dailyWaterIntakeLiters} but ensure:
     a. It is greater than 4.5 liters
     b. Based on activity level, environment (e.g., hot/humid), and metabolic demands
     c. Provide justification (e.g., liters per kg body weight or per kcal burned)

CRITICAL CONSIDERATIONS:
- Address specific medical conditions through nutrition
- Support lifestyle improvements through balanced nutrition
- Consider digestive health optimization
- Account for stress management through stable blood sugar
- Ensure adequate hydration for all physiological processes

Provide response in this EXACT JSON format:
{
  "calories": number,
  "protein": number,
  "carbohydrates": number,
  "fat": number,
  "fiber": number,
  "sodium": number,
  "potassium": number,
  "magnesium": number,
  "waterIntakeLiters": number,
  "rationale": {
    "calories": "explanation",
    "macronutrients": "explanation",
    "micronutrients": "explanation",
    "hydration": "explanation for water intake recommendation",
    "medicalConsiderations": "explanation"
  },
  "specificRecommendations": [
    "recommendation 1",
    "recommendation 2"
  ]
}`;
  }

  async function getAINutritionTargets(userDetails) {
    try {
      // Check if API key is provided and valid format
      if (!geminiApiKey || geminiApiKey.length < 30 || geminiApiKey === 'YOUR_VALID_GEMINI_API_KEY_HERE') {
        console.log('Invalid or missing Gemini API key, using enhanced fallback calculations');
        return null;
      }

      // Check for too many consecutive errors
      if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
        console.log(`Skipping AI request due to ${consecutiveErrors} consecutive errors`);
        return null;
      }

      // Rate limiting - ensure minimum time between API calls
      const now = Date.now();
      if (now - lastApiCall < MIN_TIME_BETWEEN_CALLS) {
        const waitTime = MIN_TIME_BETWEEN_CALLS - (now - lastApiCall);
        console.log(`Rate limiting: waiting ${waitTime}ms before API call`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
      lastApiCall = Date.now();

      // Add timeout and retry logic
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('AI request timeout')), 15000)
      );

      const prompt = generateHealthProfilePrompt(userDetails);
      const aiPromise = model.generateContent(prompt);

      const result = await Promise.race([aiPromise, timeoutPromise]);
      const response = await result.response;
      const text = response.text();

      // More robust JSON extraction
      let aiRecommendations = null;
      try {
        // Try to find JSON in the response
        const jsonMatch = text.match(/\{[\s\S]*?\}/);
        if (jsonMatch) {
          aiRecommendations = JSON.parse(jsonMatch[0]);
        } else {
          // If no JSON found, try to extract from code blocks
          const codeBlockMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
          if (codeBlockMatch) {
            aiRecommendations = JSON.parse(codeBlockMatch[1]);
          }
        }
      } catch (parseError) {
        console.error('JSON parsing error:', parseError.message);
        throw new Error('Invalid JSON in AI response');
      }

      if (!aiRecommendations) {
        throw new Error('No valid JSON response from AI');
      }

      // Validate required fields
      const requiredFields = ['calories', 'protein', 'carbohydrates', 'fat'];
      for (const field of requiredFields) {
        if (!aiRecommendations[field] || isNaN(aiRecommendations[field])) {
          throw new Error(`Missing or invalid ${field} in AI response`);
        }
      }

      // If AI didn't provide water intake, use calculated value
      if (!aiRecommendations.waterIntakeLiters) {
        const waterIntake = calculateWaterIntake(userDetails);
        aiRecommendations.waterIntakeLiters = waterIntake.dailyWaterIntakeLiters;
      }

      console.log('AI recommendations generated successfully');
      // Reset consecutive errors on successful response
      consecutiveErrors = 0;
      return aiRecommendations;

    } catch (error) {
      consecutiveErrors++;
      console.error(`AI recommendation error (${consecutiveErrors} consecutive errors):`, error.message);

      // Check for specific error types
      if (error.message.includes('overloaded') || error.message.includes('503')) {
        console.log('Google Gemini API is overloaded - switching to comprehensive fallback meal plans');
      } else if (error.message.includes('timeout')) {
        console.log('AI request timeout - using comprehensive fallback meal plans');
      } else {
        console.log('AI error - using comprehensive fallback meal plans:', error.message);
      }

      return null; // Return null to trigger comprehensive fallback
    }
  }

  function getFallbackRecommendations(userDetails) {
    const { healthProfile } = userDetails;
    const bmr = calculateBMR(
      healthProfile.weight,
      healthProfile.height,
      healthProfile.age,
      healthProfile.gender
    );
    const tdee = calculateTDEE(bmr, healthProfile.activityLevel);
    const waterIntake = calculateWaterIntake(userDetails);

    // Enhanced calorie adjustment for medical conditions
    let calorieAdjustment = 1.0;

    // Check for hypertension or cardiovascular conditions
    if (healthProfile.medicalConditions?.some(condition =>
      condition.toLowerCase().includes('hypertension') ||
      condition.toLowerCase().includes('cardiovascular'))) {
      calorieAdjustment *= 0.95; // Slight reduction for cardiovascular health
    }

    // Check for diabetes
    if (healthProfile.medicalConditions?.some(condition =>
      condition.toLowerCase().includes('diabetes'))) {
      calorieAdjustment *= 0.90; // More conservative for diabetes management
    }

    // Check for respiratory conditions
    if (healthProfile.medicalConditions?.some(condition =>
      condition.toLowerCase().includes('asthma') ||
      condition.toLowerCase().includes('respiratory'))) {
      calorieAdjustment *= 0.98; // Slight adjustment for respiratory health
    }

    const targetCalories = Math.round(tdee * calorieAdjustment);

    // Enhanced protein calculation
    let proteinMultiplier = 1.6; // Base protein per kg
    if (healthProfile.activityLevel === 'VERY_ACTIVE' || healthProfile.activityLevel === 'EXTREMELY_ACTIVE') {
      proteinMultiplier = 2.0; // Higher for very active individuals
    }
    if (healthProfile.age > 65) {
      proteinMultiplier = Math.max(proteinMultiplier, 1.8); // Higher for older adults
    }

    // Enhanced micronutrient targets
    let sodiumLimit = 2300; // Default
    if (healthProfile.medicalConditions?.some(condition =>
      condition.toLowerCase().includes('hypertension'))) {
      sodiumLimit = 1500; // Strict limit for hypertension
    }

    let potassiumTarget = 4700; // Default
    if (healthProfile.medicalConditions?.some(condition =>
      condition.toLowerCase().includes('hypertension') ||
      condition.toLowerCase().includes('cardiovascular'))) {
      potassiumTarget = 5000; // Higher for cardiovascular health
    }

    let magnesiumTarget = healthProfile.gender === 'MALE' ? 420 : 320;
    if (healthProfile.medicalConditions?.some(condition =>
      condition.toLowerCase().includes('asthma') ||
      condition.toLowerCase().includes('respiratory'))) {
      magnesiumTarget += 50; // Increased for respiratory health
    }

    let fiberTarget = 35; // Default
    if (healthProfile.medicalConditions?.some(condition =>
      condition.toLowerCase().includes('diabetes'))) {
      fiberTarget = 45; // Higher for diabetes management
    }
    if (healthProfile.digestiveIssues?.length > 0) {
      fiberTarget = 40; // Higher for digestive health
    }

    return {
      calories: targetCalories,
      protein: Math.round(healthProfile.weight * proteinMultiplier),
      carbohydrates: Math.round(targetCalories * 0.45 / 4),
      fat: Math.round(targetCalories * 0.25 / 9),
      fiber: fiberTarget,
      sodium: sodiumLimit,
      potassium: potassiumTarget,
      magnesium: magnesiumTarget,
      waterIntakeLiters: waterIntake.dailyWaterIntakeLiters,
      rationale: {
        calories: `Calculated using Mifflin-St Jeor equation (BMR: ${Math.round(bmr)}, TDEE: ${Math.round(tdee)}) with medical condition adjustments`,
        macronutrients: `Protein: ${proteinMultiplier}g/kg body weight, Carbs: 45% of calories, Fat: 25% of calories - optimized for health conditions`,
        micronutrients: `Sodium: ${sodiumLimit}mg (${sodiumLimit === 1500 ? 'restricted for hypertension' : 'standard'}), Potassium: ${potassiumTarget}mg, Magnesium: ${magnesiumTarget}mg, Fiber: ${fiberTarget}g - tailored for medical conditions`,
        hydration: `${waterIntake.dailyWaterIntakeLiters}L calculated based on body weight (35ml/kg), activity level (${healthProfile.activityLevel}), medical conditions, and lifestyle factors`,
        medicalConsiderations: "Enhanced evidence-based approach considering specific medical conditions and individual health profile"
      },
      specificRecommendations: [
        "Focus on whole, unprocessed foods for optimal nutrition",
        `Maintain consistent hydration with ${waterIntake.dailyWaterIntakeLiters}L daily water intake`,
        "Monitor portion sizes and eating patterns for optimal health",
        healthProfile.medicalConditions?.includes('Hypertension') ? "Prioritize low-sodium, potassium-rich foods for blood pressure management" : "Include a variety of nutrient-dense foods",
        healthProfile.medicalConditions?.includes('Asthma') ? "Include anti-inflammatory foods (omega-3 rich fish, colorful vegetables)" : "Consider medical conditions in food choices",
        "Track hydration status through urine color (aim for pale yellow)"
      ]
    };
  }

  async function generateMealPlan(userDetails, nutritionTargets) {
    const waterIntake = calculateWaterIntake(userDetails);

    // Always try AI first if API key is available
    if (geminiApiKey && geminiApiKey.length >= 30 && geminiApiKey !== 'YOUR_VALID_GEMINI_API_KEY_HERE') {
      try {
        const mealPlanPrompt = `Based on these nutrition targets and health profile, create a detailed meal plan:

NUTRITION TARGETS:
- Calories: ${nutritionTargets.calories}
- Protein: ${nutritionTargets.protein}g
- Carbs: ${nutritionTargets.carbohydrates}g  
- Fat: ${nutritionTargets.fat}g
- Fiber: ${nutritionTargets.fiber}g
- Sodium: <${nutritionTargets.sodium}mg
- Potassium: ${nutritionTargets.potassium}mg
- Water: ${nutritionTargets.waterIntakeLiters || waterIntake.dailyWaterIntakeLiters}L daily

MEDICAL CONDITIONS: ${userDetails.healthProfile.medicalConditions?.join(', ') || 'None'}
DIETARY RESTRICTIONS: ${userDetails.healthProfile.foodAllergies?.join(', ') || 'None'}

Create a comprehensive meal plan with:
1. Specific recipes for breakfast, lunch, dinner, and 2 snacks
2. Exact ingredients and portions
3. Preparation instructions
4. Nutritional benefits of each meal
5. Hydration schedule throughout the day
6. Special considerations for medical conditions
7. Weekly meal rotation suggestions

Format as detailed JSON with recipes, ingredients, and instructions.`;

        // Add timeout for AI request
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('AI meal plan timeout')), 20000)
        );

        const aiPromise = model.generateContent(mealPlanPrompt);
        const result = await Promise.race([aiPromise, timeoutPromise]);
        const response = await result.response;
        const text = response.text();

        console.log('AI meal plan generated successfully');
        return {
          source: 'AI_GENERATED',
          content: text,
          timestamp: new Date().toISOString()
        };

      } catch (error) {
        console.error('AI meal plan generation error:', error.message);
        console.log('Falling back to comprehensive structured meal plan');
      }
    }

    // Fallback to comprehensive structured meal plan
    console.log('Using comprehensive structured meal plan with detailed recipes');
    const comprehensivePlan = getComprehensiveMealPlan(nutritionTargets, userDetails);

    return {
      source: 'STRUCTURED_RECIPES',
      content: comprehensivePlan,
      timestamp: new Date().toISOString()
    };
  }

  function getComprehensiveMealPlan(nutritionTargets, userDetails) {
    const waterIntake = calculateWaterIntake(userDetails);
    const { healthProfile, badHabits } = userDetails;
    const medicalConditions = healthProfile.medicalConditions || [];
    const foodAllergies = healthProfile.foodAllergies || [];

    // Calculate meal calorie distribution
    const breakfastCal = Math.round(nutritionTargets.calories * 0.25);
    const lunchCal = Math.round(nutritionTargets.calories * 0.35);
    const dinnerCal = Math.round(nutritionTargets.calories * 0.30);
    const snackCal = Math.round(nutritionTargets.calories * 0.10);

    // Determine dietary modifications based on health conditions
    const isHypertensive = medicalConditions.some(condition => condition.toLowerCase().includes('hypertension'));
    const isDiabetic = medicalConditions.some(condition => condition.toLowerCase().includes('diabetes'));
    const hasAsthma = medicalConditions.some(condition => condition.toLowerCase().includes('asthma'));
    const hasDairyAllergy = foodAllergies.some(allergy => allergy.toLowerCase().includes('dairy') || allergy.toLowerCase().includes('milk'));
    const hasNutAllergy = foodAllergies.some(allergy => allergy.toLowerCase().includes('nut') || allergy.toLowerCase().includes('peanut'));

    return {
      hydrationSchedule: {
        wakeUp: "1-2 glasses (500ml) of water immediately upon waking",
        preBreakfast: "1 glass (250ml) 30 minutes before breakfast",
        midMorning: "1-2 glasses (250-500ml) between breakfast and lunch",
        preLunch: "1 glass (250ml) 30 minutes before lunch",
        afternoon: "2-3 glasses (500-750ml) throughout afternoon",
        preDinner: "1 glass (250ml) 30 minutes before dinner",
        evening: "1-2 glasses (250-500ml), stop 2 hours before bed",
        total: `${waterIntake.dailyWaterIntakeLiters}L (${waterIntake.dailyWaterIntakeML}ml) daily`,
        tips: [
          "Add lemon slices for flavor and vitamin C",
          "Monitor urine color - aim for pale yellow",
          "Increase intake during exercise or hot weather",
          "Set hourly reminders to maintain consistency"
        ]
      },

      breakfast: {
        targetCalories: breakfastCal,
        options: [
          {
            name: "Heart-Healthy Oatmeal Bowl",
            calories: breakfastCal,
            protein: Math.round(nutritionTargets.protein * 0.25),
            carbs: Math.round(nutritionTargets.carbohydrates * 0.30),
            fat: Math.round(nutritionTargets.fat * 0.20),
            ingredients: [
              "1/2 cup rolled oats",
              hasDairyAllergy ? "1 cup almond milk" : "1 cup low-fat milk",
              "1 medium banana, sliced",
              hasNutAllergy ? "2 tbsp sunflower seeds" : "2 tbsp chopped walnuts",
              "1 tbsp ground flaxseed",
              "1/2 cup fresh berries",
              "1 tsp honey (optional)",
              "Cinnamon to taste"
            ],
            preparation: [
              "Combine oats and milk in a pot, bring to boil",
              "Reduce heat and simmer for 5 minutes, stirring occasionally",
              "Add banana slices and cinnamon",
              "Top with berries, nuts/seeds, and flaxseed",
              "Drizzle with honey if desired"
            ],
            healthBenefits: [
              "High fiber supports digestive health",
              "Omega-3 from flaxseed reduces inflammation",
              "Potassium from banana supports heart health",
              isHypertensive ? "Low sodium, high potassium for blood pressure" : "Sustained energy release"
            ],
            prepTime: "10 minutes",
            modifications: {
              diabetic: "Use steel-cut oats, limit honey, add extra cinnamon",
              hypertensive: "Use unsalted nuts, no added salt",
              asthma: "Rich in magnesium and antioxidants"
            }
          },
          {
            name: "Protein-Rich Scrambled Eggs",
            calories: breakfastCal,
            protein: Math.round(nutritionTargets.protein * 0.30),
            carbs: Math.round(nutritionTargets.carbohydrates * 0.25),
            fat: Math.round(nutritionTargets.fat * 0.25),
            ingredients: [
              "2 whole eggs + 1 egg white",
              "2 slices whole grain bread",
              "1/2 avocado, sliced",
              "1/4 cup spinach leaves",
              "1/4 cup diced tomatoes",
              "1 tsp olive oil",
              "Black pepper to taste",
              "1/4 cup low-sodium cheese (optional)"
            ],
            preparation: [
              "Heat olive oil in non-stick pan over medium heat",
              "Add spinach and tomatoes, sauté for 2 minutes",
              "Beat eggs and pour into pan",
              "Scramble gently, adding cheese if using",
              "Toast bread and serve with avocado slices"
            ],
            healthBenefits: [
              "Complete protein supports muscle maintenance",
              "Healthy fats from avocado and olive oil",
              "Folate and iron from spinach",
              "Fiber from whole grain bread"
            ],
            prepTime: "8 minutes"
          }
        ]
      },

      lunch: {
        targetCalories: lunchCal,
        options: [
          {
            name: "Mediterranean Quinoa Bowl",
            calories: lunchCal,
            protein: Math.round(nutritionTargets.protein * 0.35),
            carbs: Math.round(nutritionTargets.carbohydrates * 0.35),
            fat: Math.round(nutritionTargets.fat * 0.30),
            ingredients: [
              "3/4 cup cooked quinoa",
              "4 oz grilled chicken breast or chickpeas",
              "2 cups mixed greens (spinach, arugula)",
              "1/2 cucumber, diced",
              "1/4 cup cherry tomatoes, halved",
              "1/4 red onion, thinly sliced",
              "2 tbsp olive oil",
              "1 tbsp lemon juice",
              "1/4 cup crumbled feta cheese (if no dairy allergy)",
              "2 tbsp kalamata olives",
              "Fresh herbs (parsley, mint)"
            ],
            preparation: [
              "Cook quinoa according to package directions, let cool",
              "Grill chicken breast with herbs and lemon",
              "Combine greens, cucumber, tomatoes, and onion",
              "Whisk olive oil, lemon juice, salt, and pepper",
              "Assemble bowl with quinoa, protein, vegetables",
              "Top with feta, olives, and dressing"
            ],
            healthBenefits: [
              "Complete protein from quinoa and chicken",
              "Anti-inflammatory omega-3s from olive oil",
              "High potassium from vegetables",
              "Antioxidants from colorful vegetables"
            ],
            prepTime: "20 minutes"
          },
          {
            name: "Salmon and Sweet Potato Power Bowl",
            calories: lunchCal,
            protein: Math.round(nutritionTargets.protein * 0.40),
            carbs: Math.round(nutritionTargets.carbohydrates * 0.30),
            fat: Math.round(nutritionTargets.fat * 0.35),
            ingredients: [
              "5 oz baked salmon fillet",
              "1 medium roasted sweet potato",
              "2 cups steamed broccoli",
              "1/4 cup brown rice",
              "1 tbsp tahini",
              "1 tsp lemon juice",
              "1 tsp honey",
              "1/4 avocado, sliced",
              "Sesame seeds for garnish"
            ],
            preparation: [
              "Bake salmon at 400°F for 12-15 minutes",
              "Roast sweet potato at 425°F for 25 minutes",
              "Steam broccoli until tender",
              "Cook brown rice according to package",
              "Mix tahini, lemon juice, and honey for dressing",
              "Assemble bowl and drizzle with dressing"
            ],
            healthBenefits: [
              "Omega-3 fatty acids support heart and brain health",
              "Complex carbs provide sustained energy",
              "Beta-carotene from sweet potato",
              "Fiber supports digestive health"
            ],
            prepTime: "30 minutes"
          }
        ]
      },

      dinner: {
        targetCalories: dinnerCal,
        options: [
          {
            name: "Herb-Crusted Chicken with Roasted Vegetables",
            calories: dinnerCal,
            protein: Math.round(nutritionTargets.protein * 0.35),
            carbs: Math.round(nutritionTargets.carbohydrates * 0.25),
            fat: Math.round(nutritionTargets.fat * 0.30),
            ingredients: [
              "5 oz chicken breast",
              "2 tbsp mixed herbs (rosemary, thyme, oregano)",
              "1 cup Brussels sprouts, halved",
              "1 cup carrots, chopped",
              "1/2 cup quinoa",
              "2 tbsp olive oil",
              "2 cloves garlic, minced",
              "1 lemon, juiced",
              "Black pepper and herbs to taste"
            ],
            preparation: [
              "Preheat oven to 425°F",
              "Season chicken with herbs, garlic, and lemon",
              "Toss vegetables with olive oil and seasoning",
              "Roast chicken and vegetables for 20-25 minutes",
              "Cook quinoa according to package directions",
              "Let chicken rest 5 minutes before slicing"
            ],
            healthBenefits: [
              "Lean protein supports muscle health",
              "Antioxidants from colorful vegetables",
              "Fiber from quinoa and vegetables",
              "Anti-inflammatory herbs"
            ],
            prepTime: "35 minutes"
          },
          {
            name: "Baked Cod with Lemon and Herbs",
            calories: dinnerCal,
            protein: Math.round(nutritionTargets.protein * 0.40),
            carbs: Math.round(nutritionTargets.carbohydrates * 0.20),
            fat: Math.round(nutritionTargets.fat * 0.25),
            ingredients: [
              "6 oz cod fillet",
              "1 cup steamed asparagus",
              "1/2 cup brown rice",
              "1 tbsp olive oil",
              "1 lemon (zested and juiced)",
              "2 tbsp fresh dill",
              "1 clove garlic, minced",
              "1/4 cup cherry tomatoes"
            ],
            preparation: [
              "Preheat oven to 400°F",
              "Place cod in baking dish with lemon juice",
              "Top with herbs, garlic, and olive oil",
              "Bake for 12-15 minutes until flaky",
              "Steam asparagus until tender-crisp",
              "Serve over brown rice with vegetables"
            ],
            healthBenefits: [
              "High-quality protein with minimal saturated fat",
              "Omega-3 fatty acids support heart health",
              "Low sodium, ideal for blood pressure management",
              "Rich in B vitamins and selenium"
            ],
            prepTime: "25 minutes"
          }
        ]
      },

      snacks: {
        targetCalories: snackCal,
        options: [
          {
            name: "Greek Yogurt Parfait",
            calories: Math.round(snackCal * 0.6),
            ingredients: [
              hasDairyAllergy ? "3/4 cup coconut yogurt" : "3/4 cup plain Greek yogurt",
              "1/4 cup fresh berries",
              hasNutAllergy ? "1 tbsp pumpkin seeds" : "1 tbsp chopped almonds",
              "1 tsp honey",
              "Cinnamon to taste"
            ],
            preparation: [
              "Layer yogurt with berries in a glass",
              "Top with nuts/seeds and honey",
              "Sprinkle with cinnamon"
            ],
            healthBenefits: [
              "Probiotics support digestive health",
              "High protein for satiety",
              "Antioxidants from berries"
            ]
          },
          {
            name: "Hummus and Veggie Plate",
            calories: Math.round(snackCal * 0.4),
            ingredients: [
              "3 tbsp hummus",
              "1 cup mixed vegetables (carrots, bell peppers, cucumber)",
              "5 whole grain crackers"
            ],
            preparation: [
              "Wash and cut vegetables into sticks",
              "Serve with hummus and crackers"
            ],
            healthBenefits: [
              "Plant-based protein from chickpeas",
              "Fiber supports digestive health",
              "Complex carbohydrates for sustained energy"
            ]
          }
        ]
      },

      weeklyMealPlan: {
        structure: "Rotate between meal options throughout the week for variety",
        shoppingList: generateShoppingList(nutritionTargets, userDetails),
        mealPrepTips: [
          "Cook quinoa and brown rice in batches on Sunday",
          "Pre-cut vegetables for easy assembly",
          "Marinate proteins the night before",
          "Prepare overnight oats for quick breakfasts"
        ]
      },

      nutritionalNotes: {
        dailyTargets: {
          calories: nutritionTargets.calories,
          protein: `${nutritionTargets.protein}g`,
          carbohydrates: `${nutritionTargets.carbohydrates}g`,
          fat: `${nutritionTargets.fat}g`,
          fiber: `${nutritionTargets.fiber}g`,
          water: `${waterIntake.dailyWaterIntakeLiters}L`
        },
        specialConsiderations: generateSpecialConsiderations(userDetails, isHypertensive, isDiabetic, hasAsthma)
      }
    };
  }

  function generateShoppingList(nutritionTargets, userDetails) {
    const { foodAllergies } = userDetails.healthProfile;
    const hasDairyAllergy = foodAllergies?.some(allergy => allergy.toLowerCase().includes('dairy'));
    const hasNutAllergy = foodAllergies?.some(allergy => allergy.toLowerCase().includes('nut'));

    return {
      proteins: [
        "Chicken breast (organic, free-range)",
        "Wild-caught salmon fillets",
        "Cod or other white fish",
        "Eggs (pasture-raised)",
        "Plain Greek yogurt" + (hasDairyAllergy ? " (dairy-free alternative)" : ""),
        "Chickpeas (canned, low-sodium)"
      ],
      grains: [
        "Quinoa",
        "Brown rice",
        "Rolled oats (steel-cut for diabetics)",
        "Whole grain bread (low-sodium)",
        "Whole grain crackers"
      ],
      vegetables: [
        "Mixed salad greens",
        "Spinach",
        "Broccoli",
        "Brussels sprouts",
        "Carrots",
        "Sweet potatoes",
        "Asparagus",
        "Cherry tomatoes",
        "Cucumber",
        "Bell peppers"
      ],
      fruits: [
        "Bananas",
        "Mixed berries (blueberries, strawberries)",
        "Lemons",
        "Avocados"
      ],
      pantryEssentials: [
        "Extra virgin olive oil",
        "Tahini",
        "Hummus",
        "Low-sodium vegetable broth",
        "Fresh herbs (dill, parsley, cilantro)",
        "Spices (cinnamon, black pepper, garlic powder)",
        "Nuts and seeds" + (hasNutAllergy ? " (seed alternatives only)" : ""),
        "Ground flaxseed"
      ]
    };
  }

  function generateSpecialConsiderations(userDetails, isHypertensive, isDiabetic, hasAsthma) {
    const considerations = [];

    if (isHypertensive) {
      considerations.push({
        condition: "Hypertension",
        recommendations: [
          "Limit sodium to 1500mg daily",
          "Emphasize potassium-rich foods (bananas, spinach, sweet potatoes)",
          "Choose fresh herbs instead of salt for flavoring",
          "Monitor blood pressure regularly",
          "Maintain consistent hydration"
        ]
      });
    }

    if (isDiabetic) {
      considerations.push({
        condition: "Diabetes",
        recommendations: [
          "Choose complex carbohydrates over simple sugars",
          "Include protein with each meal to stabilize blood sugar",
          "Monitor portion sizes carefully",
          "Consider meal timing and consistency",
          "Increase fiber intake to 45g daily"
        ]
      });
    }

    if (hasAsthma) {
      considerations.push({
        condition: "Asthma",
        recommendations: [
          "Include anti-inflammatory foods (omega-3 rich fish)",
          "Ensure adequate magnesium intake",
          "Stay well-hydrated to thin mucus secretions",
          "Avoid potential food triggers if known",
          "Include colorful fruits and vegetables for antioxidants"
        ]
      });
    }

    considerations.push({
      condition: "General Health",
      recommendations: [
        "Eat meals at consistent times",
        "Chew food thoroughly and eat mindfully",
        "Include a variety of colorful foods",
        "Stay hydrated throughout the day",
        "Listen to your body's hunger and fullness cues"
      ]
    });

    return considerations;
  }

  function generateHealthInsights(userDetails, aiRecommendations) {
    const insights = [];
    const medicalConditions = userDetails.healthProfile.medicalConditions || [];
    const waterIntake = calculateWaterIntake(userDetails);

    // Hydration insights
    insights.push({
      category: 'Hydration Health',
      priority: 'HIGH',
      insight: `Optimal daily water intake: ${waterIntake.dailyWaterIntakeLiters}L (${waterIntake.dailyWaterIntakeML}ml). This is calculated based on your body weight, activity level, medical conditions, and lifestyle factors.`,
      actionItems: waterIntake.recommendations.slice(0, 3) // Top 3 recommendations
    });

    // Cardiovascular health insights
    if (medicalConditions.some(condition =>
      condition.toLowerCase().includes('hypertension') ||
      condition.toLowerCase().includes('cardiovascular'))) {
      insights.push({
        category: 'Cardiovascular Health',
        priority: 'HIGH',
        insight: `Sodium restricted to ${aiRecommendations.sodium}mg/day. Potassium increased to ${aiRecommendations.potassium}mg for optimal cardiovascular health. Adequate hydration supports healthy blood pressure.`,
        actionItems: [
          'Monitor blood pressure regularly',
          'Track sodium intake carefully',
          'Include potassium-rich foods (bananas, spinach, sweet potatoes)',
          'Maintain consistent daily water intake'
        ]
      });
    }

    // Respiratory health insights
    if (medicalConditions.some(condition =>
      condition.toLowerCase().includes('asthma') ||
      condition.toLowerCase().includes('respiratory'))) {
      insights.push({
        category: 'Respiratory Health',
        priority: 'HIGH',
        insight: 'Anti-inflammatory nutrition approach with adequate hydration to support respiratory function and thin mucus secretions.',
        actionItems: [
          'Include omega-3 rich foods (fish, walnuts, flaxseeds)',
          'Avoid potential food triggers',
          'Maintain adequate magnesium intake',
          'Stay well-hydrated to help thin mucus'
        ]
      });
    }

    // General health insights
    insights.push({
      category: 'General Health',
      priority: 'MEDIUM',
      insight: 'Balanced nutrition plan with optimized hydration to support overall wellness and energy levels.',
      actionItems: [
        'Eat regular, balanced meals',
        `Drink ${waterIntake.dailyWaterIntakeLiters}L of water daily`,
        'Include a variety of colorful fruits and vegetables',
        'Monitor urine color as hydration indicator'
      ]
    });

    return insights;
  }

  function getMonitoringRecommendations(userDetails) {
    const recommendations = [];
    const waterIntake = calculateWaterIntake(userDetails);

    recommendations.push({
      metric: 'Weight',
      frequency: 'Weekly',
      target: 'Maintain healthy BMI range',
      notes: 'Same day/time weekly, track trends not daily fluctuations'
    });

    recommendations.push({
      metric: 'Hydration Status',
      frequency: 'Daily',
      target: `${waterIntake.dailyWaterIntakeLiters}L daily, pale yellow urine`,
      notes: 'Track water intake and monitor urine color throughout the day'
    });

    // Add specific monitoring based on conditions
    if (userDetails.healthProfile.medicalConditions?.includes('Hypertension')) {
      recommendations.push({
        metric: 'Blood Pressure',
        frequency: 'Daily',
        target: '<120/80 mmHg',
        notes: 'Monitor at same time daily, track trends. Proper hydration supports healthy BP'
      });
    }

    if (userDetails.healthProfile.medicalConditions?.includes('Asthma')) {
      recommendations.push({
        metric: 'Peak Flow (if applicable)',
        frequency: 'As directed by physician',
        target: 'Personal best range',
        notes: 'Record any triggers or symptoms. Note hydration impact on respiratory health'
      });
    }

    return recommendations;
  }

  // Main processing logic
  try {
    console.log('Processing nutrition data for:', userDetails.name);

    // Calculate water intake first
    const waterIntakeData = calculateWaterIntake(userDetails);

    // Try AI-powered nutrition targets first, fallback to enhanced calculations
    let aiRecommendations = await getAINutritionTargets(userDetails);
    let nutritionMethod = 'AI_ENHANCED';

    if (!aiRecommendations) {
      console.log('Using enhanced calculation-based recommendations');
      aiRecommendations = getFallbackRecommendations(userDetails);
      nutritionMethod = 'EVIDENCE_BASED_CALCULATION';
    }

    // Calculate metabolic data
    const bmr = calculateBMR(
      userDetails.healthProfile.weight,
      userDetails.healthProfile.height,
      userDetails.healthProfile.age,
      userDetails.healthProfile.gender
    );

    const tdee = calculateTDEE(bmr, userDetails.healthProfile.activityLevel);

    // Generate comprehensive meal plan (AI or structured recipes)
    const mealPlanResult = await generateMealPlan(userDetails, aiRecommendations);

    // Ensure we have meal plan content regardless of source
    const mealPlanContent = mealPlanResult.content || mealPlanResult;

    // Return comprehensive results with enhanced meal plans
    const responseMessage = nutritionMethod === 'AI_ENHANCED' ?
      "AI-enhanced nutrition plan with comprehensive meal recipes generated successfully" :
      "Evidence-based nutrition plan with detailed meal recipes generated successfully";

    return {
      success: true,
      message: responseMessage,
      data: {
        userProfile: {
          name: userDetails.name,
          email: userDetails.email
        },
        nutritionTargets: aiRecommendations,
        hydrationPlan: waterIntakeData,
        metabolicData: {
          bmr: Math.round(bmr),
          tdee: Math.round(tdee),
          bmi: parseFloat((userDetails.healthProfile.weight /
            Math.pow(userDetails.healthProfile.height / 100, 2)).toFixed(1))
        },
        mealPlan: {
          source: mealPlanResult.source || 'BASIC_PLAN',
          content: mealPlanContent,
          generatedAt: mealPlanResult.timestamp || new Date().toISOString(),
          isStructured: mealPlanResult.source === 'STRUCTURED_RECIPES'
        },
        // Keep legacy field for backward compatibility
        mealPlanSuggestions: typeof mealPlanContent === 'string' ? mealPlanContent : JSON.stringify(mealPlanContent, null, 2),
        healthInsights: generateHealthInsights(userDetails, aiRecommendations),
        monitoringRecommendations: getMonitoringRecommendations(userDetails),
        nutritionMethod,
        planQuality: {
          hasDetailedRecipes: mealPlanResult.source === 'STRUCTURED_RECIPES',
          includesIngredients: true,
          includesPreparationSteps: true,
          includesNutritionalInfo: true,
          includesHealthConsiderations: true,
          includesShoppingList: mealPlanResult.source === 'STRUCTURED_RECIPES'
        },
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('Processing error:', error);

    // Even in case of errors, try to provide basic recommendations
    try {
      console.log('Attempting emergency fallback nutrition plan generation');
      const emergencyRecommendations = getFallbackRecommendations(userDetails);
      const emergencyWaterIntake = calculateWaterIntake(userDetails);
      const emergencyMealPlan = getComprehensiveMealPlan(emergencyRecommendations, userDetails);

      return {
        success: true,
        message: "Emergency nutrition plan generated using evidence-based calculations",
        data: {
          userProfile: {
            name: userDetails.name,
            email: userDetails.email
          },
          nutritionTargets: emergencyRecommendations,
          hydrationPlan: emergencyWaterIntake,
          mealPlan: {
            source: 'EMERGENCY_STRUCTURED_RECIPES',
            content: emergencyMealPlan,
            generatedAt: new Date().toISOString(),
            isStructured: true
          },
          mealPlanSuggestions: JSON.stringify(emergencyMealPlan, null, 2),
          nutritionMethod: 'EMERGENCY_FALLBACK',
          planQuality: {
            hasDetailedRecipes: true,
            includesIngredients: true,
            includesPreparationSteps: true,
            includesNutritionalInfo: true,
            includesHealthConsiderations: true,
            includesShoppingList: true
          },
          timestamp: new Date().toISOString(),
          note: "Generated during error recovery - all calculations are evidence-based"
        }
      };
    } catch (emergencyError) {
      console.error('Emergency fallback also failed:', emergencyError);
      return {
        success: false,
        message: `Failed to process nutrition data: ${error.message}`,
        error: error.message,
        emergencyError: emergencyError.message
      };
    }
  }
}

