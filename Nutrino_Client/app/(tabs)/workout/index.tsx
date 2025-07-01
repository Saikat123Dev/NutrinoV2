import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');
const nodeCount = 10;

export default function WorkoutScreen() {
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

  const isFocused = useIsFocused();


  const handleBackPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const bodyPartExercises = [
    {
      key: 'chest',
      label: 'Chest',
      icon: 'arm-flex',
      color: '#FF8A65',
      description: 'Exercises targeting the chest muscles',
    },
    {
      key: 'back',
      label: 'Back',
      icon: 'backburger',
      color: '#4FC3F7',
      description: 'Exercises for the upper and lower back',
    },
    {
      key: 'shoulders',
      label: 'Shoulders',
      icon: 'weight-lifter',
      color: '#BA68C8',
      description: 'Shoulder and deltoid exercises',
    },
    {
      key: 'upper arms',
      label: 'Arms',
      icon: 'arm-flex-outline',
      color: '#FFD54F',
      description: 'Biceps, triceps, and forearm exercises',
    },
    {
      key: 'upper legs',
      label: 'Legs',
      icon: 'run-fast',
      color: '#81C784',
      description: 'Quads, hamstrings, calves, and glutes',
    },
    {
      key: 'waist',
      label: 'Waist',
      icon: 'human-male-waist',
      color: '#F06292',
      description: 'Core and abdominal exercises',
    },
  ];

  const equipmentExercises = [
    {
      key: 'bodyweight',
      label: 'Bodyweight',
      icon: 'human-handsup',
      color: '#90CAF9',
      description: 'No equipment needed',
    },
    {
      key: 'dumbbell',
      label: 'Dumbbell',
      icon: 'dumbbell',
      color: '#FFB74D',
      description: 'Exercises using dumbbells',
    },
    {
      key: 'barbell',
      label: 'Barbell',
      icon: 'weight',
      color: '#A1887F',
      description: 'Exercises using barbells',
    },
    {
      key: 'kettlebell',
      label: 'Kettlebell',
      icon: 'kettlebell',
      color: '#64B5F6',
      description: 'Exercises using kettlebells',
    },
    {
      key: 'machine',
      label: 'Machine',
      icon: 'robot-industrial',
      color: '#E57373',
      description: 'Exercises using gym machines',
    },
    {
      key: 'band',
      label: 'Resistance Band',
      icon: 'gesture',
      color: '#AED581',
      description: 'Exercises using resistance bands',
    },
  ];

  const targetAreaExercises = [
    { key: 'abductors', label: 'Abductors', icon: 'walk', color: '#81C784', description: 'Outer thigh and hip exercises' },
    { key: 'abs', label: 'Abs', icon: 'ab-testing', color: '#F06292', description: 'Core and abdominal exercises' },
    { key: 'adductors', label: 'Adductors', icon: 'run-fast', color: '#FFD54F', description: 'Inner thigh exercises' },
    { key: 'biceps', label: 'Biceps', icon: 'arm-flex', color: '#4FC3F7', description: 'Biceps and upper arm exercises' },
    { key: 'calves', label: 'Calves', icon: 'shoe-print', color: '#BA68C8', description: 'Lower leg and calf exercises' },
    { key: 'cardiovascular system', label: 'Cardio', icon: 'heart-pulse', color: '#FF8A65', description: 'Cardiovascular and aerobic exercises' },
    { key: 'delts', label: 'Delts', icon: 'weight-lifter', color: '#90CAF9', description: 'Shoulder and deltoid exercises' },
    { key: 'forearms', label: 'Forearms', icon: 'hand-back-left', color: '#A1887F', description: 'Forearm and grip exercises' },
    { key: 'glutes', label: 'Glutes', icon: 'human-female', color: '#E57373', description: 'Glute and buttock exercises' },
    { key: 'hamstrings', label: 'Hamstrings', icon: 'run', color: '#AED581', description: 'Back of thigh exercises' },
    { key: 'lats', label: 'Lats', icon: 'arrow-expand-vertical', color: '#64B5F6', description: 'Latissimus dorsi and back exercises' },
    { key: 'levator scapulae', label: 'Levator Scapulae', icon: 'arrow-up-bold', color: '#FFD54F', description: 'Neck and upper back exercises' },
    { key: 'pectorals', label: 'Pectorals', icon: 'chest', color: '#FFB74D', description: 'Chest and pectoral exercises' },
    { key: 'quads', label: 'Quads', icon: 'bike', color: '#BA68C8', description: 'Front thigh exercises' },
    { key: 'serratus anterior', label: 'Serratus Anterior', icon: 'wave', color: '#81C784', description: 'Side rib and chest exercises' },
    { key: 'spine', label: 'Spine', icon: 'spine', color: '#4FC3F7', description: 'Spinal and back extension exercises' },
    { key: 'traps', label: 'Traps', icon: 'triangle', color: '#F06292', description: 'Trapezius and upper back exercises' },
    { key: 'triceps', label: 'Triceps', icon: 'arm-flex-outline', color: '#E57373', description: 'Triceps and upper arm exercises' },
    { key: 'upper back', label: 'Upper Back', icon: 'backburger', color: '#90CAF9', description: 'Upper back and posture exercises' },
  ];

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

        <View style={styles.categoriesContainer}>
          <Text style={styles.sectionTitle}>Body part Exercises</Text>
          <View style={styles.categoriesGrid}>
            {bodyPartExercises.map((item) => (
              <Pressable
                key={item.key}
                style={styles.categoryCard}
                android_ripple={{ color: 'rgba(53, 123, 151, 0.48)', borderless: false }}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push({ pathname: '/workout/exerciseList', params: { type: 'bodyPart', id: item.key } })
                }}
              >
                <LinearGradient
                  colors={[item.color, '#232946']}
                  style={styles.categoryGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={[styles.categoryIconContainer, { backgroundColor: item.color + '22' }]}>
                    <MaterialCommunityIcons name={item.icon as any} size={32} color="#fff" />
                  </View>
                  <Text style={styles.categoryTitle}>{item.label}</Text>
                  <Text style={styles.categoryDescription}>{item.description}</Text>
                </LinearGradient>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.categoriesContainer}>
          <Text style={styles.sectionTitle}>Equipment Exercises</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingVertical: 10, gap: 14 }}
          >
            {equipmentExercises.map((item) => (
              <Pressable
                key={item.key}
                style={[styles.equipmentButton, {
                  borderColor: item.color + '55',
                  shadowColor: item.color,
                }]}
                android_ripple={{ color: item.color + '33', borderless: false }}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push({ pathname: '/workout/exerciseList', params: { type: 'equipment', id: item.key } })
                }}
              >
                <View style={{ alignItems: 'center', padding: 18 }}>
                  <View style={{
                    backgroundColor: item.color + '22',
                    borderRadius: 16,
                    padding: 10,
                    marginBottom: 12
                  }}>
                    <MaterialCommunityIcons name={item.icon as any} size={34} color={item.color} />
                  </View>
                  <Text style={{ color: item.color, fontWeight: '700', fontSize: 15, marginBottom: 4, textAlign: 'center' }}>
                    {item.label}
                  </Text>
                  <Text style={{ color: '#B0BEC5', fontSize: 11, textAlign: 'center' }}>
                    {item.description}
                  </Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <View style={styles.categoriesContainer}>
          <Text style={styles.sectionTitle}>Exercises by Target Area</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingVertical: 10, gap: 10 }}
          >
            {targetAreaExercises.map((item) => (
              <Pressable
                key={item.key}
                style={[styles.targetAreaButton, {
                  borderColor: item.color + '55',
                  shadowColor: item.color,
                }]}
                android_ripple={{ color: item.color + '33', borderless: false }}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push({ pathname: '/workout/exerciseList', params: { type: 'target', id: item.key } })
                }}
              >
                <LinearGradient
                  colors={['#232946', item.color + '44']}
                  style={{
                    borderRadius: 18,
                    padding: 14,
                    alignItems: 'center',
                    minHeight: 130,
                    justifyContent: 'center'
                  }}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={{
                    backgroundColor: item.color + '22',
                    borderRadius: 14,
                    padding: 8,
                    marginBottom: 10
                  }}>
                    <MaterialCommunityIcons name={item.icon as any} size={28} color={item.color} />
                  </View>
                  <Text style={{ color: item.color, fontWeight: '700', fontSize: 13, marginBottom: 2, textAlign: 'center' }}>
                    {item.label}
                  </Text>
                  <Text style={{ color: '#B0BEC5', fontSize: 10, textAlign: 'center' }}>
                    {item.description}
                  </Text>
                </LinearGradient>
              </Pressable>
            ))}
          </ScrollView>
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
    gap: 10
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
  },
  equipmentButton: {
    width: 140,
    marginRight: 12,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#181F2F',
    borderWidth: 1,
    elevation: 3,
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }
  },
  targetAreaButton: {
    width: 110,
    marginRight: 12,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#181F2F',
    borderWidth: 1,
    elevation: 2,
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }
  }
});