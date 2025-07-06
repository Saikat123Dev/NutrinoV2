import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');
const PARTICLE_COUNT = 25;

export default function WorkoutScreen() {
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
      color: '#FF6B6B',
      gradientColors: ['#FF6B6B', '#FF8A80'],
      description: 'Build powerful pectorals',
      exercises: '24 exercises',
    },
    {
      key: 'back',
      label: 'Back',
      icon: 'backburger',
      color: '#4FC3F7',
      gradientColors: ['#4FC3F7', '#81D4FA'],
      description: 'Strengthen your foundation',
      exercises: '32 exercises',
    },
    {
      key: 'shoulders',
      label: 'Shoulders',
      icon: 'weight-lifter',
      color: '#BA68C8',
      gradientColors: ['#BA68C8', '#CE93D8'],
      description: 'Sculpt impressive delts',
      exercises: '28 exercises',
    },
    {
      key: 'upper arms',
      label: 'Arms',
      icon: 'arm-flex-outline',
      color: '#FFD54F',
      gradientColors: ['#FFD54F', '#FFF176'],
      description: 'Power up your arms',
      exercises: '36 exercises',
    },
    {
      key: 'upper legs',
      label: 'Legs',
      icon: 'run-fast',
      color: '#81C784',
      gradientColors: ['#81C784', '#A5D6A7'],
      description: 'Build unstoppable power',
      exercises: '42 exercises',
    },
    {
      key: 'waist',
      label: 'Core',
      icon: 'human-male-waist',
      color: '#F06292',
      gradientColors: ['#F06292', '#F48FB1'],
      description: 'Forge steel abs',
      exercises: '30 exercises',
    },
  ];

  const equipmentExercises = [
    {
      key: 'bodyweight',
      label: 'Bodyweight',
      icon: 'human-handsup',
      color: '#90CAF9',
      gradientColors: ['#90CAF9', '#BBDEFB'],
      description: 'Zero equipment needed',
      exercises: '48 moves',
    },
    {
      key: 'dumbbell',
      label: 'Dumbbell',
      icon: 'dumbbell',
      color: '#FFB74D',
      gradientColors: ['#FFB74D', '#FFCC80'],
      description: 'Classic strength training',
      exercises: '52 moves',
    },
    {
      key: 'barbell',
      label: 'Barbell',
      icon: 'weight',
      color: '#A1887F',
      gradientColors: ['#A1887F', '#BCAAA4'],
      description: 'Heavy compound lifts',
      exercises: '26 moves',
    },
    {
      key: 'kettlebell',
      label: 'Kettlebell',
      icon: 'kettlebell',
      color: '#64B5F6',
      gradientColors: ['#64B5F6', '#90CAF9'],
      description: 'Dynamic power training',
      exercises: '34 moves',
    },
    {
      key: 'machine',
      label: 'Machine',
      icon: 'robot-industrial',
      color: '#E57373',
      gradientColors: ['#E57373', '#FFAB91'],
      description: 'Controlled isolation',
      exercises: '28 moves',
    },
    {
      key: 'band',
      label: 'Resistance Band',
      icon: 'gesture',
      color: '#AED581',
      gradientColors: ['#AED581', '#C8E6C9'],
      description: 'Portable versatility',
      exercises: '22 moves',
    },
  ];

  const targetAreaExercises = [
    { key: 'abductors', label: 'Abductors', icon: 'walk', color: '#81C784', gradientColors: ['#81C784', '#A5D6A7'], description: 'Outer thigh power', exercises: '12' },
    { key: 'abs', label: 'Abs', icon: 'ab-testing', color: '#F06292', gradientColors: ['#F06292', '#F48FB1'], description: 'Core strength', exercises: '26' },
    { key: 'adductors', label: 'Adductors', icon: 'run-fast', color: '#FFD54F', gradientColors: ['#FFD54F', '#FFF176'], description: 'Inner thigh focus', exercises: '14' },
    { key: 'biceps', label: 'Biceps', icon: 'arm-flex', color: '#4FC3F7', gradientColors: ['#4FC3F7', '#81D4FA'], description: 'Arm definition', exercises: '18' },
    { key: 'calves', label: 'Calves', icon: 'shoe-print', color: '#BA68C8', gradientColors: ['#BA68C8', '#CE93D8'], description: 'Lower leg power', exercises: '16' },
    { key: 'cardiovascular system', label: 'Cardio', icon: 'heart-pulse', color: '#FF6B6B', gradientColors: ['#FF6B6B', '#FF8A80'], description: 'Heart health', exercises: '32' },
    { key: 'delts', label: 'Delts', icon: 'weight-lifter', color: '#90CAF9', gradientColors: ['#90CAF9', '#BBDEFB'], description: 'Shoulder caps', exercises: '20' },
    { key: 'forearms', label: 'Forearms', icon: 'hand-back-left', color: '#A1887F', gradientColors: ['#A1887F', '#BCAAA4'], description: 'Grip strength', exercises: '15' },
    { key: 'glutes', label: 'Glutes', icon: 'human-female', color: '#E57373', gradientColors: ['#E57373', '#FFAB91'], description: 'Posterior power', exercises: '24' },
    { key: 'hamstrings', label: 'Hamstrings', icon: 'run', color: '#AED581', gradientColors: ['#AED581', '#C8E6C9'], description: 'Back thigh strength', exercises: '18' },
    { key: 'lats', label: 'Lats', icon: 'arrow-expand-vertical', color: '#64B5F6', gradientColors: ['#64B5F6', '#90CAF9'], description: 'Wing span', exercises: '22' },
    { key: 'levator scapulae', label: 'Levator Scapulae', icon: 'arrow-up-bold', color: '#FFB74D', gradientColors: ['#FFB74D', '#FFCC80'], description: 'Neck stability', exercises: '8' },
    { key: 'pectorals', label: 'Pectorals', icon: 'chest', color: '#BA68C8', gradientColors: ['#BA68C8', '#CE93D8'], description: 'Chest definition', exercises: '24' },
    { key: 'quads', label: 'Quads', icon: 'bike', color: '#81C784', gradientColors: ['#81C784', '#A5D6A7'], description: 'Front thigh power', exercises: '20' },
    { key: 'serratus anterior', label: 'Serratus Anterior', icon: 'wave', color: '#4FC3F7', gradientColors: ['#4FC3F7', '#81D4FA'], description: 'Side chest', exercises: '10' },
    { key: 'spine', label: 'Spine', icon: 'spine', color: '#F06292', gradientColors: ['#F06292', '#F48FB1'], description: 'Spinal health', exercises: '16' },
    { key: 'traps', label: 'Traps', icon: 'triangle', color: '#E57373', gradientColors: ['#E57373', '#FFAB91'], description: 'Upper back mass', exercises: '14' },
    { key: 'triceps', label: 'Triceps', icon: 'arm-flex-outline', color: '#90CAF9', gradientColors: ['#90CAF9', '#BBDEFB'], description: 'Arm definition', exercises: '18' },
    { key: 'upper back', label: 'Upper Back', icon: 'backburger', color: '#AED581', gradientColors: ['#AED581', '#C8E6C9'], description: 'Posture strength', exercises: '22' },
  ];

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <SafeAreaView style={styles.container}>
        {/* Dynamic Background - Keep existing animation */}
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
          {/* Enhanced Header */}
          <View style={styles.headerContainer}>
            <Pressable style={styles.backButton} onPress={handleBackPress}>
              <MaterialCommunityIcons name="arrow-left" size={22} color="#FFFFFF" />
            </Pressable>
            <View style={styles.headerContent}>
              <Text style={styles.title}>Fitness Pro</Text>
              <Text style={styles.subtitle}>Transform your fitness journey</Text>
              <View style={styles.headerAccent} />
            </View>
          </View>

          {/* Body Part Exercises - Enhanced */}
          <View style={styles.categoriesContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Body Part Training</Text>
              <Text style={styles.sectionSubtitle}>Target specific muscle groups</Text>
            </View>
            <View style={styles.categoriesGrid}>
              {bodyPartExercises.map((item, index) => (
                <Pressable
                  key={item.key}
                  style={[styles.categoryCard, { 
                    transform: [{ scale: 1 }],
                    shadowColor: item.color,
                    shadowOpacity: 0.25,
                    shadowRadius: 12,
                    shadowOffset: { width: 0, height: 6 },
                    elevation: 8
                  }]}
                  android_ripple={{ color: item.color + '33', borderless: false }}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    router.push({ pathname: '/workout/exerciseList', params: { type: 'bodyPart', id: item.key } })
                  }}
                >
                  <LinearGradient
                    colors={[
                      'rgba(15, 15, 35, 0.95)',
                      'rgba(26, 27, 58, 0.9)',
                      item.color + '22'
                    ]}
                    style={styles.categoryGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={styles.categoryTopSection}>
                      <View style={[styles.categoryIconContainer, { 
                        backgroundColor: item.color + '20',
                        borderColor: item.color + '40',
                        borderWidth: 1
                      }]}>
                        <MaterialCommunityIcons name={item.icon as any} size={22} color={item.color} />
                      </View>
                      <View style={styles.categoryBadge}>
                        <Text style={[styles.categoryBadgeText, { color: item.color }]}>
                          {item.exercises}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.categoryContent}>
                      <Text style={styles.categoryTitle}>{item.label}</Text>
                      <Text style={[styles.categoryDescription, { color: item.color + 'CC' }]}>
                        {item.description}
                      </Text>
                    </View>
                    <View style={[styles.categoryGlow, { backgroundColor: item.color + '15' }]} />
                  </LinearGradient>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Equipment Exercises - Enhanced */}
          <View style={styles.categoriesContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Equipment Training</Text>
              <Text style={styles.sectionSubtitle}>Choose your preferred tools</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScrollContent}
            >
              {equipmentExercises.map((item, index) => (
                <Pressable
                  key={item.key}
                  style={[styles.equipmentButton, {
                    borderColor: item.color + '40',
                    shadowColor: item.color,
                    shadowOpacity: 0.3,
                    shadowRadius: 10,
                    shadowOffset: { width: 0, height: 4 },
                    elevation: 6
                  }]}
                  android_ripple={{ color: item.color + '25', borderless: false }}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    router.push({ pathname: '/workout/exerciseList', params: { type: 'equipment', id: item.key } })
                  }}
                >
                  <LinearGradient
                    colors={[
                      'rgba(15, 15, 35, 0.95)',
                      'rgba(26, 27, 58, 0.9)',
                      item.color + '15'
                    ]}
                    style={styles.equipmentGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={styles.equipmentHeader}>
                      <View style={[styles.equipmentIconContainer, {
                        backgroundColor: item.color + '20',
                        borderColor: item.color + '40',
                        borderWidth: 1
                      }]}>
                        <MaterialCommunityIcons name={item.icon as any} size={32} color={item.color} />
                      </View>
                      <View style={styles.equipmentBadge}>
                        <Text style={[styles.equipmentBadgeText, { color: item.color }]}>
                          {item.exercises}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.equipmentContent}>
                      <Text style={[styles.equipmentTitle, { color: item.color }]}>
                        {item.label}
                      </Text>
                      <Text style={styles.equipmentDescription}>
                        {item.description}
                      </Text>
                    </View>
                    <View style={[styles.equipmentGlow, { backgroundColor: item.color + '10' }]} />
                  </LinearGradient>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Target Area Exercises - Enhanced */}
          <View style={styles.categoriesContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Target Area Focus</Text>
              <Text style={styles.sectionSubtitle}>Precision muscle targeting</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScrollContent}
            >
              {targetAreaExercises.map((item, index) => (
                <Pressable
                  key={item.key}
                  style={[styles.targetAreaButton, {
                    borderColor: item.color + '40',
                    shadowColor: item.color,
                    shadowOpacity: 0.25,
                    shadowRadius: 8,
                    shadowOffset: { width: 0, height: 3 },
                    elevation: 5
                  }]}
                  android_ripple={{ color: item.color + '25', borderless: false }}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push({ pathname: '/workout/exerciseList', params: { type: 'target', id: item.key } })
                  }}
                >
                  <LinearGradient
                    colors={[
                      'rgba(15, 15, 35, 0.95)',
                      'rgba(26, 27, 58, 0.9)',
                      item.color + '18'
                    ]}
                    style={styles.targetAreaGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={styles.targetAreaHeader}>
                      <View style={[styles.targetAreaIconContainer, {
                        backgroundColor: item.color + '20',
                        borderColor: item.color + '40',
                        borderWidth: 1
                      }]}>
                        <MaterialCommunityIcons name={item.icon as any} size={24} color={item.color} />
                      </View>
                      <View style={styles.targetAreaBadge}>
                        <Text style={[styles.targetAreaBadgeText, { color: item.color }]}>
                          {item.exercises}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.targetAreaContent}>
                      <Text style={[styles.targetAreaTitle, { color: item.color }]}>
                        {item.label}
                      </Text>
                      <Text style={styles.targetAreaDescription}>
                        {item.description}
                      </Text>
                    </View>
                    <View style={[styles.targetAreaGlow, { backgroundColor: item.color + '12' }]} />
                  </LinearGradient>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Bottom spacing */}
          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </>
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
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
    paddingTop: 8,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 10,
    padding: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(79, 195, 247, 0.1)'
  },
  headerContent: {
    alignItems: 'center',
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#BA68C8',
    textAlign: 'center',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(186, 104, 200, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#B0BEC5',
    fontWeight: '500',
    letterSpacing: 0.3,
    opacity: 0.9,
  },
  headerAccent: {
    width: 60,
    height: 3,
    backgroundColor: '#BA68C8',
    borderRadius: 2,
    marginTop: 12,
    shadowColor: '#BA68C8',
    shadowOpacity: 0.6,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  sectionHeader: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#90A4AE',
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  categoriesContainer: {
    marginBottom: 36,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  categoryCard: {
    width: (width - 64) / 2,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'rgba(15, 15, 35, 0.8)',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  categoryGradient: {
    borderRadius: 24,
    padding: 10,
    minHeight: 100,
    position: 'relative',
    overflow: 'hidden',
  },
  categoryTopSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 2,
  },
  categoryIconContainer: {
    borderRadius: 10,
    padding: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  categoryBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 2,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  categoryContent: {
    flex: 1,
    justifyContent: 'center',
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  categoryDescription: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.1,
    lineHeight: 18,
  },
  categoryGlow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  horizontalScrollContent: {
    paddingVertical: 0,
    paddingHorizontal: 0,
    gap: 4,
  },
  equipmentButton: {
    width: 140,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(15, 15, 35, 0.8)',
    borderWidth: 1,
  },
  equipmentGradient: {
    borderRadius: 20,
    padding: 12,
    minHeight: 160,
    position: 'relative',
    overflow: 'hidden',
  },
  equipmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 0,
  },
  equipmentIconContainer: {
    borderRadius: 14,
    padding: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  equipmentBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    paddingHorizontal: 2,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  equipmentBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  equipmentContent: {
    flex: 1,
    justifyContent: 'center',
  },
  equipmentTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  equipmentDescription: {
    fontSize: 12,
    color: '#B0BEC5',
    fontWeight: '500',
    letterSpacing: 0.1,
    lineHeight: 16,
  },
  equipmentGlow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  targetAreaButton: {
    width: 120,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: 'rgba(15, 15, 35, 0.8)',
    borderWidth: 1,
  },
  targetAreaGradient: {
    borderRadius: 18,
    padding: 14,
    minHeight: 120,
    position: 'relative',
    overflow: 'hidden',
  },
  targetAreaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  targetAreaIconContainer: {
    borderRadius: 12,
    padding: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  targetAreaBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  targetAreaBadgeText: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  targetAreaContent: {
    flex: 1,
    justifyContent: 'center',
  },
  targetAreaTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  targetAreaDescription: {
    fontSize: 11,
    color: '#B0BEC5',
    fontWeight: '500',
    letterSpacing: 0.1,
    lineHeight: 14,
  },
  targetAreaGlow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
});