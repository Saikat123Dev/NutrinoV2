import axiosInsatance from '@/configs/axios-config';
import { useUser } from '@clerk/clerk-expo';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import axios from 'axios';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Dimensions, Easing, KeyboardAvoidingView, Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');
const PARTICLE_COUNT = 25;
const nodeCount = 8;

type HealthFieldType = 'text' | 'dropdown' | 'list' | 'select';
type HealthInputValue = string | boolean | string[];

interface HealthField {
    key: string;
    label: string;
    placeholder: string;
    type: HealthFieldType;
    section: string;
    keyboardType?: 'default' | 'numeric' | 'decimal-pad' | 'email-address' | 'phone-pad';
    options?: { label: string; key: string | boolean }[];
}

export default function ProfilePage() {
    const [particlePositions, setParticlePositions] = useState<Array<any>>([]);
    const headerAnimation = useRef(new Animated.Value(0)).current;
    const [isLoaded, setIsLoaded] = useState(false);
    const particleAnimations = useRef(
        Array(PARTICLE_COUNT).fill(null).map(() => ({
            opacity: new Animated.Value(0),
            scale: new Animated.Value(0),
            rotate: new Animated.Value(0),
            position: new Animated.ValueXY(),
            float: new Animated.Value(0)
        }))
    ).current;

    // Initialize animations
    useEffect(() => {
        // Create particle positions
        const particles = Array(PARTICLE_COUNT).fill(null).map((_, index) => {
            const isLarge = index < 8;
            return {
                x: Math.random() * width,
                y: Math.random() * height,
                size: isLarge ? Math.random() * 120 + 80 : Math.random() * 60 + 20,
                speed: Math.random() * 0.5 + 0.2,
                direction: Math.random() * Math.PI * 2,
                color: [
                    'rgba(52, 152, 219, 0.06)',    // Professional blue
                    'rgba(46, 204, 113, 0.06)',    // Health green
                    'rgba(142, 68, 173, 0.06)',    // Medical purple
                    'rgba(52, 73, 94, 0.06)',      // Professional dark
                    'rgba(22, 160, 133, 0.06)'     // Teal accent
                ][Math.floor(Math.random() * 5)],
                glowColor: [
                    '#3498DB',  // Professional blue
                    '#2ECC71',  // Health green
                    '#8E44AD',  // Medical purple
                    '#34495E',  // Professional dark
                    '#16A085'   // Teal accent
                ][Math.floor(Math.random() * 5)]
            };
        });

        setParticlePositions(particles);

        // Animate header entrance
        Animated.timing(headerAnimation, {
            toValue: 1,
            duration: 1200,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
        }).start();

        // Animate particles
        particleAnimations.forEach((anim, index) => {
            const particle = particles[index];
            if (!particle) return;

            anim.position.setValue({ x: particle.x, y: particle.y });

            Animated.parallel([
                Animated.timing(anim.opacity, {
                    toValue: 0.8,
                    duration: 2000 + Math.random() * 1000,
                    easing: Easing.out(Easing.quad),
                    useNativeDriver: true,
                }),
                Animated.timing(anim.scale, {
                    toValue: 1,
                    duration: 1500 + Math.random() * 1000,
                    easing: Easing.out(Easing.back(1.2)),
                    useNativeDriver: true,
                }),
                Animated.loop(
                    Animated.timing(anim.rotate, {
                        toValue: 1,
                        duration: 20000 + Math.random() * 10000,
                        easing: Easing.linear,
                        useNativeDriver: true,
                    })
                ),
                Animated.loop(
                    Animated.sequence([
                        Animated.timing(anim.float, {
                            toValue: 1,
                            duration: 3000 + Math.random() * 2000,
                            easing: Easing.inOut(Easing.sin),
                            useNativeDriver: true,
                        }),
                        Animated.timing(anim.float, {
                            toValue: 0,
                            duration: 3000 + Math.random() * 2000,
                            easing: Easing.inOut(Easing.sin),
                            useNativeDriver: true,
                        })
                    ])
                )
            ]).start();
        });

        return () => {
            particleAnimations.forEach(anim => {
                anim.opacity.stopAnimation();
                anim.scale.stopAnimation();
                anim.rotate.stopAnimation();
                anim.position.stopAnimation();
                anim.float.stopAnimation();
            });
        };
    }, []);

    const handleBackPress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push('/(tabs)/profile');
    };

    const getSectionIcon = (sectionName: string) => {
        switch (sectionName) {
            case 'Basic Information':
                return 'account-circle';
            case 'Physical Measurements':
                return 'human-handsup';
            case 'Lifestyle':
                return 'run';
            case 'Dietary Information':
                return 'food-apple';
            case 'Medical History':
                return 'medical-bag';
            case 'Current Health Status':
                return 'heart-pulse';
            case 'Sleep Patterns':
                return 'sleep';
            case 'Mental Health':
                return 'brain';
            case 'Bad Habits':
                return 'smoking-off';
            case 'Stress Management':
                return 'meditation';
            default:
                return 'information';
        }
    };

    const getSectionDescription = (sectionName: string) => {
        switch (sectionName) {
            case 'Basic Information':
                return 'Essential personal details for health assessment';
            case 'Physical Measurements':
                return 'Body measurements for BMI and health calculations';
            case 'Lifestyle':
                return 'Daily activity and hydration habits';
            case 'Dietary Information':
                return 'Food preferences, allergies, and eating patterns';
            case 'Medical History':
                return 'Medical conditions, allergies, and health issues';
            case 'Current Health Status':
                return 'Current health conditions and recent changes';
            case 'Sleep Patterns':
                return 'Sleep quality, duration, and sleep-related habits';
            case 'Mental Health':
                return 'Mental wellness, mood patterns, and psychological health';
            case 'Bad Habits':
                return 'Habits that may impact your health negatively';
            case 'Stress Management':
                return 'Stress levels, triggers, and coping mechanisms';
            default:
                return 'Health information for better recommendations';
        }
    };

    const getCompletionPercentage = () => {
        const filledFields = Object.values(healthInputs).filter(value => {
            if (typeof value === 'string') return value.trim() !== '';
            if (typeof value === 'boolean') return true;
            if (Array.isArray(value)) return value.length > 0;
            return false;
        }).length;
        return Math.round((filledFields / healthFields.length) * 100);
    };

    const isFieldFilled = (key: string) => {
        const value = healthInputs[key];
        if (typeof value === 'string') return value.trim() !== '';
        if (typeof value === 'boolean') return true;
        if (Array.isArray(value)) return value.length > 0;
        return false;
    };

    const isFocused = useIsFocused();

    // get user
    const { user } = useUser();
    const email = user?.primaryEmailAddress?.emailAddress;

     
    // handle inputs - Updated to match Prisma schema exactly
    const healthFields = [
        // Basic Demographics
        { 
            key: 'age', 
            label: 'Age', 
            placeholder: 'Enter your age (years)', 
            type: 'text',
            section: 'Basic Information',
            keyboardType: 'numeric'
        },
        {
            key: 'gender',
            label: 'Gender',
            placeholder: 'Select your gender',
            type: 'dropdown',
            section: 'Basic Information',
            options: [
                { label: 'Male', key: 'MALE' },
                { label: 'Female', key: 'FEMALE' },
                { label: 'Other', key: 'OTHER' }
            ]
        },
        { 
            key: 'height', 
            label: 'Height (cm)', 
            placeholder: 'Enter your height in centimeters', 
            type: 'text',
            section: 'Physical Measurements',
            keyboardType: 'decimal-pad'
        },
        { 
            key: 'weight', 
            label: 'Weight (kg)', 
            placeholder: 'Enter your weight in kilograms', 
            type: 'text',
            section: 'Physical Measurements',
            keyboardType: 'decimal-pad'
        },
        {
            key: 'activityLevel',
            label: 'Activity Level',
            placeholder: 'Select your daily activity level',
            type: 'dropdown',
            section: 'Lifestyle',
            options: [
                { label: 'Sedentary (Little/no exercise)', key: 'SEDENTARY' },
                { label: 'Lightly Active (Light exercise 1-3 days/week)', key: 'LIGHTLY_ACTIVE' },
                { label: 'Moderately Active (Moderate exercise 3-5 days/week)', key: 'MODERATELY_ACTIVE' },
                { label: 'Very Active (Hard exercise 6-7 days/week)', key: 'VERY_ACTIVE' },
                { label: 'Extremely Active (Very hard exercise, physical job)', key: 'EXTREMELY_ACTIVE' }
            ]
        },
        { 
            key: 'waterIntake', 
            label: 'Daily Water Intake (Liters)', 
            placeholder: 'Enter daily water intake in liters (e.g., 2.5)', 
            type: 'text',
            section: 'Lifestyle',
            keyboardType: 'decimal-pad'
        },
        { 
            key: 'mealFrequency', 
            label: 'Meal Frequency', 
            placeholder: 'How often do you eat per day? (e.g., "3 main meals + 2 snacks")', 
            type: 'text',
            section: 'Dietary Information'
        },
        
        // Medical Information
        { 
            key: 'medicalConditions', 
            label: 'Medical Conditions', 
            placeholder: 'List any chronic conditions (diabetes, hypertension, etc.)', 
            type: 'list',
            section: 'Medical History'
        },
        { 
            key: 'allergies', 
            label: 'General Allergies', 
            placeholder: 'List environmental or medication allergies', 
            type: 'list',
            section: 'Medical History'
        },
        { 
            key: 'foodAllergies', 
            label: 'Food Allergies', 
            placeholder: 'List specific food allergies (nuts, dairy, gluten, etc.)', 
            type: 'list',
            section: 'Dietary Information'
        },
        { 
            key: 'dietaryPreferences', 
            label: 'Dietary Preferences', 
            placeholder: 'Add dietary preferences (vegetarian, vegan, keto, etc.)', 
            type: 'list',
            section: 'Dietary Information'
        },
        { 
            key: 'digestiveIssues', 
            label: 'Digestive Issues', 
            placeholder: 'List digestive problems (IBS, acid reflux, etc.)', 
            type: 'list',
            section: 'Medical History'
        },

        // Health Status (Boolean fields)
        { 
            key: 'pregnancyStatus', 
            label: 'Currently Pregnant', 
            placeholder: 'Are you currently pregnant?', 
            type: 'select',
            section: 'Current Health Status'
        },
        { 
            key: 'breastfeeding', 
            label: 'Currently Breastfeeding', 
            placeholder: 'Are you currently breastfeeding?', 
            type: 'select',
            section: 'Current Health Status'
        },
        { 
            key: 'recentSurgery', 
            label: 'Recent Surgery', 
            placeholder: 'Have you had surgery in the last 6 months?', 
            type: 'select',
            section: 'Current Health Status'
        },
        { 
            key: 'chronicPain', 
            label: 'Chronic Pain', 
            placeholder: 'Do you experience chronic pain?', 
            type: 'select',
            section: 'Current Health Status'
        },

        // Sleep Patterns
        { 
            key: 'averageHours', 
            label: 'Average Sleep Hours', 
            placeholder: 'Enter average hours of sleep per night (e.g., 7.5)', 
            type: 'text',
            section: 'Sleep Patterns',
            keyboardType: 'decimal-pad'
        },
        {
            key: 'sleepQuality',
            label: 'Sleep Quality',
            placeholder: 'How would you rate your sleep quality?',
            type: 'dropdown',
            section: 'Sleep Patterns',
            options: [
                { label: 'Poor', key: 'POOR' },
                { label: 'Fair', key: 'FAIR' },
                { label: 'Good', key: 'GOOD' },
                { label: 'Excellent', key: 'EXCELLENT' }
            ]
        },
        { 
            key: 'bedTime', 
            label: 'Usual Bedtime', 
            placeholder: 'What time do you usually go to bed? (e.g., 10:30 PM)', 
            type: 'text',
            section: 'Sleep Patterns'
        },
        { 
            key: 'wakeTime', 
            label: 'Usual Wake Time', 
            placeholder: 'What time do you usually wake up? (e.g., 6:30 AM)', 
            type: 'text',
            section: 'Sleep Patterns'
        },
        { 
            key: 'sleepIssues', 
            label: 'Sleep Issues', 
            placeholder: 'List any sleep problems (insomnia, sleep apnea, etc.)', 
            type: 'list',
            section: 'Sleep Patterns'
        },
        { 
            key: 'useSleepAids', 
            label: 'Use Sleep Aids', 
            placeholder: 'Do you use any sleep aids?', 
            type: 'select',
            section: 'Sleep Patterns'
        },
        { 
            key: 'sleepAidTypes', 
            label: 'Sleep Aid Types', 
            placeholder: 'List types of sleep aids you use (melatonin, etc.)', 
            type: 'list',
            section: 'Sleep Patterns'
        },
        { 
            key: 'screenTimeBeforeBed', 
            label: 'Screen Time Before Bed (minutes)', 
            placeholder: 'How many minutes of screen time before bed?', 
            type: 'text',
            section: 'Sleep Patterns',
            keyboardType: 'numeric'
        },

        // Mental Health
        { 
            key: 'moodPatterns', 
            label: 'Mood Patterns', 
            placeholder: 'Describe your typical mood patterns (anxious, depressed, etc.)', 
            type: 'list',
            section: 'Mental Health'
        },
        { 
            key: 'diagnosedIssues', 
            label: 'Diagnosed Mental Health Issues', 
            placeholder: 'List any diagnosed mental health conditions', 
            type: 'list',
            section: 'Mental Health'
        },
        { 
            key: 'therapyHistory', 
            label: 'Therapy History', 
            placeholder: 'Describe your therapy/counseling history', 
            type: 'text',
            section: 'Mental Health'
        },
        { 
            key: 'medication', 
            label: 'Mental Health Medications', 
            placeholder: 'List any psychiatric medications you take', 
            type: 'list',
            section: 'Mental Health'
        },

        // Bad Habits
        { 
            key: 'habitType', 
            label: 'Habit Type', 
            placeholder: 'Type of habit (smoking, drinking, etc.)', 
            type: 'text',
            section: 'Bad Habits'
        },
        { 
            key: 'specificHabit', 
            label: 'Specific Habit', 
            placeholder: 'Describe the specific habit in detail', 
            type: 'text',
            section: 'Bad Habits'
        },
        {
            key: 'habitFrequency',
            label: 'Habit Frequency',
            placeholder: 'How often do you engage in this habit?',
            type: 'dropdown',
            section: 'Bad Habits',
            options: [
                { label: 'Daily', key: 'DAILY' },
                { label: 'Weekly', key: 'WEEKLY' },
                { label: 'Occasionally', key: 'OCCASIONALLY' },
                { label: 'Monthly', key: 'MONTHLY' },
                { label: 'Rarely', key: 'RARELY' }
            ]
        },
        { 
            key: 'quantityPerOccasion', 
            label: 'Quantity Per Occasion', 
            placeholder: 'How much per occasion? (e.g., 5 cigarettes, 2 drinks)', 
            type: 'text',
            section: 'Bad Habits',
            keyboardType: 'decimal-pad'
        },
        { 
            key: 'habitDuration', 
            label: 'Duration (months)', 
            placeholder: 'How long have you had this habit? (in months)', 
            type: 'text',
            section: 'Bad Habits',
            keyboardType: 'numeric'
        },
        { 
            key: 'triggerFactors', 
            label: 'Trigger Factors', 
            placeholder: 'What triggers this habit? (stress, social situations, etc.)', 
            type: 'list',
            section: 'Bad Habits'
        },
        { 
            key: 'attemptedQuitting', 
            label: 'Attempted Quitting', 
            placeholder: 'Have you tried to quit this habit?', 
            type: 'select',
            section: 'Bad Habits'
        },
        { 
            key: 'quittingMethods', 
            label: 'Quitting Methods Tried', 
            placeholder: 'What methods have you tried to quit? (patches, therapy, etc.)', 
            type: 'list',
            section: 'Bad Habits'
        },
        { 
            key: 'impactSelfRating', 
            label: 'Impact Rating (1-10)', 
            placeholder: 'Rate the negative impact on your life (1=minimal, 10=severe)', 
            type: 'text',
            section: 'Bad Habits',
            keyboardType: 'numeric'
        },

        // Stress Factors
        { 
            key: 'stressType', 
            label: 'Primary Stress Type', 
            placeholder: 'Main type of stress (work, family, financial, etc.)', 
            type: 'text',
            section: 'Stress Management'
        },
        { 
            key: 'stressLevel', 
            label: 'Current Stress Level (1-10)', 
            placeholder: 'Rate your current stress level (1=minimal, 10=severe)', 
            type: 'text',
            section: 'Stress Management',
            keyboardType: 'numeric'
        },
        { 
            key: 'copingMechanisms', 
            label: 'Coping Mechanisms', 
            placeholder: 'How do you cope with stress? (exercise, meditation, etc.)', 
            type: 'list',
            section: 'Stress Management'
        },
        {
            key: 'stressFrequency',
            label: 'Stress Frequency',
            placeholder: 'How often do you experience significant stress?',
            type: 'dropdown',
            section: 'Stress Management',
            options: [
                { label: 'Daily', key: 'DAILY' },
                { label: 'Weekly', key: 'WEEKLY' },
                { label: 'Occasionally', key: 'OCCASIONALLY' },
                { label: 'Monthly', key: 'MONTHLY' },
                { label: 'Rarely', key: 'RARELY' }
            ]
        },
        { 
            key: 'physicalSymptoms', 
            label: 'Physical Stress Symptoms', 
            placeholder: 'Physical symptoms of stress (headaches, muscle tension, etc.)', 
            type: 'list',
            section: 'Stress Management'
        },
    ];

    const [healthInputs, setHealthInputs] = useState<Record<string, HealthInputValue>>(
        healthFields.reduce((acc, field) => {
            let value: any = '';
            if (field.type === 'list') value = [];
            else if (field.type === 'select') value = false;
            return ({
                ...acc,
                [field.key]: value,
            })
        }, {})
    );

    const handleInputChange = (key: string, value: HealthInputValue) => {
        setHealthInputs(prev => ({
            ...prev,
            [key]: value,
        }));
    };

    // fill fields with available values
    const [loading, setLoading] = useState(false);
    const [fetchedData, setFetchedData] = useState<Record<string, any> | null>(null);
    
    useEffect(() => {
        const fetchData = async () => {
            if (!email) return;
            try {
                setLoading(true);
                
                // Fetch all health-related data
                const promises = [
                    axiosInsatance.get(`/v1/healthstatus/healthprofile/${email}`).catch(() => ({ data: { data: null } })),
                    axiosInsatance.get(`/v1/healthstatus/sleeppattern/${email}`).catch(() => ({ data: { data: null } })),
                    axiosInsatance.get(`/v1/healthstatus/mentalhealth/${email}`).catch(() => ({ data: { data: null } })),
                    axiosInsatance.get(`/v1/healthstatus/badhabit/${email}`).catch(() => ({ data: { data: null } })),
                    axiosInsatance.get(`/v1/healthstatus/stresssource/${email}`).catch(() => ({ data: { data: null } }))
                ];

                const [healthProfileRes, sleepPatternRes, mentalHealthRes, badHabitRes, stressSourceRes] = await Promise.all(promises);
                
                // Combine all data into a single object
                const combinedData = {
                    ...(healthProfileRes.data.data || {}),
                    ...(sleepPatternRes.data.data || {}),
                    ...(mentalHealthRes.data.data || {}),
                    ...(badHabitRes.data.data || {}),
                    ...(stressSourceRes.data.data || {})
                };

                // Map back the frequency field for bad habits
                if (combinedData.frequency) {
                    combinedData.habitFrequency = combinedData.frequency;
                }

                console.log('Combined health data:', combinedData);
                setFetchedData(combinedData);
                
            } catch (error) {
                if (axios.isAxiosError?.(error)) {
                    console.error("Fetch error: ", error.response?.data);
                }
            }
            setLoading(false);
        };
        fetchData();
    }, [email, isFocused]);

    // fill data
    useEffect(() => {
        if (!fetchedData) return;
        setHealthInputs(
            healthFields.reduce((acc, field) => {
                let value = fetchedData[field.key] || healthInputs[field.key];
                if (typeof value === 'number') value = String(value);
                return {
                    ...acc,
                    [field.key]: value
                }
            }, {})
        )
    }, [fetchedData]);

    // handle health input save
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
    const [saveError, setSaveError] = useState<string>('');
    
    const formatHealthData = () => {
        const data: any = { ...healthInputs };
        
        // Health Profile data (main profile)
        const healthProfile: any = {};
        const sleepPattern: any = {};
        const mentalHealth: any = {};
        const badHabit: any = {};
        const stressSource: any = {};

        // Health Profile fields
        const healthProfileFields = [
            'age', 'gender', 'height', 'weight', 'activityLevel', 'medicalConditions',
            'allergies', 'dietaryPreferences', 'foodAllergies', 'mealFrequency', 
            'waterIntake', 'pregnancyStatus', 'breastfeeding', 'recentSurgery', 
            'chronicPain', 'digestiveIssues'
        ];

        // Sleep Pattern fields
        const sleepFields = [
            'averageHours', 'sleepQuality', 'bedTime', 'wakeTime', 'sleepIssues',
            'useSleepAids', 'sleepAidTypes', 'screenTimeBeforeBed'
        ];

        // Mental Health fields
        const mentalHealthFields = [
            'moodPatterns', 'diagnosedIssues', 'therapyHistory', 'medication'
        ];

        // Bad Habit fields
        const badHabitFields = [
            'habitType', 'specificHabit', 'habitFrequency', 'quantityPerOccasion',
            'habitDuration', 'triggerFactors', 'attemptedQuitting', 'quittingMethods',
            'impactSelfRating'
        ];

        // Stress Source fields
        const stressFields = [
            'stressType', 'stressLevel', 'copingMechanisms', 'stressFrequency',
            'physicalSymptoms'
        ];

        // Organize data by model
        healthProfileFields.forEach(field => {
            if (data[field] !== undefined && data[field] !== '' && data[field] !== null) {
                healthProfile[field] = data[field];
            }
        });

        sleepFields.forEach(field => {
            if (data[field] !== undefined && data[field] !== '' && data[field] !== null) {
                sleepPattern[field] = data[field];
            }
        });

        mentalHealthFields.forEach(field => {
            if (data[field] !== undefined && data[field] !== '' && data[field] !== null) {
                mentalHealth[field] = data[field];
            }
        });

        badHabitFields.forEach(field => {
            if (data[field] !== undefined && data[field] !== '' && data[field] !== null) {
                badHabit[field] = data[field];
            }
        });

        stressFields.forEach(field => {
            if (data[field] !== undefined && data[field] !== '' && data[field] !== null) {
                stressSource[field] = data[field];
            }
        });

        // Convert numeric fields
        if (healthProfile.age) healthProfile.age = parseInt(healthProfile.age) || null;
        if (healthProfile.height) healthProfile.height = parseFloat(healthProfile.height) || null;
        if (healthProfile.weight) healthProfile.weight = parseFloat(healthProfile.weight) || null;
        if (healthProfile.waterIntake) healthProfile.waterIntake = parseFloat(healthProfile.waterIntake) || null;
        
        if (sleepPattern.averageHours) sleepPattern.averageHours = parseFloat(sleepPattern.averageHours) || null;
        if (sleepPattern.screenTimeBeforeBed) sleepPattern.screenTimeBeforeBed = parseInt(sleepPattern.screenTimeBeforeBed) || null;
        
        if (badHabit.quantityPerOccasion) badHabit.quantityPerOccasion = parseFloat(badHabit.quantityPerOccasion) || null;
        if (badHabit.habitDuration) badHabit.habitDuration = parseInt(badHabit.habitDuration) || null;
        if (badHabit.impactSelfRating) badHabit.impactSelfRating = parseInt(badHabit.impactSelfRating) || null;
        
        if (stressSource.stressLevel) stressSource.stressLevel = parseInt(stressSource.stressLevel) || null;

        // Map frequency fields correctly
        if (badHabit.habitFrequency) badHabit.frequency = badHabit.habitFrequency;
        if (stressSource.stressFrequency) stressSource.stressFrequency = stressSource.stressFrequency;

        return {
            healthProfile: Object.keys(healthProfile).length > 0 ? healthProfile : null,
            sleepPattern: Object.keys(sleepPattern).length > 0 ? sleepPattern : null,
            mentalHealth: Object.keys(mentalHealth).length > 0 ? mentalHealth : null,
            badHabit: Object.keys(badHabit).length > 0 ? badHabit : null,
            stressSource: Object.keys(stressSource).length > 0 ? stressSource : null
        };
    };

    const handleSave = async () => {
        if (!email) return;
        
        // Reset states
        setSaveSuccess(false);
        setSaveError('');
        
        try {
            setIsSaving(true);
            const formattedData = formatHealthData();
            
            const savePromises = [];

            // Save Health Profile
            if (formattedData.healthProfile) {
                savePromises.push(
                    axiosInsatance.post('/v1/healthstatus/healthprofile', { 
                        email, 
                        ...formattedData.healthProfile 
                    })
                );
            }

            // Save Sleep Pattern
            if (formattedData.sleepPattern) {
                savePromises.push(
                    axiosInsatance.post('/v1/healthstatus/sleeppattern', { 
                        email, 
                        ...formattedData.sleepPattern 
                    })
                );
            }

            // Save Mental Health
            if (formattedData.mentalHealth) {
                savePromises.push(
                    axiosInsatance.post('/v1/healthstatus/mentalhealth', { 
                        email, 
                        ...formattedData.mentalHealth 
                    })
                );
            }

            // Save Bad Habit
            if (formattedData.badHabit) {
                savePromises.push(
                    axiosInsatance.post('/v1/healthstatus/badhabit', { 
                        email, 
                        ...formattedData.badHabit 
                    })
                );
            }

            // Save Stress Source
            if (formattedData.stressSource) {
                savePromises.push(
                    axiosInsatance.post('/v1/healthstatus/stresssource', { 
                        email, 
                        ...formattedData.stressSource 
                    })
                );
            }

            // Execute all save operations
            await Promise.all(savePromises);
            
            setSaveSuccess(true);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            
            // Auto-hide success message after 3 seconds
            setTimeout(() => {
                setSaveSuccess(false);
            }, 3000);
            
        } catch (error) {
            setSaveError('Failed to save health data. Please try again.');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            if (axios.isAxiosError?.(error)) {
                console.error("Save error: ", error.response?.data);
            }
        }
        setIsSaving(false);
    };

    return (
        <>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
            <SafeAreaView style={styles.container}>
                {/* Dynamic Background */}
                <View style={styles.backgroundContainer}>
                    <LinearGradient
                        colors={['#0F1419', '#1B2635', '#2A3F5F', '#1E3A5F']}
                        style={styles.backgroundGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    />

                    {/* Animated Particles */}
                    {particlePositions.map((particle, index) => (
                        <Animated.View
                            key={`particle-${index}`}
                            style={[
                                styles.particle,
                                {
                                    width: particle.size,
                                    height: particle.size,
                                    backgroundColor: particle.color,
                                    shadowColor: particle.glowColor,
                                    transform: [
                                        {
                                            translateX: Animated.add(
                                                particleAnimations[index].position.x,
                                                Animated.multiply(
                                                    particleAnimations[index].float,
                                                    20
                                                )
                                            )
                                        },
                                        {
                                            translateY: Animated.add(
                                                particleAnimations[index].position.y,
                                                Animated.multiply(
                                                    particleAnimations[index].float,
                                                    30
                                                )
                                            )
                                        },
                                        { scale: particleAnimations[index].scale },
                                        {
                                            rotate: particleAnimations[index].rotate.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: ['0deg', '360deg']
                                            })
                                        }
                                    ],
                                    opacity: particleAnimations[index].opacity,
                                }
                            ]}
                        />
                    ))}
                </View>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        bounces={true}
                    >
                        <View style={styles.headerContainer}>
                            <Pressable style={styles.backButton} onPress={handleBackPress}>
                                <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
                            </Pressable>
                            <View style={styles.titleContainer}>
                                <Text style={styles.title}>Health Profile</Text>
                                <Text style={styles.subtitle}>Update your health information</Text>
                                
                                {/* Progress Bar */}
                                <View style={styles.progressContainer}>
                                    <View style={styles.progressBackground}>
                                        <Animated.View 
                                            style={[
                                                styles.progressFill,
                                                { width: `${getCompletionPercentage()}%` }
                                            ]} 
                                        />
                                    </View>
                                    <Text style={styles.progressText}>
                                        {getCompletionPercentage()}% Complete
                                    </Text>
                                </View>
                            </View>
                        </View>
                        <View>
                            {/* Group fields by section */}
                            {Array.from(new Set(healthFields.map(f => f.section))).map(sectionName => (
                                <View key={sectionName} style={styles.sectionContainer}>
                                    <Text style={styles.sectionTitle}>
                                        <MaterialCommunityIcons 
                                            name={getSectionIcon(sectionName)} 
                                            size={20} 
                                            color="#3498DB" 
                                        />
                                        {'  '}{sectionName}
                                    </Text>
                                    <Text style={styles.sectionDescription}>
                                        {getSectionDescription(sectionName)}
                                    </Text>
                                    
                                    {healthFields
                                        .filter(field => field.section === sectionName)
                                        .map(field => (
                                        <View key={field.key} style={styles.fieldContainer}>
                                            <View style={styles.fieldLabelContainer}>
                                                <Text style={styles.fieldLabel}>
                                                    {field.label}
                                                </Text>
                                                {isFieldFilled(field.key) && (
                                                    <MaterialCommunityIcons 
                                                        name="check-circle" 
                                                        size={16} 
                                                        color="#2ECC71" 
                                                    />
                                                )}
                                            </View>
                                            {field.type === 'select' ? (
                                                <View style={styles.selectionInput}>
                                                    {[{ label: 'Yes', key: true }, { label: 'No', key: false }].map(option => (
                                                        <Pressable
                                                            key={option.label}
                                                            style={{
                                                                flex: 1,
                                                                paddingVertical: 12,
                                                                backgroundColor: healthInputs[field.key] === option.key ? 'rgba(52, 152, 219, 0.8)' : 'transparent',
                                                                alignItems: 'center',
                                                                borderRadius: healthInputs[field.key] === option.key ? 8 : 0,
                                                            }}
                                                            android_ripple={{ color: '#1A237E' }}
                                                            onPress={() => handleInputChange(field.key, option.key as boolean)}
                                                        >
                                                            <Text style={{ 
                                                                color: healthInputs[field.key] === option.key ? '#FFFFFF' : '#9CA3AF', 
                                                                fontWeight: '600' 
                                                            }}>
                                                                {option.label}
                                                            </Text>
                                                        </Pressable>
                                                    ))}
                                                </View>
                                            ) : field.type === 'dropdown' ? (
                                                <View style={styles.dropdownContainer}>
                                                    <Text style={styles.dropdownLabel}>
                                                        {healthInputs[field.key]
                                                            ? field.options?.find(opt => opt.key === healthInputs[field.key])?.label
                                                            : field.placeholder}
                                                    </Text>
                                                    <View style={styles.optionsContainer}>
                                                        {field.options?.map(option => (
                                                            <Pressable
                                                                key={option.key}
                                                                style={[
                                                                    styles.optionButton,
                                                                    {
                                                                        backgroundColor: healthInputs[field.key] === option.key 
                                                                            ? 'rgba(52, 152, 219, 0.8)' 
                                                                            : 'rgba(255, 255, 255, 0.1)',
                                                                        borderColor: healthInputs[field.key] === option.key 
                                                                            ? '#3498DB' 
                                                                            : 'rgba(255, 255, 255, 0.2)'
                                                                    }
                                                                ]}
                                                                android_ripple={{ color: '#1A237E' }}
                                                                onPress={() => handleInputChange(field.key, option.key)}
                                                            >
                                                                <Text style={[
                                                                    styles.optionText,
                                                                    {
                                                                        color: healthInputs[field.key] === option.key 
                                                                            ? '#FFFFFF' 
                                                                            : '#9CA3AF'
                                                                    }
                                                                ]}>
                                                                    {option.label}
                                                                </Text>
                                                            </Pressable>
                                                        ))}
                                                    </View>
                                                </View>
                                            ) : field.type === 'list' ? (
                                                <ListInput
                                                    value={healthInputs[field.key] as string[]}
                                                    onChange={list => handleInputChange(field.key, list)}
                                                    placeholder={field.placeholder}
                                                />
                                            ) : (
                                                <View style={styles.textInputBox}>
                                                    <TextInput
                                                        placeholder={field.placeholder}
                                                        placeholderTextColor="#9CA3AF"
                                                        style={styles.textInput}
                                                        value={healthInputs[field.key] as string}
                                                        onChangeText={text => handleInputChange(field.key, text)}
                                                        selectionColor="#3498DB"
                                                        keyboardType={field.keyboardType as any || 'default'}
                                                        autoComplete="off"
                                                        autoCorrect={false}
                                                    />
                                                </View>
                                            )}
                                        </View>
                                    ))}
                                </View>
                            ))}
                        </View>

                        {/* Section Completion Summary */}
                        <View style={styles.summaryContainer}>
                            <Text style={styles.summaryTitle}>Profile Completion Summary</Text>
                            {Array.from(new Set(healthFields.map(f => f.section))).map(sectionName => {
                                const sectionFields = healthFields.filter(field => field.section === sectionName);
                                const completedFields = sectionFields.filter(field => isFieldFilled(field.key)).length;
                                const completionPercentage = Math.round((completedFields / sectionFields.length) * 100);
                                
                                return (
                                    <View key={sectionName} style={styles.summaryItem}>
                                        <View style={styles.summaryHeader}>
                                            <MaterialCommunityIcons 
                                                name={getSectionIcon(sectionName)} 
                                                size={16} 
                                                color="#3498DB" 
                                            />
                                            <Text style={styles.summaryLabel}>{sectionName}</Text>
                                            <Text style={styles.summaryPercentage}>{completionPercentage}%</Text>
                                        </View>
                                        <View style={styles.summaryProgressBackground}>
                                            <View 
                                                style={[
                                                    styles.summaryProgressFill,
                                                    { width: `${completionPercentage}%` }
                                                ]} 
                                            />
                                        </View>
                                    </View>
                                );
                            })}
                        </View>

                        <View style={styles.saveSection}>
                            {/* Success/Error Messages */}
                            {saveSuccess && (
                                <View style={styles.successMessage}>
                                    <MaterialCommunityIcons name="check-circle" size={20} color="#2ECC71" />
                                    <Text style={styles.successText}>Health profile saved successfully!</Text>
                                </View>
                            )}
                            
                            {saveError && (
                                <View style={styles.errorMessage}>
                                    <MaterialCommunityIcons name="alert-circle" size={20} color="#E74C3C" />
                                    <Text style={styles.errorText}>{saveError}</Text>
                                </View>
                            )}

                            <Pressable 
                                style={[
                                    styles.saveButton,
                                    saveSuccess && styles.saveButtonSuccess,
                                    isSaving && styles.saveButtonSaving
                                ]} 
                                android_ripple={{ color: '#27AE60' }} 
                                onPress={handleSave}
                                disabled={isSaving}
                            >
                                {isSaving ? (
                                    <ActivityIndicator size={20} color="#FFFFFF" />
                                ) : saveSuccess ? (
                                    <>
                                        <MaterialCommunityIcons name="check" size={20} color="#FFFFFF" />
                                        <Text style={styles.saveButtonText}>Saved!</Text>
                                    </>
                                ) : (
                                    <>
                                        <MaterialCommunityIcons name="content-save" size={20} color="#FFFFFF" />
                                        <Text style={styles.saveButtonText}>Save Changes</Text>
                                    </>
                                )}
                            </Pressable>
                        </View>
                    </ScrollView>
                    {loading &&
                        <View style={styles.loadingBack}>
                            <View style={styles.loadingBox}>
                                <ActivityIndicator size={20} />
                                <Text style={{ color: '#374151', fontSize: 16, fontWeight: '500' }}>Loading Health Data...</Text>
                            </View>
                        </View>}
                </KeyboardAvoidingView>
            </SafeAreaView>
        </>

    )
};

