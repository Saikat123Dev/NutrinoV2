import { MaterialCommunityIcons } from '@expo/vector-icons';
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
  StyleSheet, 
  Text, 
  View,
  StatusBar,
  Platform,
  Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');
const PARTICLE_COUNT = 20;
const FEATURE_ANIMATION_DELAY = 80;

export default function SubscriptionScreen() {
  const [selectedPlan, setSelectedPlan] = useState<'6month' | '1year'>('1year');
  const [particlePositions, setParticlePositions] = useState<Array<any>>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  
  const headerAnimation = useRef(new Animated.Value(0)).current;
  const plansAnimation = useRef(new Animated.Value(0)).current;
  const featuresAnimation = useRef(new Animated.Value(0)).current;
  const buttonAnimation = useRef(new Animated.Value(0)).current;
  
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
      const isLarge = index < 6;
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        size: isLarge ? Math.random() * 100 + 60 : Math.random() * 50 + 15,
        speed: Math.random() * 0.3 + 0.1,
        direction: Math.random() * Math.PI * 2,
        color: [
          'rgba(100, 255, 218, 0.08)',
          'rgba(139, 69, 255, 0.12)',
          'rgba(255, 107, 107, 0.08)',
          'rgba(255, 183, 77, 0.10)',
          'rgba(79, 195, 247, 0.08)'
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

    // Animate entrance sequence
    const animationSequence = Animated.stagger(300, [
      Animated.timing(headerAnimation, {
        toValue: 1,
        duration: 1000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(plansAnimation, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.back(1.1)),
        useNativeDriver: true,
      }),
      Animated.timing(featuresAnimation, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(buttonAnimation, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      })
    ]);

    animationSequence.start(() => setIsLoaded(true));

    // Animate particles
    particleAnimations.forEach((anim, index) => {
      const particle = particles[index];
      if (!particle) return;
      
      anim.position.setValue({ x: particle.x, y: particle.y });
      
      Animated.parallel([
        Animated.timing(anim.opacity, {
          toValue: 0.6,
          duration: 1500 + Math.random() * 1000,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(anim.scale, {
          toValue: 1,
          duration: 1200 + Math.random() * 800,
          easing: Easing.out(Easing.back(1.1)),
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.timing(anim.rotate, {
            toValue: 1,
            duration: 25000 + Math.random() * 15000,
            easing: Easing.linear,
            useNativeDriver: true,
          })
        ),
        Animated.loop(
          Animated.sequence([
            Animated.timing(anim.float, {
              toValue: 1,
              duration: 4000 + Math.random() * 2000,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(anim.float, {
              toValue: 0,
              duration: 4000 + Math.random() * 2000,
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

  const subscriptionPlans = [
    {
      id: '6month',
      title: 'Premium',
      duration: '6 Months',
      price: '₹110',
      originalPrice: '₹300',
      discount: '63% OFF',
      monthlyPrice: '₹18/month',
      popular: false,
      color: '#4FC3F7',
      gradientColors: ['rgba(79, 195, 247, 0.25)', 'rgba(33, 150, 243, 0.15)', 'rgba(42, 79, 117, 0.1)']
    },
    {
      id: '1year',
      title: 'Premium Plus',
      duration: '1 Year',
      price: '₹199',
      originalPrice: '₹600',
      discount: '67% OFF',
      monthlyPrice: '₹16/month',
      popular: true,
      color: '#64FFDA',
      gradientColors: ['rgba(100, 255, 218, 0.25)', 'rgba(0, 188, 212, 0.15)', 'rgba(26, 107, 107, 0.1)']
    }
  ];

  const premiumFeatures = [
    {
      icon: 'robot-outline',
      title: 'AI Nutrition Coach',
      description: 'Unlimited AI-powered nutrition guidance',
      color: '#64FFDA'
    },
    {
      icon: 'chart-line',
      title: 'Advanced Health Analytics',
      description: 'Detailed health insights and tracking',
      color: '#4FC3F7'
    },
    {
      icon: 'food-apple-outline',
      title: 'Smart Meal Planner',
      description: 'AI-generated 7-day meal plans',
      color: '#FFB74D'
    },
    {
      icon: 'dumbbell',
      title: 'Fitness Pro Workouts',
      description: 'Personalized workout routines',
      color: '#BA68C8'
    },
    {
      icon: 'account-circle-outline',
      title: 'Premium Profile Features',
      description: 'Enhanced profile customization',
      color: '#FF6B6B'
    },
    {
      icon: 'cloud-sync',
      title: 'Cloud Sync',
      description: 'Sync across all your devices',
      color: '#26C6DA'
    }
  ];

  const handlePlanSelect = (planId: '6month' | '1year') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedPlan(planId);
  };

  const handleSubscribe = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    
    const plan = subscriptionPlans.find(p => p.id === selectedPlan);
    Alert.alert(
      'Subscription Confirmation',
      `You're about to subscribe to ${plan?.title} for ${plan?.price}. This will unlock all premium features!`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Subscribe',
          onPress: () => {
            // Here you would integrate with your payment system
            Alert.alert('Success!', 'Subscription activated successfully!', [
              { text: 'OK', onPress: () => router.back() }
            ]);
          }
        }
      ]
    );
  };

  const handleBack = () => {
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
            colors={['#05070D', '#0D0E20', '#1A1240', '#050509']}
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
                  shadowOpacity: 0.1,
                  transform: [
                    {
                      translateX: Animated.add(
                        particleAnimations[index].position.x,
                        Animated.multiply(particleAnimations[index].float, 15)
                      ),
                    },
                    {
                      translateY: Animated.add(
                        particleAnimations[index].position.y,
                        Animated.multiply(particleAnimations[index].float, 25)
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
                    0.25
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
          {/* Header */}
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
            <Pressable style={styles.backButton} onPress={handleBack}>
              <MaterialCommunityIcons name="arrow-left" size={24} color="#64FFDA" />
            </Pressable>
            
            <View style={styles.titleContainer}>
              <LinearGradient
                colors={['#21705d', '#2a7596', '#BA68C8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.titleGradient}
              >
                <Text style={styles.title}>Premium Plans</Text>
              </LinearGradient>
              <Text style={styles.subtitle}>Unlock Your Full Potential</Text>
              <View style={styles.subtitleUnderline} />
            </View>
          </Animated.View>

          {/* Subscription Plans */}
          <Animated.View 
            style={[
              styles.plansContainer,
              {
                opacity: plansAnimation,
                transform: [{
                  translateY: plansAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0]
                  })
                }]
              }
            ]}
          >
            {subscriptionPlans.map((plan) => (
              <Pressable
                key={plan.id}
                style={[
                  styles.planCard,
                  selectedPlan === plan.id && styles.selectedPlan
                ]}
                onPress={() => handlePlanSelect(plan.id as '6month' | '1year')}
              >
                <View style={styles.planCardContainer}>
                  {/* Glass background */}
                  <View style={styles.planGlassBackground} />
                  
                  {/* Gradient overlay */}
                  <LinearGradient
                    colors={plan.gradientColors}
                    style={styles.planGradientOverlay}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  />
                  
                  {/* Border glow */}
                  <View 
                    style={[
                      styles.planBorderGlow,
                      selectedPlan === plan.id && {
                        borderColor: `${plan.color}60`,
                        shadowColor: plan.color,
                        shadowOpacity: 0.4
                      }
                    ]} 
                  />
                  
                  {/* Popular badge */}
                  {plan.popular && (
                    <View style={[styles.popularBadge, { backgroundColor: `${plan.color}20` }]}>
                      <MaterialCommunityIcons name="star" size={16} color={plan.color} />
                      <Text style={[styles.popularText, { color: plan.color }]}>MOST POPULAR</Text>
                    </View>
                  )}
                  
                  {/* Content */}
                  <View style={styles.planContent}>
                    <Text style={styles.planTitle}>{plan.title}</Text>
                    <Text style={styles.planDuration}>{plan.duration}</Text>
                    
                    <View style={styles.priceContainer}>
                      <Text style={styles.originalPrice}>{plan.originalPrice}</Text>
                      <Text style={[styles.currentPrice, { color: plan.color }]}>{plan.price}</Text>
                    </View>
                    
                    <View style={[styles.discountBadge, { backgroundColor: `${plan.color}15` }]}>
                      <Text style={[styles.discountText, { color: plan.color }]}>{plan.discount}</Text>
                    </View>
                    
                    <Text style={styles.monthlyPrice}>{plan.monthlyPrice}</Text>
                  </View>
                  
                  {/* Selection indicator */}
                  <View style={styles.selectionIndicator}>
                    <MaterialCommunityIcons
                      name={selectedPlan === plan.id ? "check-circle" : "circle-outline"}
                      size={24}
                      color={selectedPlan === plan.id ? plan.color : '#64748B'}
                    />
                  </View>
                </View>
              </Pressable>
            ))}
          </Animated.View>

          {/* Features List */}
          <Animated.View 
            style={[
              styles.featuresContainer,
              {
                opacity: featuresAnimation,
                transform: [{
                  translateY: featuresAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [40, 0]
                  })
                }]
              }
            ]}
          >
            <Text style={styles.featuresTitle}>What's Included</Text>
            
            {premiumFeatures.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <View style={[styles.featureIcon, { backgroundColor: `${feature.color}15` }]}>
                  <MaterialCommunityIcons
                    name={feature.icon as any}
                    size={24}
                    color={feature.color}
                  />
                </View>
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDescription}>{feature.description}</Text>
                </View>
                <MaterialCommunityIcons
                  name="check"
                  size={20}
                  color="#64FFDA"
                />
              </View>
            ))}
          </Animated.View>

          {/* Subscribe Button */}
          <Animated.View 
            style={[
              styles.buttonContainer,
              {
                opacity: buttonAnimation,
                transform: [{
                  translateY: buttonAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0]
                  })
                }]
              }
            ]}
          >
            <Pressable style={styles.subscribeButton} onPress={handleSubscribe}>
              <LinearGradient
                colors={['#21705d', '#2a7596', '#BA68C8']}
                style={styles.subscribeGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.subscribeText}>
                  Subscribe Now - {subscriptionPlans.find(p => p.id === selectedPlan)?.price}
                </Text>
                <MaterialCommunityIcons name="arrow-right" size={24} color="#FFFFFF" />
              </LinearGradient>
            </Pressable>
            
            <Text style={styles.termsText}>
              By subscribing, you agree to our Terms of Service and Privacy Policy
            </Text>
          </Animated.View>

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
    marginBottom: 30,
    position: 'relative',
  },
  
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    padding: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(100, 255, 218, 0.1)',
    zIndex: 10,
  },
  
  titleContainer: {
    alignItems: 'center',
    marginTop: 50,
  },
  
  titleGradient: {
    borderRadius: 15,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 2,
    textAlign: 'center',
  },
  
  subtitle: {
    fontSize: 16,
    color: '#94A3B8',
    fontStyle: 'italic',
    marginTop: 10,
    letterSpacing: 1,
  },
  
  subtitleUnderline: {
    width: 80,
    height: 2,
    backgroundColor: '#64FFDA',
    marginTop: 8,
    borderRadius: 1,
  },
  
  plansContainer: {
    marginBottom: 40,
  },
  
  planCard: {
    marginBottom: 20,
    borderRadius: 24,
    overflow: 'hidden',
  },
  
  selectedPlan: {
    transform: [{ scale: 1.04 }],
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 2,
    borderColor: '#00E676',
    borderRadius: 26,
  }
,  
  
  planCardContainer: {
    borderRadius: 24,
    position: 'relative',
    overflow: 'hidden',
    minHeight: 180,
  },
  
  planGlassBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
  },
  
  planGradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 24,
  },
  
  planBorderGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(100, 255, 218, 0.2)',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  
  popularBadge: {
    position: 'absolute',
    top: 15,
    right: 15,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    zIndex: 10,
  },
  
  popularText: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  
  planContent: {
    padding: 24,
    alignItems: 'center',
    position: 'relative',
    zIndex: 5,
  },
  
  planTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  
  planDuration: {
    fontSize: 16,
    color: '#94A3B8',
    marginBottom: 16,
  },
  
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  
  originalPrice: {
    fontSize: 25,
    color: '#64748B',
    textDecorationLine: 'line-through',
    marginRight: 12,
  },
  
  currentPrice: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: 1,
  },
  
  discountBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 8,
  },
  
  discountText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  
  monthlyPrice: {
    fontSize: 14,
    color: '#94A3B8',
  },
  
  selectionIndicator: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 10,
  },
  
  featuresContainer: {
    marginBottom: 30,
  },
  
  featuresTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(100, 255, 218, 0.1)',
  },
  
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  
  featureContent: {
    flex: 1,
  },
  
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  
  featureDescription: {
    fontSize: 14,
    color: '#94A3B8',
    lineHeight: 20,
  },
  
  buttonContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  
  subscribeButton: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#64FFDA',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  
  subscribeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  
  subscribeText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginRight: 8,
    letterSpacing: 0.5,
  },
  
  termsText: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 16,
  },
});