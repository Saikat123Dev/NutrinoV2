import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { 
  Animated, 
  Dimensions, 
  Easing, 
  Pressable, 
  ScrollView, 
  StyleSheet, 
  Text, 
  View,
  StatusBar,
  Platform 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { UpdateService } from '@/components/UpdateService';

const { width, height } = Dimensions.get('window');
const PARTICLE_COUNT = 25;
const FEATURE_ANIMATION_DELAY = 100;

export default function HomeScreen() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [greeting, setGreeting] = useState('');
  const [particlePositions, setParticlePositions] = useState<Array<any>>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  
  const headerAnimation = useRef(new Animated.Value(0)).current;
  const particleAnimations = useRef(
    Array(PARTICLE_COUNT).fill(null).map(() => ({
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0),
      rotate: new Animated.Value(0),
      position: new Animated.ValueXY(),
      float: new Animated.Value(0)
    }))
  ).current;
  
  const featureAnimations = useRef(
    Array(5).fill(null).map(() => ({
      scale: new Animated.Value(0),
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(50)
    }))
  ).current;

  // Time and greeting logic
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now);
      
      const hour = now.getHours();
      if (hour < 12) setGreeting('Good Morning');
      else if (hour < 17) setGreeting('Good Afternoon');
      else setGreeting('Good Evening');
    };
    
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);
   useEffect(() => {
    // Check for updates when app starts
    UpdateService.checkForUpdates();
  }, []);
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

    // Animate features with stagger
    const featureAnimationSequence = featureAnimations.map((anim, index) =>
      Animated.parallel([
        Animated.timing(anim.scale, {
          toValue: 1,
          duration: 800,
          delay: index * FEATURE_ANIMATION_DELAY + 600,
          easing: Easing.out(Easing.back(1.1)),
          useNativeDriver: true,
        }),
        Animated.timing(anim.opacity, {
          toValue: 1,
          duration: 600,
          delay: index * FEATURE_ANIMATION_DELAY + 600,
          useNativeDriver: true,
        }),
        Animated.timing(anim.translateY, {
          toValue: 0,
          duration: 800,
          delay: index * FEATURE_ANIMATION_DELAY + 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        })
      ])
    );

    Animated.parallel(featureAnimationSequence).start(() => {
      setIsLoaded(true);
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

  const features = [
    {
      id: 1,
      title: 'AI Nutrition Coach',
      icon: 'robot-outline',
      primaryColor: '#64FFDA',
      secondaryColor: '#00BCD4',
      gradientColors: ['rgba(100, 255, 218, 0.25)', 'rgba(0, 188, 212, 0.15)', 'rgba(26, 107, 107, 0.1)'],
      route: 'chatbot',
      description: 'AI guidance for optimal health and wellness',
      badge: 'NEW',
      featured: true
    },
    {
      id: 2,
      title: 'Smart Profile',
      icon: 'account-circle-outline',
      primaryColor: '#44b33e',
      secondaryColor: '#FF5722',
      gradientColors: ['rgba(255, 107, 107, 0.25)', 'rgba(255, 87, 34, 0.15)', 'rgba(102, 32, 32, 0.1)'],
      route: 'profile',
      description: 'Save & Edit profile',
      badge: 'EDIT'
    },
    {
      id: 3,
      title: 'Health Analytics',
      icon: 'chart-line',
      primaryColor: '#4FC3F7',
      secondaryColor: '#2196F3',
      gradientColors: ['rgba(79, 195, 247, 0.25)', 'rgba(33, 150, 243, 0.15)', 'rgba(42, 79, 117, 0.1)'],
      route: 'healthreport',
      description: 'Health insights',
      badge: 'VIEW'
    },
    {
      id: 4,
      title: 'Meal Planner',
      icon: 'food-apple-outline',
      primaryColor: '#FFB74D',
      secondaryColor: '#FF9800',
      gradientColors: ['rgba(255, 183, 77, 0.25)', 'rgba(255, 152, 0, 0.15)', 'rgba(102, 64, 21, 0.1)'],
      route: 'mealplanning',
      description: 'AI-powered Nutrition Plans (7days)',
      badge: 'PLAN'
    },
    {
      id: 5,
      title: 'Fitness Pro',
      icon: 'dumbbell',
      primaryColor: '#BA68C8',
      secondaryColor: '#9C27B0',
      gradientColors: ['rgba(186, 104, 200, 0.25)', 'rgba(156, 39, 176, 0.15)', 'rgba(82, 38, 107, 0.1)'],
      route: 'workout',
      description: 'Workout Routines',
      badge: 'NEW'
    }
  ];

  const handleFeaturePress = (route: string, color: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    
    // Add press animation
    const pressAnimation = new Animated.Value(1);
    Animated.sequence([
      Animated.timing(pressAnimation, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true
      }),
      Animated.timing(pressAnimation, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true
      })
    ]).start();
    
    setTimeout(() => router.push(route), 150);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <SafeAreaView style={styles.container}>
        {/* Dynamic Background */}
        <View style={styles.backgroundContainer}>
  <LinearGradient
    colors={['#05070D', '#0D0E20', '#1A1240', '#050509']} // darker gradient
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
          <Animated.View 
            style={[
              styles.headerContainer,
              {
                opacity: headerAnimation,
                transform: [{
                  translateY: headerAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-50, 0]
                  })
                }]
              }
            ]}
          >
            <View style={styles.timeContainer}>
              <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
              <Text style={styles.greetingText}>{greeting}</Text>
            </View>
            
            <View style={styles.titleContainer}>
              <LinearGradient
                colors={['#21705d', '#2a7596', '#BA68C8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.titleGradient}
              >
                <Text style={styles.title}>Nutrino AI</Text>
              </LinearGradient>
              <Text style={styles.subtitle}>Wellness Through Intelligence</Text>
              <View style={styles.subtitleUnderline} />
            </View>

            {/* Stats Preview */}
            <View style={styles.statsPreview}>
              <View style={styles.statBubble}>
                <Text style={styles.statValue}>1.0.0</Text>
                <Text style={styles.statLabel}>Version</Text>
              </View>
              <View style={styles.statBubble}>
                <Text style={styles.statValue}>Lifetime</Text>
                <Text style={styles.statLabel}>Premium</Text>
              </View>
              <View style={styles.statBubble}>
                <Text style={styles.statValue}>Mid</Text>
                <Text style={styles.statLabel}>Level</Text>
              </View>
            </View>
          </Animated.View>

          {/* Features Grid */}
          <View style={styles.featuresContainer}>
            {features.map((feature, index) => (
              <Animated.View
                key={feature.id}
                style={[
                  styles.featureWrapper,
                  {
                    width: feature.featured ? width - 40 : (width - 55) / 2,
                    marginBottom: 10,
                    opacity: featureAnimations[index].opacity,
                    transform: [
                      { scale: featureAnimations[index].scale },
                      { translateY: featureAnimations[index].translateY }
                    ]
                  }
                ]}
              >
                <Pressable
                  style={({ pressed }) => [
                    styles.featureCard,
                    {
                      transform: [{ scale: pressed ? 0.96 : 1 }],
                    }
                  ]}
                  onPress={() => handleFeaturePress(feature.route, feature.primaryColor)}
                >
                  <View style={styles.cardContainer}>
                    {/* Glass morphism background */}
                    <View style={[styles.glassBackground, { backgroundColor: 'rgba(255, 255, 255, 0.05)' }]} />
                    
                    {/* Gradient overlay */}
                    <LinearGradient
                      colors={feature.gradientColors}
                      style={styles.gradientOverlay}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    />
                    
                    {/* Border glow */}
                    <View 
                      style={[
                        styles.borderGlow,
                        { 
                          shadowColor: feature.primaryColor,
                          borderColor: `${feature.primaryColor}30`
                        }
                      ]} 
                    />
                    
                    {/* Badge */}
                    {feature.badge && (
                      <View style={[styles.badge, { backgroundColor: `${feature.primaryColor}20` }]}>
                        <Text style={[styles.badgeText, { color: feature.primaryColor }]}>
                          {feature.badge}
                        </Text>
                      </View>
                    )}
                    
                    {/* Content */}
                    <View style={[styles.cardContent, feature.featured && styles.featuredContent]}>
                      {/* Icon with enhanced styling */}
                      <View style={[
                        styles.iconContainer,
                        { 
                          backgroundColor: `${feature.primaryColor}15`,
                          shadowColor: feature.primaryColor,
                          shadowOpacity: 0.3,
                          shadowRadius: 8,
                          shadowOffset: { width: 0, height: 4 }
                        }
                      ]}>
                        <MaterialCommunityIcons
                          name={feature.icon as any}
                          size={feature.featured ? 36 : 28}
                          color={feature.primaryColor}
                        />
                      </View>
                      
                      {/* Title */}
                      <Text style={[
                        styles.featureTitle,
                        feature.featured && styles.featuredTitle,
                        { color: '#FFFFFF' }
                      ]}>
                        {feature.title}
                      </Text>
                      
                      {/* Description */}
                      <Text style={[
                        styles.featureDescription,
                        feature.featured && styles.featuredDescription,
                        { color: '#B0BEC5' }
                      ]}>
                        {feature.description}
                      </Text>
                      
                      {/* Action indicator */}
                      <View style={styles.actionIndicator}>
                        <MaterialCommunityIcons
                          name="arrow-right"
                          size={20}
                          color={feature.primaryColor}
                        />
                      </View>
                    </View>
                    
                    {/* Shine effect */}
                    <LinearGradient
                      colors={[
                        'transparent',
                        `${feature.primaryColor}10`,
                        'transparent'
                      ]}
                      style={styles.shineEffect}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    />
                  </View>
                </Pressable>
              </Animated.View>
            ))}
          </View>

          {/* Bottom Padding */}
          <View style={{ height: 50 }} />
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
  
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  
  headerContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  
  timeContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  
  timeText: {
    fontSize: 28,
    fontWeight: '500',
    color: '#FFFFFF',
    letterSpacing: 6,
  },
  
  greetingText: {
    fontSize: 16,
    color: '#64FFDA',
    fontWeight: '500',
    marginTop: 5,
  },
  
  titleContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  
  titleGradient: {
    borderRadius: 15,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 3,
    textAlign: 'center',
  },
  
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
    fontStyle: 'italic',
    marginTop: 10,
    letterSpacing: 1,
  },
  
  subtitleUnderline: {
    width: 60,
    height: 2,
    backgroundColor: '#64FFDA',
    marginTop: 8,
    borderRadius: 1,
  },
  
  statsPreview: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 20,
  },
  
  statBubble: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(100, 255, 218, 0.2)',
  },
  
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#64FFDA',
  },
  
  statLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 4,
  },
  
  featureWrapper: {
    marginBottom: 20,
  },
  
  featureCard: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  
  cardContainer: {
    borderRadius: 20,
    position: 'relative',
    overflow: 'hidden',
    minHeight: 170,
  },
  
  glassBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 50)',
    backdropFilter: 'blur(10px)',
  },
  
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
  },
  
  borderGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
    borderWidth: 3,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  
  badge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    zIndex: 10,
  },
  
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  
  cardContent: {
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    position: 'relative',
    zIndex: 5,
  },
  
  
  iconContainer: {
    borderRadius: 16,
    padding: 7,
    elevation: 2,
    marginBottom: 12,
  },
  
  featureTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  
  featuredTitle: {
    fontSize: 20,
    marginBottom: 12,
    fontWeight: '800',
  },
  
  featureDescription: {
    fontSize: 13,
    color: '#B0BEC5',
    textAlign: 'center',
    lineHeight: 18,
    fontWeight: '500',
    paddingHorizontal: 4,
  },
  
  featuredDescription: {
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: 0,
  },
  
  actionIndicator: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 10,
    padding: 4,
  },
  
  shineEffect: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
    opacity: 0.9,
  },
});