import express from 'express';
import prisma from '../lib/db.js';
const router = express.Router();

// Health Profile Routes
router.post('/healthprofile', async (req, res) => {
    try {
        const {
            email,
            age,
            gender,
            height,
            weight,
            activityLevel,
            medicalConditions,
            allergies,
            dietaryPreferences,
            foodAllergies,
            mealFrequency,
            waterIntake,
            pregnancyStatus,
            breastfeeding,
            recentSurgery,
            chronicPain,
            digestiveIssues
        } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'email is required' });
        }

        console.log('Looking for user with email:', email, 'Type:', typeof email);

        const user = await prisma.user.findUnique({
            where: { email: String(email) }
        });

        console.log('Found user:', user);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        const userId = user ? user.id : null;
        // Check if a profile already exists
        const existingProfile = await prisma.healthProfile.findUnique({
            where: { userId: parseInt(userId) }
        });

        let healthProfile;

        if (existingProfile) {
            // Update existing profile
            healthProfile = await prisma.healthProfile.update({
                where: { userId: parseInt(userId) },
                data: {
                    age: age !== undefined && age !== null && age !== '' ? parseInt(age) : undefined,
                    gender: gender !== undefined && gender !== '' ? gender : undefined,
                    height: height !== undefined && height !== null && height !== '' ? parseFloat(height) : undefined,
                    weight: weight !== undefined && weight !== null && weight !== '' ? parseFloat(weight) : undefined,
                    activityLevel: activityLevel !== undefined && activityLevel !== '' ? activityLevel : undefined,
                    medicalConditions: medicalConditions !== undefined ? medicalConditions : undefined,
                    allergies: allergies !== undefined ? allergies : undefined,
                    dietaryPreferences: dietaryPreferences !== undefined ? dietaryPreferences : undefined,
                    foodAllergies: foodAllergies !== undefined ? foodAllergies : undefined,
                    mealFrequency: mealFrequency !== undefined && mealFrequency !== '' ? mealFrequency : undefined,
                    waterIntake: waterIntake !== undefined && waterIntake !== null && waterIntake !== '' ? parseFloat(waterIntake) : undefined,
                    pregnancyStatus: pregnancyStatus !== undefined ? pregnancyStatus : undefined,
                    breastfeeding: breastfeeding !== undefined ? breastfeeding : undefined,
                    recentSurgery: recentSurgery !== undefined ? recentSurgery : undefined,
                    chronicPain: chronicPain !== undefined ? chronicPain : undefined,
                    digestiveIssues: digestiveIssues !== undefined ? digestiveIssues : undefined
                }
            });
        } else {
            // Create new profile
            healthProfile = await prisma.healthProfile.create({
                data: {
                    userId: parseInt(userId),
                    age: age && age !== '' ? parseInt(age) : null,
                    gender: gender || null,
                    height: height && height !== '' ? parseFloat(height) : null,
                    weight: weight && weight !== '' ? parseFloat(weight) : null,
                    activityLevel: activityLevel || null,
                    medicalConditions: medicalConditions || [],
                    allergies: allergies || [],
                    dietaryPreferences: dietaryPreferences || [],
                    foodAllergies: foodAllergies || [],
                    mealFrequency: mealFrequency || null,
                    waterIntake: waterIntake && waterIntake !== '' ? parseFloat(waterIntake) : null,
                    pregnancyStatus: pregnancyStatus || null,
                    breastfeeding: breastfeeding || null,
                    recentSurgery: recentSurgery || null,
                    chronicPain: chronicPain || null,
                    digestiveIssues: digestiveIssues || []
                }
            });
        }

        return res.status(200).json({
            success: true,
            message: existingProfile ? 'Health profile updated successfully' : 'Health profile created successfully',
            data: healthProfile
        });
    } catch (error) {
        console.error('Error handling health profile:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to process health profile',
            error: error.message
        });
    }
});

