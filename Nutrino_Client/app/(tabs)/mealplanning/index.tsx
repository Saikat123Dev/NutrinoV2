import PremiumGuard from '@/components/PremiumGuard';
import axiosInstance from '@/configs/axios-config';
import { useUser } from '@clerk/clerk-expo';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import axios from 'axios';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Dimensions, Easing, FlatList, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
const { width, height } = Dimensions.get('window');
const PARTICLE_COUNT = 25;

export default function MealPlanningScreen() {
  // get the current user
  const { user } = useUser();
  const email: string = user?.primaryEmailAddress?.emailAddress as string;

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
          '#3F51B5',
          '#283593',
          '#34495E',
          '#2C3E50',
          '#37474F'
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

  // Option actions
  // generate meal plan
  const [mealPlan, setMealPlan] = useState<Record<string, any> | null>(null);
  const [generating, setGenerating] = useState<boolean>(false);
  const generateMealPlan = async () => {
    if (!email) return;
    try {
      setGenerating(true);
      await axiosInstance.post('/v2/meal/generator',
        { email }
      )
        .then(res => {
          const resdata = res.data.data
          setMealPlan(resdata);
        })
    } catch (error) {
      console.error("Failed generating: ", error);
    }
    setGenerating(false);
  }

  // get current 7 day meal plan
  const [mealLoading, setMealLoading] = useState<boolean>(false);
  const getLoadedMealPlan = async () => {
    try {
      setMealLoading(true)
      await axiosInstance.post('/v1/user/mealplan', { email })
        .then(res => {
          const data = res.data.data;
          console.log("Loaded existing meal plan:", data);

          setMealPlan(data)
        })
    } catch (error) {
      if (axios.isAxiosError?.(error)) {
        const status = error.response?.status;
        if (status === 404) {
          console.log("No existing meal plan found");
          // Don't auto-generate, let user click the button
        }
      }
      console.error("Error loading meal plan:", error);
    }
    setMealLoading(false);
  }

  useEffect(() => {
    getLoadedMealPlan();
  }, []);

  const handleActionPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    generateMealPlan();
  };

  const handleBackPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  return (
    <>
      <PremiumGuard>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <SafeAreaView style={styles.container}>
        {/* Dynamic Background */}
        <View style={styles.backgroundContainer}>
          <LinearGradient
            colors={['#0A0E1B', '#1A1B3A', '#2C3E50', '#34495E', '#1A1A2E']}
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
            <Text style={styles.title}>Meal Planning</Text>
            <Text style={styles.subtitle}>Plan your nutrition journey</Text>
          </View>

          <View style={styles.quickActionsContainer}>
            <Pressable style={({ pressed }) => [styles.quickActionButton, { transform: [{ scale: pressed ? 0.95 : 1 }] }]} disabled={generating || mealLoading} onPress={handleActionPress} >
              <LinearGradient colors={['#283593', '#3F51B5']} style={styles.quickActionGradient}>
                {generating && <ActivityIndicator color="#FFFFFF" />}
                {!generating && <MaterialCommunityIcons name={'auto-fix'} size={24} color={'#FFFFFF'} />}
                <Text style={styles.quickActionText}>{generating ? "Generating" : "Generate"} plans</Text>
              </LinearGradient>
            </Pressable>
          </View>

          {mealLoading && <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 10 }}>
            <ActivityIndicator size={20} />
            <Text style={{ color: '#ffff' }}>Loading plans...</Text>
          </View>}

          {(mealPlan && mealPlan.dailyPlans?.length > 0) ?
            <WeeklyMealPlanList mealPlan={mealPlan} /> :
            !mealLoading && <Text style={{ color: "#ffff", fontSize: 17, textAlign: 'center' }}>You don't have any meal plans. Try to generate it</Text>
          }
        </ScrollView>
      </SafeAreaView>
       </PremiumGuard>
    </>
  );
}


