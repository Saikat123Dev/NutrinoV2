import express from 'express';
import prisma from '../lib/db.js';
const router = express.Router();

// Health Profile Routes
router.post('/healthprofile', async (req, res) => {
    try {
        const {
            clerkId,
            age,
            gender,
            height,
            weight,
            activityLevel,
            medicalConditions,
            allergies,
            pregnancyStatus,
            breastfeeding,
            recentSurgery,
            chronicPain,
            digestiveIssues
        } = req.body;

        if (!clerkId) {
            return res.status(400).json({ error: 'clerkId is required' });
        }
         const user = await prisma.user.findUnique({
            where: { clerkId: parseInt(clerkId) }
        });
        if(!user) {
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
                    age: age !== undefined ? parseInt(age) : undefined,
                    gender: gender !== undefined ? gender : undefined,
                    height: height !== undefined ? parseFloat(height) : undefined,
                    weight: weight !== undefined ? parseFloat(weight) : undefined,
                    activityLevel: activityLevel !== undefined ? activityLevel : undefined,
                    medicalConditions: medicalConditions !== undefined ? medicalConditions : undefined,
                    allergies: allergies !== undefined ? allergies : undefined,
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
                    age: age ? parseInt(age) : null,
                    gender,
                    height: height ? parseFloat(height) : null,
                    weight: weight ? parseFloat(weight) : null,
                    activityLevel,
                    medicalConditions: medicalConditions || [],
                    allergies: allergies || [],
                    pregnancyStatus,
                    breastfeeding,
                    recentSurgery,
                    chronicPain,
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

router.get('/healthprofile/:clerkId', async (req, res) => {
    try {
        const clerkId = parseInt(req.params.clerkId);
            const user = await prisma.user.findUnique({
            where: { clerkId: parseInt(clerkId) }
        });
        if(!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        const userId = user ? user.id : null;
        const healthProfile = await prisma.healthProfile.findUnique({
            where: { userId},
        });
        
        if (!healthProfile) {
            return res.status(404).json({
                success: false,
                message: 'Health profile not found'
            });
        }

        return res.status(200).json({
            success: true,
            data: healthProfile
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

router.delete('/healthprofile/:clerkId', async (req, res) => {
    try {
        const clerkId = parseInt(req.params.clerkId);
        const user = await prisma.user.findUnique({
            where: { clerkId: parseInt(clerkId) }
        });
        if(!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        const userId = user ? user.id : null;
        const existingProfile = await prisma.healthProfile.findUnique({
            where: { userId }
        });

        if (!existingProfile) {
            return res.status(404).json({
                success: false,
                message: 'Health profile not found'
            });
        }

        await prisma.healthProfile.delete({
            where: { userId }
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
      clerkId,
      habitType,
      specificHabit,
      frequency,
      quantityPerOccasion,
      unit,
      duration,
      lastOccurrence,
      triggerFactors,
      attemptedQuitting,
      quittingMethods,
      impactSelfRating,
      notes,
      substanceUseId
    } = req.body;

    // Validate required fields
    if (!clerkId) {
      return res.status(400).json({ error: 'clerkId is required' });
    }

    if (!habitType || !specificHabit || !frequency) {
      return res.status(400).json({ error: 'habitType, specificHabit, and frequency are required' });
    }

    // Get the user by clerkId
    const user = await prisma.user.findUnique({
      where: { clerkId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found with given clerkId' });
    }

    const formattedLastOccurrence = lastOccurrence ? new Date(lastOccurrence) : undefined;

    const createData = {
      user: {
        connect: { id: user.id }
      },
      habitType,
      specificHabit,
      frequency,
      quantityPerOccasion: quantityPerOccasion ? parseFloat(quantityPerOccasion) : null,
      unit,
      duration: duration ? parseInt(duration) : null,
      lastOccurrence: formattedLastOccurrence,
      triggerFactors: triggerFactors || [],
      attemptedQuitting: attemptedQuitting !== undefined ? attemptedQuitting : false,
      quittingMethods: quittingMethods || [],
      impactSelfRating: impactSelfRating ? parseInt(impactSelfRating) : null,
      notes
    };

    // Add relation to substanceUse if present
    if (substanceUseId) {
      createData.substanceUse = {
        connect: { id: parseInt(substanceUseId) }
      };
    }

    const habit = await prisma.badHabit.create({
      data: createData
    });

    return res.status(200).json({
      success: true,
      message: 'Bad habit created successfully',
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

router.get('/badhabit/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);

        const habit = await prisma.badHabit.findUnique({
            where: { id }
        });

        if (!habit) {
            return res.status(404).json({
                success: false,
                message: 'Bad habit not found'
            });
        }

        return res.status(200).json({
            success: true,
            data: habit
        });
    } catch (error) {
        console.error('Error fetching bad habit:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch bad habit',
            error: error.message
        });
    }
});

router.get('/badhabit/user/:clerkId', async (req, res) => {
    try {
        const clerkId = parseInt(req.params.clerkId);
        const user = await prisma.user.findUnique({
            where: { clerkId: clerkId }
        });
        if(!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        const userId = user ? user.id : null;

        const habits = await prisma.badHabit.findMany({
            where: { userId }
        });

        return res.status(200).json({
            success: true,
            data: habits
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

router.delete('/badhabit/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);

        const existingHabit = await prisma.badHabit.findUnique({
            where: { id }
        });

        if (!existingHabit) {
            return res.status(404).json({
                success: false,
                message: 'Bad habit not found'
            });
        }

        await prisma.badHabit.delete({
            where: { id }
        });

        return res.status(200).json({
            success: true,
            message: 'Bad habit deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting bad habit:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete bad habit',
            error: error.message
        });
    }
});



// Sleep Pattern Routes
router.post('/sleeppattern', async (req, res) => {
  try {
    const {
      clerkId,
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
    if (!clerkId) {
      return res.status(400).json({ error: 'clerkId is required' });
    }

    // Fetch user by clerkId
    const user = await prisma.user.findUnique({
      where: { clerkId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found with given clerkId' });
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


router.get('/sleeppattern/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);

        const sleepPattern = await prisma.sleepPattern.findUnique({
            where: { id }
        });

        if (!sleepPattern) {
            return res.status(404).json({
                success: false,
                message: 'Sleep pattern not found'
            });
        }

        return res.status(200).json({
            success: true,
            data: sleepPattern
        });
    } catch (error) {
        console.error('Error fetching sleep pattern:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch sleep pattern',
            error: error.message
        });
    }
});

router.get('/sleeppattern/user/:clerkId', async (req, res) => {
    try {
        const clerkId = parseInt(req.params.clerkId);
        const user = await prisma.user.findUnique({
            where: { clerkId: clerkId }
        });
        if(!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        const userId = user ? user.id : null;

        const sleepPatterns = await prisma.sleepPattern.findMany({
            where: { userId }
        });

        return res.status(200).json({
            success: true,
            data: sleepPatterns
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

router.delete('/sleeppattern/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);

        const existingPattern = await prisma.sleepPattern.findUnique({
            where: { id }
        });

        if (!existingPattern) {
            return res.status(404).json({
                success: false,
                message: 'Sleep pattern not found'
            });
        }

        await prisma.sleepPattern.delete({
            where: { id }
        });

        return res.status(200).json({
            success: true,
            message: 'Sleep pattern deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting sleep pattern:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete sleep pattern',
            error: error.message
        });
    }
});

router.post('/stresssource', async (req, res) => {
  try {
    const {
      clerkId,
      stressType,
      stressLevel,
      copingMechanisms,
      stressFrequency,
      physicalSymptoms
    } = req.body;

    if (!clerkId) {
      return res.status(400).json({ error: 'clerkId is required' });
    }

    if (!stressType || !stressFrequency) {
      return res.status(400).json({ error: 'stressType and stressFrequency are required' });
    }

    // Find user by clerkId
    const user = await prisma.user.findUnique({
      where: { clerkId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found with given clerkId' });
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

router.get('/stresssource/user/:userId', async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);

        const stressSources = await prisma.stressSource.findMany({
            where: { userId }
        });

        return res.status(200).json({
            success: true,
            data: stressSources
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

router.delete('/stresssource/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);

        const existingSource = await prisma.stressSource.findUnique({
            where: { id }
        });

        if (!existingSource) {
            return res.status(404).json({
                success: false,
                message: 'Stress source not found'
            });
        }

        await prisma.stressSource.delete({
            where: { id }
        });

        return res.status(200).json({
            success: true,
            message: 'Stress source deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting stress source:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete stress source',
            error: error.message
        });
    }
});

// Mental Health Routes
router.post('/mentalhealth', async (req, res) => {
  try {
    const {
      clerkId,
      moodPatterns,
      diagnosedIssues,
      therapyHistory,
      medication,
      lastEvaluation
    } = req.body;

    // Validate required clerkId
    if (!clerkId) {
      return res.status(400).json({ error: 'clerkId is required' });
    }

    // Find user by clerkId
    const user = await prisma.user.findUnique({
      where: { clerkId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found with given clerkId' });
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


router.get('/mentalhealth/:clerkId', async (req, res) => {
    try {
        const clerkId = parseInt(req.params.clerkId);
        const user = await prisma.user.findUnique({
            where: { clerkId: clerkId }
        });
        if(!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        const userId = user ? user.id : null;

        const mentalHealth = await prisma.mentalHealth.findUnique({
            where: { userId }
        });

        if (!mentalHealth) {
            return res.status(404).json({
                success: false,
                message: 'Mental health profile not found'
            });
        }

        return res.status(200).json({
            success: true,
            data: mentalHealth
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

router.delete('/mentalhealth/:clerkId', async (req, res) => {
    try {
        const clerkId = parseInt(req.params.clerkId);
        const user = await prisma.user.findUnique({
            where: { clerkId: clerkId }
        });
        if(!user) {
            return res.status(404).json({   
                success: false,
                message: 'User not found'
            });
        }
        const userId = user ? user.id : null;

        const existingProfile = await prisma.mentalHealth.findUnique({
            where: { userId }
        });

        if (!existingProfile) {
            return res.status(404).json({
                success: false,
                message: 'Mental health profile not found'
            });
        }

        await prisma.mentalHealth.delete({
            where: { userId }
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
