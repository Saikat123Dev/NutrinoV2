import express from 'express';
import prisma from '../lib/db.js';
const router = express.Router();

// Health Profile Routes
router.post('/healthprofile', async (req, res) => {
    try {
        const {
            userId,
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

        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }

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

router.get('/healthprofile/:userId', async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);

        const healthProfile = await prisma.healthProfile.findUnique({
            where: { userId }
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

router.delete('/healthprofile/:userId', async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);

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

// Bad Habit Routes
router.post('/badhabit', async (req, res) => {
  try {
      const {
          id,
          userId,
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

      if (!userId) {
          return res.status(400).json({ error: 'userId is required' });
      }

      if (!habitType || !specificHabit || !frequency) {
          return res.status(400).json({ error: 'habitType, specificHabit, and frequency are required' });
      }

      // Format the date if it exists
      const formattedLastOccurrence = lastOccurrence ? new Date(lastOccurrence) : undefined;

      let habit;

      if (id) {
          // Check if the habit exists
          const existingHabit = await prisma.badHabit.findUnique({
              where: { id: parseInt(id) }
          });

          if (!existingHabit) {
              return res.status(404).json({
                  success: false,
                  message: 'Bad habit not found'
              });
          }

          // Update existing habit
          const updateData = {
              userId: parseInt(userId),
              habitType,
              specificHabit,
              frequency,
              quantityPerOccasion: quantityPerOccasion ? parseFloat(quantityPerOccasion) : undefined,
              unit,
              duration: duration ? parseInt(duration) : undefined,
              lastOccurrence: formattedLastOccurrence,
              triggerFactors: triggerFactors || undefined,
              attemptedQuitting: attemptedQuitting !== undefined ? attemptedQuitting : undefined,
              quittingMethods: quittingMethods || undefined,
              impactSelfRating: impactSelfRating ? parseInt(impactSelfRating) : undefined,
              notes
          };

          // Handle substanceUse relation for Prisma
          if (substanceUseId) {
              updateData.substanceUse = {
                  connect: { id: parseInt(substanceUseId) }
              };
          } else if (existingHabit.substanceUseId) {
              updateData.substanceUse = {
                  disconnect: true
              };
          }

          habit = await prisma.badHabit.update({
              where: { id: parseInt(id) },
              data: updateData
          });
      } else {
          // Create new habit
          const createData = {
              user: {
                  connect: { id: parseInt(userId) }
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

          // Only add relation if substanceUseId is provided
          if (substanceUseId) {
              createData.substanceUse = {
                  connect: { id: parseInt(substanceUseId) }
              };
          }

          habit = await prisma.badHabit.create({
              data: createData
          });
      }

      return res.status(200).json({
          success: true,
          message: id ? 'Bad habit updated successfully' : 'Bad habit created successfully',
          data: habit
      });
  } catch (error) {
      console.error('Error handling bad habit:', error);
      return res.status(500).json({
          success: false,
          message: 'Failed to process bad habit',
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

router.get('/badhabit/user/:userId', async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);

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

            userId,
            averageHours,
            sleepQuality,
            bedTime,
            wakeTime,
            sleepIssues,
            useSleepAids,
            sleepAidTypes,
            screenTimeBeforeBed
        } = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }

        let sleepPattern;


            // Check if the sleep pattern exists
            const existingPattern = await prisma.sleepPattern.findUnique({
                where: { userId:parseInt(userId)}
            });


          if(existingPattern){
            // Update existing sleep pattern
            sleepPattern = await prisma.sleepPattern.update({
                where: { userId: parseInt(userId) },
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
          }
        else {
            // Create new sleep pattern
            sleepPattern = await prisma.sleepPattern.create({
                data: {
                    userId: parseInt(userId),
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
            message:  'Sleep pattern updated successfully',
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

router.get('/sleeppattern/user/:userId', async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);

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

// Stress Source Routes
router.post('/stresssource', async (req, res) => {
  try {
      const {
          id,
          userId,
          stressType,
          stressLevel,
          copingMechanisms,
          stressFrequency,
          physicalSymptoms
      } = req.body;

      if (!userId) {
          return res.status(400).json({ error: 'userId is required' });
      }

      if (!stressType || !stressFrequency) {
          return res.status(400).json({ error: 'stressType and stressFrequency are required' });
      }

      const stressSource = await prisma.stressSource.upsert({
          where: {
              id: id ? parseInt(id) : -1
          },
          update: {
              userId: parseInt(userId),
              stressType,
              stressLevel: stressLevel ? parseInt(stressLevel) : undefined,
              copingMechanisms: copingMechanisms || undefined,
              stressFrequency,
              physicalSymptoms: physicalSymptoms || undefined
          },
          create: {
              userId: parseInt(userId),
              stressType,
              stressLevel: stressLevel ? parseInt(stressLevel) : 1,
              copingMechanisms: copingMechanisms || [],
              stressFrequency,
              physicalSymptoms: physicalSymptoms || []
          }
      });

      return res.status(200).json({
          success: true,
          message: id ? 'Stress source updated successfully' : 'Stress source created successfully',
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
            userId,
            moodPatterns,
            diagnosedIssues,
            therapyHistory,
            medication,
            lastEvaluation
        } = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }

        // Format the date if it exists
        const formattedLastEvaluation = lastEvaluation ? new Date(lastEvaluation) : undefined;

        const mentalHealth = await prisma.mentalHealth.upsert({
            where: { userId: parseInt(userId) },
            update: {
                moodPatterns: moodPatterns || undefined,
                diagnosedIssues: diagnosedIssues || undefined,
                therapyHistory,
                medication: medication || undefined,
                lastEvaluation: formattedLastEvaluation
            },
            create: {
                userId: parseInt(userId),
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

router.get('/mentalhealth/:userId', async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);

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

router.delete('/mentalhealth/:userId', async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);

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
