import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');
const nodeCount = 10;

export default function WorkoutScreen() {
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
      const radius = Math.min(width, height) * 0.3;
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * radius;

      return {
        x: centerX + Math.cos(angle) * distance,
        y: centerY + Math.sin(angle) * distance,
        size: Math.random() * 80 + 50,
        delay: Math.random() * 2500,
        duration: Math.random() * 2500 + 2500,
        color: `rgba(${Math.floor(Math.random() * 100 + 155)}, ${Math.floor(Math.random() * 100 + 155)}, 255, 0.65)`
      };
    });
    setNodePositions(initialNodePositions);

    nodeAnimations.forEach((anim, index) => {
      const { x, y, delay, duration } = initialNodePositions[index];
      const destX = x + (Math.random() - 0.5) * width * 0.2;
      const destY = y + (Math.random() - 0.5) * height * 0.2;

      anim.position.setValue({ x, y });

      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(anim.opacity, {
            toValue: 0.4,
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

  const workoutCategories = [
    {
      id: 1,
      title: 'Strength Training',
      icon: 'dumbbell',
      color: '#BA68C8',
      gradientColors: ['#220742', '#6A1B9A'],
      glowColor: '#BA68C8',
      duration: '45 min',
      level: 'Intermediate',
      description: 'Build muscle strength'
    },
    {
      id: 2,
      title: 'Cardio',
      icon: 'run-fast',
      color: '#FF6B6B',
      gradientColors: ['#B71C1C', '#C62828'],
      glowColor: '#FF6B6B',
      duration: '30 min',
      level: 'Beginner',
      description: 'Boost cardiovascular health'
    },
    {
      id: 3,
      title: 'Yoga',
      icon: 'yoga',
      color: '#4FC3F7',
      gradientColors: ['#062350', '#0C3B69'],
      glowColor: '#4FC3F7',
      duration: '60 min',
      level: 'All Levels',
      description: 'Flexibility and mindfulness'
    },
    {
      id: 4,
      title: 'HIIT',
      icon: 'timer-outline',
      color: '#66BB6A',
      gradientColors: ['#1B5E20', '#2E7D32'],
      glowColor: '#66BB6A',
      duration: '20 min',
      level: 'Advanced',
      description: 'High intensity training'
    }
  ];

  const quickStats = [
    {
      id: 1,
      title: 'This Week',
      icon: 'calendar-week',
      color: '#FFB74D',
      value: '3 workouts',
      subtext: '2 hours total'
    },
    {
      id: 2,
      title: 'Streak',
      icon: 'fire',
      color: '#FF6B6B',
      value: '5 days',
      subtext: 'Keep it up!'
    }
  ];

  const todayWorkout = {
    title: 'Upper Body Strength',
    exercises: [
      { name: 'Push-ups', sets: '3x12', icon: 'arm-flex' },
      { name: 'Pull-ups', sets: '3x8', icon: 'weight-lifter' },
      { name: 'Shoulder Press', sets: '3x10', icon: 'dumbbell' }
    ],
    duration: '35 min',
    calories: '280 Cal'
  };

  const handleCategoryPress = (category) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Navigate to specific workout category
  };

  const handleStartWorkout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    // Start workout routine
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
          <Text style={styles.title}>Workout</Text>
          <Text style={styles.subtitle}>Transform your fitness journey</Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            {quickStats.map((stat) => (
              <View key={stat.id} style={styles.statCard}>
                <LinearGradient
                  colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
                  style={styles.statGradient}
                >
                  <MaterialCommunityIcons 
                    name={stat.icon} 
                    size={24} 
                    color={stat.color} 
                  />
                  <Text style={styles.statTitle}>{stat.title}</Text>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statSubtext}>{stat.subtext}</Text>
                </LinearGradient>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.todayWorkoutContainer}>
          <Text style={styles.sectionTitle}>Today's Workout</Text>
          <LinearGradient
            colors={['#1A237E', '#0D1421']}
            style={styles.todayWorkoutCard}
          >
            <View style={styles.todayWorkoutHeader}>
              <Text style={styles.todayWorkoutTitle}>{todayWorkout.title}</Text>
              <View style={styles.todayWorkoutMeta}>
                <Text style={styles.todayWorkoutDuration}>{todayWorkout.duration}</Text>
                <Text style={styles.todayWorkoutCalories}>{todayWorkout.calories}</Text>
              </View>
            </View>
            
            <View style={styles.exercisesList}>
              {todayWorkout.exercises.map((exercise, index) => (
                <View key={index} style={styles.exerciseItem}>
                  <MaterialCommunityIcons 
                    name={exercise.icon} 
                    size={20} 
                    color="#BA68C8" 
                  />
                  <Text style={styles.exerciseName}>{exercise.name}</Text>
                  <Text style={styles.exerciseSets}>{exercise.sets}</Text>
                </View>
              ))}
            </View>

            <Pressable 
              style={({ pressed }) => [
                styles.startWorkoutButton,
                { transform: [{ scale: pressed ? 0.95 : 1 }] }
              ]}
              onPress={handleStartWorkout}
            >
              <LinearGradient
                colors={['#BA68C8', '#8E24AA']}
                style={styles.startWorkoutGradient}
              >
                <MaterialCommunityIcons name="play" size={20} color="#FFFFFF" />
                <Text style={styles.startWorkoutText}>Start Workout</Text>
              </LinearGradient>
            </Pressable>
          </LinearGradient>
        </View>

        <View style={styles.categoriesContainer}>
          <Text style={styles.sectionTitle}>Workout Categories</Text>
          <View style={styles.categoriesGrid}>
            {workoutCategories.map((category) => (
              <Pressable
                key={category.id}
                style={({ pressed }) => [
                  styles.categoryCard,
                  { transform: [{ scale: pressed ? 0.95 : 1 }] }
                ]}
                onPress={() => handleCategoryPress(category)}
              >
                <LinearGradient
                  colors={[...category.gradientColors, '#121212']}
                  style={[
                    styles.categoryGradient,
                    { 
                      shadowColor: category.glowColor,
                      shadowOpacity: 0.3,
                      shadowOffset: { width: 0, height: 0 },
                      shadowRadius: 8,
                      elevation: 6,
                    }
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={[styles.categoryIconContainer, { backgroundColor: `${category.color}20` }]}>
                    <MaterialCommunityIcons 
                      name={category.icon} 
                      size={28} 
                      color={category.color} 
                    />
                  </View>
                  <Text style={styles.categoryTitle}>{category.title}</Text>
                  <Text style={styles.categoryDuration}>{category.duration}</Text>
                  <Text style={styles.categoryLevel}>{category.level}</Text>
                  <Text style={styles.categoryDescription}>{category.description}</Text>
                  <View style={[styles.categoryGlowEffect, { backgroundColor: category.glowColor }]} />
                </LinearGradient>
              </Pressable>
            ))}
          </View>
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
    color: '#BA68C8',
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
  statsContainer: {
    marginBottom: 25
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15
  },
  statCard: {
    flex: 1,
    borderRadius: 15,
    overflow: 'hidden'
  },
  statGradient: {
    padding: 15,
    alignItems: 'center',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)'
  },
  statTitle: {
    color: '#B0BEC5',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 5
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 2
  },
  statSubtext: {
    color: '#90A4AE',
    fontSize: 10,
    marginTop: 2
  },
  todayWorkoutContainer: {
    marginBottom: 30
  },
  todayWorkoutCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)'
  },
  todayWorkoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15
  },
  todayWorkoutTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF'
  },
  todayWorkoutMeta: {
    alignItems: 'flex-end'
  },
  todayWorkoutDuration: {
    fontSize: 12,
    color: '#4FC3F7',
    fontWeight: '600'
  },
  todayWorkoutCalories: {
    fontSize: 12,
    color: '#FF6B6B',
    fontWeight: '600'
  },
  exercisesList: {
    marginBottom: 20
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)'
  },
  exerciseName: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 10
  },
  exerciseSets: {
    color: '#B0BEC5',
    fontSize: 12,
    fontWeight: '600'
  },
  startWorkoutButton: {
    borderRadius: 12,
    overflow: 'hidden'
  },
  startWorkoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20
  },
  startWorkoutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8
  },
  categoriesContainer: {
    marginBottom: 20
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 15
  },
  categoryCard: {
    width: (width - 55) / 2,
    borderRadius: 20,
    overflow: 'hidden'
  },
  categoryGradient: {
    borderRadius: 20,
    padding: 15,
    alignItems: 'center',
    minHeight: 160,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    position: 'relative'
  },
  categoryIconContainer: {
    borderRadius: 12,
    padding: 8,
    marginBottom: 10
  },
  categoryTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'center'
  },
  categoryDuration: {
    fontSize: 12,
    color: '#B0BEC5',
    marginBottom: 2
  },
  categoryLevel: {
    fontSize: 11,
    color: '#81C784',
    fontWeight: '600',
    marginBottom: 4
  },
  categoryDescription: {
    fontSize: 10,
    color: '#90A4AE',
    textAlign: 'center'
  },
  categoryGlowEffect: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    opacity: 0.6
  }
});