const DayPlanCard = ({ plan, index }: { plan: Record<string, any> | null; index: number }) => {
  const cardAnimation = useRef(new Animated.Value(0)).current;
  const scaleAnimation = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(cardAnimation, {
      toValue: 1,
      duration: 800,
      delay: index * 100,
      easing: Easing.out(Easing.back(1.1)),
      useNativeDriver: true,
    }).start();
  }, []);

  const handleMealPress = () => {
    if (!plan?.day) return;
    
    // Animate press effect
    Animated.sequence([
      Animated.timing(scaleAnimation, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnimation, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      })
    ]).start();
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({ pathname: '/mealplanning/dailyMealPlan', params: { day: plan.day } })
  }

  if (!plan) return null;

  // Professional gradient colors for sophisticated, modern look
  const dayGradients = [
    ['#1A1A2E', '#16213E'], // Deep navy professional
    ['#0F4C75', '#3282B8'], // Professional blue
    ['#2C3E50', '#4A6741'], // Elegant dark teal
    ['#34495E', '#5D4E75'], // Sophisticated purple-grey
    ['#2E3440', '#4C566A'], // Modern dark slate
    ['#283593', '#3F51B5'], // Corporate indigo
    ['#37474F', '#455A64']  // Professional blue-grey
  ];

  const currentGradient = dayGradients[index % dayGradients.length];

  return (
    <Animated.View
      style={[
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
      <Pressable 
        style={[styles.dayPlanCard, { marginBottom: 20 }]} 
        onPress={handleMealPress}
        android_ripple={{ color: "rgba(255, 255, 255, 0.1)" }}
      >
        <LinearGradient
          colors={[`${currentGradient[0]}15`, `${currentGradient[1]}20`]}
          style={styles.dayPlanGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Floating orbs for visual appeal */}
          <View style={[styles.floatingOrb, { 
            backgroundColor: `${currentGradient[0]}20`, 
            top: 10, 
            right: 15,
            width: 60,
            height: 60
          }]} />
          <View style={[styles.floatingOrb, { 
            backgroundColor: `${currentGradient[1]}15`, 
            bottom: 15, 
            left: 10,
            width: 40,
            height: 40
          }]} />
          
          {/* Day header with enhanced styling */}
          <View style={styles.dayHeader}>
            <View style={styles.dayTitleContainer}>
              <Text style={styles.dayName}>{plan.dayName}</Text>
              <Text style={styles.dayNumber}>Day {plan.day}</Text>
            </View>
            <View style={[styles.dayBadge, { backgroundColor: currentGradient[0] }]}>
              <MaterialCommunityIcons name="calendar-today" size={18} color="white" />
            </View>
          </View>

          {/* Enhanced nutrition stats grid */}
          <View style={styles.nutritionGrid}>
            <View style={styles.nutritionRow}>
              <View style={styles.nutritionItemEnhanced}>
                <View style={[styles.iconContainer, { backgroundColor: '#FFD54F30' }]}>
                  <MaterialCommunityIcons name="fire" size={20} color="#FFD54F" />
                </View>
                <Text style={styles.nutritionValueEnhanced}>{plan.totalCalories}</Text>
                <Text style={styles.nutritionLabelEnhanced}>kcal</Text>
              </View>
              
              <View style={styles.nutritionItemEnhanced}>
                <View style={[styles.iconContainer, { backgroundColor: '#81C78430' }]}>
                  <MaterialCommunityIcons name="food-drumstick" size={20} color="#81C784" />
                </View>
                <Text style={styles.nutritionValueEnhanced}>{plan.totalProtein}g</Text>
                <Text style={styles.nutritionLabelEnhanced}>protein</Text>
              </View>

              <View style={styles.nutritionItemEnhanced}>
                <View style={[styles.iconContainer, { backgroundColor: 'rgba(63, 81, 181, 0.2)' }]}>
                  <MaterialCommunityIcons name="corn" size={20} color="#3F51B5" />
                </View>
                <Text style={styles.nutritionValueEnhanced}>{plan.totalCarbs}g</Text>
                <Text style={styles.nutritionLabelEnhanced}>carbs</Text>
              </View>

              <View style={styles.nutritionItemEnhanced}>
                <View style={[styles.iconContainer, { backgroundColor: '#FF8A6530' }]}>
                  <MaterialCommunityIcons name="peanut" size={20} color="#FF8A65" />
                </View>
                <Text style={styles.nutritionValueEnhanced}>{plan.totalFat}g</Text>
                <Text style={styles.nutritionLabelEnhanced}>fat</Text>
              </View>
            </View>
          </View>

          {/* Progress indicator */}
          <View style={styles.progressIndicator}>
            <View style={[styles.progressBar, { backgroundColor: `${currentGradient[0]}40` }]}>
              <View style={[styles.progressFill, { 
                backgroundColor: currentGradient[0],
                width: '85%' // You can make this dynamic based on completion
              }]} />
            </View>
            <Text style={styles.progressText}>Nutrition balanced</Text>
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
};

const WeeklyMealPlanList = ({ mealPlan }: { mealPlan: Record<string, any> | null }) => {
  const listAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(listAnimation, {
      toValue: 1,
      duration: 600,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, []);

  if (!mealPlan || !mealPlan.dailyPlans?.length) return null;

  return (
    <Animated.View 
      style={[
        styles.nutritionSummary,
        {
          opacity: listAnimation,
          transform: [{
            translateY: listAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: [30, 0],
            })
          }]
        }
      ]}
    >
      <View style={styles.sectionHeader}>
        <LinearGradient
          colors={['rgba(63, 81, 181, 0.15)', 'rgba(52, 73, 94, 0.1)']}
          style={styles.sectionHeaderGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <MaterialCommunityIcons name="calendar-week" size={28} color="#3F51B5" />
          <View style={styles.sectionHeaderText}>
            <Text style={styles.sectionTitle}>7-Day Meal Plan</Text>
            <Text style={styles.sectionSubtitle}>Personalized nutrition journey</Text>
          </View>
          <View style={styles.planBadge}>
            <Text style={styles.planBadgeText}>{mealPlan.dailyPlans.length}</Text>
          </View>
        </LinearGradient>
      </View>

      <FlatList
        data={mealPlan.dailyPlans}
        keyExtractor={item => item.day.toString()}
        renderItem={({ item, index }) => <DayPlanCard plan={item} index={index} />}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false}
        contentContainerStyle={styles.mealPlanList}
      />
    </Animated.View>
  );
};



// Usage in your main component's JSX (add below mealsContainer in ScrollView):
// <WeeklyMealPlanList mealPlan={mealPlan} />

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0E1B',
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
    padding: 12,
    borderRadius: 25,
    backgroundColor: 'rgba(63, 81, 181, 0.2)',
    backdropFilter: 'blur(10px)',
    borderWidth: 0,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 1.5,
    textShadowColor: 'rgba(63, 81, 181, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8
  },
  subtitle: {
    fontSize: 16,
    color: '#B0BEC5',
    fontStyle: 'italic',
    opacity: 0.8
  },
  
  // Enhanced Section Header Styles
  sectionHeader: {
    marginBottom: 25,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  sectionHeaderGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderWidth: 0,
  },
  sectionHeaderText: {
    flex: 1,
    marginLeft: 15,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#B0BEC5',
    opacity: 0.8
  },
  planBadge: {
    backgroundColor: 'rgba(63, 81, 181, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 0,
  },
  planBadgeText: {
    color: '#3F51B5',
    fontSize: 16,
    fontWeight: '700'
  },
  mealPlanList: {
    paddingTop: 10
  },

  // Enhanced Day Plan Card Styles
  dayPlanCard: {
    borderRadius: 25,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  dayPlanGradient: {
    padding: 25,
    position: 'relative',
    borderWidth: 0,
  },
  floatingOrb: {
    position: 'absolute',
    borderRadius: 1000,
    opacity: 0.6,
  },
  
  // Day Header Styles
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  dayTitleContainer: {
    flex: 1,
  },
  dayName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2
  },
  dayNumber: {
    fontSize: 14,
    color: '#B0BEC5',
    opacity: 0.8,
    fontWeight: '500'
  },
  dayBadge: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },

  // Enhanced Nutrition Grid Styles
  nutritionGrid: {
    marginBottom: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 18,
    padding: 15,
    borderWidth: 0,
    elevation: 2,
    shadowColor: 'rgba(63, 81, 181, 0.3)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nutritionItemEnhanced: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 4,
  },
  iconContainer: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  nutritionValueEnhanced: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    textAlign: 'center',
  },
  nutritionLabelEnhanced: {
    fontSize: 11,
    color: '#B0BEC5',
    fontWeight: '600',
    textAlign: 'center',
    opacity: 0.9
  },

  // Progress Indicator Styles
  progressIndicator: {
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#B0BEC5',
    fontWeight: '500',
    opacity: 0.8
  },

  // Quick Actions Enhanced
  quickActionsContainer: {
    marginBottom: 35
  },
  quickActionButton: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#3F51B5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  quickActionGradient: {
    padding: 18,
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12
  },
  quickActionText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 3,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2
  },

  // Legacy styles for compatibility
  mealsContainer: {
    marginBottom: 30
  },
  mealsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 15
  },
  mealCard: {
    width: (width - 55) / 2,
    borderRadius: 20,
    overflow: 'hidden'
  },
  mealGradient: {
    borderRadius: 20,
    padding: 15,
    alignItems: 'center',
    minHeight: 160,
    borderWidth: 0,
    position: 'relative'
  },
  mealIconContainer: {
    borderRadius: 12,
    padding: 8,
    marginBottom: 10
  },
  mealTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4
  },
  mealTime: {
    fontSize: 12,
    color: '#B0BEC5',
    marginBottom: 2
  },
  mealCalories: {
    fontSize: 12,
    color: '#81C784',
    fontWeight: '600',
    marginBottom: 4
  },
  mealDescription: {
    fontSize: 10,
    color: '#90A4AE',
    textAlign: 'center'
  },
  mealGlowEffect: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    opacity: 0.6
  },
  nutritionSummary: {
    marginTop: 15
  },
  nutritionContainer: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 0,
    backgroundColor: 'rgba(63, 81, 181, 0.05)'
  },
  nutritionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 15,
    textAlign: 'center'
  },
  nutritionStats: {
    flexDirection: 'row',
    justifyContent: 'space-around'
  },
  nutritionItem: {
    alignItems: 'center',
    flex: 1
  },
  nutritionLabel: {
    fontSize: 11,
    color: '#B0BEC5',
    marginTop: 4,
    fontWeight: '500'
  },
  nutritionValue: {
    fontSize: 12,
    color: '#FFFFFF',
    marginTop: 2,
    fontWeight: '600'
  }
});