router.get('/healthprofile/:email', async (req, res) => {
    try {
        const email = req.params.email;

        console.log('GET HealthProfile: Looking for user with email:', email, 'Type:', typeof email);

        const user = await prisma.user.findUnique({
            where: { email: String(email) }
        });

        console.log('GET HealthProfile: Found user:', user);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        const userId = user ? user.id : null;
        const healthProfile = await prisma.healthProfile.findUnique({
            where: { userId: user.id },
        });

        return res.status(200).json({
            success: true,
            data: healthProfile || null
        });
    } catch (error) {
        console.error('Error fetching health profile:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch health profile',
            error: error.message
        });
    }
});

router.delete('/healthprofile/:email', async (req, res) => {
    try {
        const email = req.params.email;
        const user = await prisma.user.findUnique({
            where: { email: String(email) }
        });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        const existingProfile = await prisma.healthProfile.findUnique({
            where: { userId: user.id }
        });

        if (!existingProfile) {
            return res.status(404).json({
                success: false,
                message: 'Health profile not found'
            });
        }

        await prisma.healthProfile.delete({
            where: { userId: user.id }
        });

        return res.status(200).json({
            success: true,
            message: 'Health profile deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting health profile:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete health profile',
            error: error.message
        });
    }
});

router.post('/badhabit', async (req, res) => {
    try {
        const {
            email,
            habitType,
            specificHabit,
            habitFrequency,
            frequency, // fallback for backwards compatibility
            quantityPerOccasion,
            unit,
            habitDuration,
            duration, // fallback for backwards compatibility
            lastOccurrence,
            triggerFactors,
            attemptedQuitting,
            quittingMethods,
            impactSelfRating,
            notes
        } = req.body;

        // Validate required fields
        if (!email) {
            return res.status(400).json({ error: 'email is required' });
        }

        // Use habitFrequency if available, otherwise fall back to frequency
        const finalFrequency = habitFrequency || frequency;
        const finalDuration = habitDuration || duration;

        // Get the user by email
        console.log('BadHabit: Looking for user with email:', email, 'Type:', typeof email);

        const user = await prisma.user.findUnique({
            where: { email: String(email) }
        });

        console.log('BadHabit: Found user:', user);

        if (!user) {
            return res.status(404).json({ error: 'User not found with given email' });
        }

        const formattedLastOccurrence = lastOccurrence ? new Date(lastOccurrence) : undefined;

        // Check if bad habit already exists for this user
        const existingHabit = await prisma.badHabit.findFirst({
            where: { userId: user.id }
        });

        let habit;

        if (existingHabit) {
            // Update existing habit
            habit = await prisma.badHabit.update({
                where: { id: existingHabit.id },
                data: {
                    habitType: habitType || undefined,
                    specificHabit: specificHabit || undefined,
                    frequency: finalFrequency || undefined,
                    quantityPerOccasion: quantityPerOccasion && quantityPerOccasion !== '' ? parseFloat(quantityPerOccasion) : undefined,
                    unit: unit || undefined,
                    duration: finalDuration && finalDuration !== '' ? parseInt(finalDuration) : undefined,
                    lastOccurrence: formattedLastOccurrence,
                    triggerFactors: triggerFactors !== undefined ? triggerFactors : undefined,
                    attemptedQuitting: attemptedQuitting !== undefined ? attemptedQuitting : undefined,
                    quittingMethods: quittingMethods !== undefined ? quittingMethods : undefined,
                    impactSelfRating: impactSelfRating && impactSelfRating !== '' ? parseInt(impactSelfRating) : undefined,
                    notes: notes || undefined
                }
            });
        } else {
            // Create new habit
            habit = await prisma.badHabit.create({
                data: {
                    userId: user.id,
                    habitType: habitType || '',
                    specificHabit: specificHabit || '',
                    frequency: finalFrequency || 'RARELY',
                    quantityPerOccasion: quantityPerOccasion && quantityPerOccasion !== '' ? parseFloat(quantityPerOccasion) : null,
                    unit: unit || null,
                    duration: finalDuration && finalDuration !== '' ? parseInt(finalDuration) : null,
                    lastOccurrence: formattedLastOccurrence,
                    triggerFactors: triggerFactors || [],
                    attemptedQuitting: attemptedQuitting !== undefined ? attemptedQuitting : false,
                    quittingMethods: quittingMethods || [],
                    impactSelfRating: impactSelfRating && impactSelfRating !== '' ? parseInt(impactSelfRating) : null,
                    notes: notes || null
                }
            });
        }

        return res.status(200).json({
            success: true,
            message: existingHabit ? 'Bad habit updated successfully' : 'Bad habit created successfully',
            data: habit
        });
    } catch (error) {
        console.error('Error creating bad habit:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to create bad habit',
            error: error.message
        });
    }
});

