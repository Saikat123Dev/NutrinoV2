import { UpdateService } from '@/components/UpdateService';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { usePlan } from '@/context/PlanContext';
const { width, height } = Dimensions.get('window');
const PARTICLE_COUNT = 25;
const FEATURE_ANIMATION_DELAY = 100;

export default function HomeScreen() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [greeting, setGreeting] = useState('');
  const [particlePositions, setParticlePositions] = useState<Array<any>>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [plan , setPlan] = useState<string>()
   const planId = usePlan();
   console.log("planId",planId)
   useEffect(()=>{
    if(planId == "1year"){
        setPlan("1 Year")
    }else{
        setPlan("6 Months")
    }
   },[planId])

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
      route: '(tabs)/chatbot',
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
      route: '(tabs)/profile',
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
      route: '(tabs)/healthreport',
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
      route: '(tabs)/mealplanning',
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
      route: '(tabs)/workout',
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
    
    setTimeout(() => router.push(route as any), 150);
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
          {/* Enhanced Professional Header */}
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
            {/* Welcome Section */}
            <View style={styles.welcomeSection}>
              <View style={styles.timeContainer}>
                <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
                <LinearGradient
                  colors={['#64FFDA', '#4FC3F7', '#29B6F6']}
                  style={styles.greetingGradient}
                >
                  <Text style={styles.greetingText}>{greeting}</Text>
                </LinearGradient>
              </View>
              
              {/* Brand Identity */}
              <View style={styles.brandContainer}>
                <View style={styles.logoContainer}>
                  <LinearGradient
                    colors={['#64FFDA', '#4FC3F7']}
                    style={styles.logoGradient}
                  >
                    <MaterialCommunityIcons name="nutrition" size={28} color="#FFFFFF" />
                  </LinearGradient>
                  <LinearGradient
                    colors={['#21705d', '#2a7596', '#BA68C8']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.titleGradient}
                  >
                    <Text style={styles.title}>Nutrino AI</Text>
                  </LinearGradient>
                </View>
                <Text style={styles.subtitle}>Wellness Through Intelligence</Text>
                <View style={styles.taglineContainer}>
                  <View style={styles.subtitleUnderline} />
                  <Text style={styles.tagline}>Transform Your Health Journey</Text>
                </View>
              </View>
            </View>

            {/* Enhanced Stats Section */}
            <LinearGradient
              colors={['rgba(100, 255, 218, 0.1)', 'rgba(79, 195, 247, 0.05)']}
              style={styles.statsContainer}
            >
              <View style={styles.statsHeader}>
                <MaterialCommunityIcons name="chart-timeline-variant" size={20} color="#64FFDA" />
                <Text style={styles.statsTitle}>Your Progress</Text>
              </View>
              <View style={styles.statsPreview}>
                <View style={[styles.statBubble, styles.versionBubble]}>
                  <LinearGradient
                    colors={['rgba(100, 255, 218, 0.2)', 'rgba(100, 255, 218, 0.1)']}
                    style={styles.statBubbleGradient}
                  >
                    <MaterialCommunityIcons name="rocket-launch" size={16} color="#64FFDA" />
                    <Text style={styles.statValue}>v1.0.0</Text>
                    <Text style={styles.statLabel}>Version</Text>
                  </LinearGradient>
                </View>
                
                <View style={[styles.statBubble, styles.planBubble]}>
                  <LinearGradient
                    colors={plan ? ['rgba(0, 230, 118, 0.2)', 'rgba(0, 230, 118, 0.1)'] : ['rgba(255, 152, 0, 0.2)', 'rgba(255, 152, 0, 0.1)']}
                    style={styles.statBubbleGradient}
                  >
                    <MaterialCommunityIcons 
                      name={plan ? "crown" : "arrow-up-bold"} 
                      size={16} 
                      color={plan ? "#00E676" : "#FF9800"} 
                    />
                    <Text style={[styles.statValue, { color: plan ? "#00E676" : "#FF9800" }]}>
                      {plan ? plan : 'Upgrade'}
                    </Text>
                    <Text style={styles.statLabel}>Premium</Text>
                  </LinearGradient>
                </View>
                
                <View style={[styles.statBubble, styles.levelBubble]}>
                  <LinearGradient
                    colors={['rgba(186, 104, 200, 0.2)', 'rgba(186, 104, 200, 0.1)']}
                    style={styles.statBubbleGradient}
                  >
                    <MaterialCommunityIcons name="trending-up" size={16} color="#BA68C8" />
                    <Text style={[styles.statValue, { color: "#BA68C8" }]}>Pro</Text>
                    <Text style={styles.statLabel}>Level</Text>
                  </LinearGradient>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* Professional Features Section */}
          <View style={styles.featuresSection}>
            <View style={styles.sectionHeader}>
              <LinearGradient
                colors={['#64FFDA', '#4FC3F7']}
                style={styles.sectionIconGradient}
              >
                <MaterialCommunityIcons name="view-dashboard-outline" size={20} color="#FFFFFF" />
              </LinearGradient>
              <Text style={styles.sectionTitle}>Explore Features</Text>
            </View>
            
            <View style={styles.featuresContainer}>
              {features.map((feature, index) => (
                <Animated.View
                  key={feature.id}
                  style={[
                    styles.featureWrapper,
                    {
                      width: feature.featured ? width - 40 : (width - 55) / 2,
                      marginBottom: 16,
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
                    <View style={[styles.cardContainer, feature.featured && styles.featuredCardContainer]}>
                      {/* Enhanced glass morphism background */}
                      <BlurView intensity={20} style={styles.blurBackground} />
                      
                      {/* Enhanced gradient overlay */}
                      <LinearGradient
                        colors={[
                          `${feature.primaryColor}25`,
                          `${feature.secondaryColor}15`,
                          'transparent'
                        ]}
                        style={styles.gradientOverlay}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      />
                      
                      {/* Professional border */}
                      <View 
                        style={[
                          styles.professionalBorder,
                          { 
                            borderColor: `${feature.primaryColor}40`,
                            shadowColor: feature.primaryColor,
                          }
                        ]} 
                      />
                      
                      {/* Enhanced badge */}
                      {feature.badge && (
                        <LinearGradient
                          colors={[`${feature.primaryColor}30`, `${feature.primaryColor}20`]}
                          style={styles.enhancedBadge}
                        >
                          <Text style={[styles.badgeText, { color: feature.primaryColor }]}>
                            {feature.badge}
                          </Text>
                        </LinearGradient>
                      )}
                      
                      {/* Enhanced content */}
                      <View style={[styles.cardContent, feature.featured && styles.featuredContent]}>
                        {/* Professional icon container */}
                        <View style={[
                          styles.professionalIconContainer,
                          { 
                            shadowColor: feature.primaryColor,
                          }
                        ]}>
                          <LinearGradient
                            colors={[`${feature.primaryColor}30`, `${feature.primaryColor}20`]}
                            style={styles.iconGradientBg}
                          >
                            <MaterialCommunityIcons
                              name={feature.icon as any}
                              size={feature.featured ? 32 : 26}
                              color={feature.primaryColor}
                            />
                          </LinearGradient>
                        </View>
                        
                        {/* Enhanced typography */}
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
                        
                        {/* Professional call-to-action */}
                        <View style={[styles.ctaContainer, { borderTopColor: `${feature.primaryColor}30` }]}>
                          <Text style={[styles.ctaText, { color: feature.primaryColor }]}>
                            Explore Now
                          </Text>
                          <MaterialCommunityIcons
                            name="arrow-right-circle"
                            size={18}
                            color={feature.primaryColor}
                          />
                        </View>
                      </View>
                      
                      {/* Professional shine effect */}
                      <LinearGradient
                        colors={[
                          'transparent',
                          `${feature.primaryColor}08`,
                          'transparent'
                        ]}
                        style={styles.professionalShine}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      />
                    </View>
                  </Pressable>
                </Animated.View>
              ))}
            </View>
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
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  
  headerContainer: {
    alignItems: 'center',
    marginBottom: 30,
    paddingHorizontal: 4,
  },
  
  // Welcome Section Styles
  welcomeSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  
  timeContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  
  timeText: {
    fontSize: 32,
    fontWeight: '300',
    color: '#FFFFFF',
    letterSpacing: 8,
    textShadowColor: 'rgba(100, 255, 218, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  
  greetingGradient: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginTop: 8,
  },
  
  greetingText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
  },
  
  // Brand Container Styles
  brandContainer: {
    alignItems: 'center',
  },
  
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  
  logoGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#64FFDA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  
  titleContainer: {
    alignItems: 'center',
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
    fontSize: 15,
    color: '#94A3B8',
    fontStyle: 'italic',
    marginTop: 8,
    letterSpacing: 1,
    textAlign: 'center',
  },
  
  taglineContainer: {
    alignItems: 'center',
    marginTop: 12,
  },
  
  subtitleUnderline: {
    width: 80,
    height: 3,
    backgroundColor: '#64FFDA',
    marginBottom: 8,
    borderRadius: 2,
    shadowColor: '#64FFDA',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  
  tagline: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  
  // Enhanced Stats Styles
  statsContainer: {
    borderRadius: 20,
    padding: 20,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(100, 255, 218, 0.2)',
    shadowColor: '#64FFDA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  
  statsTitle: {
    fontSize: 16,
    color: '#64FFDA',
    fontWeight: '600',
    marginLeft: 8,
    letterSpacing: 1,
  },
  
  statsPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  
  statBubble: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(100, 255, 218, 0.15)',
    overflow: 'hidden',
  },
  
  statBubbleGradient: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    width: '100%',
  },
  
  versionBubble: {
    borderColor: 'rgba(100, 255, 218, 0.3)',
  },
  
  planBubble: {
    borderColor: 'rgba(0, 230, 118, 0.3)',
  },
  
  levelBubble: {
    borderColor: 'rgba(186, 104, 200, 0.3)',
  },
  
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
    marginBottom: 2,
  },
  
  statLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  
  // Features Section Styles
  featuresSection: {
    marginTop: 8,
  },
  
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  
  sectionIconGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
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
    borderRadius: 24,
    position: 'relative',
    overflow: 'hidden',
    minHeight: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  
  featuredCardContainer: {
    minHeight: 200,
    borderRadius: 28,
  },
  
  // Professional Background Styles
  blurBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 24,
  },
  
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 24,
  },
  
  professionalBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 24,
    borderWidth: 1.5,
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
  },
  
  // Enhanced Badge Styles
  enhancedBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    zIndex: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  
  // Professional Card Content
  cardContent: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
    position: 'relative',
    zIndex: 5,
  },
  
  featuredContent: {
    padding: 24,
  },
  
  
  // Professional Icon Styles
  professionalIconContainer: {
    marginBottom: 16,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  
  iconGradientBg: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  
  // Typography Styles
  featureTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  
  featuredTitle: {
    fontSize: 18,
    marginBottom: 10,
    fontWeight: '800',
  },
  
  featureDescription: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 16,
    fontWeight: '500',
    marginBottom: 16,
  },
  
  featuredDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 18,
  },
  
  // Professional Call-to-Action
  ctaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    width: '100%',
  },
  
  ctaText: {
    fontSize: 12,
    fontWeight: '600',
    marginRight: 6,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  
  // Professional Effects
  professionalShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 24,
    opacity: 0.6,
  },
});