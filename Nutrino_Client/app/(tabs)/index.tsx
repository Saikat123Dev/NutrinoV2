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
      gradientColors: ['#0D4F4F', '#1A6B6B', '#0A3B3B'],
      route: 'chatbot',
      description: 'Personalized AI guidance for optimal health',
      particles: ['🧠', '💡', '⚡'],
      featured: true
    },
    {
      id: 2,
      title: 'Smart Profile Edit',
      icon: 'account-circle-outline',
      primaryColor: '#FF6B6B',
      secondaryColor: '#FF5722',
      gradientColors: ['#4A1515', '#662020', '#3D1010'],
      route: 'profile',
      description: 'Edit profile',
    },
    {
      id: 3,
      title: 'Health Analytics',
      icon: 'chart-line',
      primaryColor: '#4FC3F7',
      secondaryColor: '#2196F3',
      gradientColors: ['#1B3A5C', '#2A4F75', '#152B42'],
      route: 'healthreport',
      description: 'Health insights',
    },
    {
      id: 4,
      title: 'Meal Plans',
      icon: 'food-apple-outline',
      primaryColor: '#FFB74D',
      secondaryColor: '#FF9800',
      gradientColors: ['#4A2F0A', '#664015', '#3D2408'],
      route: 'mealplanning',
      description: 'AI-powered nutrition planning',
    },
    {
      id: 5,
      title: 'Fitness Pro',
      icon: 'dumbbell',
      primaryColor: '#BA68C8',
      secondaryColor: '#9C27B0',
      gradientColors: ['#3D1A4A', '#52266B', '#2E1338'],
      route: 'workout',
      description: 'Personalized workout routines',
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
                  transform: [
                    { 
                      translateX: Animated.add(
                        particleAnimations[index].position.x,
                        Animated.multiply(
                          particleAnimations[index].float,
                          20
                        )
                      )
                    },
                    { 
                      translateY: Animated.add(
                        particleAnimations[index].position.y,
                        Animated.multiply(
                          particleAnimations[index].float,
                          30
                        )
                      )
                    },
                    { scale: particleAnimations[index].scale },
                    {
                      rotate: particleAnimations[index].rotate.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '360deg']
                      })
                    }
                  ],
                  opacity: particleAnimations[index].opacity,
                }
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
                    width: feature.featured ? width - 40 : (width - 60) / 2,
                    marginBottom: feature.featured ? 20 : 15,
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
                  <LinearGradient
                    colors={[...feature.gradientColors, '#0A0A0A']}
                    style={[
                      styles.cardGradient,
                      feature.featured && styles.featuredCard
                    ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    {/* Glow Effect */}
                    <View 
                      style={[
                        styles.cardGlow,
                        { 
                          shadowColor: feature.primaryColor,
                          backgroundColor: `${feature.primaryColor}15`
                        }
                      ]} 
                    />
                    
                    {/* Content */}
                    <View style={styles.cardContent}>
                      <View style={[
                        styles.iconContainer,
                        feature.featured && styles.featuredIconContainer,
                        { backgroundColor: `${feature.primaryColor}20` }
                      ]}>
                        <MaterialCommunityIcons
                          name={feature.icon as any}
                          size={feature.featured ? 42 : 28}
                          color={feature.primaryColor}
                        />
                        {feature.featured && (
                          <View style={styles.iconPulse}>
                            <MaterialCommunityIcons
                              name={feature.icon as any}
                              size={42}
                              color={feature.primaryColor}
                              style={{ opacity: 0.3 }}
                            />
                          </View>
                        )}
                      </View>
                      
                      <Text style={[
                        styles.featureTitle,
                        feature.featured && styles.featuredTitle
                      ]}>
                        {feature.title}
                      </Text>
                      
                      <Text style={[
                        styles.featureDescription,
                        feature.featured && styles.featuredDescription
                      ]}>
                        {feature.description}
                      </Text>
                      

                    </View>
                    
                    {/* Interactive Border */}
                    <View 
                      style={[
                        styles.cardBorder,
                        { borderColor: `${feature.primaryColor}40` }
                      ]} 
                    />
                    
                    {/* Shimmer Effect */}
                    <LinearGradient
                      colors={[
                        'transparent',
                        `${feature.primaryColor}20`,
                        'transparent'
                      ]}
                      style={styles.shimmer}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    />
                  </LinearGradient>
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
  
  meshOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 20 : 40,
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
    marginTop: 4,
    fontWeight: '500',
  },
  
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  
  featureWrapper: {
    marginBottom: 15,
  },
  
  featureCard: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  
  cardGradient: {
    borderRadius: 24,
    padding: 2,
    minHeight: 140,
    position: 'relative',
  },
  
  featuredCard: {
    minHeight: 180,
  },
  
  cardGlow: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 26,
    shadowOpacity: 0.3,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 0 },
  },
  
  cardContent: {
    backgroundColor: 'rgba(10, 14, 26, 0.7)',
    borderRadius: 30,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    position: 'relative',
  },
  
  iconContainer: {
    borderRadius: 16,
    padding: 8,
    marginBottom: 8,
    position: 'relative',
  },
  
  featuredIconContainer: {
    padding: 8,
    marginBottom: 8,
  },
  
  iconPulse: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
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
    marginBottom: 10,
  },
  
  featureDescription: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 16,
    fontWeight: '500',
  },
  
  featuredDescription: {
    fontSize: 14,
    lineHeight: 20,
  },

});