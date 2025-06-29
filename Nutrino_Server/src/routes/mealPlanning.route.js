import { Router } from "express";
import { z } from "zod";
import geminiAI from "../lib/AI.js";
import prisma from "../lib/db.js";

const router = Router();

// Input validation schemas
const generateMealPlanSchema = z.object({
  clerkId: z.string().min(1, "Clerk ID is required"),
  duration: z.number().int().min(1).max(30).default(7),
  forceRegenerate: z.boolean().optional(),
});

const refreshMealSchema = z.object({
  mealId: z.number().int().positive("Meal ID must be a positive integer"),
});

const refreshMealPlanSchema = z.object({
  clerkId: z.string().min(1, "Clerk ID is required").optional(),
  mealPlanId: z.number().int().positive("Meal Plan ID must be a positive integer").optional(),
}).refine(data => data.clerkId || data.mealPlanId, {
  message: "Either clerkId or mealPlanId is required",
});

const getMealPlanSchema = z.object({
  clerkId: z.string().min(1, "Clerk ID is required"),
});

const getMealPlanDaySchema = z.object({
  clerkId: z.string().min(1, "Clerk ID is required"),
  day: z.number().int().positive("Day must be a positive integer"),
});

// Helper function for consistent error responses
const sendErrorResponse = (res, status, message, error = null) => {
  console.error(message, error || '');
  return res.status(status).json({ message, error: error?.message });
};


router.post('/mealplan/generate', async (req, res) => {
  try {

    const { clerkId, duration = 7, forceRegenerate = false, cuisinePreferences = [], healthGoals = [] } = req.body;

    const userDetails = await prisma.user.findUnique({
      where: { clerkId },
      include: {
        healthProfile: true,
        badHabits: true,
        sleepPatterns: true,
        stressFactors: true,
        mentalHealth: true,
        healthReport: true,
        mealPlan: true,
      },
    });

    console.log(userDetails);



    if (!userDetails) {
      return sendErrorResponse(res, 404, "User not found");
    }


    const hasRecentMealPlan = userDetails.mealPlan &&
      (new Date() - new Date(userDetails.mealPlan.generatedAt)) / (1000 * 60 * 60 * 24) < 14;

    if (hasRecentMealPlan && !forceRegenerate) {
      const completeMealPlan = await prisma.mealPlan.findUnique({
        where: { userId: userDetails.id },
        include: {
          dailyPlans: {
            include: { meals: true },
            orderBy: { day: 'asc' },
          },
        },
      });

      // Parse original plan object safely
      let originalPlanObject = {};
      if (completeMealPlan?.originalPlanText) {
        try {
          originalPlanObject = JSON.parse(completeMealPlan.originalPlanText);
        } catch (error) {
          console.error('Error parsing originalPlanText:', error);
        }
      }

      // Format the date for each day
      const startDate = new Date(completeMealPlan.startDate);

      const responseData = {
        id: completeMealPlan.id,
        startDate: completeMealPlan.startDate,
        endDate: completeMealPlan.endDate,
        calorieTarget: completeMealPlan.calorieTarget,
        proteinTarget: completeMealPlan.proteinTarget,
        carbTarget: completeMealPlan.carbTarget,
        fatTarget: completeMealPlan.fatTarget,
        dailyPlans: completeMealPlan.dailyPlans.map((plan, index) => {
          // Calculate the date for this day
          const currentDate = new Date(startDate);
          currentDate.setDate(startDate.getDate() + index);

          // Format the date as "Day X - Weekday, Month Day, Year"
          const dayName = `Day ${plan.day} - ${currentDate.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric'
          })}`;

          return {
            day: plan.day,
            dayName: dayName,
            dayDate: currentDate,
            totalCalories: plan.totalCalories,
            totalProtein: plan.totalProtein,
            totalCarbs: plan.totalCarbs,
            totalFat: plan.totalFat,
            waterIntake: plan.waterIntake,
            meals: plan.meals.map(meal => ({
              mealType: meal.mealType,
              name: meal.name,
              description: meal.description,
              calories: meal.calories,
              protein: meal.protein,
              carbs: meal.carbs,
              fat: meal.fat,
              ingredients: meal.ingredients,
              preparationSteps: meal.preparationSteps,
              preparationTime: meal.preparationTime,
              // Improved health benefits formatting
              healthBenefits: extractHealthBenefits(meal.healthBenefits, meal.ingredients),
            })),
          };
        }),
        originalPlanObject,
      };

      return res.status(200).json({
        message: "Retrieved existing meal plan",
        data: responseData,
      });
    }

    // Enhanced nutrition calculation based on comprehensive health profile
    const nutritionTargets = calculateNutritionTargets(userDetails);
    const {
      calorieTarget,
      proteinTarget,
      carbTarget,
      fatTarget,
      bmi,
      tdee
    } = nutritionTargets;

    // Extract dietary restrictions and preferences
    const dietaryRestrictions = [
      ...(userDetails.healthProfile?.foodAllergies || []),
      ...(userDetails.healthProfile?.dietaryPreferences || []),
    ];

    // Extract medical conditions and health issues
    const medicalConditions = userDetails.healthProfile?.medicalConditions || [];
    const badHabits = userDetails.badHabits.map(habit => habit.specificHabit);
    const sleepIssues = userDetails.sleepPatterns?.sleepIssues || [];
    const stressIssues = userDetails.stressFactors.map(factor => factor.stressType);
    const mentalHealthIssues = userDetails.mentalHealth?.diagnosedIssues || [];

    // Compile health insights from healthReport
    const healthInsights = compileHealthInsights(userDetails);

    // Get personalized recommendations based on user's health profile
    const healthRecommendations = generateHealthRecommendations({
      userDetails,
      medicalConditions,
      badHabits,
      sleepIssues,
      stressIssues,
      mentalHealthIssues,
      bmi,
      dietaryRestrictions,
      healthInsights
    });

    // Generate meal plan with AI - with a timeout to prevent long waits
    const textPrompt = generateAIPrompt({
      user: userDetails,
      duration,
      nutritionTargets,
      healthRecommendations,
      dietaryRestrictions,
      cuisinePreferences,
      healthGoals
    });

    let originalPlanText = '';
    let originalPlanObject = {
      title: `${userDetails.name}'s ${duration}-Day Personalized Meal Plan`,
      summary: `A customized meal plan for ${userDetails.name} based on their health profile and nutritional needs.`,
      nutritionStrategy: [],
      mealPrepTips: [],
      foodsToEmphasize: [],
      foodsToAvoid: [],
      hydrationRecommendations: [],
      dailyPlans: [],
      importantConsiderations: [],
    };

    try {
      // Add timeout for the AI request
      const aiPromise = new Promise(async (resolve, reject) => {
        try {
          const { ai, model } = geminiAI;
          const textResult = await ai.models.generateContent({
            model,
            contents: textPrompt,
          }, {
            userId: userDetails.id,
            userName: userDetails.name,
            userEmail: userDetails.email,
          });
          resolve(textResult);
        } catch (error) {
          reject(error);
        }
      });

      // Race between the AI request and a timeout
      const textResult = await Promise.race([
        aiPromise]);

      originalPlanText = textResult.text;

      // Parse AI response to extract structured information
      originalPlanObject = parseAIResponse(originalPlanText, userDetails.name, duration);
    } catch (aiError) {
      console.error('Error calling AI:', aiError);
      // Fall back to generating a basic meal plan based on user's health needs
      originalPlanObject = generateFallbackMealPlan(userDetails, nutritionTargets, duration);
    }

    // Transform AI recommendations into usable data
    const aiRecommendations = {
      generalStrategy: originalPlanObject.nutritionStrategy[0]?.description || "Focus on a balanced diet.",
      foodsToEmphasize: originalPlanObject.foodsToEmphasize.flatMap(f => f.examples) || [],
      foodsToAvoid: originalPlanObject.foodsToAvoid.flatMap(f => f.examples) || [],
      mealPrepTips: originalPlanObject.mealPrepTips.map(t => t.tip) || [],
      hydrationAdvice: originalPlanObject.hydrationRecommendations[0]?.details || "Drink 8 glasses of water daily.",
    };

    // Transform nutrition strategy into goals
    const nutritionalGoals = originalPlanObject.nutritionStrategy.map(strategy => ({
      goal: strategy.focus,
      reason: `Support health and address ${medicalConditions.join(', ') || 'nutritional needs'}`,
      recommendations: [strategy.description],
    }));

    // Set meal plan dates
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + duration - 1);

    // Serialize the original plan for storage
    const originalPlanTextJson = JSON.stringify(originalPlanObject);

    // Create or update meal plan
    let mealPlan;
    try {
      // Delete existing daily plans if a meal plan exists
      if (userDetails.mealPlan) {
        await prisma.dailyMealPlan.deleteMany({ where: { mealPlanId: userDetails.mealPlan.id } });
      }

      // Update or create the meal plan
      mealPlan = await prisma.mealPlan.upsert({
        where: { userId: userDetails.id },
        update: {
          startDate,
          endDate,
          calorieTarget,
          proteinTarget,
          carbTarget,
          fatTarget,
          nutritionalGoals,
          restrictions: dietaryRestrictions,
          aiRecommendations,
          originalPlanText: originalPlanTextJson,
          updatedAt: new Date(),
        },
        create: {
          userId: userDetails.id,
          startDate,
          endDate,
          calorieTarget,
          proteinTarget,
          carbTarget,
          fatTarget,
          nutritionalGoals,
          restrictions: dietaryRestrictions,
          aiRecommendations,
          originalPlanText: originalPlanTextJson,
        },
      });

      // Create daily plans and meals based on AI recommendations
      await createDailyPlansAndMeals({
        mealPlanId: mealPlan.id,
        duration,
        startDate,
        nutritionTargets,
        originalPlanObject,
        dietaryRestrictions,
        healthRecommendations
      });

      // Fetch the complete meal plan with all relationships
      const completeMealPlan = await prisma.mealPlan.findUnique({
        where: { id: mealPlan.id },
        include: {
          dailyPlans: {
            include: { meals: true },
            orderBy: { day: 'asc' },
          },
        },
      });

      // Format response data
      const responseData = formatMealPlanResponse(completeMealPlan, startDate, originalPlanObject);

      return res.status(200).json({
        message: "Meal plan generated successfully",
        data: responseData,
      });
    } catch (dbError) {
      console.error('Error creating/updating meal plan:', dbError);
      return sendErrorResponse(res, 500, "Failed to create meal plan", dbError);
    }
  } catch (error) {
    return sendErrorResponse(res, 500, "Error generating meal plan", error);
  }
});

/**
 * Calculate nutrition targets based on user's health profile
 * @param {Object} userDetails - User details with health profile
 * @returns {Object} - Calculated nutrition targets
 */
