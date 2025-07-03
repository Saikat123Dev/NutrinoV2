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
  const clerkId: string = user?.id as string;

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

  // Option actions
  // generate meal plan
  const [mealPlan, setMealPlan] = useState<Record<string, any> | null>(null);
  const [generating, setGenerating] = useState<boolean>(false);
  const generateMealPlan = async () => {
    if (!clerkId) return;
    try {
      setGenerating(true);
      await axiosInstance.post('/v1/user/mealplan/generate',
        { clerkId }
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

  // get curremt 7 day meal plan
  const [mealLoading, setMealLoading] = useState<boolean>(false);
  const getLoadedMealPlan = async () => {
    try {
      setMealLoading(true)
      await axiosInstance.post('/v1/user/mealplan', { clerkId })
        .then(res => {
          const data = res.data.data;
          // console.log(data);

          setMealPlan(data)
        })
    } catch (error) {
      if (axios.isAxiosError?.(error)) {
        const status = error.response?.status;
        if (status === 404) generateMealPlan() // If meal plan is not there
      }
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
            <Text style={styles.title}>Meal Planning</Text>
            <Text style={styles.subtitle}>Plan your nutrition journey</Text>
          </View>

          <View style={styles.quickActionsContainer}>
            <Pressable style={({ pressed }) => [styles.quickActionButton, { transform: [{ scale: pressed ? 0.95 : 1 }] }]} disabled={generating || mealLoading} onPress={handleActionPress} >
              <LinearGradient colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']} style={styles.quickActionGradient}>
                {generating && <ActivityIndicator />}
                {!generating && <MaterialCommunityIcons name={'auto-fix'} size={24} color={'#4FC3F7'} />}
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
    </>
  );
}


const DayPlanCard = ({ plan }: { plan: Record<string, any> | null }) => {
  const handleMealPress = () => {
    if (!plan?.day) return;
    router.push({ pathname: '/mealplanning/dailyMealPlan', params: { day: plan.day } })
  }
  return (
    plan ?
      <Pressable android_ripple={{ color: "rgba(31, 74, 98, 0.9)" }} style={[styles.nutritionContainer, { marginBottom: 20,backgroundColor: 'rgba(255, 255, 255, 0.08)'}]} onPress={handleMealPress}>
        <Text style={styles.nutritionTitle}>{plan.dayName}</Text>
        <View style={styles.nutritionStats}>
          <View style={styles.nutritionItem}>
            <MaterialCommunityIcons name="fire" size={22} color="#FFB74D" />
            <Text style={styles.nutritionValue}>{plan.totalCalories} Cal</Text>
            <Text style={styles.nutritionLabel}>Calories</Text>
          </View>
          <View style={styles.nutritionItem}>
            <MaterialCommunityIcons name="food-variant" size={22} color="#66BB6A" />
            <Text style={styles.nutritionValue}>{plan.totalProtein}g</Text>
            <Text style={styles.nutritionLabel}>Protein</Text>
          </View>
          <View style={styles.nutritionItem}>
            <MaterialCommunityIcons name="noodles" size={22} color="#4FC3F7" />
            <Text style={styles.nutritionValue}>{plan.totalCarbs}g</Text>
            <Text style={styles.nutritionLabel}>Carbs</Text>
          </View>
          <View style={styles.nutritionItem}>
            <MaterialCommunityIcons name="oil" size={22} color="#EF5350" />
            <Text style={styles.nutritionValue}>{plan.totalFat}g</Text>
            <Text style={styles.nutritionLabel}>Fat</Text>
          </View>
          <View style={styles.nutritionItem}>
            <MaterialCommunityIcons name="cup-water" size={22} color="#00E676" />
            <Text style={styles.nutritionValue}>{plan.waterIntake}ml</Text>
            <Text style={styles.nutritionLabel}>Water</Text>
          </View>
        </View>
        {/* You can add a button or expand to show meals for the day */}
      </Pressable>
      : null
  )
};

const WeeklyMealPlanList = ({ mealPlan }: { mealPlan: Record<string, any> | null }) => {
  if (!mealPlan || !mealPlan.dailyPlans?.length) return null;
  return (
    <View style={styles.nutritionSummary}>
      <Text style={styles.sectionTitle}>7-Day Meal Plan</Text>
      <FlatList
        data={mealPlan.dailyPlans}
        keyExtractor={item => item.day.toString()}
        renderItem={({ item }) => <DayPlanCard plan={item} />}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false}
      />
    </View>
  );
};



// Usage in your main component's JSX (add below mealsContainer in ScrollView):
// <WeeklyMealPlanList mealPlan={mealPlan} />

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
    color: '#FFB74D',
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
  quickActionsContainer: {
    marginBottom: 30
  },
  quickActionButton: {
    flex: 1,
    borderRadius: 15,
    overflow: 'hidden',
  },
  quickActionGradient: {
    padding:8,
    alignItems: 'center',
    borderRadius: 15,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10
  },
  quickActionText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '500',
    marginTop: 5
  },
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
    borderWidth: 6,
    borderColor: 'rgba(255, 255, 255, 0.2)',
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
    marginTop: 10
  },
  nutritionContainer: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)'
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