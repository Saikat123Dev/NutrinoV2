import { Router } from "express";
import geminiAI from "../lib/AI.js";
import prisma from "../lib/db.js";

const router = Router();



// Generate health report feedback using Gemini AI and save to database
router.post('/health', async (req, res) => {
  try {
    const { clerkId } = req.body;

    // Get user details with health information
    const userDetails = await prisma.user.findUnique({
      where: {
        clerkId: clerkId
      },
      include: {
        healthProfile: true,
        badHabits: true,
        sleepPatterns: true,
        stressFactors: true,
        mentalHealth: true,
        HealthReport: true, // Include existing health report if any
      }
    });

    if (!userDetails) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if there's a recent report (less than 7 days old)
    const hasRecentReport = userDetails.HealthReport &&
      (new Date() - new Date(userDetails.HealthReport.generatedAt)) / (1000 * 60 * 60 * 24) < 7;

    // If there's a recent report, return it
    if (hasRecentReport) {
      return res.status(200).json({
        message: "Retrieved existing health report",
        data: {
          userDetails: userDetails,
          healthReport: userDetails.HealthReport.originalReportText,
          structuredReport: {
            strengths: userDetails.HealthReport.strengths,
            areasForImprovement: userDetails.HealthReport.areasForImprovement,
            smokingCessation: userDetails.HealthReport.smokingCessation,
            hypertensionManagement: userDetails.HealthReport.hypertensionManagement,
            asthmaManagement: userDetails.HealthReport.asthmaManagement,
            stressManagement: userDetails.HealthReport.stressManagement,
            digestiveHealth: userDetails.HealthReport.digestiveHealth,
            sleepRecommendations: userDetails.HealthReport.sleepRecommendations,
            healthRisks: userDetails.HealthReport.healthRisks,
            medicalAdvice: userDetails.HealthReport.medicalAdvice,
            lifestyleModifications: userDetails.HealthReport.lifestyleModifications
          }
        }
      });
    }

    // Prepare prompt for Gemini AI
    const prompt = `
    Generate a comprehensive health report and personalized feedback based on the following user health data:

    USER PROFILE:
    Name: ${userDetails.name}
    Age: ${userDetails.healthProfile?.age || 'Not specified'}
    Gender: ${userDetails.healthProfile?.gender || 'Not specified'}

    PHYSICAL METRICS:
    Height: ${userDetails.healthProfile?.height || 'Not specified'} cm
    Weight: ${userDetails.healthProfile?.weight || 'Not specified'} kg
    Activity Level: ${userDetails.healthProfile?.activityLevel || 'Not specified'}

    MEDICAL INFORMATION:
    Medical Conditions: ${userDetails.healthProfile?.medicalConditions?.join(', ') || 'None reported'}
    Allergies: ${userDetails.healthProfile?.allergies?.join(', ') || 'None reported'}
    Dietary Preferences: ${userDetails.healthProfile?.dietaryPreferences?.join(', ') || 'None reported'}
    Food Allergies: ${userDetails.healthProfile?.foodAllergies?.join(', ') || 'None reported'}
    Digestive Issues: ${userDetails.healthProfile?.digestiveIssues?.join(', ') || 'None reported'}

    LIFESTYLE HABITS:
    ${userDetails.badHabits?.map(habit =>
      `- ${habit.habitType}: ${habit.specificHabit}
       Frequency: ${habit.frequency}
       Quantity: ${habit.quantityPerOccasion} ${habit.unit} per occasion
       Duration: ${habit.duration} minutes
       Trigger Factors: ${habit.triggerFactors?.join(', ') || 'None specified'}
       Attempted Quitting: ${habit.attemptedQuitting ? 'Yes' : 'No'}
       Quitting Methods Tried: ${habit.quittingMethods?.join(', ') || 'None'}
       Self-rated Impact (1-10): ${habit.impactSelfRating}
       Notes: ${habit.notes || 'None'}`
    ).join('\n\n') || 'No habits reported'}

    SLEEP PATTERNS:
    ${userDetails.sleepPatterns?.map(sleep =>
      `- Average Hours: ${sleep.averageHours} hours
       Sleep Quality: ${sleep.sleepQuality}
       Bed Time: ${sleep.bedTime}
       Wake Time: ${sleep.wakeTime}
       Sleep Issues: ${sleep.sleepIssues?.join(', ') || 'None reported'}
       Use of Sleep Aids: ${sleep.useSleepAids ? 'Yes' : 'No'}
       Sleep Aid Types: ${sleep.sleepAidTypes?.join(', ') || 'None'}
       Screen Time Before Bed: ${sleep.screenTimeBeforeBed} minutes`
    ).join('\n\n') || 'No sleep data reported'}

    STRESS FACTORS:
    ${userDetails.stressFactors?.map(stress =>
      `- Stress Type: ${stress.stressType}
       Stress Level (1-10): ${stress.stressLevel}
       Frequency: ${stress.stressFrequency}
       Coping Mechanisms: ${stress.copingMechanisms?.join(', ') || 'None reported'}
       Physical Symptoms: ${stress.physicalSymptoms?.join(', ') || 'None reported'}`
    ).join('\n\n') || 'No stress data reported'}

    MENTAL HEALTH:
    ${userDetails.mentalHealth ?
      `- Mood Patterns: ${userDetails.mentalHealth.moodPatterns?.join(', ') || 'None reported'}
       Diagnosed Issues: ${userDetails.mentalHealth.diagnosedIssues?.join(', ') || 'None reported'}
       Therapy History: ${userDetails.mentalHealth.therapyHistory || 'None reported'}
       Medication: ${userDetails.mentalHealth.medication?.join(', ') || 'None reported'}
       Last Evaluation: ${userDetails.mentalHealth.lastEvaluation || 'Not specified'}`
    : 'No mental health data reported'}

    Please provide:
    1. A comprehensive health assessment summary
    2. Personalized recommendations for health improvement
    3. Analysis of potential health risks based on current habits
    4. Specific advice for managing identified medical conditions
    5. Lifestyle modifications to improve overall wellbeing

    Structure the report with clear headings and organize information in a user-friendly format. Include both strengths and areas for improvement.

    IMPORTANT: Also provide a JSON structure of your analysis that follows this exact format:
    {
      "strengths": ["strength1", "strength2", ...],
      "areasForImprovement": ["area1", "area2", ...],
      "smokingCessation": {
        "priority": number,
        "recommendations": ["rec1", "rec2", ...],
        "behavioralStrategies": ["strategy1", "strategy2", ...]
      },
      "hypertensionManagement": {
        "recommendations": ["rec1", "rec2", ...],
        "lifestyle": ["lifestyle1", "lifestyle2", ...],
        "medicationAdvice": "advice text"
      },
      "asthmaManagement": {
        "recommendations": ["rec1", "rec2", ...],
        "triggerAvoidance": ["trigger1", "trigger2", ...],
        "medicationAdvice": "advice text"
      },
      "stressManagement": {
        "techniques": ["technique1", "technique2", ...],
        "recommendations": ["rec1", "rec2", ...]
      },
      "digestiveHealth": {
        "recommendations": ["rec1", "rec2", ...],
        "dietaryChanges": ["change1", "change2", ...]
      },
      "sleepRecommendations": {
        "recommendations": ["rec1", "rec2", ...],
        "sleepHygieneAdvice": ["advice1", "advice2", ...]
      },
      "healthRisks": [
        {"condition": "condition1", "description": "description1", "preventionSteps": ["step1", "step2", ...]},
        {"condition": "condition2", "description": "description2", "preventionSteps": ["step1", "step2", ...]}
      ],
      "medicalAdvice": [
        {"condition": "condition1", "managementSteps": ["step1", "step2", ...], "medicationAdvice": "advice text"},
        {"condition": "condition2", "managementSteps": ["step1", "step2", ...], "medicationAdvice": "advice text"}
      ],
      "lifestyleModifications": [
        {"area": "area1", "recommendations": ["rec1", "rec2", ...]},
        {"area": "area2", "recommendations": ["rec1", "rec2", ...]}
      ]
    }

    Include only the sections that are relevant to this specific user based on their health data. Put this JSON at the end of your response, clearly separated from the text report.
    `;

    // Call Gemini API
    const { ai, model } = geminiAI;


    const result = await ai.models.generateContent({
      model: model,
      contents: prompt,
      maxOutputTokens: 3000,
      temperature: 0.7,
      topP: 0.9,
      topK: 40,
      stopSequences: ["```json"]
    });

    const fullText = result.text;

    // Extract the JSON structure from the response
    let structuredReport = {};
    try {
      // Find JSON part in the response (between the last set of triple backticks)
      const jsonMatch = fullText.match(/```json\s*([\s\S]*?)\s*```\s*$/);

      if (jsonMatch && jsonMatch[1]) {
        structuredReport = JSON.parse(jsonMatch[1]);
      } else {
        // Alternative method: Try to find JSON object between curly braces
        const jsonStartIndex = fullText.lastIndexOf('{');
        const jsonEndIndex = fullText.lastIndexOf('}') + 1;

        if (jsonStartIndex !== -1 && jsonEndIndex !== -1 && jsonEndIndex > jsonStartIndex) {
          const jsonPart = fullText.substring(jsonStartIndex, jsonEndIndex);
          structuredReport = JSON.parse(jsonPart);
        } else {
          console.warn('Could not extract JSON from Gemini response. Using default structure.');
          // Provide a basic structure based on the report text
          structuredReport = {
            strengths: [],
            areasForImprovement: [],
            healthRisks: [],
            medicalAdvice: [],
            lifestyleModifications: []
          };
        }
      }
    } catch (error) {
      console.error('Error parsing JSON from Gemini response:', error);
      // Provide a basic structure based on the report text
      structuredReport = {
        strengths: [],
        areasForImprovement: [],
        healthRisks: [],
        medicalAdvice: [],
        lifestyleModifications: []
      };
    }

    // Extract only the narrative report part (excluding JSON)
    const reportText = fullText.replace(/```json\s*[\s\S]*?\s*```\s*$/, '').trim();

    // Save the report to the database
    const healthReport = await prisma.healthReport.upsert({
      where: {
        userId: userDetails.id
      },
      update: {
        strengths: structuredReport.strengths || [],
        areasForImprovement: structuredReport.areasForImprovement || [],
        smokingCessation: structuredReport.smokingCessation || null,
        hypertensionManagement: structuredReport.hypertensionManagement || null,
        asthmaManagement: structuredReport.asthmaManagement || null,
        stressManagement: structuredReport.stressManagement || null,
        digestiveHealth: structuredReport.digestiveHealth || null,
        sleepRecommendations: structuredReport.sleepRecommendations || null,
        healthRisks: structuredReport.healthRisks || [],
        medicalAdvice: structuredReport.medicalAdvice || [],
        lifestyleModifications: structuredReport.lifestyleModifications || [],
        originalReportText: reportText,
        updatedAt: new Date()
      },
      create: {
        userId: userDetails.id,
        strengths: structuredReport.strengths || [],
        areasForImprovement: structuredReport.areasForImprovement || [],
        smokingCessation: structuredReport.smokingCessation || null,
        hypertensionManagement: structuredReport.hypertensionManagement || null,
        asthmaManagement: structuredReport.asthmaManagement || null,
        stressManagement: structuredReport.stressManagement || null,
        digestiveHealth: structuredReport.digestiveHealth || null,
        sleepRecommendations: structuredReport.sleepRecommendations || null,
        healthRisks: structuredReport.healthRisks || [],
        medicalAdvice: structuredReport.medicalAdvice || [],
        lifestyleModifications: structuredReport.lifestyleModifications || [],
        originalReportText: reportText
      }
    });

    // Return the generated health report
    return res.status(200).json({
      message: "Health report generated successfully",
      data: {
        userDetails: userDetails,
        healthReport: reportText,
        structuredReport: {
          strengths: healthReport.strengths,
          areasForImprovement: healthReport.areasForImprovement,
          smokingCessation: healthReport.smokingCessation,
          hypertensionManagement: healthReport.hypertensionManagement,
          asthmaManagement: healthReport.asthmaManagement,
          stressManagement: healthReport.stressManagement,
          digestiveHealth: healthReport.digestiveHealth,
          sleepRecommendations: healthReport.sleepRecommendations,
          healthRisks: healthReport.healthRisks,
          medicalAdvice: healthReport.medicalAdvice,
          lifestyleModifications: healthReport.lifestyleModifications
        }
      }
    });

  } catch (error) {
    console.error('Error generating health feedback:', error);
    return res.status(500).json({ message: 'Error generating health report', error: error.message });
  }
});

export default router;