function calculateNutritionTargets(userDetails) {
  // Extract user health data
  const height = userDetails.healthProfile?.height || 170;
  const weight = userDetails.healthProfile?.weight || 70;
  const age = userDetails.healthProfile?.age || 30;
  const gender = userDetails.healthProfile?.gender || 'MALE';
  const activityLevel = userDetails.healthProfile?.activityLevel || 'MODERATELY_ACTIVE';

  // Calculate BMI
  const bmi = weight / ((height / 100) ** 2);

  // Calculate Basal Metabolic Rate (BMR)
  let bmr = gender === 'MALE'
    ? 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age)
    : 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);

  // Activity level multipliers
  const activityMultipliers = {
    SEDENTARY: 1.2,
    LIGHTLY_ACTIVE: 1.375,
    MODERATELY_ACTIVE: 1.55,
    VERY_ACTIVE: 1.725,
    EXTREMELY_ACTIVE: 1.9,
  };

  // Calculate Total Daily Energy Expenditure (TDEE)
  const activityMultiplier = activityMultipliers[activityLevel] || 1.55;
  const tdee = Math.round(bmr * activityMultiplier);

  // Adjust calorie target based on BMI and health conditions
  let calorieTarget = tdee;
  const medicalConditions = userDetails.healthProfile?.medicalConditions || [];

  // Adjust for weight management if needed
  if (bmi > 25) {
    // For overweight individuals, reduce calories for healthy weight loss
    calorieTarget = Math.round(tdee * 0.85); // 15% deficit for weight loss
  } else if (bmi < 18.5) {
    // For underweight individuals, increase calories for healthy weight gain
    calorieTarget = Math.round(tdee * 1.15); // 15% surplus for weight gain
  }

  // Further adjust based on medical conditions
  if (medicalConditions.some(condition =>
    condition.toLowerCase().includes('diabetes') ||
    condition.toLowerCase().includes('insulin')
  )) {
    // Lower carbs for diabetic conditions
    const proteinTarget = Math.round((calorieTarget * 0.30) / 4);
    const carbTarget = Math.round((calorieTarget * 0.30) / 4); // Reduced carbs
    const fatTarget = Math.round((calorieTarget * 0.40) / 9); // Increased healthy fats

    return { calorieTarget, proteinTarget, carbTarget, fatTarget, bmi, tdee };
  }

  if (medicalConditions.some(condition =>
    condition.toLowerCase().includes('kidney') ||
    condition.toLowerCase().includes('renal')
  )) {
    // Lower protein for kidney conditions
    const proteinTarget = Math.round((calorieTarget * 0.15) / 4); // Reduced protein
    const carbTarget = Math.round((calorieTarget * 0.55) / 4); // Increased carbs
    const fatTarget = Math.round((calorieTarget * 0.30) / 9);

    return { calorieTarget, proteinTarget, carbTarget, fatTarget, bmi, tdee };
  }

  if (medicalConditions.some(condition =>
    condition.toLowerCase().includes('heart') ||
    condition.toLowerCase().includes('hypertension') ||
    condition.toLowerCase().includes('cholesterol')
  )) {
    // Lower fat for heart conditions
    const proteinTarget = Math.round((calorieTarget * 0.30) / 4);
    const carbTarget = Math.round((calorieTarget * 0.50) / 4); // Increased carbs
    const fatTarget = Math.round((calorieTarget * 0.20) / 9); // Reduced fat

    return { calorieTarget, proteinTarget, carbTarget, fatTarget, bmi, tdee };
  }

  // Default macronutrient distribution
  const proteinTarget = Math.round((calorieTarget * 0.30) / 4);
  const carbTarget = Math.round((calorieTarget * 0.40) / 4);
  const fatTarget = Math.round((calorieTarget * 0.30) / 9);

  return { calorieTarget, proteinTarget, carbTarget, fatTarget, bmi, tdee };
}

/**
 * Compile health insights from user's health report
 * @param {Object} userDetails - User details with health report
 * @returns {Object} - Compiled health insights
 */
function compileHealthInsights(userDetails) {
  const insights = {
    nutritionAdvice: [],
    lifestyleRecommendations: [],
    healthRisks: [],
    medicalAdvice: []
  };

  if (!userDetails.healthReport) {
    return insights;
  }

  // Extract nutrition advice from health report
  if (userDetails.healthReport.hypertensionManagement?.lifestyle) {
    const dietAdvice = userDetails.healthReport.hypertensionManagement.lifestyle
      .filter(item => item.includes("Diet") || item.includes("food") || item.includes("sodium"))
      .join(". ");
    if (dietAdvice) insights.nutritionAdvice.push(dietAdvice);
  }

  if (userDetails.healthReport.smokingCessation) {
    insights.nutritionAdvice.push("Include foods rich in antioxidants to support recovery from smoking.");
  }

  if (userDetails.healthReport.digestiveHealth?.dietaryChanges) {
    insights.nutritionAdvice.push(userDetails.healthReport.digestiveHealth.dietaryChanges.join(". "));
  }

  // Extract lifestyle recommendations
  if (userDetails.healthReport.lifestyleModifications) {
    const lifestyleNutrition = userDetails.healthReport.lifestyleModifications
      .filter(mod => mod.area === "Nutrition")
      .flatMap(mod => mod.recommendations);

    if (lifestyleNutrition.length > 0) {
      insights.nutritionAdvice.push(...lifestyleNutrition);
    }

    const otherLifestyleRecs = userDetails.healthReport.lifestyleModifications
      .filter(mod => mod.area !== "Nutrition")
      .flatMap(mod => mod.recommendations);

    if (otherLifestyleRecs.length > 0) {
      insights.lifestyleRecommendations.push(...otherLifestyleRecs);
    }
  }

  // Extract health risks
  if (userDetails.healthReport.healthRisks) {
    insights.healthRisks = userDetails.healthReport.healthRisks;
  }

  // Extract medical advice
  if (userDetails.healthReport.medicalAdvice) {
    insights.medicalAdvice = userDetails.healthReport.medicalAdvice;
  }

  return insights;
}

/**
 * Generate personalized health recommendations for meal planning
 * @param {Object} params - Parameters including user details and health conditions
 * @returns {Object} - Personalized health recommendations
 */
function generateHealthRecommendations({
  userDetails,
  medicalConditions,
  badHabits,
  sleepIssues,
  stressIssues,
  mentalHealthIssues,
  bmi,
  dietaryRestrictions,
  healthInsights
}) {
  const recommendations = {
    foodsToEmphasize: [],
    foodsToAvoid: [],
    specialConsiderations: [],
    hydrationGoal: 0,
    mealTimingRecommendations: []
  };

  // Set base hydration goal (adjusted by body weight)
  const weight = userDetails.healthProfile?.weight || 70;
  recommendations.hydrationGoal = Math.round(weight * 30); // 30ml per kg body weight

  // Adjust for BMI
  if (bmi > 30) {
    recommendations.foodsToEmphasize.push('High-fiber foods', 'Lean proteins', 'Low-glycemic vegetables');
    recommendations.foodsToAvoid.push('Refined sugars', 'Processed foods', 'High-calorie beverages');
    recommendations.specialConsiderations.push('Focus on portion control');
    recommendations.mealTimingRecommendations.push('Eat smaller, more frequent meals to maintain stable blood sugar');
  } else if (bmi > 25) {
    recommendations.foodsToEmphasize.push('Lean proteins', 'Complex carbohydrates', 'Foods rich in fiber');
    recommendations.foodsToAvoid.push('Processed snacks', 'Sugar-sweetened beverages');
    recommendations.mealTimingRecommendations.push('Consider intermittent fasting approach if appropriate');
  } else if (bmi < 18.5) {
    recommendations.foodsToEmphasize.push('Nutrient-dense foods', 'Healthy fats', 'Protein-rich foods');
    recommendations.specialConsiderations.push('Focus on calorie-dense but nutritious foods');
    recommendations.mealTimingRecommendations.push('Eat more frequent meals to increase calorie intake');
  }

  // Adjust for medical conditions
  medicalConditions.forEach(condition => {
    const conditionLower = condition.toLowerCase();

    if (conditionLower.includes('diabetes')) {
      recommendations.foodsToEmphasize.push('Low-glycemic foods', 'High-fiber vegetables', 'Lean proteins');
      recommendations.foodsToAvoid.push('Simple sugars', 'Refined carbohydrates', 'Sugary beverages');
      recommendations.specialConsiderations.push('Monitor carbohydrate intake consistently throughout the day');
      recommendations.mealTimingRecommendations.push('Space meals evenly throughout the day to maintain stable blood glucose');
    }

    if (conditionLower.includes('hypertension') || conditionLower.includes('heart')) {
      recommendations.foodsToEmphasize.push('Potassium-rich foods', 'Foods rich in omega-3 fatty acids', 'Magnesium-rich foods');
      recommendations.foodsToAvoid.push('High-sodium foods', 'Processed meats', 'Full-fat dairy');
      recommendations.specialConsiderations.push('Limit sodium intake to below 2,300mg daily');
      recommendations.hydrationGoal = Math.max(recommendations.hydrationGoal, 2500); // Minimum 2.5L for hypertension
    }

    if (conditionLower.includes('kidney') || conditionLower.includes('renal')) {
      recommendations.foodsToEmphasize.push('Low-phosphorus foods', 'Lower-potassium options when needed');
      recommendations.foodsToAvoid.push('High-phosphorus foods', 'High-potassium foods if levels are elevated');
      recommendations.specialConsiderations.push('Carefully monitor protein intake based on kidney function');
      // Adjust hydration based on kidney function - this is simplified and should be personalized
      recommendations.specialConsiderations.push('Consult nephrologist for specific fluid intake requirements');
    }

    if (conditionLower.includes('gout')) {
      recommendations.foodsToEmphasize.push('Vitamin C-rich foods', 'Low-purine foods', 'Plant-based proteins');
      recommendations.foodsToAvoid.push('High-purine foods', 'Organ meats', 'Shellfish', 'Beer and spirits');
      recommendations.hydrationGoal = Math.max(recommendations.hydrationGoal, 3000); // Minimum 3L for gout
    }

    if (conditionLower.includes('ibs') || conditionLower.includes('irritable bowel')) {
      recommendations.foodsToEmphasize.push('Soluble fiber foods', 'Probiotic-rich foods');
      recommendations.specialConsiderations.push('Consider a low-FODMAP approach if symptoms are severe');
      recommendations.mealTimingRecommendations.push('Eat smaller, regular meals rather than large meals');
    }
  });

  // Adjust for bad habits
  badHabits.forEach(habit => {
    const habitLower = habit.toLowerCase();

    if (habitLower.includes('smoking')) {
      recommendations.foodsToEmphasize.push('Foods rich in antioxidants', 'Vitamin C-rich foods', 'Foods high in vitamin A and E');
      recommendations.hydrationGoal = Math.max(recommendations.hydrationGoal, 2500); // Minimum 2.5L for smokers
    }

    if (habitLower.includes('alcohol')) {
      recommendations.foodsToEmphasize.push('B-vitamin rich foods', 'Liver-supporting foods like cruciferous vegetables');
      recommendations.foodsToAvoid.push('Highly processed foods that may trigger cravings');
      recommendations.hydrationGoal = Math.max(recommendations.hydrationGoal, 3000); // Minimum 3L for alcohol consumption
      recommendations.specialConsiderations.push('Include meals before drinking to slow alcohol absorption');
    }
  });

  // Adjust for sleep issues
  if (sleepIssues.length > 0) {
    recommendations.foodsToEmphasize.push('Foods containing tryptophan', 'Magnesium-rich foods', 'Foods with melatonin');
    recommendations.foodsToAvoid.push('Caffeine after noon', 'High-fat meals close to bedtime', 'Spicy foods in the evening');
    recommendations.mealTimingRecommendations.push('Have dinner at least 3 hours before bedtime');
    recommendations.specialConsiderations.push('Consider a small protein-carb balanced snack before bed if waking hungry');
  }

  // Adjust for stress
  if (stressIssues.length > 0) {
    recommendations.foodsToEmphasize.push('Omega-3 rich foods', 'Complex carbohydrates', 'Magnesium-rich foods');
    recommendations.foodsToAvoid.push('Excessive caffeine', 'High-sugar foods that may cause energy crashes');
    recommendations.specialConsiderations.push('Practice mindful eating to reduce stress-related consumption');
  }

  // Adjust for mental health issues
  if (mentalHealthIssues.length > 0) {
    recommendations.foodsToEmphasize.push('Omega-3 fatty acids', 'Foods rich in folate', 'Foods with vitamin D');
    recommendations.foodsToAvoid.push('Processed foods with artificial additives', 'High-sugar foods');
    recommendations.specialConsiderations.push('Regular meal timing can help stabilize mood');
  }

  // Include insights from health report
  if (healthInsights.nutritionAdvice.length > 0) {
    // Process nutrition advice to extract foods to emphasize and avoid
    healthInsights.nutritionAdvice.forEach(advice => {
      const adviceLower = advice.toLowerCase();

      // Extract foods to emphasize
      if (adviceLower.includes('increase') || adviceLower.includes('consume more') || adviceLower.includes('add')) {
        const emphasizeMatch = advice.match(/increase|consume more|add|include ([^.]+)/i);
        if (emphasizeMatch && emphasizeMatch[1]) {
          recommendations.foodsToEmphasize.push(emphasizeMatch[1].trim());
        }
      }

      // Extract foods to avoid
      if (adviceLower.includes('reduce') || adviceLower.includes('limit') || adviceLower.includes('avoid')) {
        const avoidMatch = advice.match(/reduce|limit|avoid|decrease ([^.]+)/i);
        if (avoidMatch && avoidMatch[1]) {
          recommendations.foodsToAvoid.push(avoidMatch[1].trim());
        }
      }

      // Add as special consideration if no specific food identified
      if (!adviceLower.match(/increase|consume more|add|include|reduce|limit|avoid|decrease/i)) {
        recommendations.specialConsiderations.push(advice);
      }
    });
  }

  // Remove duplicates
  recommendations.foodsToEmphasize = [...new Set(recommendations.foodsToEmphasize)];
  recommendations.foodsToAvoid = [...new Set(recommendations.foodsToAvoid)];
  recommendations.specialConsiderations = [...new Set(recommendations.specialConsiderations)];
  recommendations.mealTimingRecommendations = [...new Set(recommendations.mealTimingRecommendations)];

  return recommendations;
}

