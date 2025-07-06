import axiosInstance from '@/configs/axios-config';
import { useUser } from '@clerk/clerk-expo';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import axios from 'axios';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Dimensions, Easing, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');
const PARTICLE_COUNT = 25;

export default function HealthReportScreen() {
  const [particlePositions, setParticlePositions] = useState<Array<any>>([]);
  const headerAnimation = useRef(new Animated.Value(0)).current;
  const [isLoaded, setIsLoaded] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
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

    Animated.timing(headerAnimation, {
      toValue: 1,
      duration: 1200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

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

  const handleBackPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.back();
  };

  const { user } = useUser();
  const clerkId = user?.id;
  const isFocused = useIsFocused();

  const [healthReport, setHealthReport] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState<boolean>(true); // Start with loading true
  
  const retryFetch = () => {
    setApiError(null);
    setHealthReport(null);
    setLoading(true);
    fetchHealthReport();
  };

  const fetchHealthReport = async () => {
    if (!clerkId) {
      setLoading(false);
      setApiError("User not authenticated");
      return;
    }
    
    try {
      const response = await axiosInstance.post('/v1/feedback/health', { clerkId });
      
      if (response.data?.data?.structuredReport) {
        setHealthReport(response.data.data.structuredReport);
        setApiError(null);
      } else {
        setApiError("No health report data found");
      }
    } catch (error) {
      let errorMessage = "Failed to fetch health report";
      
      if (axios.isAxiosError(error)) {
        if (error.response) {
          // Server responded with error status
          if (error.response.status === 404) {
            errorMessage = "No health report found. Please complete your health assessments.";
          } else if (error.response.status === 401) {
            errorMessage = "Session expired. Please log in again.";
          } else if (error.response.status >= 500) {
            errorMessage = "Server error. Please try again later.";
          } else if (error.response.data?.message) {
            errorMessage = error.response.data.message;
          }
        } else if (error.request) {
          // Request was made but no response received
          errorMessage = "Network error. Please check your connection.";
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setApiError(errorMessage);
      console.error("Health report fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isFocused) {
      fetchHealthReport();
    }
  }, [clerkId, isFocused]);

  const ErrorDisplay = () => (
    <View style={styles.errorContainer}>
      <LinearGradient
        colors={['#2D1B1B', '#3D2626']}
        style={styles.errorCard}
      >
        <MaterialCommunityIcons name="alert-circle-outline" size={48} color="#FF6B6B" />
        <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
        <Text style={styles.errorMessage}>{apiError}</Text>
        
        <Pressable 
          style={styles.retryButton} 
          onPress={retryFetch}
          android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
        >
          <LinearGradient
            colors={['#4FC3F7', '#29B6F6']}
            style={styles.retryButtonGradient}
          >
            <MaterialCommunityIcons name="refresh" size={20} color="#FFFFFF" />
            <Text style={styles.retryButtonText}>Try Again</Text>
          </LinearGradient>
        </Pressable>
      </LinearGradient>
    </View>
  );

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <LinearGradient
        colors={['#1A1A2E', '#2D2D44']}
        style={styles.emptyCard}
      >
        <MaterialCommunityIcons name="file-document-outline" size={48} color="#4FC3F7" />
        <Text style={styles.emptyTitle}>No Report Available</Text>
        <Text style={styles.emptyMessage}>
          Complete your health assessments to generate your personalized health report.
        </Text>
        
        <Pressable 
          style={styles.retryButton} 
          onPress={retryFetch}
          android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
        >
          <LinearGradient
            colors={['#4FC3F7', '#29B6F6']}
            style={styles.retryButtonGradient}
          >
            <MaterialCommunityIcons name="refresh" size={20} color="#FFFFFF" />
            <Text style={styles.retryButtonText}>Refresh</Text>
          </LinearGradient>
        </Pressable>
      </LinearGradient>
    </View>
  );

  const LoadingIndicator = () => (
    <View style={styles.loadingOverlay}>
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4FC3F7" />
        <Text style={styles.loadingText}>Loading your health report...</Text>
      </View>
    </View>
  );

  const ReportContent = () => {
    if (!healthReport) return null;
    
    return (
      <View style={{ marginBottom: 30 }}>
        <Section
          title="Strengths"
          items={healthReport.strengths}
          icon={<MaterialCommunityIcons name="thumb-up-outline" size={20} color="#00E676" />}
        />
        <Section
          title="Areas for Improvement"
          items={healthReport.areasForImprovement}
          icon={<MaterialCommunityIcons name="alert-outline" size={20} color="#FFB300" />}
        />
        <ObjectSection
          title="Stress Management"
          obj={healthReport.stressManagement}
          icon={<MaterialCommunityIcons name="meditation" size={20} color="#4FC3F7" />}
        />
        <ObjectSection
          title="Digestive Health"
          obj={healthReport.digestiveHealth}
          icon={<MaterialCommunityIcons name="food-apple-outline" size={20} color="#FF7043" />}
        />
        <ObjectSection
          title="Sleep Recommendations"
          obj={healthReport.sleepRecommendations}
          icon={<MaterialCommunityIcons name="sleep" size={20} color="#9575CD" />}
        />
        <HealthRisks risks={healthReport.healthRisks} />
        <MedicalAdvice advice={healthReport.medicalAdvice} />
        <LifestyleModifications mods={healthReport.lifestyleModifications} />
        
        {healthReport?.insightSummary && (
          <View style={styles.insightsContainer}>
            <LinearGradient
              colors={['#0D2F10', '#173E19']}
              style={styles.insightsCard}
            >
              <MaterialCommunityIcons name="lightbulb-outline" size={24} color="#00E676" />
              <Text style={styles.insightsTitle}>Health Insights</Text>
              <Text style={styles.insightsText}>{healthReport.insightSummary}</Text>
            </LinearGradient>
          </View>
        )}
      </View>
    );
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
                  shadowOpacity: 0.1,
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
                    0.3
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
          <View style={styles.headerContainer}>
            <Pressable style={styles.backButton} onPress={handleBackPress}>
              <MaterialCommunityIcons name="arrow-left" size={24} color="#4FC3F7" />
            </Pressable>
            <Text style={styles.title}>Health Report</Text>
            <Text style={styles.subtitle}>Track your wellness journey</Text>
          </View>

          {/* Content based on state */}
          {loading ? (
            <LoadingIndicator />
          ) : apiError ? (
            <ErrorDisplay />
          ) : healthReport ? (
            <ReportContent />
          ) : (
            <EmptyState />
          )}
        </ScrollView>

        {loading && <LoadingIndicator />}
      </SafeAreaView>
    </>
  );
}

// Component definitions remain the same...
type SectionProps = {
  title: string;
  items?: string[] | null;
  icon?: React.ReactNode;
};
const Section: React.FC<SectionProps> = ({ title, items, icon }) => {
  if (!items || items.length === 0) return null;
  return (
    <View style={styles.sectionStyle}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
        {icon}
        <Text style={{ color: '#4FC3F7', fontWeight: 'bold', fontSize: 16, marginLeft: icon ? 8 : 0 }}>{title}</Text>
      </View>
      {items.map((item, idx) => (
        <View key={idx} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4 }}>
          <MaterialCommunityIcons name="check-circle-outline" size={18} color="#00E676" style={{ marginTop: 2, marginRight: 6 }} />
          <Text style={{ color: '#FFFFFF', fontSize: 14, flex: 1 }}>{item}</Text>
        </View>
      ))}
    </View>
  );
};

