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
    const clerkId = user?.id;

    const { day } = useLocalSearchParams();

    // get mealplan by day
    const [mealPlan, setMealPlan] = useState<Record<string, any> | null>(null);
    const [loading, setLoading] = useState(false);

    // get todays plan
    const getTodaysPlan = async (day: number) => {
        try {
            setLoading(true);
            await axiosInsatance.post('/v1/user/mealplan/day', { clerkId, day })
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
                        colors={['#0A0E1A', '#1A1B3A', '#2D1B69', '#0F0F23']}
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
                        <Text style={styles.title}>Your Meal plan</Text>
                    </View>

                    {(mealPlan && !loading) && (
                        <View>
                            <Text style={styles.sectionTitle}>{mealPlan.dayName}</Text>
                            <View style={{
                                backgroundColor: 'rgba(255,255,255,0.07)',
                                borderRadius: 16,
                                padding: 16,
                                marginBottom: 20,
                                flexDirection: 'row',
                                justifyContent: 'space-between'
                            }}>
                                <View style={{ alignItems: 'center' }}>
                                    <MaterialCommunityIcons name="fire" size={22} color="#FFD54F" />
                                    <Text style={{ color: '#fff', fontWeight: '600' }}>Calories</Text>
                                    <Text style={{ color: '#FFD54F', fontSize: 18 }}>{mealPlan.totalCalories} kcal</Text>
                                </View>
                                <View style={{ alignItems: 'center' }}>
                                    <MaterialCommunityIcons name="food-drumstick" size={22} color="#81C784" />
                                    <Text style={{ color: '#fff', fontWeight: '600' }}>Protein</Text>
                                    <Text style={{ color: '#81C784', fontSize: 18 }}>{mealPlan.totalProtein}g</Text>
                                </View>
                                <View style={{ alignItems: 'center' }}>
                                    <MaterialCommunityIcons name="corn" size={22} color="#4FC3F7" />
                                    <Text style={{ color: '#fff', fontWeight: '600' }}>Carbs</Text>
                                    <Text style={{ color: '#4FC3F7', fontSize: 18 }}>{mealPlan.totalCarbs}g</Text>
                                </View>
                                <View style={{ alignItems: 'center' }}>
                                    <MaterialCommunityIcons name="peanut" size={22} color="#FF8A65" />
                                    <Text style={{ color: '#fff', fontWeight: '600' }}>Fat</Text>
                                    <Text style={{ color: '#FF8A65', fontSize: 18 }}>{mealPlan.totalFat}g</Text>
                                </View>
                            </View>
                            <View style={{
                                backgroundColor: 'rgba(255,255,255,0.04)',
                                borderRadius: 12,
                                padding: 12,
                                marginBottom: 18,
                                flexDirection: 'row',
                                alignItems: 'center'
                            }}>
                                <MaterialCommunityIcons name="cup-water" size={22} color="#4FC3F7" />
                                <Text style={{ color: '#fff', marginLeft: 8 }}>
                                    Water Intake: <Text style={{ color: '#4FC3F7', fontWeight: 'bold' }}>{mealPlan.waterIntake} ml</Text>
                                </Text>
                            </View>
                            {mealPlan.notes ? (
                                <View style={{
                                    backgroundColor: 'rgba(255,255,255,0.04)',
                                    borderRadius: 12,
                                    padding: 12,
                                    marginBottom: 18,
                                }}>
                                    <Text style={{ color: '#fff', fontStyle: 'italic' }}>{mealPlan.notes}</Text>
                                </View>
                            ) : null}
                            <Text style={[styles.sectionTitle, { marginTop: 10 }]}>Meals</Text>
                            {mealPlan.meals?.length ? mealPlan.meals.map((meal: any) => (
                                <MealCard key={meal.id} meal={meal} />
                            )) : (
                                <Text style={{ color: '#fff', fontStyle: 'italic', marginTop: 10 }}>No meals found.</Text>
                            )}
                        </View>
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

function MealCard({ meal }: { meal: any }) {
    const [expanded, setExpanded] = useState(false);

    // handle refresh meal
    const [refreshedMeal, setRefreshedMeal] = useState<Record<string, any> | null>(null);
    useEffect(() => {
        if (meal)
            setRefreshedMeal(meal);
    }, [meal]);

    const [refreshing, setRefreshing] = useState(false);
    const handleRefreshMeal = async () => {
        if (!meal || !meal?.id) return;
        try {
            setRefreshing(true);
            await axiosInsatance.post('/v1/user/meal/refresh', { mealId: meal?.id })
                .then(res => {
                    const mealData = res.data.data
                    if (mealData)
                        setRefreshedMeal(mealData);

                })
        } catch (error) {
            if (axios.isAxiosError(error))
                console.log(error.response);
        }
        setRefreshing(false);
    }
    return (
        <Pressable
            onPress={() => setExpanded(e => !e)}
            style={{
                backgroundColor: expanded ? 'rgba(22, 58, 89, 0.9)' : 'rgba(16, 37, 52, 0.78)',
                borderRadius: 14,
                padding: 16,
                marginBottom: 16,
            }}
            android_ripple={{ color: 'rgba(48, 82, 107, 0.06)' }}
        >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                <MaterialCommunityIcons
                    name={
                        refreshedMeal?.mealType === 'BREAKFAST' ? 'food-croissant' :
                            refreshedMeal?.mealType === 'LUNCH' ? 'food-apple' :
                                refreshedMeal?.mealType === 'DINNER' ? 'food-steak' :
                                    'food'
                    }
                    size={22}
                    color="#FFD54F"
                    style={{ marginRight: 8 }}
                />
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16, flex: 1 }}>
                    {refreshedMeal?.mealType.charAt(0) + refreshedMeal?.mealType.slice(1).toLowerCase()} - {refreshedMeal?.name}
                </Text>
                <MaterialCommunityIcons
                    name={expanded ? 'chevron-up' : 'chevron-down'}
                    size={22}
                    color="#fff"
                />
            </View>
            <Text style={{ color: '#B0BEC5', fontSize: 13, marginBottom: 6 }}>{refreshedMeal?.description}</Text>
            <View style={{ flexDirection: 'row', marginBottom: expanded ? 10 : 0 }}>
                <Text style={{ color: '#FFD54F', marginRight: 12 }}>{refreshedMeal?.calories} kcal</Text>
                <Text style={{ color: '#81C784', marginRight: 12 }}>{refreshedMeal?.protein}g protein</Text>
                <Text style={{ color: '#4FC3F7', marginRight: 12 }}>{refreshedMeal?.carbs}g carbs</Text>
                <Text style={{ color: '#FF8A65' }}>{refreshedMeal?.fat}g fat</Text>
            </View>
            {expanded && (
                <View style={{ marginTop: 10 }}>
                    <Text style={{ color: '#fff', fontWeight: '600', marginBottom: 4 }}>Ingredients:</Text>
                    {refreshedMeal?.ingredients?.length ? refreshedMeal?.ingredients.map((ing: string, i: number) => (
                        <Text key={i} style={{ color: '#B0BEC5', marginLeft: 8 }}>• {ing}</Text>
                    )) : <Text style={{ color: '#B0BEC5', marginLeft: 8 }}>No ingredients listed.</Text>}

                    <Text style={{ color: '#fff', fontWeight: '600', marginTop: 8, marginBottom: 4 }}>Preparation Steps:</Text>
                    {refreshedMeal?.preparationSteps?.length ? refreshedMeal?.preparationSteps.map((step: string, i: number) => (
                        <Text key={i} style={{ color: '#B0BEC5', marginLeft: 8 }}>{i + 1}. {step}</Text>
                    )) : <Text style={{ color: '#B0BEC5', marginLeft: 8 }}>No steps listed.</Text>}

                    {refreshedMeal?.healthBenefits?.length ? (
                        <>
                            <Text style={{ color: '#fff', fontWeight: '600', marginTop: 8, marginBottom: 4 }}>Health Benefits:</Text>
                            {refreshedMeal?.healthBenefits.map((benefit: string, i: number) => (
                                <Text key={i} style={{ color: '#B0BEC5', marginLeft: 8 }}>• {benefit}</Text>
                            ))}
                        </>
                    ) : null}
                    <Text style={{ color: '#fff', marginTop: 8 }}>
                        Preparation Time: <Text style={{ color: '#FFD54F', fontWeight: 'bold' }}>{refreshedMeal?.preparationTime} min</Text>
                    </Text>
                </View>
            )}
            <Pressable style={styles.refreshButton} android_ripple={{ color: "rgba(0, 0, 0, 0.13)" }} onPress={handleRefreshMeal} disabled={!meal || refreshing}>
                <MaterialCommunityIcons name='refresh' size={17} color={'#ffff'} />
                <Text style={{ fontSize: 17, color: '#ffff' }}>{refreshing ? "Refreshing meal..." : "Refresh meal"}</Text>
            </Pressable>
        </Pressable>
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
    },
    headerContainer: {
        alignItems: 'center',
        marginBottom: 30,
        paddingTop: 10
    },
    backButton: {
        position: 'absolute',
        left: 0,
        top: 15,
        padding: 10,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.1)'
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#ae5252',
        marginBottom: 5,
        textAlign: 'center',
        letterSpacing: 1
    },
    subtitle: {
        fontSize: 14,
        color: '#B0BEC5',
        fontStyle: 'italic'
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FFFFFF',
        marginBottom: 15
    },
    loadingBack: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'absolute',
        top: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.2)'
    },
    loadingBox: {
        width: `60%`,
        height: 40,
        backgroundColor: '#ffff',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
        flexDirection: 'row',
        gap: 5
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