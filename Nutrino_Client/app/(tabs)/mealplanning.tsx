import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');
const nodeCount = 8;

export default function MealPlanningScreen() {
  const [nodePositions, setNodePositions] = useState([]);
  const nodeAnimations = useRef(Array(nodeCount).fill().map(() => ({
    opacity: new Animated.Value(0),
    scale: new Animated.Value(0.5),
    position: new Animated.ValueXY()
  }))).current;

  useEffect(() => {
    const initialNodePositions = Array(nodeCount).fill().map(() => {
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

  const mealCategories = [
    {
      id: 1,
      title: 'Breakfast',
      icon: 'coffee-outline',
      color: '#FFB74D',
      gradientColors: ['#4d1c02', '#7A3E00'],
      glowColor: '#FFB74D',
      time: '7:00 AM',
      calories: '320 Cal',
      description: 'Start your day right'
    },
    {
      id: 2,
      title: 'Lunch',
      icon: 'food-outline',
      color: '#66BB6A',
      gradientColors: ['#1B5E20', '#2E7D32'],
      glowColor: '#66BB6A',
      time: '12:30 PM',
      calories: '450 Cal',
      description: 'Balanced midday meal'
    },
    {
      id: 3,
      title: 'Dinner',
      icon: 'silverware-fork-knife',
      color: '#EF5350',
      gradientColors: ['#B71C1C', '#C62828'],
      glowColor: '#EF5350',
      time: '7:00 PM',
      calories: '380 Cal',
      description: 'End with nutrition'
    },
    {
      id: 4,
      title: 'Snacks',
      icon: 'food-apple-outline',
      color: '#AB47BC',
      gradientColors: ['#4A148C', '#6A1B9A'],
      glowColor: '#AB47BC',
      time: 'Anytime',
      calories: '150 Cal',
      description: 'Healthy treats'
    }
  ];

  const quickActions = [
    {
      id: 1,
      title: 'Generate Plan',
      icon: 'auto-fix',
      color: '#4FC3F7',
      action: 'generate'
    },
    {
      id: 2,
      title: 'Food Scanner',
      icon: 'camera-outline',
      color: '#00E676',
      action: 'scan'
    },
    {
      id: 3,
      title: 'Recipes',
      icon: 'book-open-outline',
      color: '#FF9800',
      action: 'recipes'
    }
  ];

  const handleCategoryPress = (category) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Navigate to specific meal category
  };

  const handleActionPress = (action) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    // Handle quick actions
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
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsRow}>
            {quickActions.map((action) => (
              <Pressable
                key={action.id}
                style={({ pressed }) => [
                  styles.quickActionButton,
                  { transform: [{ scale: pressed ? 0.95 : 1 }] }
                ]}
                onPress={() => handleActionPress(action.action)}
              >
                <LinearGradient
                  colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
                  style={styles.quickActionGradient}
                >
                  <MaterialCommunityIcons 
                    name={action.icon} 
                    size={24} 
                    color={action.color} 
                  />
                  <Text style={styles.quickActionText}>{action.title}</Text>
                </LinearGradient>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.mealsContainer}>
          <Text style={styles.sectionTitle}>Today's Meals</Text>
          <View style={styles.mealsGrid}>
            {mealCategories.map((meal) => (
              <Pressable
                key={meal.id}
                style={({ pressed }) => [
                  styles.mealCard,
                  { transform: [{ scale: pressed ? 0.95 : 1 }] }
                ]}
                onPress={() => handleCategoryPress(meal)}
              >
                <LinearGradient
                  colors={[...meal.gradientColors, '#121212']}
                  style={[
                    styles.mealGradient,
                    { 
                      shadowColor: meal.glowColor,
                      shadowOpacity: 0.3,
                      shadowOffset: { width: 0, height: 0 },
                      shadowRadius: 8,
                      elevation: 6,
                    }
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={[styles.mealIconContainer, { backgroundColor: `${meal.color}20` }]}>
                    <MaterialCommunityIcons 
                      name={meal.icon} 
                      size={32} 
                      color={meal.color} 
                    />
                  </View>
                  <Text style={styles.mealTitle}>{meal.title}</Text>
                  <Text style={styles.mealTime}>{meal.time}</Text>
                  <Text style={styles.mealCalories}>{meal.calories}</Text>
                  <Text style={styles.mealDescription}>{meal.description}</Text>
                  <View style={[styles.mealGlowEffect, { backgroundColor: meal.glowColor }]} />
                </LinearGradient>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.nutritionSummary}>
          <LinearGradient
            colors={['#1A237E', '#0D1421']}
            style={styles.nutritionContainer}
          >
            <Text style={styles.nutritionTitle}>Today's Nutrition</Text>
            <View style={styles.nutritionStats}>
              <View style={styles.nutritionItem}>
                <MaterialCommunityIcons name="fire" size={20} color="#FF6B6B" />
                <Text style={styles.nutritionLabel}>Calories</Text>
                <Text style={styles.nutritionValue}>1,300 / 2,000</Text>
              </View>
              <View style={styles.nutritionItem}>
                <MaterialCommunityIcons name="wheat" size={20} color="#FFB74D" />
                <Text style={styles.nutritionLabel}>Protein</Text>
                <Text style={styles.nutritionValue}>45g / 120g</Text>
              </View>
              <View style={styles.nutritionItem}>
                <MaterialCommunityIcons name="rice" size={20} color="#4FC3F7" />
                <Text style={styles.nutritionLabel}>Carbs</Text>
                <Text style={styles.nutritionValue}>180g / 250g</Text>
              </View>
            </View>
          </LinearGradient>
        </View>
      </ScrollView>
    </SafeAreaView>
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
    height :785,
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
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10
  },
  quickActionButton: {
    flex: 1,
    borderRadius: 15,
    overflow: 'hidden'
  },
  quickActionGradient: {
    padding: 15,
    alignItems: 'center',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)'
  },
  quickActionText: {
    color: '#FFFFFF',
    fontSize: 12,
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