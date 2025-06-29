import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');
const nodeCount = 10;

export default function HomeScreen() {
  const [activeTab] = useState('home');
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
        size: Math.random() * 90 + 60,
        delay: Math.random() * 3000,
        duration: Math.random() * 2000 + 2000,
        color: `rgba(${Math.floor(Math.random() * 150 + 105)}, ${Math.floor(Math.random() * 150 + 105)}, 255, 0.7)`
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

  const features = [
    {
      id: 1,
      title: 'Nutrino Chatbot',
      icon: 'robot-outline',
      color: '#00E676',
      gradientColors: ['#0D2F10', '#173E19'],
      glowColor: '#00E676',
      route: 'chatbot',
      description: 'Get instant health advice from AI'
    },
    {
      id: 2,
      title: 'Profile',
      icon: 'account-circle-outline',
      color: '#f28383',
      gradientColors: ['#420909', '#691717'],
      glowColor: '#FF6B6B',
      route: 'profile',
      description: 'Profile Section'
    },
    {
      id: 3,
      title: 'Health Report',
      icon: 'chart-line',
      color: '#4FC3F7',
      gradientColors: ['#062350', '#0C3B69'],
      glowColor: '#4FC3F7',
      route: 'healthreport', // Updated to point to healthreport.tsx
      description: 'Track your health'
    },
    {
      id: 4,
      title: 'Meal Planning',
      icon: 'food-apple-outline',
      color: '#FFB74D',
      gradientColors: ['#4d1c02', '#7A3E00'],
      glowColor: '#FFB74D',
      route: 'mealplanning', // Updated to point to mealplanning.tsx
      description: 'Plan nutritious meals'
    },
    {
      id: 5,
      title: 'Workout',
      icon: 'dumbbell',
      color: '#BA68C8',
      gradientColors: ['#220742', '#6A1B9A'],
      glowColor: '#BA68C8',
      route: 'workout', // Updated to point to workout.tsx
      description: 'Fitness routines'
    }
  ];

  const handleFeaturePress = (route) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.push(route);
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
          <Text style={styles.title}>Nutrino AI</Text>
          <Text style={styles.motto}>"Wellness Through Intelligence"</Text>
        </View>

        <View style={styles.featuresGrid}>
          {features.map((feature, index) => (
            <Pressable
              key={feature.id}
              style={({ pressed }) => [
                styles.featureCard,
                {
                  transform: [{ scale: pressed ? 0.95 : 1 }],
                  width: index === 0 ? width - 40 : (width - 60) / 2,
                  marginBottom: index === 0 ? 20 : 0
                }
              ]}
              onPress={() => handleFeaturePress(feature.route)}
            >
              <LinearGradient
                colors={[...feature.gradientColors, '#121212']}
                style={[
                  styles.gradientCard,
                  {
                    shadowColor: feature.glowColor,
                    shadowOpacity: 0.3,
                    shadowOffset: { width: 0, height: 0 },
                    shadowRadius: 10,
                    elevation: 8,
                  }
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={[styles.iconContainer, { backgroundColor: `${feature.color}20` }]}>
                  <MaterialCommunityIcons
                    name={feature.icon}
                    size={index === 0 ? 40 : 32}
                    color={feature.color}
                  />
                </View>
                <Text style={[styles.featureTitle, { fontSize: index === 0 ? 20 : 16 }]}>
                  {feature.title}
                </Text>
                <Text style={[styles.featureDescription, { fontSize: index === 0 ? 14 : 12 }]}>
                  {feature.description}
                </Text>
                <View style={[styles.glowEffect, { backgroundColor: feature.glowColor }]} />
              </LinearGradient>
            </Pressable>
          ))}
        </View>

        <View>
          <LinearGradient
            colors={['#1A237E', '#0D1421']}
            style={styles.statsContainer}
          >
            <Text style={styles.statsTitle}>Today's Progress</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <MaterialCommunityIcons name="water" size={20} color="#4FC3F7" />
                <Text style={styles.statText}>2.3L Water</Text>
              </View>
              <View style={styles.statItem}>
                <MaterialCommunityIcons name="run-fast" size={20} color="#00E676" />
                <Text style={styles.statText}>5.2K Steps</Text>
              </View>
              <View style={styles.statItem}>
                <MaterialCommunityIcons name="food-apple" size={20} color="#FFB74D" />
                <Text style={styles.statText}>1,420 Cal</Text>
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
    marginBottom: 20,
    paddingTop: 0
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#32a852',
    marginBottom: 0,
    textAlign: 'center',
    letterSpacing: 2
  },
  motto: {
    fontSize: 16,
    color: '#57cbff',
    fontStyle: 'italic'
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 15,
    marginBottom: 30
  },
  featureCard: {
    borderRadius: 30,
    overflow: 'hidden',
    backgroundColor: '#1E1E1E',
  },
  gradientCard: {
    borderRadius: 30,
    padding: 5,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    minHeight: 140,
    borderWidth: 2,
    overflow: 'hidden',
    borderColor: 'rgba(255, 255, 255, 0.4)'
  },
  iconContainer: {
    borderRadius: 10,
    padding: 5,
    marginBottom: 5
  },
  featureTitle: {
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
    textAlign: 'center',
  },
  featureDescription: {
    color: '#B0BEC5',
    textAlign: 'center',
    lineHeight: 16
  },
  glowEffect: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    opacity: 0.6
  },
  statsContainer: {
    borderRadius: 20,
    padding: 12,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8, // For Android shadow
  },

  statsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
    letterSpacing: 0.5,
  },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'stretch',
    gap: 16, // Add spacing between items
  },

  statItem: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    minHeight: 80,
    justifyContent: 'center',
  },

  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'center',
  },

  statText: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    opacity: 0.8,
  },

});