type ObjectSectionProps = {
  title: string;
  obj?: Record<string, any> | null;
  icon?: React.ReactNode;
};
const ObjectSection: React.FC<ObjectSectionProps> = ({ title, obj, icon }) => {
  if (!obj) return null;
  return (
    <View style={styles.sectionStyle}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
        {icon}
        <Text style={{ color: '#4FC3F7', fontWeight: 'bold', fontSize: 16, marginLeft: icon ? 8 : 0 }}>{title}</Text>
      </View>
      {Object.entries(obj).map(([key, value]) =>
        Array.isArray(value) && value.length > 0 ? (
          <View key={key} style={{ marginBottom: 6 }}>
            <Text style={{ color: '#00E676', fontWeight: '600', fontSize: 14, marginBottom: 2 }}>{key.replace(/([A-Z])/g, ' $1')}</Text>
            {value.map((v: string, idx: number) => (
              <View key={idx} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 2 }}>
                <MaterialCommunityIcons name="circle-small" size={18} color="#FFFFFF" />
                <Text style={{ color: '#FFFFFF', fontSize: 14, flex: 1 }}>{v}</Text>
              </View>
            ))}
          </View>
        ) : null
      )}
    </View>
  );
};

type HealthRisksProps = {
  risks?: any[] | null;
};
const HealthRisks: React.FC<HealthRisksProps> = ({ risks }) => {
  if (!risks || risks.length === 0) return null;
  return (
    <View style={styles.sectionStyle}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
        <MaterialCommunityIcons name="alert-circle-outline" size={20} color="#FFB300" />
        <Text style={{ color: '#FFB300', fontWeight: 'bold', fontSize: 16, marginLeft: 8 }}>Health Risks</Text>
      </View>
      {risks.map((risk, idx) => (
        <View key={idx} style={{ marginBottom: 8 }}>
          <Text style={{ color: '#FFB300', fontWeight: '600', fontSize: 14 }}>{risk.condition}</Text>
          <Text style={{ color: '#FFFFFF', fontSize: 14, marginBottom: 2 }}>{risk.description}</Text>
          {risk.preventionSteps && Array.isArray(risk.preventionSteps) && risk.preventionSteps.length > 0 && (
            <View style={{ marginLeft: 8 }}>
              {risk.preventionSteps.map((step: string, i: number) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                  <MaterialCommunityIcons name="circle-small" size={18} color="#FFFFFF" />
                  <Text style={{ color: '#FFFFFF', fontSize: 13, flex: 1 }}>{step}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      ))}
    </View>
  );
};

type MedicalAdviceProps = {
  advice?: any[] | null;
};
const MedicalAdvice: React.FC<MedicalAdviceProps> = ({ advice }) => {
  if (!advice || advice.length === 0) return null;
  return (
    <View style={styles.sectionStyle}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
        <MaterialCommunityIcons name="medical-bag" size={20} color="#00E676" />
        <Text style={{ color: '#00E676', fontWeight: 'bold', fontSize: 16, marginLeft: 8 }}>Medical Advice</Text>
      </View>
      {advice.map((item, idx) => (
        <View key={idx} style={{ marginBottom: 8 }}>
          <Text style={{ color: '#00E676', fontWeight: '600', fontSize: 14 }}>{item.condition}</Text>
          {item.managementSteps && Array.isArray(item.managementSteps) && item.managementSteps.length > 0 && (
            <View style={{ marginLeft: 8, marginBottom: 2 }}>
              {item.managementSteps.map((step: string, i: number) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                  <MaterialCommunityIcons name="circle-small" size={18} color="#FFFFFF" />
                  <Text style={{ color: '#FFFFFF', fontSize: 13, flex: 1 }}>{step}</Text>
                </View>
              ))}
            </View>
          )}
          {item.medicationAdvice && (
            <Text style={{ color: '#FFFFFF', fontSize: 13, fontStyle: 'italic' }}>{item.medicationAdvice}</Text>
          )}
        </View>
      ))}
    </View>
  );
};

type LifestyleModificationsProps = {
  mods?: any[] | null;
};
const LifestyleModifications: React.FC<LifestyleModificationsProps> = ({ mods }) => {
  if (!mods || mods.length === 0) return null;
  return (
    <View style={styles.sectionStyle}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
        <MaterialCommunityIcons name="run" size={20} color="#4FC3F7" />
        <Text style={{ color: '#4FC3F7', fontWeight: 'bold', fontSize: 16, marginLeft: 8 }}>Lifestyle Modifications</Text>
      </View>
      {mods.map((mod, idx) => (
        <View key={idx} style={{ marginBottom: 6 }}>
          <Text style={{ color: '#00E676', fontWeight: '600', fontSize: 14 }}>{mod.area}</Text>
          {mod.recommendations && Array.isArray(mod.recommendations) && mod.recommendations.length > 0 && (
            <View style={{ marginLeft: 8 }}>
              {mod.recommendations.map((rec: string, i: number) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                  <MaterialCommunityIcons name="circle-small" size={18} color="#FFFFFF" />
                  <Text style={{ color: '#FFFFFF', fontSize: 13, flex: 1 }}>{rec}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      ))}
    </View>
  );
};

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
  meshOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    flexGrow: 1,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 30,
    paddingTop: 10
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 10,
    padding: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(79, 195, 247, 0.2)'
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
    textAlign: 'center',
    letterSpacing: 1
  },
  subtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    fontStyle: 'italic'
  },
  sectionStyle: {
    marginBottom: 18,
    backgroundColor: 'rgba(178, 178, 178, 0.26)',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10
  },
  insightsContainer: {
    marginBottom: 20
  },
  insightsCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(100, 255, 218, 0.2)',
    alignItems: 'center'
  },
  insightsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00E676',
    marginTop: 10,
    marginBottom: 10
  },
  insightsText: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 20
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 14, 26, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    minWidth: 200,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 350,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.3)',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 350,
    borderWidth: 1,
    borderColor: 'rgba(79, 195, 247, 0.3)',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4FC3F7',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  retryButton: {
    borderRadius: 25,
    overflow: 'hidden',
    marginTop: 10,
  },
  retryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});