import axiosInsatance from '@/configs/axios-config';
import { useUser } from '@clerk/clerk-expo';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import axios from 'axios';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Dimensions, Easing, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');
const PARTICLE_COUNT = 25;

export default function DailyMealPlanPage() {
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
                    'rgba(100, 255, 218, 0.1)',
                    'rgba(139, 69, 255, 0.15)',
                    'rgba(255, 107, 107, 0.1)',
                    'rgba(255, 183, 77, 0.12)',
                    'rgba(79, 195, 247, 0.1)'
                ][Math.floor(Math.random() * 5)],
                glowColor: [
                    '#64FFDA',
                    '#8B45FF',
                    '#FF6B6B',
                    '#FFB74D',
                    '#4FC3F7'
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
        router.push('/(tabs)/mealplanning');
    };

    const isFocused = useIsFocused();
    // get user
    const { user } = useUser();
    const email = user?.primaryEmailAddress?.emailAddress;

    const { day } = useLocalSearchParams();

    // get mealplan by day
    const [mealPlan, setMealPlan] = useState<Record<string, any> | null>(null);
    const [loading, setLoading] = useState(false);

    // get todays plan
    const getTodaysPlan = async (day: number) => {
        try {
            setLoading(true);
            await axiosInsatance.post('/mealplan/day', { email, day })
                .then(res => {
                    const mealData = res.data.data;
                    setMealPlan(mealData);
                    // console.log(mealData);

                })
        } catch (error) {
            if (axios.isAxiosError?.(error)) {
                console.log(error.response);

            }
        }
        setLoading(false);
    }

    useEffect(() => {
        if (!day) return;
        getTodaysPlan(Number(day));
    }, [day]);

    return (
        <>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
            <SafeAreaView style={styles.container}>
                {/* Dynamic Background */}
                <View style={styles.backgroundContainer}>
                    <LinearGradient
                        colors={['#0B0F1A', '#1C1B3A', '#2A1B69', '#1A0F2E', '#0A0E1A']}
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
          shadowOpacity: 0.1, // softer glow
          transform: [
            {
              translateX: Animated.add(
                particleAnimations[index].position.x,
                Animated.multiply(particleAnimations[index].float, 20)
              ),
            },
            {
              translateY: Animated.add(
                particleAnimations[index].position.y,
                Animated.multiply(particleAnimations[index].float, 30)
              ),
            },
            { scale: particleAnimations[index].scale },
            {
              rotate: particleAnimations[index].rotate.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '360deg'],
              }),
            },
          ],
          opacity: Animated.multiply(
            particleAnimations[index].opacity,
            0.3 // reduce particle opacity to 30 %
          ),
        },
      ]}
    />
  ))}
                </View>
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
                            <Text style={styles.title}>Daily Nutrition</Text>
                            <Text style={styles.subtitle}>Your personalized meal journey</Text>
                        </View>
                    </View>

                    {(mealPlan && !loading) && (
                        <Animated.View style={styles.contentContainer}>
                            {/* Enhanced Day Header */}
                            <View style={styles.dayHeaderCard}>
                                <LinearGradient
                                    colors={['rgba(139, 69, 255, 0.25)', 'rgba(100, 255, 218, 0.20)', 'rgba(255, 183, 77, 0.15)']}
                                    style={styles.dayHeaderGradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                >
                                    <View style={styles.dayTitleSection}>
                                        <MaterialCommunityIcons name="calendar-today" size={32} color="#64FFDA" />
                                        <View style={styles.dayTextContainer}>
                                            <Text style={styles.dayTitle}>{mealPlan.dayName}</Text>
                                            <Text style={styles.daySubtitle}>Day {day} Nutrition Plan</Text>
                                        </View>
                                    </View>
                                    <View style={styles.dayBadgeContainer}>
                                        <MaterialCommunityIcons name="check-circle" size={24} color="#4CAF50" />
                                    </View>
                                </LinearGradient>
                            </View>

                            {/* Enhanced Nutrition Stats */}
                            <View style={styles.nutritionStatsCard}>
                                <LinearGradient
                                    colors={['rgba(255, 255, 255, 0.12)', 'rgba(139, 69, 255, 0.08)', 'rgba(255, 255, 255, 0.05)']}
                                    style={styles.nutritionStatsGradient}
                                >
                                    <Text style={styles.nutritionStatsTitle}>Daily Nutrition Breakdown</Text>
                                    <View style={styles.nutritionGrid}>
                                        <View style={styles.nutritionStatItem}>
                                            <View style={[styles.nutritionIconContainer, { backgroundColor: '#FFD54F30' }]}>
                                                <MaterialCommunityIcons name="fire" size={22} color="#FFD54F" />
                                            </View>
                                            <Text style={styles.nutritionStatLabel}>Calories</Text>
                                            <Text style={[styles.nutritionStatValue, { color: '#FFD54F' }]}>{mealPlan.totalCalories}</Text>
                                            <Text style={styles.nutritionStatUnit}>kcal</Text>
                                        </View>
                                        
                                        <View style={styles.nutritionStatItem}>
                                            <View style={[styles.nutritionIconContainer, { backgroundColor: '#81C78430' }]}>
                                                <MaterialCommunityIcons name="food-drumstick" size={22} color="#81C784" />
                                            </View>
                                            <Text style={styles.nutritionStatLabel}>Protein</Text>
                                            <Text style={[styles.nutritionStatValue, { color: '#81C784' }]}>{mealPlan.totalProtein}</Text>
                                            <Text style={styles.nutritionStatUnit}>g</Text>
                                        </View>

                                        <View style={styles.nutritionStatItem}>
                                            <View style={[styles.nutritionIconContainer, { backgroundColor: '#4FC3F730' }]}>
                                                <MaterialCommunityIcons name="corn" size={22} color="#4FC3F7" />
                                            </View>
                                            <Text style={styles.nutritionStatLabel}>Carbs</Text>
                                            <Text style={[styles.nutritionStatValue, { color: '#4FC3F7' }]}>{mealPlan.totalCarbs}</Text>
                                            <Text style={styles.nutritionStatUnit}>g</Text>
                                        </View>

                                        <View style={styles.nutritionStatItem}>
                                            <View style={[styles.nutritionIconContainer, { backgroundColor: '#FF8A6530' }]}>
                                                <MaterialCommunityIcons name="peanut" size={22} color="#FF8A65" />
                                            </View>
                                            <Text style={styles.nutritionStatLabel}>Fat</Text>
                                            <Text style={[styles.nutritionStatValue, { color: '#FF8A65' }]}>{mealPlan.totalFat}</Text>
                                            <Text style={styles.nutritionStatUnit}>g</Text>
                                        </View>
                                    </View>
                                </LinearGradient>
                            </View>

                            {/* Enhanced Hydration Card */}
                            <View style={styles.hydrationCard}>
                                <LinearGradient
                                    colors={['rgba(79, 195, 247, 0.15)', 'rgba(3, 169, 244, 0.1)']}
                                    style={styles.hydrationGradient}
                                >
                                    <View style={styles.hydrationIconContainer}>
                                        <MaterialCommunityIcons name="cup-water" size={32} color="#4FC3F7" />
                                    </View>
                                    <View style={styles.hydrationTextContainer}>
                                        <Text style={styles.hydrationTitle}>Hydration Goal</Text>
                                        <Text style={styles.hydrationValue}>{mealPlan.waterIntake} ml</Text>
                                    </View>
                                    <View style={styles.hydrationProgress}>
                                        <View style={[styles.progressBar, { backgroundColor: '#4FC3F720' }]}>
                                            <View style={[styles.progressFill, { backgroundColor: '#4FC3F7', width: '75%' }]} />
                                        </View>
                                        <Text style={styles.hydrationProgressText}>Daily target</Text>
                                    </View>
                                </LinearGradient>
                            </View>

                            {mealPlan.notes && (
                                <View style={styles.notesCard}>
                                    <LinearGradient
                                        colors={['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.02)']}
                                        style={styles.notesGradient}
                                    >
                                        <MaterialCommunityIcons name="note-text" size={24} color="#B0BEC5" />
                                        <Text style={styles.notesText}>{mealPlan.notes}</Text>
                                    </LinearGradient>
                                </View>
                            )}

                            {/* Enhanced Meals Section */}
                            <View style={styles.mealsSection}>
                                <View style={styles.mealsSectionHeader}>
                                    <MaterialCommunityIcons name="silverware-fork-knife" size={28} color="#FFB74D" />
                                    <Text style={styles.mealsSectionTitle}>Today's Meals</Text>
                                    <View style={styles.mealsCount}>
                                        <Text style={styles.mealsCountText}>{mealPlan.meals?.length || 0}</Text>
                                    </View>
                                </View>
                                
                                {mealPlan.meals?.length ? mealPlan.meals.map((meal: any, index: number) => (
                                    <EnhancedMealCard key={meal.id} meal={meal} index={index} />
                                )) : (
                                    <View style={styles.noMealsContainer}>
                                        <MaterialCommunityIcons name="food-off" size={48} color="#B0BEC5" />
                                        <Text style={styles.noMealsText}>No meals planned for today</Text>
                                    </View>
                                )}
                            </View>
                        </Animated.View>
                    )}
                    {(!mealPlan && !loading) && <Text>No meal plan found!</Text>}
                </ScrollView>
                {loading &&
                    <View style={styles.loadingBack}>
                        <View style={styles.loadingBox}>
                            <ActivityIndicator size={20} />
                            <Text>Loading Meals...</Text>
                        </View>
                    </View>}
            </SafeAreaView>
        </>
    )
};