/**
 * Generate an AI prompt for meal plan creation
 * @param {Object} params - Parameters for the prompt
 * @returns {String} - The generated prompt
 */
function generateAIPrompt({
  user,
  duration,
  nutritionTargets,
  healthRecommendations,
  dietaryRestrictions,
  cuisinePreferences,
  healthGoals
}) {
  const {
    calorieTarget,
    proteinTarget,
    carbTarget,
    fatTarget,
    bmi,
    tdee
  } = nutritionTargets;

  const height = user.healthProfile?.height || 170;
  const weight = user.healthProfile?.weight || 70;
  const age = user.healthProfile?.age || 30;
  const gender = user.healthProfile?.gender || 'MALE';
  const activityLevel = user.healthProfile?.activityLevel || 'MODERATELY_ACTIVE';
  const medicalConditions = user.healthProfile?.medicalConditions || [];

  // Format health recommendations
  const foodsToEmphasizeText = healthRecommendations.foodsToEmphasize.length > 0
    ? healthRecommendations.foodsToEmphasize.join(', ')
    : 'None specifically identified';

  const foodsToAvoidText = healthRecommendations.foodsToAvoid.length > 0
    ? healthRecommendations.foodsToAvoid.join(', ')
    : 'None specifically identified';

  const specialConsiderationsText = healthRecommendations.specialConsiderations.length > 0
    ? healthRecommendations.specialConsiderations.join(', ')
    : 'None specifically identified';

  const mealTimingText = healthRecommendations.mealTimingRecommendations.length > 0
    ? healthRecommendations.mealTimingRecommendations.join(', ')
    : 'Standard meal timing';

  // Format cuisine preferences
  const cuisinePreferencesText = cuisinePreferences.length > 0
    ? cuisinePreferences.join(', ')
    : 'No specific preferences';

  // Format health goals
  const healthGoalsText = healthGoals.length > 0
    ? healthGoals.join(', ')
    : 'General health maintenance';

  return `
    Generate a detailed ${duration}-day personalized meal plan for ${user.name} based on:

    USER PROFILE:
    - Age: ${age}
    - Gender: ${gender}
    - Height: ${height} cm
    - Weight: ${weight} kg
    - BMI: ${bmi.toFixed(1)}
    - Activity Level: ${activityLevel}
    - Daily Calorie Target: ${calorieTarget} calories
    - Daily Protein Target: ${proteinTarget}g
    - Daily Carbs Target: ${carbTarget}g
    - Daily Fat Target: ${fatTarget}g

    HEALTH CONSIDERATIONS:
    - Medical Conditions: ${medicalConditions.join(', ') || 'None reported'}
    - Dietary Restrictions: ${dietaryRestrictions.join(', ') || 'None reported'}
    - Foods to Emphasize: ${foodsToEmphasizeText}
    - Foods to Avoid: ${foodsToAvoidText}
    - Special Health Considerations: ${specialConsiderationsText}
    - Meal Timing Recommendations: ${mealTimingText}
    - Cuisine Preferences: ${cuisinePreferencesText}
    - Health Goals: ${healthGoalsText}
    - Recommended Daily Hydration: ${healthRecommendations.hydrationGoal}ml

    MEAL PLAN REQUIREMENTS:
    1. Overall Nutrition Strategy - tailored to the user's specific health conditions and needs
    2. Tips for Meal Preparation and Planning
    3. Detailed Foods to Emphasize List - include specific nutrients and benefits for the user's health conditions
    4. Detailed Foods to Avoid List - explain why these should be avoided given the user's health profile
    5. Hydration Recommendations - personalized to their health conditions
    6. ${duration}-Day Meal Plan with breakfast, lunch, dinner, and snacks for each day

    For each meal include:
    - Name (make this personalized to the user's health needs)
    - Description
    - Nutritional information (calories, protein, carbs, fat)
    - Health benefits specifically relevant to the user's conditions
    - Ingredients list with quantities
    - Simple preparation steps
    - Preparation time

    Ensure meals align with medical conditions ${medicalConditions.join(', ') || 'if any'}, address health goals ${healthGoalsText}, and respect dietary restrictions ${dietaryRestrictions.join(', ') || 'if any'}.

    Format all nutritional macros with specific numbers.

    End with important health considerations specific to ${user.name}'s conditions.
  `;
}

/**
 * Parse AI response to extract structured meal plan data
 * @param {String} responseText - The raw AI response text
 * @param {String} userName - The user's name
 * @param {Number} duration - Meal plan duration in days
 * @returns {Object} - Structured meal plan data
 */
function parseAIResponse(responseText, userName, duration) {
  // Initialize the plan object with default structure
  const planObject = {
    title: `${userName}'s ${duration}-Day Personalized Meal Plan`,
    summary: `A customized meal plan for ${userName} based on their health profile.`,
    nutritionStrategy: [],
    mealPrepTips: [],
    foodsToEmphasize: [],
    foodsToAvoid: [],
    hydrationRecommendations: [],
    dailyPlans: [],
    importantConsiderations: [],
  };

  try {
    // Parse nutrition strategy
    const strategyMatch = responseText.match(/(?:Overall Nutrition Strategy:|Nutrition Strategy:)([\s\S]*?)(?=Tips for Meal|Meal Preparation|Food|$)/i);
    if (strategyMatch?.[1]) {
      const strategies = strategyMatch[1].match(/\*?\s*\*?\*?([\w\s\-]+):\*?\*?\s*([\s\S]*?)(?=\*?\s*\*?\*?[\w\s\-]+:|$)/g) || [];

      if (strategies.length > 0) {
        planObject.nutritionStrategy = strategies.map(strategy => {
          const parts = strategy.match(/\*?\s*\*?\*?([\w\s\-]+):\*?\*?\s*([\s\S]*?)(?=\*?\s*\*?\*?[\w\s\-]+:|$)/);
          return parts ? { focus: parts[1].trim(), description: parts[2].trim() } : null;
        }).filter(Boolean);
      } else {
        // If no structured format, use the whole section
        planObject.nutritionStrategy = [{
          focus: "Balanced Nutrition",
          description: strategyMatch[1].trim()
        }];
      }
    }

    // Parse meal prep tips
    const prepMatch = responseText.match(/(?:Tips for Meal Preparation|Meal Preparation Tips|Meal Prep Tips):([\s\S]*?)(?=Foods to |Hydration|$)/i);
    if (prepMatch?.[1]) {
      const tips = prepMatch[1].match(/\*?\s*([^*\n]+)/g) || [];
      planObject.mealPrepTips = tips.map(tip => ({
        tip: tip.replace(/\*?\s*/, '').trim()
      })).filter(tip => tip.tip);
    }

    // Parse foods to emphasize
    const emphasizeMatch = responseText.match(/(?:Foods to Emphasize|Foods to Include):([\s\S]*?)(?=Foods to Avoid|Foods to Limit|$)/i);
    if (emphasizeMatch?.[1]) {
      // Try to extract categorized foods
      const categories = emphasizeMatch[1].match(/\*?\s*\*?\*?([\w\s\-]+):\*?\*?\s*([\s\S]*?)(?=\*?\s*\*?\*?[\w\s\-]+:|$)/g) || [];

      if (categories.length > 0) {
        planObject.foodsToEmphasize = categories.map(category => {
          const parts = category.match(/\*?\s*\*?\*?([\w\s\-]+):\*?\*?\s*([\s\S]*?)(?=\*?\s*\*?\*?[\w\s\-]+:|$)/);
          if (!parts) return null;

          const examples = parts[2].match(/\*?\s*([^*\n]+)/g) || [];
          return {
            category: parts[1].trim(),
            examples: examples.map(ex => ex.replace(/\*?\s*/, '').trim()).filter(Boolean)
          };
        }).filter(Boolean);
      } else {
        // If no categorized format, extract a simple list
        const foods = emphasizeMatch[1].match(/\*?\s*([^*\n]+)/g) || [];
        planObject.foodsToEmphasize = [{
          category: "Recommended Foods",
          examples: foods.map(food => food.replace(/\*?\s*/, '').trim()).filter(Boolean)
        }];
      }
    }

    // Parse foods to avoid
    const avoidMatch = responseText.match(/(?:Foods to Avoid|Foods to Limit):([\s\S]*?)(?=Hydration|${duration}-Day Meal|Daily Plans|$)/i);
    if (avoidMatch?.[1]) {
      // Try to extract categorized foods
      const categories = avoidMatch[1].match(/\*?\s*\*?\*?([\w\s\-]+):\*?\*?\s*([\s\S]*?)(?=\*?\s*\*?\*?[\w\s\-]+:|$)/g) || [];

      if (categories.length > 0) {
        planObject.foodsToAvoid = categories.map(category => {
          const parts = category.match(/\*?\s*\*?\*?([\w\s\-]+):\*?\*?\s*([\s\S]*?)(?=\*?\s*\*?\*?[\w\s\-]+:|$)/);
          if (!parts) return null;

          const examples = parts[2].match(/\*?\s*([^*\n]+)/g) || [];
          return {
            category: parts[1].trim(),
            examples: examples.map(ex => ex.replace(/\*?\s*/, '').trim()).filter(Boolean)
          };
        }).filter(Boolean);
      } else {
        // If no categorized format, extract a simple list
        const foods = avoidMatch[1].match(/\*?\s*([^*\n]+)/g) || [];
        planObject.foodsToAvoid = [{
          category: "Foods to Avoid",
          examples: foods.map(food => food.replace(/\*?\s*/, '').trim()).filter(Boolean)
        }];
      }
    }

    // Parse hydration recommendations
    const hydrationMatch = responseText.match(/(?:Hydration Recommendations|Hydration):([\s\S]*?)(?=${duration}-Day Meal|Daily Plans|$)/i);
    if (hydrationMatch?.[1]) {
      const recommendations = hydrationMatch[1].match(/\*?\s*([^*\n]+)/g) || [];
      planObject.hydrationRecommendations = recommendations.map(rec => ({
        recommendation: "Hydration",
        details: rec.replace(/\*?\s*/, '').trim()
      })).filter(rec => rec.details);
    }

    // Parse important considerations (usually at the end)
    const considerationsMatch = responseText.match(/(?:Important Health Considerations|Health Considerations|Important Considerations):([\s\S]*?)$/i);
    if (considerationsMatch?.[1]) {
      const considerations = considerationsMatch[1].match(/\*?\s*([^*\n]+)/g) || [];
      planObject.importantConsiderations = considerations.map(con =>
        con.replace(/\*?\s*/, '').trim()
      ).filter(Boolean);
    }

    // Parse daily plans (this is more complex and would depend on the format)
    // For simplicity, we'll just note that the daily plans exist and will be processed separately
    planObject.hasDailyPlans = responseText.includes(`${duration}-Day Meal Plan`) ||
      responseText.includes("Daily Plans") ||
      responseText.includes("Day 1");
  } catch (error) {
    console.error("Error parsing AI response:", error);
  }

  return planObject;
}

/**
 * Generate a fallback meal plan when AI fails
 * @param {Object} userDetails - User details
 * @param {Object} nutritionTargets - Calculated nutrition targets
 * @param {Number} duration - Meal plan duration in days
 * @returns {Object} - Fallback meal plan
 */