type ListInputProps = {
    value: string[];
    onChange: (list: string[]) => void;
    placeholder?: string;
};

function ListInput({ value, onChange, placeholder }: ListInputProps) {
    const [input, setInput] = useState('');

    const handleAdd = () => {
        const trimmed = input.trim();
        if (trimmed && !value.includes(trimmed)) {
            onChange([...value, trimmed]);
            setInput('');
        }
    };

    const handleRemove = (item: string) => {
        onChange(value.filter(v => v !== item));
    };

    return (
        <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 5 }}>
                <View style={[styles.textInputBox, { flex: 1 }]}>
                    <TextInput
                        style={[styles.textInput]}
                        placeholder={placeholder}
                        placeholderTextColor="#9CA3AF"
                        value={input}
                        onChangeText={setInput}
                        onSubmitEditing={handleAdd}
                        returnKeyType="done"
                    />
                </View>
                <Pressable
                    onPress={handleAdd}
                    style={{
                        backgroundColor: '#3498DB',
                        paddingHorizontal: 16,
                        paddingVertical: 13,
                        borderRadius: 12,
                        shadowColor: '#3498DB',
                        shadowOpacity: 0.3,
                        shadowRadius: 4,
                        shadowOffset: { width: 0, height: 2 },
                    }}
                    android_ripple={{ color: '#2980B9' }}
                >
                    <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 16 }}>Add</Text>
                </Pressable>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {value.map((item, idx) => (
                    <View key={item + idx} style={styles.listBox}>
                        <Text style={{ color: '#FFFFFF', fontSize: 15, marginRight: 6, fontWeight: '500' }}>{item}</Text>
                        <Pressable onPress={() => handleRemove(item)}>
                            <MaterialCommunityIcons name="close-circle" size={18} color="#FFFFFF" />
                        </Pressable>
                    </View>
                ))}
            </View>
        </View>
    );
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0A0E1A',
    },
    backgroundContainer: {
        position: 'absolute',
        width: '100%',
        height: '100%',
    },
    backgroundGradient: {
        flex: 1,
    },
    particle: {
        position: 'absolute',
        borderRadius: 1000,
        shadowOpacity: 0.3,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 0 },
    },
    meshOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 40,
    },
    headerContainer: {
        alignItems: 'center',
        marginBottom: 32,
        paddingTop: 10
    },
    backButton: {
        position: 'absolute',
        left: 0,
        top: 15,
        padding: 12,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
    },
    titleContainer: {
        alignItems: 'center',
    },
    progressContainer: {
        marginTop: 16,
        width: '80%',
        alignItems: 'center',
    },
    progressBackground: {
        width: '100%',
        height: 6,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: 8,
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#3498DB',
        borderRadius: 3,
        shadowColor: '#3498DB',
        shadowOpacity: 0.5,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 0 },
    },
    progressText: {
        fontSize: 12,
        color: '#9CA3AF',
        fontWeight: '500',
        letterSpacing: 0.5,
    },
    title: {
        fontSize: 32,
        fontWeight: '700',
        color: '#FFFFFF',
        textAlign: 'center',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 16,
        color: '#9CA3AF',
        textAlign: 'center',
        fontWeight: '400',
    },
    fieldContainer: {
        marginBottom: 18,
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        borderRadius: 14,
        padding: 18,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.15)',
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
    },
    fieldLabelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    fieldLabel: {
        color: '#E5E7EB',
        fontWeight: '600',
        marginBottom: 8,
        fontSize: 16,
        letterSpacing: 0.3,
    },
    sectionContainer: {
        marginBottom: 25,
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        borderRadius: 20,
        padding: 18,
        borderWidth: 1,
        borderColor: 'rgba(52, 152, 219, 0.15)',
        shadowColor: '#3498DB',
        shadowOpacity: 0.1,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 8,
        letterSpacing: 0.5,
        textAlign: 'left',
    },
    sectionDescription: {
        fontSize: 14,
        color: '#9CA3AF',
        marginBottom: 20,
        lineHeight: 20,
        fontStyle: 'italic',
    },
    dropdownContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
    },
    dropdownLabel: {
        color: '#E5E7EB',
        fontSize: 16,
        marginBottom: 12,
        fontWeight: '500',
        letterSpacing: 0.3,
    },
    optionsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    optionButton: {
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 6,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 3,
        shadowOffset: { width: 0, height: 1 },
    },
    optionText: {
        fontWeight: '600',
        fontSize: 14,
        letterSpacing: 0.3,
    },
    textInputBox: {
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
    },
    textInput: {
        color: '#FFFFFF',
        fontSize: 16,
        paddingVertical: 8,
        paddingHorizontal: 4,
        letterSpacing: 0.3,
        fontWeight: '500',
    },
    selectionInput: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
    },
    listBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(52, 152, 219, 0.8)',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 6,
        marginRight: 8,
        marginBottom: 8,
        shadowColor: '#3498DB',
        shadowOpacity: 0.3,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
    },
    saveSection: {
        marginVertical: 20,
        paddingHorizontal: 4,
    },
    successMessage: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: 'rgba(46, 204, 113, 0.15)',
        padding: 12,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(46, 204, 113, 0.3)',
    },
    successText: {
        color: '#2ECC71',
        fontSize: 14,
        fontWeight: '600',
        letterSpacing: 0.3,
    },
    errorMessage: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: 'rgba(231, 76, 60, 0.15)',
        padding: 12,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(231, 76, 60, 0.3)',
    },
    errorText: {
        color: '#E74C3C',
        fontSize: 14,
        fontWeight: '600',
        letterSpacing: 0.3,
        textAlign: 'center',
    },
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        width: '100%',
        backgroundColor: '#2ECC71',
        padding: 16,
        borderRadius: 16,
        shadowColor: '#2ECC71',
        shadowOpacity: 0.3,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        borderWidth: 1,
        borderColor: 'rgba(46, 204, 113, 0.3)',
    },
    saveButtonSuccess: {
        backgroundColor: '#27AE60',
        shadowColor: '#27AE60',
    },
    saveButtonSaving: {
        backgroundColor: '#95A5A6',
        shadowColor: '#95A5A6',
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    summaryContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: 16,
        padding: 20,
        marginVertical: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    summaryTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 16,
        textAlign: 'center',
        letterSpacing: 0.5,
    },
    summaryItem: {
        marginBottom: 12,
    },
    summaryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    summaryLabel: {
        flex: 1,
        fontSize: 14,
        color: '#E5E7EB',
        fontWeight: '500',
        marginLeft: 8,
    },
    summaryPercentage: {
        fontSize: 12,
        color: '#3498DB',
        fontWeight: '600',
        minWidth: 40,
        textAlign: 'right',
    },
    summaryProgressBackground: {
        width: '100%',
        height: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 2,
        overflow: 'hidden',
    },
    summaryProgressFill: {
        height: '100%',
        backgroundColor: '#3498DB',
        borderRadius: 2,
    },
    loadingBack: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'absolute',
        top: 0,
        backgroundColor: 'rgba(15, 20, 25, 0.8)',
        backdropFilter: 'blur(10px)',
    },
    loadingBox: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        flexDirection: 'row',
        gap: 12,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    }
});