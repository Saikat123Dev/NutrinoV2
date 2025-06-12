// Enhanced Nutrition Calculator with Gemini AI Integration - ES Modules Version
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Generate AI-enhanced nutrition recommendations for a user
 * @param {Object} userDetails - Complete user profile including health data
 * @param {string} geminiApiKey - Your Google Gemini API key
 * @returns {Promise<Object>} Enhanced nutrition recommendations with AI insights
 */
export async function generateNutritionPlan(userDetails, geminiApiKey) {
  // Initialize Gemini AI
  const genAI = new GoogleGenerativeAI(geminiApiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

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

  function generateHealthProfilePrompt(userDetails) {
    const { healthProfile, badHabits, sleepPatterns, stressFactors, HealthReport } = userDetails;
    
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

CURRENT HEALTH CONCERNS:
${HealthReport?.areasForImprovement?.map(area => `- ${area}`).join('\n') || '- General health optimization'}

Please provide EXACT numerical values for:
1. Daily Calorie Target (consider weight management, medical conditions, and lifestyle)
2. Protein Target (grams) - considering muscle maintenance, medical conditions, and activity
3. Carbohydrate Target (grams) - optimized for energy needs and health conditions
4. Fat Target (grams) - focusing on heart-healthy fats
5. Fiber Target (grams) - for digestive health and cardiovascular benefits
6. Sodium Limit (mg) - considering any cardiovascular conditions
7. Potassium Target (mg) - essential for overall health
8. Magnesium Target (mg) - for cardiovascular and general health

CRITICAL CONSIDERATIONS:
- Address specific medical conditions through nutrition
- Support lifestyle improvements through balanced nutrition
- Consider digestive health optimization
- Account for stress management through stable blood sugar

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
  "rationale": {
    "calories": "explanation",
    "macronutrients": "explanation",
    "micronutrients": "explanation",
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
      const prompt = generateHealthProfilePrompt(userDetails);
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      throw new Error('No valid JSON response from AI');
    } catch (error) {
      console.error('AI recommendation error:', error);
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
    
    // Adjust for medical conditions
    let calorieAdjustment = 1.0;
    
    // Check for hypertension or cardiovascular conditions
    if (healthProfile.medicalConditions?.some(condition => 
        condition.toLowerCase().includes('hypertension') || 
        condition.toLowerCase().includes('cardiovascular'))) {
      calorieAdjustment *= 0.95;
    }
    
    const targetCalories = Math.round(tdee * calorieAdjustment);
    
    return {
      calories: targetCalories,
      protein: Math.round(healthProfile.weight * 1.6),
      carbohydrates: Math.round(targetCalories * 0.45 / 4),
      fat: Math.round(targetCalories * 0.25 / 9),
      fiber: 35,
      sodium: healthProfile.medicalConditions?.includes('Hypertension') ? 1500 : 2300,
      potassium: 4700,
      magnesium: healthProfile.gender === 'MALE' ? 420 : 320,
      rationale: {
        calories: "Calculated using Mifflin-St Jeor equation with activity and health adjustments",
        macronutrients: "Balanced distribution optimized for health conditions",
        micronutrients: "Tailored for specific medical conditions and general health",
        medicalConsiderations: "Conservative approach considering medical history"
      },
      specificRecommendations: [
        "Focus on whole, unprocessed foods for optimal nutrition",
        "Stay hydrated and monitor portion sizes",
        "Consider medical conditions in food choices"
      ]
    };
  }

  async function generateMealPlan(userDetails, nutritionTargets) {
    const mealPlanPrompt = `Based on these nutrition targets and health profile, create a practical meal plan:

NUTRITION TARGETS:
- Calories: ${nutritionTargets.calories}
- Protein: ${nutritionTargets.protein}g
- Carbs: ${nutritionTargets.carbohydrates}g  
- Fat: ${nutritionTargets.fat}g
- Fiber: ${nutritionTargets.fiber}g
- Sodium: <${nutritionTargets.sodium}mg
- Potassium: ${nutritionTargets.potassium}mg

MEDICAL CONDITIONS: ${userDetails.healthProfile.medicalConditions?.join(', ') || 'None'}
DIETARY RESTRICTIONS: ${userDetails.healthProfile.foodAllergies?.join(', ') || 'None'}

Create a practical, balanced meal plan with specific focus on:
1. Meeting nutritional targets
2. Supporting health conditions through nutrition
3. Providing variety and sustainability
4. Including culturally appropriate foods

Provide 3 meals + 2 snacks per day with general nutritional guidance.`;

    try {
      const result = await model.generateContent(mealPlanPrompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Meal plan generation error:', error);
      return getBasicMealPlan(nutritionTargets);
    }
  }

  function getBasicMealPlan(nutritionTargets) {
    return `Basic meal plan structure:
    
Breakfast: ~${Math.round(nutritionTargets.calories * 0.25)} calories
- Whole grain cereal with milk and fruit
- Or oatmeal with nuts and berries

Lunch: ~${Math.round(nutritionTargets.calories * 0.35)} calories  
- Lean protein with vegetables and whole grains
- Large salad with olive oil dressing

Dinner: ~${Math.round(nutritionTargets.calories * 0.30)} calories
- Fish or chicken with steamed vegetables
- Brown rice or quinoa

Snacks: ~${Math.round(nutritionTargets.calories * 0.10)} calories
- Nuts, fruits, or yogurt

Focus on nutrient-dense foods that support your health goals.`;
  }

  function generateHealthInsights(userDetails, aiRecommendations) {
    const insights = [];
    const medicalConditions = userDetails.healthProfile.medicalConditions || [];
    
    // Cardiovascular health insights
    if (medicalConditions.some(condition => 
        condition.toLowerCase().includes('hypertension') || 
        condition.toLowerCase().includes('cardiovascular'))) {
      insights.push({
        category: 'Cardiovascular Health',
        priority: 'HIGH',
        insight: `Sodium restricted to ${aiRecommendations.sodium}mg/day. Potassium increased to ${aiRecommendations.potassium}mg for optimal cardiovascular health.`,
        actionItems: [
          'Monitor blood pressure regularly',
          'Track sodium intake carefully',
          'Include potassium-rich foods (bananas, spinach, sweet potatoes)'
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
        insight: 'Anti-inflammatory nutrition approach to support respiratory function.',
        actionItems: [
          'Include omega-3 rich foods (fish, walnuts, flaxseeds)',
          'Avoid potential food triggers',
          'Maintain adequate magnesium intake'
        ]
      });
    }

    // General health insights
    insights.push({
      category: 'General Health',
      priority: 'MEDIUM',
      insight: 'Balanced nutrition plan to support overall wellness and energy levels.',
      actionItems: [
        'Eat regular, balanced meals',
        'Stay hydrated throughout the day',
        'Include a variety of colorful fruits and vegetables'
      ]
    });

    return insights;
  }

  function getMonitoringRecommendations(userDetails) {
    const recommendations = [];

    recommendations.push({
      metric: 'Weight',
      frequency: 'Weekly',
      target: 'Maintain healthy BMI range',
      notes: 'Same day/time weekly, track trends not daily fluctuations'
    });

    // Add specific monitoring based on conditions
    if (userDetails.healthProfile.medicalConditions?.includes('Hypertension')) {
      recommendations.push({
        metric: 'Blood Pressure',
        frequency: 'Daily',
        target: '<120/80 mmHg',
        notes: 'Monitor at same time daily, track trends'
      });
    }

    if (userDetails.healthProfile.medicalConditions?.includes('Asthma')) {
      recommendations.push({
        metric: 'Peak Flow (if applicable)',
        frequency: 'As directed by physician',
        target: 'Personal best range',
        notes: 'Record any triggers or symptoms'
      });
    }

    return recommendations;
  }

  // Main processing logic
  try {
    console.log('Processing nutrition data for:', userDetails.name);
    
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
      message: "Enhanced nutrition plan generated successfully",
      data: {
        userProfile: {
          name: userDetails.name,
          email: userDetails.email
        },
        nutritionTargets: aiRecommendations,
        metabolicData: {
          bmr: Math.round(bmr),
          tdee: Math.round(tdee),
          bmi: parseFloat((userDetails.healthProfile.weight / 
            Math.pow(userDetails.healthProfile.height/100, 2)).toFixed(1))
        },
        mealPlanSuggestions,
        healthInsights: generateHealthInsights(userDetails, aiRecommendations),
        monitoringRecommendations: getMonitoringRecommendations(userDetails),
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

// Example usage function
export async function exampleUsage() {
  const sampleUserData = {
    name: "SAIKAT BERA",
    email: "sb2621@it.jgec.ac.in",
    healthProfile: {
      age: 35,
      gender: "MALE",
      height: 175.5,
      weight: 70.3,
      activityLevel: "MODERATELY_ACTIVE",
      medicalConditions: ["Asthma", "Hypertension"],
      allergies: ["Pollen", "Dust"],
      foodAllergies: [],
      digestiveIssues: ["Occasional bloating"]
    },
    badHabits: [{
      habitType: "Smoking",
      frequency: "DAILY",
      quantityPerOccasion: 10,
      unit: "cigarettes"
    }],
    sleepPatterns: [{
      averageHours: 8,
      sleepQuality: "GOOD"
    }],
    stressFactors: [{
      stressLevel: 7,
      stressType: "Work"
    }],
    HealthReport: {
      areasForImprovement: [
        "Cigarette smoking",
        "Hypertension management", 
        "Stress level",
        "Occasional digestive bloating"
      ]
    }
  };

  const apiKey = 'AIzaSyAVpe4Fu3Eic4VPKpHRzyt9kye6mT9UrFQ';
  const result = await generateNutritionPlan(sampleUserData, apiKey);
  console.log('Nutrition Plan Result:', result);
  return result;
}