function generateFallbackMealPlan(userDetails, nutritionTargets, duration) {
  const { calorieTarget, proteinTarget, carbTarget, fatTarget } = nutritionTargets;
  const medicalConditions = userDetails.healthProfile?.medicalConditions || [];

  return {
    title: `${userDetails.name}'s ${duration}-Day Personalized Meal Plan`,
    summary: `A nutritionally balanced meal plan for ${userDetails.name}.`,
    nutritionStrategy: [
      {
        focus: "Balanced Diet",
        description: "Focus on whole foods that provide essential nutrients while meeting daily calorie and macronutrient targets."
      },
      {
        focus: "Regular Meals",
        description: "Maintain stable energy by eating 3 main meals and 1-2 snacks per day."
      }
    ],
    mealPrepTips: [
      { tip: "Batch cook whole grains and proteins for easy meal assembly" },
      { tip: "Prepare cut vegetables in advance for quick meal additions" },
      { tip: "Use herbs and spices liberally for flavor without added salt or sugar" }
    ],
    foodsToEmphasize: [
      {
        category: "Whole Foods",
        examples: ["Fruits", "Vegetables", "Whole grains", "Lean proteins", "Healthy fats"]
      },
      {
        category: "Nutrient-Dense Options",
        examples: ["Leafy greens", "Berries", "Nuts and seeds", "Fatty fish", "Legumes"]
      }
    ],
    foodsToAvoid: [
      {
        category: "Processed Foods",
        examples: ["Fast food", "Packaged snacks", "Sugary beverages", "Refined grains"]
      },
      {
        category: "Unhealthy Additives",
        examples: ["Trans fats", "Artificial sweeteners", "High fructose corn syrup", "Excessive sodium"]
      }
    ],
    hydrationRecommendations: [
      {
        recommendation: "Water Intake",
        details: "Drink at least 8 glasses (2L) of water daily, more if physically active or in hot weather."
      }
    ],
    importantConsiderations: [
      `This meal plan is designed to support general nutrition and health.`,
      `Consult with a healthcare professional for personalized guidance related to ${medicalConditions.join(', ') || 'any medical conditions'}.`,
      `Adjust portion sizes based on hunger and fullness cues while meeting calorie targets of ${calorieTarget} calories per day.`
    ],
    dailyPlans: [],
    hasDailyPlans: true
  };
}

/**
 * Create daily plans and meals in database
 * @param {Object} params - Parameters for creating daily plans and meals
 * @returns {Promise} - Promise resolving when all daily plans and meals are created
 */
async function createDailyPlansAndMeals({
  mealPlanId,
  duration,
  startDate,
  nutritionTargets,
  originalPlanObject,
  dietaryRestrictions,
  healthRecommendations
}) {
  const { calorieTarget, proteinTarget, carbTarget, fatTarget } = nutritionTargets;

  // Create daily plans with Promise.all for parallel execution
  const dailyPlanPromises = [];

  for (let day = 1; day <= duration; day++) {
    const dailyPlanPromise = (async () => {
      // Create a date for this day
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + day - 1);

      // Format date as "Day X - Weekday, Month Day, Year"
      const dayName = `Day ${day} - ${currentDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      })}`;

      // Create daily plan in database
      const dailyPlan = await prisma.dailyMealPlan.create({
        data: {
          mealPlanId: mealPlanId,
          day,
          dayName: dayName,
          totalCalories: calorieTarget,
          totalProtein: proteinTarget,
          totalCarbs: carbTarget,
          totalFat: fatTarget,
          waterIntake: healthRecommendations.hydrationGoal,
          notes: "",
        },
      });

      // Generate and create meals for this day
      const mealPromises = await generateMealsForDay(
        dailyPlan.id,
        day,
        dietaryRestrictions,
        healthRecommendations,
        nutritionTargets
      );

      await Promise.all(mealPromises);
      return dailyPlan.id;
    })();

    dailyPlanPromises.push(dailyPlanPromise);
  }

  // Wait for all daily plans to be created
  return Promise.all(dailyPlanPromises);
}

/**
 * Generate meals for a specific day
 * @param {Number} dailyPlanId - The daily plan ID
 * @param {Number} day - The day number
 * @param {Array} dietaryRestrictions - User's dietary restrictions
 * @param {Object} healthRecommendations - Health recommendations
 * @param {Object} nutritionTargets - Nutrition targets
 * @returns {Array} - Array of meal creation promises
 */
async function generateMealsForDay(dailyPlanId, day, dietaryRestrictions, healthRecommendations, nutritionTargets) {
  const { calorieTarget } = nutritionTargets;

  // Define meal types and their calorie allocation percentages
  const mealTypes = [
    { type: "BREAKFAST", percentage: 0.25 },
    { type: "LUNCH", percentage: 0.35 },
    { type: "DINNER", percentage: 0.30 },
    { type: "SNACK", percentage: 0.10 },
  ];

  // Calculate calories for each meal type
  const mealCalories = mealTypes.map(meal => ({
    ...meal,
    calories: Math.round(calorieTarget * meal.percentage)
  }));

  // Generate personalized meal names based on health recommendations
  const mealNames = await generatePersonalizedMealNames(
    mealTypes.map(m => m.type),
    dietaryRestrictions,
    healthRecommendations,
    day
  );

  // Create meals in parallel
  const mealPromises = mealTypes.map(async (mealType, index) => {
    const caloriesForMeal = mealCalories[index].calories;
    const mealTypeStr = mealType.type;
    const mealName = mealNames[mealTypeStr];

    return createMealWithExternalSearch(
      dailyPlanId,
      mealTypeStr,
      mealName,
      caloriesForMeal,
      dietaryRestrictions,
      healthRecommendations
    );
  });

  return mealPromises;
}

/**
 * Generate personalized meal names based on health recommendations
 * @param {Array} mealTypes - Array of meal types
 * @param {Array} dietaryRestrictions - User's dietary restrictions
 * @param {Object} healthRecommendations - Health recommendations
 * @param {Number} day - The day number (for variety)
 * @returns {Object} - Object mapping meal types to personalized names
 */
async function generatePersonalizedMealNames(mealTypes, dietaryRestrictions, healthRecommendations, day) {
  // Collections of meal components that can be mixed and matched
  const mealComponents = {
    BREAKFAST: {
      base: ["Oatmeal", "Yogurt Bowl", "Smoothie", "Egg", "Avocado Toast", "Chia Pudding", "Breakfast Bowl", "Protein Pancakes"],
      addon: ["Berry", "Banana", "Nut", "Seed", "Vegetable", "Spinach", "Protein", "Whole Grain", "Almond", "Coconut", "Quinoa"],
      preparation: ["Bowl", "Parfait", "Scramble", "Wrap", "Skillet", "Toast", "Muffin", "Porridge"]
    },
    LUNCH: {
      base: ["Salad", "Bowl", "Wrap", "Sandwich", "Soup", "Plate", "Stir-Fry", "Pasta", "Grain Bowl"],
      protein: ["Chicken", "Tofu", "Salmon", "Tuna", "Turkey", "Bean", "Lentil", "Quinoa", "Chickpea", "Egg"],
      addon: ["Avocado", "Vegetable", "Mediterranean", "Garden", "Harvest", "Protein", "Energy", "Power", "Antioxidant", "Omega-3"]
    },
    DINNER: {
      base: ["Bowl", "Plate", "Stir-Fry", "Bake", "Roast", "Skillet", "Sheet Pan", "One-Pot", "Sauté"],
      protein: ["Salmon", "Chicken", "Turkey", "Tofu", "Tempeh", "Lentil", "Bean", "Quinoa", "Cod", "Vegetable"],
      preparation: ["Roasted", "Grilled", "Baked", "Steamed", "Seared", "Slow-Cooked", "Air-Fried", "Herb-Crusted"]
    },
    SNACK: {
      base: ["Yogurt", "Hummus", "Smoothie", "Trail Mix", "Energy Ball", "Protein Bites", "Vegetable", "Fruit"],
      addon: ["Nut", "Seed", "Berry", "Protein", "Whole Grain", "Avocado", "Greek", "Antioxidant", "Fiber"],
      preparation: ["Plate", "Cup", "Bowl", "Box", "Bites", "Dip", "Snack Pack", "Power Boost"]
    }
  };

  // Filter out components based on dietary restrictions
  Object.keys(mealComponents).forEach(mealType => {
    Object.keys(mealComponents[mealType]).forEach(componentType => {
      mealComponents[mealType][componentType] = mealComponents[mealType][componentType]
        .filter(component => !isRestrictedIngredient(component, dietaryRestrictions));
    });
  });

  // Add components based on foods to emphasize
  healthRecommendations.foodsToEmphasize.forEach(food => {
    const foodLower = food.toLowerCase();

    if (foodLower.includes('protein') || foodLower.includes('lean')) {
      mealComponents.BREAKFAST.addon.push("Protein");
      mealComponents.LUNCH.protein.push("Lean Protein");
      mealComponents.DINNER.protein.push("High-Protein");
    }

    if (foodLower.includes('fiber') || foodLower.includes('whole grain')) {
      mealComponents.BREAKFAST.addon.push("Fiber");
      mealComponents.BREAKFAST.addon.push("Whole Grain");
      mealComponents.LUNCH.addon.push("High-Fiber");
    }

    if (foodLower.includes('omega') || foodLower.includes('fatty')) {
      mealComponents.BREAKFAST.addon.push("Omega-Rich");
      mealComponents.LUNCH.addon.push("Omega-3");
      mealComponents.DINNER.protein.push("Omega-3 Rich");
    }
  });

  // Generate names for each meal type
  const personalizedMealNames = {};

  mealTypes.forEach(type => {
    const components = mealComponents[type];
    let name = "";

    // Create varied combinations based on day number (for variety)
    const dayOffset = (day - 1) % 7;

    switch (type) {
      case "BREAKFAST":
        name = `${components.addon[(2 + dayOffset) % components.addon.length]} ${components.base[(dayOffset) % components.base.length]} ${components.preparation[(4 + dayOffset) % components.preparation.length]}`;
        break;
      case "LUNCH":
        name = `${components.addon[(3 + dayOffset) % components.addon.length]} ${components.protein[(1 + dayOffset) % components.protein.length]} ${components.base[(dayOffset) % components.base.length]}`;
        break;
      case "DINNER":
        name = `${components.preparation[(5 + dayOffset) % components.preparation.length]} ${components.protein[(2 + dayOffset) % components.protein.length]} ${components.base[(1 + dayOffset) % components.base.length]}`;
        break;
      case "SNACK":
        name = `${components.addon[(dayOffset) % components.addon.length]} ${components.base[(2 + dayOffset) % components.base.length]} ${components.preparation[(3 + dayOffset) % components.preparation.length]}`;
        break;
      default:
        name = `Balanced ${type.toLowerCase()} Option`;
    }

    // Remove any double spaces and trim
    personalizedMealNames[type] = name.replace(/\s+/g, ' ').trim();
  });

  return personalizedMealNames;
}

/**
 * Check if an ingredient is restricted based on dietary restrictions
 * @param {String} ingredient - Ingredient to check
 * @param {Array} restrictions - Dietary restrictions
 * @returns {Boolean} - True if ingredient is restricted
 */
