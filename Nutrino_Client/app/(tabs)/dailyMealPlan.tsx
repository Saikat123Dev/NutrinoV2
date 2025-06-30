import axiosInsatance from '@/configs/axios-config';
import { useUser } from '@clerk/clerk-expo';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import axios from 'axios';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Dimensions, Easing, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');
const nodeCount = 8;

export default function DailyMealPlanPage() {
    const [nodePositions, setNodePositions] = useState<Array<Record<string, any>>>([]);
    const nodeAnimations = useRef(Array(nodeCount).fill(undefined).map(() => ({
        opacity: new Animated.Value(0),
        scale: new Animated.Value(0.5),
        position: new Animated.ValueXY()
    }))).current;

    useEffect(() => {
        const initialNodePositions = Array(nodeCount).fill(undefined).map(() => {
            const centerX = width / 2;
            const centerY = height / 2;
            const radius = Math.min(width, height) * 0.25;
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * radius;

            return {
                x: centerX + Math.cos(angle) * distance,
                y: centerY + Math.sin(angle) * distance,
                size: Math.random() * 70 + 40,
                delay: Math.random() * 2000,
                duration: Math.random() * 3000 + 3000,
                color: `rgba(${Math.floor(Math.random() * 100 + 155)}, ${Math.floor(Math.random() * 150 + 100)}, ${Math.floor(Math.random() * 100 + 155)}, 0.6)`
            };
        });
        setNodePositions(initialNodePositions);

        nodeAnimations.forEach((anim, index) => {
            const { x, y, delay, duration } = initialNodePositions[index];
            const destX = x + (Math.random() - 0.5) * width * 0.15;
            const destY = y + (Math.random() - 0.5) * height * 0.15;

            anim.position.setValue({ x, y });

            Animated.sequence([
                Animated.delay(delay),
                Animated.parallel([
                    Animated.timing(anim.opacity, {
                        toValue: 0.3,
                        duration: duration * 0.3,
                        easing: Easing.out(Easing.cubic),
                        useNativeDriver: true,
                    }),
                    Animated.timing(anim.scale, {
                        toValue: 1,
                        duration: duration * 0.4,
                        easing: Easing.out(Easing.elastic(1)),
                        useNativeDriver: true,
                    })
                ]),
                Animated.loop(Animated.sequence([
                    Animated.timing(anim.position, {
                        toValue: { x: destX, y: destY },
                        duration,
                        easing: Easing.inOut(Easing.quad),
                        useNativeDriver: true,
                    }),
                    Animated.timing(anim.position, {
                        toValue: { x, y },
                        duration,
                        easing: Easing.inOut(Easing.quad),
                        useNativeDriver: true,
                    })
                ]))
            ]).start();
        });

        return () => nodeAnimations.forEach(anim => {
            anim.opacity.stopAnimation();
            anim.scale.stopAnimation();
            anim.position.stopAnimation();
        });
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
        <SafeAreaView style={styles.container}>
            <View style={styles.backgroundContainer}>
                <LinearGradient
                    colors={['#0D1421', '#1A237E', '#000051']}
                    style={styles.backgroundGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                />
                {nodePositions.map((node, index) => (
                    <Animated.View
                        key={`node-${index}`}
                        style={{
                            position: 'absolute',
                            width: node.size,
                            height: node.size,
                            borderRadius: node.size / 2,
                            backgroundColor: node.color,
                            transform: [
                                { translateX: Animated.subtract(nodeAnimations[index].position.x, node.size / 2) },
                                { translateY: Animated.subtract(nodeAnimations[index].position.y, node.size / 2) },
                                { scale: nodeAnimations[index].scale }
                            ],
                            opacity: nodeAnimations[index].opacity,
                        }}
                    />
                ))}
            </View>
            <ScrollView contentContainerStyle={styles.scrollViewContent}>
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
        backgroundColor: '#0D1421'
    },
    backgroundContainer: {
        position: 'absolute',
        width: 400,
        height: 785,
    },
    backgroundGradient: {
        flex: 1
    },
    scrollViewContent: {
        padding: 20,
        paddingBottom: 40
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