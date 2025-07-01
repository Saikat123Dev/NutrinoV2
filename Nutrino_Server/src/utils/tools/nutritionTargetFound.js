// Enhanced Nutrition Calculator with Gemini AI Integration and Water Intake - ES Modules Version
import { GoogleGenerativeAI } from '@google/generative-ai';
 const geminiApiKey = 'AIzaSyD6QUjfKI_F1jr65i0foMdAb4FgbZUGE4Y'; // Replace with your valid API key
  
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
- BMI: ${(healthProfile.weight / Math.pow(healthProfile.height/100, 2)).toFixed(1)}
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
      console.log(geminiApiKey)
      if (!geminiApiKey) {
        console.log('Invalid or missing Gemini API key, using enhanced fallback calculations');
        return getFallbackRecommendations(userDetails);
      }

      const prompt = generateHealthProfilePrompt(userDetails);
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const aiRecommendations = JSON.parse(jsonMatch[0]);
        
        // If AI didn't provide water intake, use calculated value
        if (!aiRecommendations.waterIntakeLiters) {
          const waterIntake = calculateWaterIntake(userDetails);
          aiRecommendations.waterIntakeLiters = waterIntake.dailyWaterIntakeLiters;
        }
        
        console.log('AI recommendations generated successfully');
        return aiRecommendations;
      }
      
      throw new Error('No valid JSON response from AI');
    } catch (error) {
      console.error('AI recommendation error:', error.message);
      console.log('Falling back to enhanced calculation-based recommendations');
      return getFallbackRecommendations(userDetails);
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
    
    // Check if API key is valid before attempting AI generation
    if (!geminiApiKey || geminiApiKey === 'YOUR_VALID_GEMINI_API_KEY_HERE' || geminiApiKey.length < 30) {
      console.log('Using fallback meal plan generation');
      return getBasicMealPlan(nutritionTargets, userDetails);
    }
    
    const mealPlanPrompt = `Based on these nutrition targets and health profile, create a practical meal plan:

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

Create a practical, balanced meal plan with specific focus on:
1. Meeting nutritional targets
2. Supporting health conditions through nutrition
3. Including hydration timing throughout the day
4. Providing variety and sustainability
5. Including culturally appropriate foods

Provide 3 meals + 2 snacks per day with general nutritional guidance and hydration schedule.`;

    try {
      const result = await model.generateContent(mealPlanPrompt);
      const response = await result.response;
      console.log('AI meal plan generated successfully');
      return response.text();
    } catch (error) {
      console.error('Meal plan generation error:', error.message);
      console.log('Falling back to structured meal plan');
      return getBasicMealPlan(nutritionTargets, userDetails);
    }
  }

  function getBasicMealPlan(nutritionTargets, userDetails) {
    const waterIntake = calculateWaterIntake(userDetails);
    
    return `Basic meal plan structure with hydration schedule:
    
HYDRATION SCHEDULE:
- Upon waking: 1-2 glasses (500ml) of water
- Pre-breakfast: 1 glass (250ml) 30 min before eating
- Mid-morning: 1-2 glasses (250-500ml)
- Pre-lunch: 1 glass (250ml) 30 min before eating
- Afternoon: 2-3 glasses (500-750ml)
- Pre-dinner: 1 glass (250ml) 30 min before eating
- Evening: 1-2 glasses (250-500ml), stop 2 hours before bed
- Total: ${waterIntake.dailyWaterIntakeLiters}L (${waterIntake.dailyWaterIntakeML}ml)

MEAL STRUCTURE:
Breakfast: ~${Math.round(nutritionTargets.calories * 0.25)} calories
- Whole grain cereal with milk and fruit
- Or oatmeal with nuts and berries
- Drink water 30 minutes before eating

Lunch: ~${Math.round(nutritionTargets.calories * 0.35)} calories  
- Lean protein with vegetables and whole grains
- Large salad with olive oil dressing
- Continue steady water intake

Dinner: ~${Math.round(nutritionTargets.calories * 0.30)} calories
- Fish or chicken with steamed vegetables
- Brown rice or quinoa
- Final water intake 2 hours before bed

Snacks: ~${Math.round(nutritionTargets.calories * 0.10)} calories
- Nuts, fruits, or yogurt
- Pair with water intake

Focus on nutrient-dense foods and consistent hydration that supports your health goals.`;
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
    
    // Get AI-powered nutrition targets
    const aiRecommendations = await getAINutritionTargets(userDetails);
    
    // Calculate metabolic data
    const bmr = calculateBMR(
      userDetails.healthProfile.weight,
      userDetails.healthProfile.height,
      userDetails.healthProfile.age,
      userDetails.healthProfile.gender
    );
    
    const tdee = calculateTDEE(bmr, userDetails.healthProfile.activityLevel);
    
    // Generate meal plan
    const mealPlanSuggestions = await generateMealPlan(userDetails, aiRecommendations);

    // Return comprehensive results
    return {
      success: true,
      message: geminiApiKey && geminiApiKey !== 'YOUR_VALID_GEMINI_API_KEY_HERE' && geminiApiKey.length > 30 ? 
        "Enhanced nutrition plan with hydration optimization generated successfully" : 
        "Enhanced nutrition plan with hydration optimization generated using evidence-based calculations (AI unavailable)",
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
            Math.pow(userDetails.healthProfile.height/100, 2)).toFixed(1))
        },
        mealPlanSuggestions,
        healthInsights: generateHealthInsights(userDetails, aiRecommendations),
        monitoringRecommendations: getMonitoringRecommendations(userDetails),
        calculationMethod: geminiApiKey && geminiApiKey !== 'YOUR_VALID_GEMINI_API_KEY_HERE' && geminiApiKey.length > 30 ? 'AI_ENHANCED' : 'EVIDENCE_BASED_CALCULATION',
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('Processing error:', error);
    return {
      success: false,
      message: `Failed to process nutrition data: ${error.message}`,
      error: error.message
    };
  }
}