function isRestrictedIngredient(ingredient, restrictions) {
  if (!restrictions || restrictions.length === 0) {
    return false;
  }

  const ingredientLower = ingredient.toLowerCase();

  // Map of common ingredients to their related dietary restrictions
  const restrictionMap = {
    'vegan': ['egg', 'chicken', 'turkey', 'salmon', 'tuna', 'cod', 'yogurt', 'greek'],
    'vegetarian': ['chicken', 'turkey', 'salmon', 'tuna', 'cod'],
    'pescatarian': ['chicken', 'turkey'],
    'gluten-free': ['whole grain', 'wheat'],
    'dairy-free': ['yogurt', 'greek', 'dairy'],
    'nut-free': ['nut', 'almond'],
    'low-sodium': [],
    'keto': ['whole grain', 'oatmeal'],
    'paleo': ['whole grain', 'dairy', 'yogurt', 'greek']
  };

  for (const restriction of restrictions) {
    const restrictionLower = restriction.toLowerCase();

    // Check direct matches (e.g., 'no eggs' would match 'egg')
    if (ingredientLower.includes(restrictionLower.replace('no ', '').replace('-free', ''))) {
      return true;
    }

    // Check mapped restrictions
    for (const [key, bannedIngredients] of Object.entries(restrictionMap)) {
      if (restrictionLower.includes(key) && bannedIngredients.some(banned => ingredientLower.includes(banned))) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Create a meal with data from external search/API
 * @param {Number} dailyPlanId - Daily plan ID
 * @param {String} mealType - Type of meal
 * @param {String} mealName - Name of meal
 * @param {Number} targetCalories - Target calories for meal
 * @param {Array} dietaryRestrictions - Dietary restrictions
 * @param {Object} healthRecommendations - Health recommendations
 * @returns {Promise} - Promise resolving to created meal
 */
async function createMealWithExternalSearch(
  dailyPlanId,
  mealType,
  mealName,
  targetCalories,
  dietaryRestrictions = [],
  healthRecommendations = {}
) {
  // Set default macronutrient ratios based on meal type
  let proteinRatio, carbRatio, fatRatio;

  switch (mealType) {
    case "BREAKFAST":
      proteinRatio = 0.25; // 25% of calories from protein
      carbRatio = 0.50;    // 50% of calories from carbs
      fatRatio = 0.25;     // 25% of calories from fat
      break;
    case "LUNCH":
    case "DINNER":
      proteinRatio = 0.35; // 35% of calories from protein
      carbRatio = 0.40;    // 40% of calories from carbs
      fatRatio = 0.25;     // 25% of calories from fat
      break;
    case "SNACK":
      proteinRatio = 0.20; // 20% of calories from protein
      carbRatio = 0.50;    // 50% of calories from carbs
      fatRatio = 0.30;     // 30% of calories from fat
      break;
    default:
      proteinRatio = 0.30;
      carbRatio = 0.40;
      fatRatio = 0.30;
  }

  // Calculate macros based on calorie target
  const protein = Math.round((targetCalories * proteinRatio) / 4); // 4 calories per gram of protein
  const carbs = Math.round((targetCalories * carbRatio) / 4);      // 4 calories per gram of carbs
  const fat = Math.round((targetCalories * fatRatio) / 9);         // 9 calories per gram of fat

  try {
    // Construct a search query for the recipe
    const restrictionsStr = dietaryRestrictions.length > 0
      ? `without ${dietaryRestrictions.join(', ')}`
      : '';

    const emphasizeStr = healthRecommendations.foodsToEmphasize.length > 0
      ? `including ${healthRecommendations.foodsToEmphasize.slice(0, 3).join(', ')}`
      : '';

    const avoidStr = healthRecommendations.foodsToAvoid.length > 0
      ? `avoiding ${healthRecommendations.foodsToAvoid.slice(0, 3).join(', ')}`
      : '';

    const searchQuery = `recipe for ${mealName} ${emphasizeStr} ${avoidStr} ${restrictionsStr} with ${targetCalories} calories`;

    // Set a timeout for the search request
    const searchPromise = new Promise(async (resolve, reject) => {
      try {
        // In real implementation, replace with actual API call (e.g., Tavily)
        const searchResult = await tavilySearch(searchQuery, { searchDepth: "advanced", maxResults: 5 });
        resolve(searchResult);
      } catch (error) {
        reject(error);
      }
    });

    // Race between the search request and a timeout
    const searchResult = await Promise.race([
      searchPromise]);

    // Default values for meal
    let ingredients = getMealDefaultIngredients(mealName, mealType);
    let preparationSteps = generateDefaultPreparationSteps(mealName, mealType);
    let healthBenefits = generateHealthBenefits(mealName, mealType, healthRecommendations);
    let description = `A nutritious ${mealType.toLowerCase()} option tailored for your dietary needs and health goals.`;
    let prepTime = mealType === "SNACK" ? 10 : 25;

    // If search was successful, extract data from results
    if (searchResult?.answer) {
      const answer = searchResult.answer;

      // Extract data from search results (simplified)
      const extractedData = extractRecipeData(answer, mealName, mealType);

      if (extractedData.ingredients && extractedData.ingredients.length > 0) {
        ingredients = extractedData.ingredients;
      }

      if (extractedData.preparationSteps && extractedData.preparationSteps.length > 0) {
        preparationSteps = extractedData.preparationSteps;
      }

      if (extractedData.healthBenefits && extractedData.healthBenefits.length > 0) {
        healthBenefits = [...extractedData.healthBenefits, ...healthBenefits.slice(0, 2)];
        // Limit to 5 benefits maximum
        healthBenefits = [...new Set(healthBenefits)].slice(0, 5);
      }

      if (extractedData.description) {
        description = extractedData.description;
      }

      if (extractedData.prepTime) {
        prepTime = extractedData.prepTime;
      }
    }

    // Create the meal in the database
    return prisma.meal.create({
      data: {
        dailyPlanId,
        mealType,
        name: mealName,
        description,
        calories: targetCalories,
        protein,
        carbs,
        fat,
        ingredients,
        preparationSteps,
        preparationTime: prepTime,
        healthBenefits,
      },
    });
  } catch (error) {
    console.error(`Error creating meal ${mealName}:`, error);

    // Fallback with default values if search/creation fails
    return prisma.meal.create({
      data: {
        dailyPlanId,
        mealType,
        name: mealName,
        description: `A nutritious ${mealType.toLowerCase()} option designed for your health needs.`,
        calories: targetCalories,
        protein: Math.round((targetCalories * 0.3) / 4), // 30% protein
        carbs: Math.round((targetCalories * 0.4) / 4),   // 40% carbs
        fat: Math.round((targetCalories * 0.3) / 9),     // 30% fat
        ingredients: getMealDefaultIngredients(mealName, mealType),
        preparationSteps: generateDefaultPreparationSteps(mealName, mealType),
        preparationTime: mealType === "SNACK" ? 10 : 25,
        healthBenefits: generateHealthBenefits(mealName, mealType, healthRecommendations),
      },
    });
  }
}

/**
 * Extract recipe data from search result
 * @param {String} searchResult - Search result text
 * @param {String} mealName - Name of the meal
 * @param {String} mealType - Type of meal
 * @returns {Object} - Extracted recipe data
 */
function extractRecipeData(searchResult, mealName, mealType) {
  const result = {
    ingredients: [],
    preparationSteps: [],
    healthBenefits: [],
    description: '',
    prepTime: mealType === "SNACK" ? 10 : 25
  };

  try {
    const resultLower = searchResult.toLowerCase();

    // Extract ingredients
    const ingredientsRegexOptions = [
      /ingredients[:\n]+((?:[-•*]?\s*.*?(?:\n|$))+)/is,
      /what you('ll| will) need[:\n]+((?:[-•*]?\s*.*?(?:\n|$))+)/is,
      /you('ll| will) need[:\n]+((?:[-•*]?\s*.*?(?:\n|$))+)/is,
      /for the [a-z\s]+[:\n]+((?:[-•*]?\s*.*?(?:\n|$))+)/is,
    ];

    for (const regex of ingredientsRegexOptions) {
      const match = resultLower.match(regex);
      if (match?.[1]) {
        // Split by lines, bullets, or numbers
        const lines = match[1]
          .split('\n')
          .map(line => line.trim())
          .filter(line => line && !line.match(/^(ingredients|what you|for the)/i))
          .map(line => line.replace(/^[-•*]?\s*(\d+\.?\s*)?/, '')) // Remove bullets or numbers
          .filter(line => line.length > 3 && !line.match(/^(step|direction|method|preparation)/i));

        if (lines.length > 1) {
          result.ingredients = lines;
          break;
        }
      }
    }

    // Extract preparation steps
    const stepsRegexOptions = [
      /(?:instructions|directions|preparation|method)[:\n]+((?:(?:\d+\.|\-|•|\*)\s*.*?(?:\n|$))+)/is,
      /(?:instructions|directions|preparation|method)[:\n]+(.*?)(?:\n\n|\n(?=\w+:))/is,
      /(?:step|how to make)[:\n]+((?:(?:\d+\.|\-|•|\*)\s*.*?(?:\n|$))+)/is,
    ];

    for (const regex of stepsRegexOptions) {
      const match = resultLower.match(regex);
      if (match?.[1]) {
        const numberedItems = match[1].match(/(?:\d+\.|\-|•|\*)\s*(.*?)(?=\n(?:\d+\.|\-|•|\*)|$)/gs);
        if (numberedItems?.length) {
          result.preparationSteps = numberedItems
            .map(item => item.replace(/(?:\d+\.|\-|•|\*)\s*/, '').trim())
            .filter(Boolean);
          break;
        }

        const lines = match[1].split('\n')
          .map(line => line.trim())
          .filter(Boolean);

        if (lines.length > 0) {
          result.preparationSteps = lines;
          break;
        }
      }
    }

    // Extract description
    const descriptionRegexOptions = [
      /description[:\n]+(.*?)(?:\n\n|\n(?=\w+:))/is,
      /about[:\n]+(.*?)(?:\n\n|\n(?=\w+:))/is,
      /^([a-z][^\n]{20,200}(?=\n\n|\n\w+:|$))/is,
    ];

    for (const regex of descriptionRegexOptions) {
      const match = resultLower.match(regex);
      if (match?.[1]?.trim()) {
        result.description = match[1].trim();
        // Capitalize first letter
        result.description = result.description.charAt(0).toUpperCase() + result.description.slice(1);
        break;
      }
    }

    // Extract health benefits
    const benefitsRegexOptions = [
      /(?:benefits|health benefits|nutritional benefits)[:\n]+((?:[-•*]\s*.*?(?:\n|$))+)/is,
      /(?:benefits|health benefits|nutritional benefits)[:\n]+(.*?)(?:\n\n|\n(?=\w+:))/is,
      /(?:nutrition|nutrition facts|nutritional information)[:\n]+(.*?)(?:\n\n|\n(?=\w+:))/is,
      /(?:vitamins|minerals|nutrients)[:\n]+((?:[-•*]\s*.*?(?:\n|$))+)/is,
    ];

    for (const regex of benefitsRegexOptions) {
      const match = resultLower.match(regex);
      if (match?.[1]) {
        const bulletedItems = match[1].match(/[-•*]\s*(.*?)(?=\n[-•*]|$)/gs);
        if (bulletedItems?.length) {
          const benefits = bulletedItems
            .map(item => {
              const cleaned = item.replace(/[-•*]\s*/, '').trim();
              return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
            })
            .filter(Boolean);

          result.healthBenefits = [...result.healthBenefits, ...benefits];
          continue; // Continue checking other patterns
        }

        const lines = match[1].split('\n')
          .map(line => {
            const cleaned = line.trim();
            return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
          })
          .filter(Boolean);

        if (lines.length > 0) {
          result.healthBenefits = [...result.healthBenefits, ...lines];
          continue; // Continue checking other patterns
        }
      }
    }

    // Extract vitamin mentions from the entire text
    const vitaminMatches = resultLower.match(/(?:vitamin|vit\.) [a-z\d]+|zinc|iron|calcium|magnesium|potassium|folate|omega-3|antioxidants|protein|fiber/gi);
    if (vitaminMatches) {
      const vitamins = [...new Set(vitaminMatches)].map(v => {
        const vitamin = `Contains ${v}`;
        return vitamin.charAt(0).toUpperCase() + vitamin.slice(1);
      });
      result.healthBenefits = [...result.healthBenefits, ...vitamins];
    }

    // Extract preparation time
    const prepTimeMatch = resultLower.match(/(?:prep time|preparation time|cooking time|total time)[:\s]+(?:about\s+)?(\d+)(?:\s*-\s*\d+)?\s*(?:min|minute)/i);
    if (prepTimeMatch?.[1]) {
      result.prepTime = parseInt(prepTimeMatch[1]);
    }
  } catch (error) {
    console.error("Error extracting recipe data:", error);
  }

  return result;
}

/**
 * Get default ingredients for a meal type and name
 * @param {String} mealName - Name of the meal
 * @param {String} mealType - Type of meal
 * @returns {Array} - Default ingredients
 */
function getMealDefaultIngredients(mealName, mealType) {
  const mealNameLower = mealName.toLowerCase();

  // Common ingredient patterns based on meal name
  if (mealNameLower.includes('oatmeal')) {
    return [
      "1 cup rolled oats",
      "1 cup milk of choice",
      "1 tbsp honey or maple syrup",
      "1/2 tsp cinnamon",
      "1/4 cup mixed berries",
      "1 tbsp chopped nuts"
    ];
  }

  if (mealNameLower.includes('yogurt')) {
    return [
      "1 cup Greek yogurt",
      "1/4 cup granola",
      "1 tbsp honey",
      "1/2 cup mixed berries",
      "1 tbsp chia seeds"
    ];
  }

  if (mealNameLower.includes('smoothie')) {
    return [
      "1 banana",
      "1 cup milk of choice",
      "1/2 cup mixed berries",
      "1 tbsp nut butter",
      "1 tsp chia seeds",
      "1 scoop protein powder (optional)"
    ];
  }

  if (mealNameLower.includes('egg')) {
    return [
      "3 eggs",
      "1/4 cup diced bell peppers",
      "1/4 cup diced onions",
      "1/4 cup spinach",
      "1 tbsp olive oil",
      "Salt and pepper to taste"
    ];
  }

  if (mealNameLower.includes('avocado')) {
    return [
      "1 ripe avocado",
      "2 slices whole grain bread",
      "1 tbsp lemon juice",
      "1/4 tsp red pepper flakes",
      "Salt and pepper to taste"
    ];
  }

  if (mealNameLower.includes('chia')) {
    return [
      "1/4 cup chia seeds",
      "1 cup milk of choice",
      "1 tbsp honey or maple syrup",
      "1/4 tsp vanilla extract",
      "1/4 cup mixed berries for topping"
    ];
  }

  if (mealNameLower.includes('salad')) {
    return [
      "2 cups mixed greens",
      "4 oz protein of choice (chicken, tofu, etc.)",
      "1/4 cup cherry tomatoes",
      "1/4 cup cucumber",
      "1/4 cup carrots",
      "2 tbsp vinaigrette dressing"
    ];
  }

  if (mealNameLower.includes('bowl')) {
    return [
      "1 cup cooked grain (quinoa, rice, etc.)",
      "4 oz protein of choice",
      "1 cup mixed vegetables",
      "1 tbsp olive oil",
      "1 tbsp sauce or dressing",
      "Herbs and spices to taste"
    ];
  }

  if (mealNameLower.includes('wrap') || mealNameLower.includes('sandwich')) {
    return [
      "1 whole grain wrap or 2 slices bread",
      "3-4 oz protein of choice",
      "1/4 avocado",
      "1/2 cup vegetables (lettuce, tomato, etc.)",
      "1 tbsp spread (hummus, mayo, etc.)"
    ];
  }

  if (mealNameLower.includes('soup')) {
    return [
      "4 cups vegetable or chicken broth",
      "1 cup diced vegetables",
      "3-4 oz protein of choice",
      "1/2 cup whole grains or legumes",
      "Herbs and spices to taste"
    ];
  }

  if (mealNameLower.includes('stir-fry')) {
    return [
      "4 oz protein of choice",
      "2 cups mixed vegetables",
      "1 cup cooked rice or noodles",
      "2 tbsp sauce (soy sauce, stir-fry sauce, etc.)",
      "1 tbsp oil for cooking",
      "Garlic and ginger to taste"
    ];
  }

  if (mealNameLower.includes('pasta')) {
    return [
      "2 oz whole grain pasta",
      "3-4 oz protein of choice",
      "1 cup vegetables",
      "1/4 cup sauce",
      "1 tbsp olive oil",
      "Herbs and spices to taste"
    ];
  }

  if (mealNameLower.includes('energy') || (mealNameLower.includes('protein') && mealNameLower.includes('bite'))) {
    return [
      "1/2 cup rolled oats",
      "1/4 cup nut butter",
      "2 tbsp honey or maple syrup",
      "2 tbsp chia or flax seeds",
      "2 tbsp mini dark chocolate chips",
      "1/4 tsp vanilla extract"
    ];
  }

  if (mealNameLower.includes('trail mix')) {
    return [
      "1/4 cup mixed nuts",
      "2 tbsp seeds",
      "2 tbsp dried fruit",
      "1 tbsp dark chocolate chips",
      "1 tsp cinnamon"
    ];
  }

  if (mealNameLower.includes('hummus')) {
    return [
      "1 cup raw vegetables for dipping",
      "1/4 cup hummus",
      "1 tbsp olive oil",
      "Herbs and spices to taste",
      "1 tbsp lemon juice"
    ];
  }

  // Default ingredients based on meal type if no specific pattern matches
  switch (mealType) {
    case 'BREAKFAST':
      return [
        "2 eggs",
        "1 slice whole grain toast",
        "1/4 avocado",
        "1/2 cup spinach",
        "1 tsp olive oil",
        "Salt and pepper to taste"
      ];
    case 'LUNCH':
      return [
        "4 oz lean protein",
        "1 cup mixed vegetables",
        "1/2 cup whole grains",
        "1 tbsp healthy fat",
        "Herbs and spices to taste"
      ];
    case 'DINNER':
      return [
        "5 oz protein of choice",
        "1.5 cups vegetables",
        "1/2 cup whole grains or starches",
        "1 tbsp healthy oil",
        "Herbs and seasonings to taste"
      ];
    case 'SNACK':
      return [
        "1/4 cup nuts or seeds",
        "1 piece of fruit",
        "1 tbsp honey or maple syrup",
        "Cinnamon to taste"
      ];
    default:
      return [
        "4 oz protein of choice",
        "1 cup vegetables",
        "1/2 cup complex carbohydrates",
        "1 tbsp healthy fat",
        "Herbs and spices to taste"
      ];
  }
}

/**
 * Generate default preparation steps
 * @param {String} mealName - Name of the meal
 * @param {String} mealType - Type of meal
 * @returns {Array} - Default preparation steps
 */
function generateDefaultPreparationSteps(mealName, mealType) {
  const mealNameLower = mealName.toLowerCase();

  // Common preparation patterns based on meal name
  if (mealNameLower.includes('oatmeal')) {
    return [
      "Combine oats and milk in a saucepan over medium heat.",
      "Cook for 5-7 minutes, stirring occasionally, until oats are soft and creamy.",
      "Remove from heat and stir in honey or maple syrup and cinnamon.",
      "Transfer to a bowl and top with berries and chopped nuts."
    ];
  }

  if (mealNameLower.includes('yogurt')) {
    return [
      "Add Greek yogurt to a bowl.",
      "Drizzle with honey.",
      "Top with granola and mixed berries.",
      "Sprinkle with chia seeds before serving."
    ];
  }

  if (mealNameLower.includes('smoothie')) {
    return [
      "Add all ingredients to a blender.",
      "Blend on high speed until smooth and creamy.",
      "Add more liquid if needed to achieve desired consistency.",
      "Pour into a glass and enjoy immediately."
    ];
  }

  if (mealNameLower.includes('egg')) {
    return [
      "Heat olive oil in a non-stick skillet over medium heat.",
      "Add diced bell peppers and onions, sauté for 2-3 minutes until softened.",
      "Add spinach and cook until wilted, about 1 minute.",
      "Whisk eggs in a bowl, season with salt and pepper.",
      "Pour eggs over vegetables and cook, stirring occasionally, until eggs are set."
    ];
  }

  if (mealNameLower.includes('avocado')) {
    return [
      "Toast bread until golden brown.",
      "Mash avocado in a bowl with lemon juice, salt, and pepper.",
      "Spread mashed avocado evenly over toast.",
      "Sprinkle with red pepper flakes before serving."
    ];
  }

  if (mealNameLower.includes('chia')) {
    return [
      "Mix chia seeds, milk, honey or maple syrup, and vanilla extract in a jar or container.",
      "Stir well to combine and prevent clumping.",
      "Cover and refrigerate for at least 4 hours or overnight.",
      "Top with mixed berries before serving."
    ];
  }

  if (mealNameLower.includes('salad')) {
    return [
      "Cook protein according to preferred method (grill, bake, etc.).",
      "Wash and prepare all vegetables.",
      "Combine mixed greens and vegetables in a large bowl.",
      "Add cooked protein on top.",
      "Drizzle with vinaigrette dressing just before serving."
    ];
  }

  if (mealNameLower.includes('bowl')) {
    return [
      "Cook grain according to package instructions.",
      "Prepare protein by cooking to appropriate temperature.",
      "Steam or sauté vegetables until tender-crisp.",
      "Assemble bowl with grain as base, topped with vegetables and protein.",
      "Drizzle with sauce and garnish with herbs before serving."
    ];
  }

  if (mealNameLower.includes('wrap') || mealNameLower.includes('sandwich')) {
    return [
      "Warm wrap or toast bread if desired.",
      "Spread chosen condiment on wrap or bread.",
      "Layer protein and vegetables evenly.",
      "Add sliced avocado.",
      "Roll up wrap tightly or close sandwich and cut in half before serving."
    ];
  }

  if (mealNameLower.includes('stir-fry')) {
    return [
      "Heat oil in a wok or large pan over high heat.",
      "Add protein and cook until almost done.",
      "Add vegetables and stir-fry for 3-5 minutes until tender-crisp.",
      "Add sauce and stir to coat all ingredients.",
      "Serve hot over cooked rice or noodles."
    ];
  }

  if (mealNameLower.includes('energy') || (mealNameLower.includes('protein') && mealNameLower.includes('bite'))) {
    return [
      "Mix rolled oats, nut butter, honey or maple syrup, seeds, and vanilla in a bowl.",
      "Fold in chocolate chips until evenly distributed.",
      "Refrigerate mixture for 30 minutes to firm up.",
      "Roll mixture into bite-sized balls.",
      "Store in an airtight container in the refrigerator."
    ];
  }

  // Default preparation steps based on meal type if no specific pattern matches
  switch (mealType) {
    case 'BREAKFAST':
      return [
        "Prepare all ingredients according to recipe.",
        "Cook main component over medium heat until done.",
        "Add toppings or accompaniments.",
        "Serve hot with optional garnishes."
      ];
    case 'LUNCH':
      return [
        "Cook protein to appropriate temperature.",
        "Prepare vegetables and grains.",
        "Combine all ingredients in serving dish.",
        "Add dressing or sauce just before serving."
      ];
    case 'DINNER':
      return [
        "Preheat oven or pan as required.",
        "Season protein with herbs and spices.",
        "Cook protein to appropriate temperature.",
        "Prepare vegetables and starches as side dishes.",
        "Plate all components and serve."
      ];
    case 'SNACK':
      return [
        "Combine all ingredients in a bowl or container.",
        "Mix well to ensure even distribution of flavors.",
        "Portion into serving size.",
        "Enjoy immediately or store for later."
      ];
    default:
      return [
        "Prepare all ingredients as specified.",
        "Cook main components according to recipe.",
        "Combine all elements before serving.",
        "Garnish as desired."
      ];
  }
}

/**
 * Generate health benefits for a meal
 * @param {String} mealName - Name of the meal
 * @param {String} mealType - Type of meal
 * @param {Object} healthRecommendations - Health recommendations
 * @returns {Array} - Health benefits
 */
function generateHealthBenefits(mealName, mealType, healthRecommendations = {}) {
  const mealNameLower = mealName.toLowerCase();
  let benefits = [];

  // Add general benefits based on meal type
  if (mealType === 'BREAKFAST') {
    benefits.push('Provides morning energy and mental focus');
    benefits.push('Helps kickstart metabolism for the day');
    benefits.push('Supports stable blood sugar levels');
  } else if (mealType === 'LUNCH') {
    benefits.push('Maintains energy levels throughout the day');
    benefits.push('Supports cognition and afternoon productivity');
    benefits.push('Provides midday nutrient replenishment');
  } else if (mealType === 'DINNER') {
    benefits.push('Supports muscle recovery and repair');
    benefits.push('Provides nutrients for overnight healing processes');
    benefits.push('Helps maintain stable blood sugar during sleep');
  } else if (mealType === 'SNACK') {
    benefits.push('Provides between-meal energy sustainment');
    benefits.push('Helps prevent overeating at main meals');
    benefits.push('Supports stable blood sugar between meals');
  }

  // Add benefits from health recommendations
  if (healthRecommendations.foodsToEmphasize && healthRecommendations.foodsToEmphasize.length > 0) {
    const emphasisBenefits = [
      `Rich in recommended nutrients from ${healthRecommendations.foodsToEmphasize[0].toLowerCase()}`,
      `Supports health goals through inclusion of beneficial foods`
    ];
    benefits = [...benefits, ...emphasisBenefits.slice(0, 2)];
  }

  // Add specific benefits based on meal name ingredients
  if (mealNameLower.includes('berry') || mealNameLower.includes('berries')) {
    benefits.push('Rich in antioxidants that fight oxidative stress');
    benefits.push('Provides vitamin C for immune support');
  }

  if (mealNameLower.includes('oat') || mealNameLower.includes('whole grain')) {
    benefits.push('Contains soluble fiber that supports heart health');
    benefits.push('Provides sustainable energy through complex carbohydrates');
  }

  if (mealNameLower.includes('yogurt') || mealNameLower.includes('greek')) {
    benefits.push('Contains probiotics that support gut microbiome health');
    benefits.push('High in calcium for bone strength');
    benefits.push('Good source of protein for muscle maintenance');
  }

  if (mealNameLower.includes('egg')) {
    benefits.push('Complete protein source with all essential amino acids');
    benefits.push('Contains choline for brain health');
    benefits.push('Rich in B vitamins for energy metabolism');
  }

  if (mealNameLower.includes('avocado')) {
    benefits.push('Rich in heart-healthy monounsaturated fats');
    benefits.push('Good source of potassium for healthy blood pressure');
    benefits.push('Contains vitamin E, an antioxidant for skin health');
  }

  if (mealNameLower.includes('nut') || mealNameLower.includes('seed')) {
    benefits.push('Contains healthy fats for brain function');
    benefits.push('Good source of plant protein');
    benefits.push('Rich in minerals like magnesium and zinc');
  }

  if (mealNameLower.includes('spinach') || mealNameLower.includes('leafy green')) {
    benefits.push('High in iron for healthy blood cells');
    benefits.push('Good source of folate for cellular repair');
    benefits.push('Contains lutein for eye health');
  }

  if (mealNameLower.includes('salmon') || mealNameLower.includes('fish')) {
    benefits.push('Rich in omega-3 fatty acids for heart and brain health');
    benefits.push('High-quality protein for muscle maintenance');
    benefits.push('Contains vitamin D for immune function');
  }

  if (mealNameLower.includes('chicken') || mealNameLower.includes('turkey')) {
    benefits.push('Lean protein source for muscle building and repair');
    benefits.push('Contains B vitamins for energy metabolism');
    benefits.push('Low in saturated fat, supporting heart health');
  }

  if (mealNameLower.includes('tofu') || mealNameLower.includes('legume') || mealNameLower.includes('bean')) {
    benefits.push('Plant-based protein source');
    benefits.push('Contains isoflavones that support hormonal balance');
    benefits.push('Rich in iron and calcium for bone health');
  }

  if (mealNameLower.includes('vegetable') || mealNameLower.includes('veggie')) {
    benefits.push('Rich in dietary fiber for digestive health');
    benefits.push('Provides a variety of vitamins and minerals');
    benefits.push('Contains phytonutrients with anti-inflammatory properties');
  }

  if (mealNameLower.includes('omega')) {
    benefits.push('Supports heart health through essential fatty acids');
    benefits.push('Promotes healthy brain function and cognition');
    benefits.push('Has anti-inflammatory properties');
  }

  if (mealNameLower.includes('protein')) {
    benefits.push('Supports muscle maintenance and recovery');
    benefits.push('Promotes longer satiety and fullness');
    benefits.push('Essential for cellular repair and immune function');
  }

  if (mealNameLower.includes('antioxidant')) {
    benefits.push('Helps neutralize free radicals in the body');
    benefits.push('Supports cellular health and longevity');
    benefits.push('May reduce inflammation and oxidative stress');
  }

  // Limit to maximum 5 benefits
  return [...new Set(benefits)].slice(0, 5);
}

/**
 * Format meal plan response for API
 * @param {Object} mealPlan - Complete meal plan with relations
 * @param {Date} startDate - Start date of the meal plan
 * @param {Object} originalPlanObject - Original AI plan object
 * @returns {Object} - Formatted response data
 */
function formatMealPlanResponse(mealPlan, startDate, originalPlanObject) {
  return {
    id: mealPlan.id,
    startDate: mealPlan.startDate,// Meal Plan Generation Endpoint with Improved User Health Analysis
    endDate: mealPlan.endDate,
    calorieTarget: mealPlan.calorieTarget,
    proteinTarget: mealPlan.proteinTarget,
    carbTarget: mealPlan.carbTarget,
    fatTarget: mealPlan.fatTarget,
    dailyPlans: mealPlan.dailyPlans.map((plan, index) => {
      // Calculate the date for this day
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + index);

      return {
        day: plan.day,
        dayName: plan.dayName,
        dayDate: currentDate,
        totalCalories: plan.totalCalories,
        totalProtein: plan.totalProtein,
        totalCarbs: plan.totalCarbs,
        totalFat: plan.totalFat,
        waterIntake: plan.waterIntake,
        meals: plan.meals.map(meal => ({
          mealType: meal.mealType,
          name: meal.name,
          description: meal.description,
          calories: meal.calories,
          protein: meal.protein,
          carbs: meal.carbs,
          fat: meal.fat,
          ingredients: meal.ingredients,
          preparationSteps: meal.preparationSteps,
          preparationTime: meal.preparationTime,
          healthBenefits: meal.healthBenefits,
        })),
      };
    }),
    originalPlanObject,
  };
}

/**
 * Extract structured health benefits
 * @param {Array} rawBenefits - Raw health benefits
 * @param {Array} ingredients - Ingredients list
 * @returns {Array} - Structured health benefits
 */
function extractHealthBenefits(rawBenefits, ingredients) {

  const structuredBenefits = [];

  // If no raw benefits provided, return default
  if (!rawBenefits || rawBenefits.length === 0) {
    return ["Provides essential nutrients", "Supports overall health"];
  }

  // Helper function to clean and format benefits
  const cleanBenefit = (benefit) => {
    if (!benefit) return null;
    // Remove common prefixes
    let cleaned = benefit.trim()
      .replace(/^provides|^contains|^rich in|^high in|^good source of|^source of/i, '')
      .trim();

    // Capitalize first letter
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);

    // Return if it's substantive
    return cleaned.length > 3 ? cleaned : null;
  };

  // Process each raw benefit
  for (let benefit of rawBenefits) {
    // Skip if benefit is too long (likely copied text)
    if (benefit.length > 200) continue;


    const cleanedBenefit = cleanBenefit(benefit);
    if (cleanedBenefit) {
      structuredBenefits.push(cleanedBenefit);
    }
  }

  // Extract nutrients from ingredients if benefits are still empty
  if (structuredBenefits.length === 0 && ingredients && ingredients.length > 0) {
    // Common nutrient-rich ingredients and their benefits
    const ingredientMap = {
      'avocado': ['Healthy fats', 'Vitamin E', 'Potassium'],
      'spinach': ['Iron', 'Vitamin K', 'Folate'],
      'berries': ['Antioxidants', 'Vitamin C', 'Fiber'],
      'yogurt': ['Calcium', 'Probiotics', 'Protein'],
      'oats': ['Fiber', 'Complex carbohydrates', 'B vitamins'],
      'nuts': ['Healthy fats', 'Protein', 'Vitamin E'],
      'seeds': ['Omega-3 fatty acids', 'Fiber', 'Protein'],
      'salmon': ['Omega-3 fatty acids', 'Protein', 'Vitamin D'],
      'chicken': ['Lean protein', 'B vitamins', 'Selenium'],
      'beans': ['Plant protein', 'Fiber', 'Iron'],
      'quinoa': ['Complete protein', 'Fiber', 'Magnesium'],
      'sweet potato': ['Vitamin A', 'Fiber', 'Potassium'],
      'tofu': ['Plant protein', 'Calcium', 'Iron'],
      'olive oil': ['Monounsaturated fats', 'Vitamin E', 'Antioxidants'],
      'whole grain': ['Fiber', 'B vitamins', 'Minerals'],
      'tomato': ['Lycopene', 'Vitamin C', 'Potassium'],
      'garlic': ['Allicin (antimicrobial)', 'Antioxidants', 'Immune support'],
      'greek yogurt': ['Protein', 'Calcium', 'Probiotics'],
      'cottage cheese': ['Casein protein', 'Calcium', 'Selenium'],
      'chia': ['Omega-3 fatty acids', 'Fiber', 'Calcium'],
      'flax': ['Omega-3 fatty acids', 'Lignans', 'Fiber'],
      'tuna': ['Lean protein', 'Omega-3 fatty acids', 'Vitamin D'],
      'bell pepper': ['Vitamin C', 'Vitamin A', 'Antioxidants'],
      'broccoli': ['Vitamin C', 'Vitamin K', 'Folate'],
      'lentils': ['Plant protein', 'Fiber', 'Iron'],
    };

    // Go through ingredients and add related benefits
    const addedBenefits = new Set();
    for (let ingredient of ingredients) {
      const ingredientLower = ingredient.toLowerCase();
      // Check if any key term is in the ingredient
      for (const [key, benefits] of Object.entries(ingredientMap)) {
        if (ingredientLower.includes(key)) {
          benefits.forEach(benefit => {
            if (!addedBenefits.has(benefit)) {
              structuredBenefits.push(benefit);
              addedBenefits.add(benefit);
            }
          });
        }
      }
    }
  }

  // If still no benefits found, add generic ones
  if (structuredBenefits.length === 0) {
    return ["Rich in essential nutrients", "Supports overall health", "Provides balanced nutrition"];
  }

  // Limit to 5 benefits
  return structuredBenefits.slice(0, 5);
}

/**
 * Simulate external search API call (replace with actual implementation in production)
 * @param {String} query - Search query
 * @param {Object} options - Search options
 * @returns {Promise<Object>} - Search results
 */
async function tavilySearch(query, options = {}) {
  console.log(`Searching for: ${query} with options:`, options);

  // This is a mock implementation, replace with actual API call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        answer: `Recipe for ${query.split(' ').slice(2).join(' ')}.

        Ingredients:
        - 4 oz protein
        - 1 cup vegetables
        - 1/2 cup grains
        - 1 tbsp healthy fats
        - Herbs and spices to taste

        Instructions:
        1. Prepare all ingredients.
        2. Cook protein until done.
        3. Add vegetables and cook until tender.
        4. Add grains and seasonings.
        5. Serve hot.

        Health Benefits:
        - Rich in protein for muscle health
        - Contains fiber for digestive health
        - Provides complex carbohydrates for energy
        - Includes healthy fats for nutrient absorption

        Preparation Time: 20 minutes

        Nutritional Information:
        - Calories: varies based on specific ingredients
        - Protein: varies based on specific ingredients
        - Carbs: varies based on specific ingredients
        - Fat: varies based on specific ingredients`,

        query,
        results: [
          { title: "Recipe Result 1", url: "https://example.com/recipe1" },
          { title: "Recipe Result 2", url: "https://example.com/recipe2" }
        ]
      });
    }, 500); // Simulate network delay
  });
}


router.get('/test-tavily', async (req, res) => {
  try {
    const testQuery = "healthy oatmeal with berries recipe ingredients";
    const result = await tavilySearch(testQuery, { searchDepth: "advanced", maxResults: 3 });
    return res.status(200).json({
      message: "Tavily test completed successfully",
      data: result,
    });
  } catch (error) {
    return sendErrorResponse(res, 500, "Error testing Tavily", error);
  }
});

/**
 * Refresh a specific meal's recipe using Tavily
 */
router.post('/meal/refresh', async (req, res) => {
  try {
    const { mealId } = refreshMealSchema.parse(req.body);
    const meal = await prisma.meal.findUnique({ where: { id: mealId } });

    if (!meal) {
      return sendErrorResponse(res, 404, "Meal not found");
    }

    const tavilyQuery = `detailed recipe for ${meal.name} with ingredients, preparation steps, nutritional information, and health benefits`;
    let ingredients = meal.ingredients;
    let preparationSteps = meal.preparationSteps;
    let healthBenefits = meal.healthBenefits;
    let description = meal.description;
    let prepTime = meal.preparationTime;
    let calories = meal.calories;
    let protein = meal.protein;
    let carbs = meal.carbs;
    let fat = meal.fat;

    try {
      const searchResult = await tavilySearch(tavilyQuery, { searchDepth: "advanced", maxResults: 3 });
      if (searchResult?.answer) {
        const answer = searchResult.answer;

        // Extract ingredients
        const ingredientsRegexOptions = [
          /ingredients[:\n]+((?:[-•*]\s*.*?(?:\n|$))+)/is,
          /ingredients[:\n]+(.*?)(?:\n\n|\n(?=\w+:))/is,
          /what you('ll| will) need[:\n]+((?:[-•*]\s*.*?(?:\n|$))+)/is,
        ];
        for (const regex of ingredientsRegexOptions) {
          const match = answer.match(regex);
          if (match?.[1]) {
            const bulletedItems = match[1].match(/[-•*]\s*(.*?)(?=\n[-•*]|$)/gs);
            if (bulletedItems?.length) {
              ingredients = bulletedItems.map(item => item.replace(/[-•*]\s*/, '').trim()).filter(Boolean);
              break;
            }
            const lines = match[1].split('\n').map(line => line.trim()).filter(Boolean);
            if (lines.length) {
              ingredients = lines;
              break;
            }
          }
        }

        // Extract preparation steps
        const stepsRegexOptions = [
          /(?:instructions|directions|preparation|method)[:\n]+((?:(?:\d+\.|\-|•|\*)\s*.*?(?:\n|$))+)/is,
          /(?:instructions|directions|preparation|method)[:\n]+(.*?)(?:\n\n|\n(?=\w+:))/is,
        ];
        for (const regex of stepsRegexOptions) {
          const match = answer.match(regex);
          if (match?.[1]) {
            const numberedItems = match[1].match(/(?:\d+\.|\-|•|\*)\s*(.*?)(?=\n(?:\d+\.|\-|•|\*)|$)/gs);
            if (numberedItems?.length) {
              preparationSteps = numberedItems.map(item => item.replace(/(?:\d+\.|\-|•|\*)\s*/, '').trim()).filter(Boolean);
              break;
            }
            const lines = match[1].split('\n').map(line => line.trim()).filter(Boolean);
            if (lines.length) {
              preparationSteps = lines;
              break;
            }
          }
        }

        // Extract description
        const descriptionRegexOptions = [/description[:\n]+(.*?)(?:\n\n|\n(?=\w+:))/is, /about[:\n]+(.*?)(?:\n\n|\n(?=\w+:))/is];
        for (const regex of descriptionRegexOptions) {
          const match = answer.match(regex);
          if (match?.[1]?.trim()) {
            description = match[1].trim();
            break;
          }
        }
        if (description === meal.description) {
          const firstParagraph = answer.split('\n\n')[0].trim();
          if (firstParagraph && firstParagraph.length < 200 && !firstParagraph.toLowerCase().startsWith('ingredients')) {
            description = firstParagraph;
          }
        }

        // Extract health benefits
        const benefitsRegexOptions = [
          /(?:benefits|health benefits|nutritional benefits)[:\n]+((?:[-•*]\s*.*?(?:\n|$))+)/is,
          /(?:benefits|health benefits|nutritional benefits)[:\n]+(.*?)(?:\n\n|\n(?=\w+:))/is,
        ];
        for (const regex of benefitsRegexOptions) {
          const match = answer.match(regex);
          if (match?.[1]) {
            const bulletedItems = match[1].match(/[-•*]\s*(.*?)(?=\n[-•*]|$)/gs);
            if (bulletedItems?.length) {
              healthBenefits = bulletedItems.map(item => item.replace(/[-•*]\s*/, '').trim()).filter(Boolean);
              break;
            }
            const lines = match[1].split('\n').map(line => line.trim()).filter(Boolean);
            if (lines.length) {
              healthBenefits = lines;
              break;
            }
          }
        }
        if (!healthBenefits.length && answer.includes('benefit')) {
          const sentences = answer.match(/[^.!?]+(?:[.!?]+(?=\s|$))/g) || [];
          healthBenefits = sentences
            .filter(sentence => sentence.toLowerCase().includes('benefit'))
            .map(sentence => sentence.trim());
        }

        // Extract preparation time
        const prepTimeMatch = answer.match(/(?:prep time|preparation time|cooking time|total time)[:\s]+(?:about\s+)?(\d+)(?:\s*-\s*\d+)?\s*(?:min|minute)/i);
        if (prepTimeMatch?.[1]) {
          prepTime = parseInt(prepTimeMatch[1]);
        }

        // Extract nutritional information
        const nutritionMatch = answer.match(/(?:nutrition|nutritional information)[:\n]+(.*?)(?:\n\n|\n(?=\w+:)|$)/is);
        if (nutritionMatch?.[1]) {
          const nutritionText = nutritionMatch[1];
          const caloriesMatch = nutritionText.match(/calories?[:\s]+(?:about\s+)?(\d+)/i);
          if (caloriesMatch?.[1]) calories = parseInt(caloriesMatch[1]);
          const proteinMatch = nutritionText.match(/protein[:\s]+(?:about\s+)?(\d+)(?:\.\d+)?\s*g/i);
          if (proteinMatch?.[1]) protein = parseInt(proteinMatch[1]);
          const carbsMatch = nutritionText.match(/(?:carbs|carbohydrates)[:\s]+(?:about\s+)?(\d+)(?:\.\d+)?\s*g/i);
          if (carbsMatch?.[1]) carbs = parseInt(carbsMatch[1]);
          const fatMatch = nutritionText.match(/fat[:\s]+(?:about\s+)?(\d+)(?:\.\d+)?\s*g/i);
          if (fatMatch?.[1]) fat = parseInt(fatMatch[1]);
        }
      }

      const updatedMeal = await prisma.meal.update({
        where: { id: meal.id },
        data: {
          description,
          ingredients,
          preparationSteps,
          healthBenefits,
          preparationTime: prepTime,
          calories,
          protein,
          carbs,
          fat,
        },
      });

      return res.status(200).json({
        message: "Recipe details updated successfully",
        data: updatedMeal,
      });
    } catch (tavilyError) {
      console.error('Error fetching recipe from Tavily:', tavilyError);
      return res.status(200).json({
        message: "Could not fetch additional recipe details",
        data: meal,
        error: tavilyError.message,
      });
    }
  } catch (error) {
    return sendErrorResponse(res, 500, "Error updating recipe details", error);
  }
});

/**
 * Refresh all recipe details in a meal plan using Tavily
 */
router.post('/mealplan/refresh-recipes', async (req, res) => {
  try {
    const { clerkId, mealPlanId } = refreshMealPlanSchema.parse(req.body);

    let mealPlan;
    if (mealPlanId) {
      mealPlan = await prisma.mealPlan.findUnique({
        where: { id: mealPlanId },
        include: { dailyPlans: { include: { meals: true } } },
      });
    } else {
      const user = await prisma.user.findUnique({ where: { clerkId } });
      if (!user) {
        return sendErrorResponse(res, 404, "User not found");
      }
      mealPlan = await prisma.mealPlan.findFirst({
        where: { userId: user.id },
        include: { dailyPlans: { include: { meals: true } } },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (!mealPlan) {
      return sendErrorResponse(res, 404, "Meal plan not found");
    }

    const uniqueMeals = new Map();
    mealPlan.dailyPlans.forEach(dailyPlan => {
      dailyPlan.meals.forEach(meal => {
        if (!uniqueMeals.has(meal.name)) {
          uniqueMeals.set(meal.name, meal);
        }
      });
    });

    const updatedMeals = [];
    const failedMeals = [];

    for (const meal of uniqueMeals.values()) {
      try {
        const tavilyQuery = `detailed recipe for ${meal.name} with ingredients, preparation steps, and nutritional information`;
        const searchResult = await tavilySearch(tavilyQuery, { searchDepth: "advanced", maxResults: 3 });

        let ingredients = meal.ingredients;
        let preparationSteps = meal.preparationSteps;

        if (searchResult?.answer) {
          const answer = searchResult.answer;

          // Extract ingredients
          const ingredientsRegexOptions = [
            /ingredients[:\n]+((?:[-•*]\s*.*?(?:\n|$))+)/is,
            /ingredients[:\n]+(.*?)(?:\n\n|\n(?=\w+:))/is,
            /what you('ll| will) need[:\n]+((?:[-•*]\s*.*?(?:\n|$))+)/is,
          ];
          for (const regex of ingredientsRegexOptions) {
            const match = answer.match(regex);
            if (match?.[1]) {
              const bulletedItems = match[1].match(/[-•*]\s*(.*?)(?=\n[-•*]|$)/gs);
              if (bulletedItems?.length) {
                ingredients = bulletedItems.map(item => item.replace(/[-•*]\s*/, '').trim()).filter(Boolean);
                break;
              }
              const lines = match[1].split('\n').map(line => line.trim()).filter(Boolean);
              if (lines.length) {
                ingredients = lines;
                break;
              }
            }
          }

          // Extract preparation steps
          const stepsRegexOptions = [
            /(?:instructions|directions|preparation|method)[:\n]+((?:(?:\d+\.|\-|•|\*)\s*.*?(?:\n|$))+)/is,
            /(?:instructions|directions|preparation|method)[:\n]+(.*?)(?:\n\n|\n(?=\w+:))/is,
          ];
          for (const regex of stepsRegexOptions) {
            const match = answer.match(regex);
            if (match?.[1]) {
              const numberedItems = match[1].match(/(?:\d+\.|\-|•|\*)\s*(.*?)(?=\n(?:\d+\.|\-|•|\*)|$)/gs);
              if (numberedItems?.length) {
                preparationSteps = numberedItems.map(item => item.replace(/(?:\d+\.|\-|•|\*)\s*/, '').trim()).filter(Boolean);
                break;
              }
              const lines = match[1].split('\n').map(line => line.trim()).filter(Boolean);
              if (lines.length) {
                preparationSteps = lines;
                break;
              }
            }
          }

          const mealsToUpdate = await prisma.meal.findMany({
            where: { name: meal.name, dailyPlan: { mealPlanId: mealPlan.id } },
          });

          for (const mealToUpdate of mealsToUpdate) {
            const updatedMeal = await prisma.meal.update({
              where: { id: mealToUpdate.id },
              data: { ingredients, preparationSteps },
            });
            updatedMeals.push(updatedMeal);
          }
        } else {
          failedMeals.push(meal.name);
        }
      } catch (mealError) {
        console.error(`Error updating meal ${meal.name}:`, mealError);
        failedMeals.push(meal.name);
      }
    }

    return res.status(200).json({
      message: "Recipe details refreshed successfully",
      data: {
        mealsUpdated: updatedMeals.length,
        totalMeals: uniqueMeals.size,
        failedMeals,
      },
    });
  } catch (error) {
    return sendErrorResponse(res, 500, "Error refreshing recipe details", error);
  }
});

/**
 * Get the current meal plan for a user
 */
router.post('/mealplan', async (req, res) => {
  try {
    const { clerkId } = getMealPlanSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { clerkId } });

    if (!user) {
      return sendErrorResponse(res, 404, "User not found");
    }

    const mealPlan = await prisma.mealPlan.findUnique({
      where: { userId: user.id },
      include: {
        dailyPlans: {
          include: { meals: true },
          orderBy: { day: 'asc' },
        },
      },
    });

    if (!mealPlan) {
      return sendErrorResponse(res, 404, "No meal plan found for this user");
    }

    let originalPlanObject = {};
    try {
      originalPlanObject = JSON.parse(mealPlan.originalPlanText);
    } catch (error) {
      console.error('Error parsing originalPlanText:', error);
      originalPlanObject = {
        title: "Meal Plan",
        summary: "A balanced meal plan for your health goals.",
        nutritionStrategy: [],
        mealPrepTips: [],
        foodsToEmphasize: [],
        foodsToAvoid: [],
        hydrationRecommendations: [],
        dailyPlans: [],
        importantConsiderations: [],
      };
    }

    const responseData = {
      ...mealPlan,
      originalPlanObject,
    };
    delete responseData.originalPlanText;

    return res.status(200).json({
      message: "Meal plan retrieved successfully",
      data: responseData,
    });
  } catch (error) {
    return sendErrorResponse(res, 500, "Error retrieving meal plan", error);
  }
});


router.post('/mealplan/day', async (req, res) => {
  try {
    const { clerkId, day } = getMealPlanDaySchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { clerkId } });

    if (!user) {
      return sendErrorResponse(res, 404, "User not found");
    }

    const mealPlan = await prisma.mealPlan.findUnique({ where: { userId: user.id } });

    if (!mealPlan) {
      return sendErrorResponse(res, 404, "No meal plan found for this user");
    }

    const dailyPlan = await prisma.dailyMealPlan.findUnique({
      where: { mealPlanId_day: { mealPlanId: mealPlan.id, day } },
      include: { meals: true },
    });

    if (!dailyPlan) {
      return sendErrorResponse(res, 404, `Day ${day} not found in the meal plan`);
    }

    return res.status(200).json({
      message: `Day ${day} retrieved successfully`,
      data: dailyPlan,
    });
  } catch (error) {
    return sendErrorResponse(res, 500, "Error retrieving meal plan day", error);
  }
});

export default router;