router.get('/badhabit/:email', async (req, res) => {
    try {
        const email = req.params.email;
        const user = await prisma.user.findUnique({
            where: { email: String(email) }
        });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const habit = await prisma.badHabit.findFirst({
            where: { userId: user.id }
        });

        return res.status(200).json({
            success: true,
            data: habit || null
        });
    } catch (error) {
        console.error('Error fetching user bad habits:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch user bad habits',
            error: error.message
        });
    }
});

// Sleep Pattern Routes
router.post('/sleeppattern', async (req, res) => {
    try {
        const {
            email,
            averageHours,
            sleepQuality,
            bedTime,
            wakeTime,
            sleepIssues,
            useSleepAids,
            sleepAidTypes,
            screenTimeBeforeBed
        } = req.body;

        // Validate required field
        if (!email) {
            return res.status(400).json({ error: 'email is required' });
        }

        // Fetch user by email
        console.log('SleepPattern: Looking for user with email:', email, 'Type:', typeof email);

        const user = await prisma.user.findUnique({
            where: { email: String(email) }
        });

        console.log('SleepPattern: Found user:', user);

        if (!user) {
            return res.status(404).json({ error: 'User not found with given email' });
        }

        let sleepPattern;

        // Check if sleep pattern already exists for user
        const existingPattern = await prisma.sleepPattern.findUnique({
            where: { userId: user.id }
        });

        if (existingPattern) {
            // Update existing sleep pattern
            sleepPattern = await prisma.sleepPattern.update({
                where: { userId: user.id },
                data: {
                    averageHours: averageHours ? parseFloat(averageHours) : undefined,
                    sleepQuality: sleepQuality || undefined,
                    bedTime,
                    wakeTime,
                    sleepIssues: sleepIssues || undefined,
                    useSleepAids: useSleepAids !== undefined ? useSleepAids : undefined,
                    sleepAidTypes: sleepAidTypes || undefined,
                    screenTimeBeforeBed: screenTimeBeforeBed ? parseInt(screenTimeBeforeBed) : undefined
                }
            });
        } else {
            // Create new sleep pattern
            sleepPattern = await prisma.sleepPattern.create({
                data: {
                    userId: user.id,
                    averageHours: averageHours ? parseFloat(averageHours) : null,
                    sleepQuality,
                    bedTime,
                    wakeTime,
                    sleepIssues: sleepIssues || [],
                    useSleepAids: useSleepAids !== undefined ? useSleepAids : false,
                    sleepAidTypes: sleepAidTypes || [],
                    screenTimeBeforeBed: screenTimeBeforeBed ? parseInt(screenTimeBeforeBed) : null
                }
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Sleep pattern saved successfully',
            data: sleepPattern
        });
    } catch (error) {
        console.error('Error handling sleep pattern:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to process sleep pattern',
            error: error.message
        });
    }
});