function EnhancedMealCard({ meal, index }: { meal: any; index: number }) {
    const [expanded, setExpanded] = useState(false);
    const cardAnimation = useRef(new Animated.Value(0)).current;
    const scaleAnimation = useRef(new Animated.Value(1)).current;
    const rotateAnimation = useRef(new Animated.Value(0)).current;

    // handle refresh meal
    const [refreshedMeal, setRefreshedMeal] = useState<Record<string, any> | null>(null);
    useEffect(() => {
        if (meal) setRefreshedMeal(meal);
        
        // Animate card entrance
        Animated.timing(cardAnimation, {
            toValue: 1,
            duration: 600,
            delay: index * 150,
            easing: Easing.out(Easing.back(1.1)),
            useNativeDriver: true,
        }).start();
    }, [meal]);

    const [refreshing, setRefreshing] = useState(false);
    const handleRefreshMeal = async () => {
        if (!meal || !meal?.id) return;
        try {
            setRefreshing(true);
            // Animate refresh
            Animated.timing(rotateAnimation, {
                toValue: 1,
                duration: 1000,
                easing: Easing.linear,
                useNativeDriver: true,
            }).start(() => rotateAnimation.setValue(0));

            await axiosInsatance.post('/api/meal/refresh', { mealId: meal?.id })
                .then(res => {
                    const mealData = res.data.data
                    if (mealData) setRefreshedMeal(mealData);
                })
        } catch (error) {
            if (axios.isAxiosError(error))
                console.log(error.response);
        }
        setRefreshing(false);
    }

    const handlePress = () => {
        Animated.sequence([
            Animated.timing(scaleAnimation, {
                toValue: 0.97,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.timing(scaleAnimation, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
            })
        ]).start();
        
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setExpanded(e => !e);
    }

    const getMealIcon = (mealType: string) => {
        switch (mealType) {
            case 'BREAKFAST': return 'food-croissant';
            case 'LUNCH': return 'food-apple';
            case 'DINNER': return 'food-steak';
            case 'SNACK': return 'food-variant';
            default: return 'food';
        }
    };

    const getMealGradient = (mealType: string) => {
        switch (mealType) {
            case 'BREAKFAST': return ['#FFD54F20', '#FFA72615'];
            case 'LUNCH': return ['#4CAF5020', '#8BC34A15'];
            case 'DINNER': return ['#FF572215', '#E9134520'];
            case 'SNACK': return ['#9C27B020', '#673AB715'];
            default: return ['#607D8B20', '#45526815'];
        }
    };

    if (!refreshedMeal) return null;

    const mealGradient = getMealGradient(refreshedMeal.mealType);

    return (
        <Animated.View
            style={[
                styles.enhancedMealCard,
                {
                    transform: [
                        {
                            translateY: cardAnimation.interpolate({
                                inputRange: [0, 1],
                                outputRange: [50, 0],
                            }),
                        },
                        { scale: scaleAnimation }
                    ],
                    opacity: cardAnimation,
                }
            ]}
        >
            <Pressable onPress={handlePress} android_ripple={{ color: 'rgba(255, 255, 255, 0.1)' }}>
                <LinearGradient
                    colors={expanded ? ['rgba(255, 255, 255, 0.12)', 'rgba(255, 255, 255, 0.05)'] as const : mealGradient as any}
                    style={styles.enhancedMealGradient}
                >
                    {/* Meal Header */}
                    <View style={styles.mealHeader}>
                        <View style={styles.mealIconBadge}>
                            <MaterialCommunityIcons
                                name={getMealIcon(refreshedMeal.mealType)}
                                size={28}
                                color="#FFD54F"
                            />
                        </View>
                        <View style={styles.mealHeaderText}>
                            <Text style={styles.mealTypeText}>
                                {refreshedMeal.mealType.charAt(0) + refreshedMeal.mealType.slice(1).toLowerCase()}
                            </Text>
                            <Text style={styles.mealNameText}>{refreshedMeal.name}</Text>
                        </View>
                        <View style={styles.expandIconContainer}>
                            <Animated.View
                                style={{
                                    transform: [{
                                        rotate: expanded ? '180deg' : '0deg'
                                    }]
                                }}
                            >
                                <MaterialCommunityIcons name="chevron-down" size={24} color="#B0BEC5" />
                            </Animated.View>
                        </View>
                    </View>

                    {/* Meal Description */}
                    <Text style={styles.mealDescription}>{refreshedMeal.description}</Text>

                    {/* Nutrition Stats */}
                    <View style={styles.mealNutritionStats}>
                        <View style={styles.nutritionStatMini}>
                            <Text style={[styles.nutritionStatMiniValue, { color: '#FFD54F' }]}>{refreshedMeal.calories}</Text>
                            <Text style={styles.nutritionStatMiniLabel}>kcal</Text>
                        </View>
                        <View style={styles.nutritionStatMini}>
                            <Text style={[styles.nutritionStatMiniValue, { color: '#81C784' }]}>{refreshedMeal.protein}g</Text>
                            <Text style={styles.nutritionStatMiniLabel}>protein</Text>
                        </View>
                        <View style={styles.nutritionStatMini}>
                            <Text style={[styles.nutritionStatMiniValue, { color: '#4FC3F7' }]}>{refreshedMeal.carbs}g</Text>
                            <Text style={styles.nutritionStatMiniLabel}>carbs</Text>
                        </View>
                        <View style={styles.nutritionStatMini}>
                            <Text style={[styles.nutritionStatMiniValue, { color: '#FF8A65' }]}>{refreshedMeal.fat}g</Text>
                            <Text style={styles.nutritionStatMiniLabel}>fat</Text>
                        </View>
                    </View>

                    {/* Expanded Content */}
                    {expanded && (
                        <Animated.View style={styles.expandedContent}>
                            {/* Ingredients Section */}
                            <View style={styles.expandedSection}>
                                <View style={styles.expandedSectionHeader}>
                                    <MaterialCommunityIcons name="format-list-bulleted" size={20} color="#64FFDA" />
                                    <Text style={styles.expandedSectionTitle}>Ingredients</Text>
                                </View>
                                {refreshedMeal.ingredients?.length ? refreshedMeal.ingredients.map((ing: string, i: number) => (
                                    <View key={i} style={styles.listItem}>
                                        <MaterialCommunityIcons name="circle-small" size={16} color="#B0BEC5" />
                                        <Text style={styles.listItemText}>{ing}</Text>
                                    </View>
                                )) : <Text style={styles.noDataText}>No ingredients listed.</Text>}
                            </View>

                            {/* Preparation Steps */}
                            <View style={styles.expandedSection}>
                                <View style={styles.expandedSectionHeader}>
                                    <MaterialCommunityIcons name="chef-hat" size={20} color="#FFB74D" />
                                    <Text style={styles.expandedSectionTitle}>Preparation Steps</Text>
                                </View>
                                {refreshedMeal.preparationSteps?.length ? refreshedMeal.preparationSteps.map((step: string, i: number) => (
                                    <View key={i} style={styles.stepItem}>
                                        <View style={styles.stepNumber}>
                                            <Text style={styles.stepNumberText}>{i + 1}</Text>
                                        </View>
                                        <Text style={styles.stepText}>{step}</Text>
                                    </View>
                                )) : <Text style={styles.noDataText}>No preparation steps listed.</Text>}
                            </View>

                            {/* Health Benefits */}
                            {refreshedMeal.healthBenefits?.length > 0 && (
                                <View style={styles.expandedSection}>
                                    <View style={styles.expandedSectionHeader}>
                                        <MaterialCommunityIcons name="heart-pulse" size={20} color="#4CAF50" />
                                        <Text style={styles.expandedSectionTitle}>Health Benefits</Text>
                                    </View>
                                    {refreshedMeal.healthBenefits.map((benefit: string, i: number) => (
                                        <View key={i} style={styles.listItem}>
                                            <MaterialCommunityIcons name="check-circle" size={14} color="#4CAF50" />
                                            <Text style={styles.listItemText}>{benefit}</Text>
                                        </View>
                                    ))}
                                </View>
                            )}

                            {/* Preparation Time */}
                            <View style={styles.prepTimeContainer}>
                                <MaterialCommunityIcons name="clock-outline" size={20} color="#FFD54F" />
                                <Text style={styles.prepTimeText}>
                                    Preparation Time: <Text style={styles.prepTimeValue}>{refreshedMeal.preparationTime || 'N/A'} min</Text>
                                </Text>
                            </View>
                        </Animated.View>
                    )}

                    {/* Refresh Button */}
                    <Pressable 
                        style={[styles.enhancedRefreshButton, { opacity: refreshing ? 0.6 : 1 }]} 
                        android_ripple={{ color: "rgba(255, 255, 255, 0.2)" }} 
                        onPress={handleRefreshMeal} 
                        disabled={!meal || refreshing}
                    >
                        <Animated.View
                            style={{
                                transform: [{
                                    rotate: rotateAnimation.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: ['0deg', '360deg'],
                                    })
                                }]
                            }}
                        >
                            <MaterialCommunityIcons name='refresh' size={18} color={'#FFFFFF'} />
                        </Animated.View>
                        <Text style={styles.refreshButtonText}>
                            {refreshing ? "Refreshing..." : "Refresh Meal"}
                        </Text>
                    </Pressable>
                </LinearGradient>
            </Pressable>
        </Animated.View>
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
        height: '108%',
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
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    
    // Enhanced Header Styles
    headerContainer: {
        alignItems: 'center',
        marginBottom: 35,
        paddingTop: 10
    },
    backButton: {
        position: 'absolute',
        left: 0,
        top: 15,
        padding: 12,
        borderRadius: 25,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        backdropFilter: 'blur(10px)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    titleContainer: {
        alignItems: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: '#FFB74D',
        marginBottom: 8,
        textAlign: 'center',
        letterSpacing: 1.5,
        textShadowColor: 'rgba(255, 183, 77, 0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4
    },
    subtitle: {
        fontSize: 16,
        color: '#B0BEC5',
        fontStyle: 'italic',
        opacity: 0.8
    },
    
    // Content Container
    contentContainer: {
        paddingBottom: 30,
    },

    // Enhanced Day Header Card
    dayHeaderCard: {
        marginBottom: 25,
        borderRadius: 20,
        overflow: 'hidden',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
    },
    dayHeaderGradient: {
        padding: 25,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    dayTitleSection: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    dayTextContainer: {
        marginLeft: 15,
        flex: 1,
    },
    dayTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 4,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2
    },
    daySubtitle: {
        fontSize: 14,
        color: '#B0BEC5',
        opacity: 0.8,
    },
    dayBadgeContainer: {
        width: 45,
        height: 45,
        borderRadius: 22.5,
        backgroundColor: 'rgba(76, 175, 80, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#4CAF50',
    },

    // Enhanced Nutrition Stats Card
    nutritionStatsCard: {
        marginBottom: 25,
        borderRadius: 20,
        overflow: 'hidden',
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    nutritionStatsGradient: {
        padding: 25,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    nutritionStatsTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 20,
        textAlign: 'center',
    },
    nutritionGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 8,
        paddingHorizontal: 5,
    },
    nutritionStatItem: {
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderRadius: 16,
        padding: 12,
        flex: 1,
        minHeight: 85,
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.15)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    nutritionIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    nutritionStatLabel: {
        fontSize: 11,
        color: '#B0BEC5',
        fontWeight: '600',
        marginBottom: 2,
        textAlign: 'center',
    },
    nutritionStatValue: {
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 1,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
        textAlign: 'center',
    },
    nutritionStatUnit: {
        fontSize: 10,
        color: '#90A4AE',
        fontWeight: '500',
        textAlign: 'center',
    },

    // Enhanced Hydration Card
    hydrationCard: {
        marginBottom: 20,
        borderRadius: 18,
        overflow: 'hidden',
        elevation: 4,
        shadowColor: '#4FC3F7',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
    },
    hydrationGradient: {
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(79, 195, 247, 0.3)',
    },
    hydrationIconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(79, 195, 247, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    hydrationTextContainer: {
        flex: 1,
    },
    hydrationTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    hydrationValue: {
        fontSize: 18,
        fontWeight: '700',
        color: '#4FC3F7',
    },
    hydrationProgress: {
        alignItems: 'center',
    },
    progressBar: {
        width: 60,
        height: 6,
        borderRadius: 3,
        marginBottom: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 3,
    },
    hydrationProgressText: {
        fontSize: 10,
        color: '#B0BEC5',
        fontWeight: '500',
    },

    // Notes Card
    notesCard: {
        marginBottom: 25,
        borderRadius: 15,
        overflow: 'hidden',
    },
    notesGradient: {
        padding: 18,
        flexDirection: 'row',
        alignItems: 'flex-start',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    notesText: {
        fontSize: 14,
        color: '#E0E0E0',
        fontStyle: 'italic',
        marginLeft: 12,
        flex: 1,
        lineHeight: 20,
    },

    // Meals Section
    mealsSection: {
        marginTop: 10,
    },
    mealsSectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        paddingHorizontal: 5,
    },
    mealsSectionTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#FFFFFF',
        marginLeft: 12,
        flex: 1,
    },
    mealsCount: {
        backgroundColor: 'rgba(255, 183, 77, 0.2)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FFB74D',
    },
    mealsCountText: {
        color: '#FFB74D',
        fontSize: 14,
        fontWeight: '700',
    },

    // No Meals Container
    noMealsContainer: {
        alignItems: 'center',
        padding: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: 15,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    noMealsText: {
        fontSize: 16,
        color: '#B0BEC5',
        fontStyle: 'italic',
        marginTop: 15,
    },

    // Enhanced Meal Card Styles
    enhancedMealCard: {
        marginBottom: 20,
        borderRadius: 20,
        overflow: 'hidden',
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    enhancedMealGradient: {
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    
    // Meal Header
    mealHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    mealIconBadge: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(255, 212, 79, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
        borderWidth: 1,
        borderColor: 'rgba(255, 212, 79, 0.3)',
    },
    mealHeaderText: {
        flex: 1,
    },
    mealTypeText: {
        fontSize: 14,
        color: '#FFD54F',
        fontWeight: '600',
        marginBottom: 2,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    mealNameText: {
        fontSize: 18,
        color: '#FFFFFF',
        fontWeight: '700',
        lineHeight: 22,
    },
    expandIconContainer: {
        width: 35,
        height: 35,
        borderRadius: 17.5,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Meal Description
    mealDescription: {
        fontSize: 14,
        color: '#B0BEC5',
        lineHeight: 20,
        marginBottom: 15,
        opacity: 0.9,
    },

    // Meal Nutrition Stats
    mealNutritionStats: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        padding: 15,
        marginBottom: 15,
    },
    nutritionStatMini: {
        alignItems: 'center',
    },
    nutritionStatMiniValue: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 2,
    },
    nutritionStatMiniLabel: {
        fontSize: 11,
        color: '#B0BEC5',
        fontWeight: '500',
    },

    // Expanded Content
    expandedContent: {
        marginTop: 10,
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.1)',
    },
    expandedSection: {
        marginBottom: 20,
    },
    expandedSectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    expandedSectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
        marginLeft: 10,
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 8,
        paddingLeft: 10,
    },
    listItemText: {
        fontSize: 14,
        color: '#E0E0E0',
        marginLeft: 8,
        flex: 1,
        lineHeight: 18,
    },
    stepItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
        paddingLeft: 10,
    },
    stepNumber: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 183, 77, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        marginTop: 2,
    },
    stepNumberText: {
        fontSize: 12,
        color: '#FFB74D',
        fontWeight: '700',
    },
    stepText: {
        fontSize: 14,
        color: '#E0E0E0',
        flex: 1,
        lineHeight: 20,
    },
    noDataText: {
        fontSize: 14,
        color: '#90A4AE',
        fontStyle: 'italic',
        marginLeft: 20,
    },
    prepTimeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 212, 79, 0.1)',
        borderRadius: 10,
        padding: 12,
        marginTop: 5,
    },
    prepTimeText: {
        fontSize: 14,
        color: '#FFFFFF',
        marginLeft: 10,
    },
    prepTimeValue: {
        fontWeight: '700',
        color: '#FFD54F',
    },

    // Enhanced Refresh Button
    enhancedRefreshButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(139, 69, 255, 0.8)',
        borderRadius: 12,
        padding: 14,
        marginTop: 15,
        borderWidth: 1,
        borderColor: 'rgba(139, 69, 255, 0.3)',
    },
    refreshButtonText: {
        fontSize: 15,
        color: '#FFFFFF',
        fontWeight: '600',
        marginLeft: 8,
    },

    // Loading Styles
    loadingBack: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingBox: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 15,
        padding: 25,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 12,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    
    // Legacy styles
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FFFFFF',
        marginBottom: 15
    },
    refreshButton: {
        flexDirection: 'row',
        paddingVertical: 10,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 15,
        gap: 10,
        backgroundColor: 'rgb(107, 58, 176)',
        borderRadius: 10
    }
});