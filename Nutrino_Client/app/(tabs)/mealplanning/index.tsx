import axiosInstance from '@/configs/axios-config';
import { useUser } from '@clerk/clerk-expo';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import axios from 'axios';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Dimensions, Easing, FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');
const nodeCount = 8;

export default function MealPlanningScreen() {
  // get the current user
  const { user } = useUser();
  const clerkId: string = user?.id as string;

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
  );
}


const DayPlanCard = ({ plan }: { plan: Record<string, any> | null }) => {
  const handleMealPress = () => {
    if (!plan?.day) return;
    router.push({ pathname: '/mealplanning/dailyMealPlan', params: { day: plan.day } })
  }
  return (
    plan ?
      <Pressable android_ripple={{ color: "rgba(31, 74, 98, 0.06)" }} style={[styles.nutritionContainer, { marginBottom: 5, backgroundColor: '#181F2F' }]} onPress={handleMealPress}>
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
    padding: 15,
    alignItems: 'center',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
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
    borderWidth: 1,
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
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)'
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