router.get('/sleeppattern/:email', async (req, res) => {
    try {
        const email = req.params.email;
        const user = await prisma.user.findUnique({
            where: { email: String(email) }
        });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const sleepPattern = await prisma.sleepPattern.findUnique({
            where: { userId: user.id }
        });

        return res.status(200).json({
            success: true,
            data: sleepPattern || null
        });
    } catch (error) {
        console.error('Error fetching user sleep patterns:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch user sleep patterns',
            error: error.message
        });
    }
});

router.post('/stresssource', async (req, res) => {
    try {
        const {
            email,
            stressType,
            stressLevel,
            copingMechanisms,
            stressFrequency,
            physicalSymptoms
        } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'email is required' });
        }

        if (!stressType || !stressFrequency) {
            return res.status(400).json({ error: 'stressType and stressFrequency are required' });
        }

        // Find user by email
        console.log('StressSource: Looking for user with email:', email, 'Type:', typeof email);

        const user = await prisma.user.findUnique({
            where: { email: String(email) }
        });

        console.log('StressSource: Found user:', user);

        if (!user) {
            return res.status(404).json({ error: 'User not found with given email' });
        }

        // Check if stress source already exists
        const existing = await prisma.stressSource.findFirst({
            where: { userId: user.id }
        });

        let stressSource;

        if (existing) {
            // Update existing stress source
            stressSource = await prisma.stressSource.update({
                where: { id: existing.id },
                data: {
                    stressType,
                    stressLevel: stressLevel ? parseInt(stressLevel) : undefined,
                    copingMechanisms: copingMechanisms || undefined,
                    stressFrequency,
                    physicalSymptoms: physicalSymptoms || undefined
                }
            });
        } else {
            // Create new stress source
            stressSource = await prisma.stressSource.create({
                data: {
                    userId: user.id,
                    stressType,
                    stressLevel: stressLevel ? parseInt(stressLevel) : 1,
                    copingMechanisms: copingMechanisms || [],
                    stressFrequency,
                    physicalSymptoms: physicalSymptoms || []
                }
            });
        }

        return res.status(200).json({
            success: true,
            message: existing ? 'Stress source updated successfully' : 'Stress source created successfully',
            data: stressSource
        });
    } catch (error) {
        console.error('Error handling stress source:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to process stress source',
            error: error.message
        });
    }
});

router.get('/stresssource/:email', async (req, res) => {
    try {
        const email = req.params.email;
        const user = await prisma.user.findUnique({
            where: { email: String(email) }
        });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const stressSource = await prisma.stressSource.findFirst({
            where: { userId: user.id }
        });

        return res.status(200).json({
            success: true,
            data: stressSource || null
        });
    } catch (error) {
        console.error('Error fetching user stress sources:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch user stress sources',
            error: error.message
        });
    }
});

// Mental Health Routes
router.post('/mentalhealth', async (req, res) => {
    try {
        const {
            email,
            moodPatterns,
            diagnosedIssues,
            therapyHistory,
            medication,
            lastEvaluation
        } = req.body;

        // Validate required email
        if (!email) {
            return res.status(400).json({ error: 'email is required' });
        }

        // Find user by email
        console.log('MentalHealth: Looking for user with email:', email, 'Type:', typeof email);

        const user = await prisma.user.findUnique({
            where: { email: String(email) }
        });

        console.log('MentalHealth: Found user:', user);

        if (!user) {
            return res.status(404).json({ error: 'User not found with given email' });
        }

        // Format date
        const formattedLastEvaluation = lastEvaluation ? new Date(lastEvaluation) : undefined;

        const mentalHealth = await prisma.mentalHealth.upsert({
            where: { userId: user.id },
            update: {
                moodPatterns: moodPatterns || undefined,
                diagnosedIssues: diagnosedIssues || undefined,
                therapyHistory,
                medication: medication || undefined,
                lastEvaluation: formattedLastEvaluation
            },
            create: {
                userId: user.id,
                moodPatterns: moodPatterns || [],
                diagnosedIssues: diagnosedIssues || [],
                therapyHistory,
                medication: medication || [],
                lastEvaluation: formattedLastEvaluation
            }
        });

        return res.status(200).json({
            success: true,
            message: 'Mental health profile upserted successfully',
            data: mentalHealth
        });
    } catch (error) {
        console.error('Error handling mental health profile:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to process mental health profile',
            error: error.message
        });
    }
});


router.get('/mentalhealth/:email', async (req, res) => {
    try {
        const email = req.params.email;
        const user = await prisma.user.findUnique({
            where: { email: String(email) }
        });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const mentalHealth = await prisma.mentalHealth.findUnique({
            where: { userId: user.id }
        });

        return res.status(200).json({
            success: true,
            data: mentalHealth || null
        });
    } catch (error) {
        console.error('Error fetching mental health profile:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch mental health profile',
            error: error.message
        });
    }
});

router.delete('/mentalhealth/:email', async (req, res) => {
    try {
        const email = req.params.email;
        const user = await prisma.user.findUnique({
            where: { email: String(email) }
        });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const existingProfile = await prisma.mentalHealth.findUnique({
            where: { userId: user.id }
        });

        if (!existingProfile) {
            return res.status(404).json({
                success: false,
                message: 'Mental health profile not found'
            });
        }

        await prisma.mentalHealth.delete({
            where: { userId: user.id }
        });

        return res.status(200).json({
            success: true,
            message: 'Mental health profile deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting mental health profile:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete mental health profile',
            error: error.message
        });
    }
});

// Debug route to check users
router.get('/debug/users', async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                clerkId: true,
                name: true,
                email: true
            }
        });

        return res.status(200).json({
            success: true,
            data: users,
            count: users.length
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// User Routes
router.post('/user', async (req, res) => {
    try {
        const { name, email, clerkId } = req.body;

        if (!name || !email || !clerkId) {
            return res.status(400).json({ error: 'name, email, and clerkId are required' });
        }

        // Check if user with this email or clerkId already exists
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { email },
                    { clerkId }
                ]
            }
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'User with this email or clerkId already exists'
            });
        }

        const user = await prisma.user.create({
            data: {
                name,
                email,
                clerkId
            }
        });

        return res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: user
        });
    } catch (error) {
        console.error('Error creating user:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to create user',
            error: error.message
        });
    }
});

router.get('/user/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);

        const user = await prisma.user.findUnique({
            where: { id },
            include: {
                healthProfile: true,
                badHabits: true,
                substanceUse: true,
                sleepPatterns: true,
                stressFactors: true,
                mentalHealth: true
            }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        return res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('Error fetching user by clerk ID:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch user',
            error: error.message
        });
    }
});

router.put('/user/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { name, email } = req.body;

        const existingUser = await prisma.user.findUnique({
            where: { id }
        });

        if (!existingUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data: {
                name: name || undefined,
                email: email || undefined
            }
        });

        return res.status(200).json({
            success: true,
            message: 'User updated successfully',
            data: updatedUser
        });
    } catch (error) {
        console.error('Error updating user:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update user',
            error: error.message
        });
    }
});

router.delete('/user/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);

        const existingUser = await prisma.user.findUnique({
            where: { id }
        });

        if (!existingUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Delete all related records first to avoid foreign key constraints
        await prisma.$transaction([
            prisma.healthProfile.deleteMany({ where: { userId: id } }),
            prisma.mentalHealth.deleteMany({ where: { userId: id } }),
            prisma.badHabit.deleteMany({ where: { userId: id } }),
            prisma.substanceUse.deleteMany({ where: { userId: id } }),
            prisma.sleepPattern.deleteMany({ where: { userId: id } }),
            prisma.stressSource.deleteMany({ where: { userId: id } }),
            prisma.user.delete({ where: { id } })
        ]);

        return res.status(200).json({
            success: true,
            message: 'User and all related records deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting user:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete user',
            error: error.message
        });
    }
});

export default router;