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
  const email = user?.emailAddresses?.[0]?.emailAddress || '';
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
    if (!email) {
      setLoading(false);
      setApiError("User not authenticated");
      return;
    }
    
    try {
      const response = await axiosInstance.post('/v1/feedback/health', { email });
      
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
  }, [email, isFocused]);

  const ErrorDisplay = () => (
    <View style={styles.errorContainer}>
      <LinearGradient
        colors={['rgba(45, 27, 27, 0.95)', 'rgba(61, 38, 38, 0.85)']}
        style={styles.errorCard}
      >
        <View style={styles.errorIconContainer}>
          <MaterialCommunityIcons name="alert-circle-outline" size={64} color="#FF6B6B" />
        </View>
        <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
        <Text style={styles.errorMessage}>{apiError}</Text>
        
        <Pressable 
          style={styles.retryButton} 
          onPress={retryFetch}
          android_ripple={{ color: 'rgba(255,255,255,0.15)' }}
        >
          <LinearGradient
            colors={['#FF6B6B', '#FF5252']}
            style={styles.retryButtonGradient}
          >
            <MaterialCommunityIcons name="refresh" size={22} color="#FFFFFF" />
            <Text style={styles.retryButtonText}>Try Again</Text>
          </LinearGradient>
        </Pressable>
      </LinearGradient>
    </View>
  );

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <LinearGradient
        colors={['rgba(26, 26, 46, 0.95)', 'rgba(45, 45, 68, 0.85)']}
        style={styles.emptyCard}
      >
        <View style={styles.emptyIconContainer}>
          <LinearGradient
            colors={['#4FC3F7', '#29B6F6']}
            style={styles.iconGradientBackground}
          >
            <MaterialCommunityIcons name="file-document-outline" size={48} color="#FFFFFF" />
          </LinearGradient>
        </View>
        <Text style={styles.emptyTitle}>No Report Available</Text>
        <Text style={styles.emptyMessage}>
          Complete your health assessments to generate your personalized health report.
        </Text>
        
        <Pressable 
          style={styles.retryButton} 
          onPress={retryFetch}
          android_ripple={{ color: 'rgba(255,255,255,0.15)' }}
        >
          <LinearGradient
            colors={['#4FC3F7', '#29B6F6']}
            style={styles.retryButtonGradient}
          >
            <MaterialCommunityIcons name="refresh" size={22} color="#FFFFFF" />
            <Text style={styles.retryButtonText}>Refresh</Text>
          </LinearGradient>
        </Pressable>
      </LinearGradient>
    </View>
  );

  const LoadingIndicator = () => (
    <View style={styles.loadingOverlay}>
      <LinearGradient
        colors={['rgba(10, 14, 26, 0.95)', 'rgba(26, 27, 58, 0.9)']}
        style={styles.loadingContainer}
      >
        <View style={styles.loadingIconContainer}>
          <ActivityIndicator size="large" color="#4FC3F7" />
          <View style={styles.pulsingDots}>
            <View style={[styles.dot, { animationDelay: '0s' }]} />
            <View style={[styles.dot, { animationDelay: '0.2s' }]} />
            <View style={[styles.dot, { animationDelay: '0.4s' }]} />
          </View>
        </View>
        <Text style={styles.loadingText}>Loading your health report...</Text>
        <Text style={styles.loadingSubtext}>Analyzing your wellness data</Text>
      </LinearGradient>
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
              colors={['rgba(13, 47, 16, 0.95)', 'rgba(23, 62, 25, 0.85)']}
              style={styles.insightsCard}
            >
              <View style={styles.insightsIconContainer}>
                <LinearGradient
                  colors={['#00E676', '#4CAF50']}
                  style={styles.insightsIconGradient}
                >
                  <MaterialCommunityIcons name="lightbulb-outline" size={28} color="#FFFFFF" />
                </LinearGradient>
              </View>
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
              <LinearGradient
                colors={['rgba(79, 195, 247, 0.3)', 'rgba(79, 195, 247, 0.1)']}
                style={styles.backButtonGradient}
              >
                <MaterialCommunityIcons name="arrow-left" size={24} color="#4FC3F7" />
              </LinearGradient>
            </Pressable>
            
            <View style={styles.titleContainer}>
              <LinearGradient
                colors={['#4FC3F7', '#29B6F6', '#1E88E5']}
                style={styles.titleGradient}
              >
                <MaterialCommunityIcons name="chart-line" size={32} color="#FFFFFF" />
                <Text style={styles.title}>Health Report</Text>
              </LinearGradient>
              <Text style={styles.subtitle}>Track your wellness journey</Text>
            </View>
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
    <LinearGradient
      colors={['rgba(79, 195, 247, 0.1)', 'rgba(79, 195, 247, 0.05)']}
      style={styles.sectionStyle}
    >
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIconContainer}>
          {icon}
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.sectionContent}>
        {items.map((item, idx) => (
          <View key={idx} style={styles.sectionItem}>
            <View style={styles.checkIconContainer}>
              <MaterialCommunityIcons name="check-circle-outline" size={18} color="#00E676" />
            </View>
            <Text style={styles.sectionItemText}>{item}</Text>
          </View>
        ))}
      </View>
    </LinearGradient>
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
    <LinearGradient
      colors={['rgba(79, 195, 247, 0.1)', 'rgba(79, 195, 247, 0.05)']}
      style={styles.sectionStyle}
    >
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIconContainer}>
          {icon}
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.sectionContent}>
        {Object.entries(obj).map(([key, value]) =>
          Array.isArray(value) && value.length > 0 ? (
            <View key={key} style={styles.objectSectionCategory}>
              <Text style={styles.categoryTitle}>{key.replace(/([A-Z])/g, ' $1')}</Text>
              {value.map((v: string, idx: number) => (
                <View key={idx} style={styles.sectionItem}>
                  <View style={styles.bulletPoint}>
                    <MaterialCommunityIcons name="circle-small" size={18} color="#4FC3F7" />
                  </View>
                  <Text style={styles.sectionItemText}>{v}</Text>
                </View>
              ))}
            </View>
          ) : null
        )}
      </View>
    </LinearGradient>
  );
};

type HealthRisksProps = {
  risks?: any[] | null;
};
const HealthRisks: React.FC<HealthRisksProps> = ({ risks }) => {
  if (!risks || risks.length === 0) return null;
  return (
    <LinearGradient
      colors={['rgba(255, 179, 0, 0.1)', 'rgba(255, 179, 0, 0.05)']}
      style={[styles.sectionStyle, styles.riskSection]}
    >
      <View style={styles.sectionHeader}>
        <View style={[styles.sectionIconContainer, styles.riskIconContainer]}>
          <MaterialCommunityIcons name="alert-circle-outline" size={20} color="#FFB300" />
        </View>
        <Text style={[styles.sectionTitle, styles.riskTitle]}>Health Risks</Text>
      </View>
      <View style={styles.sectionContent}>
        {risks.map((risk, idx) => (
          <View key={idx} style={styles.riskItem}>
            <Text style={styles.riskCondition}>{risk.condition}</Text>
            <Text style={styles.riskDescription}>{risk.description}</Text>
            {risk.preventionSteps && Array.isArray(risk.preventionSteps) && risk.preventionSteps.length > 0 && (
              <View style={styles.preventionSteps}>
                <Text style={styles.preventionTitle}>Prevention Steps:</Text>
                {risk.preventionSteps.map((step: string, i: number) => (
                  <View key={i} style={styles.sectionItem}>
                    <View style={styles.bulletPoint}>
                      <MaterialCommunityIcons name="shield-check-outline" size={16} color="#00E676" />
                    </View>
                    <Text style={styles.preventionStepText}>{step}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}
      </View>
    </LinearGradient>
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
    marginBottom: 40,
    paddingTop: 10,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 10,
    borderRadius: 25,
    overflow: 'hidden',
  },
  backButtonGradient: {
    padding: 12,
    borderRadius: 25,
  },
  titleContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  titleGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 10,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    fontStyle: 'italic',
  },
  sectionStyle: {
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(79, 195, 247, 0.2)',
    shadowColor: '#4FC3F7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(79, 195, 247, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    color: '#4FC3F7',
    fontWeight: 'bold',
    fontSize: 18,
    flex: 1,
  },
  sectionContent: {
    marginLeft: 8,
  },
  sectionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingVertical: 4,
  },
  checkIconContainer: {
    marginTop: 2,
    marginRight: 12,
  },
  sectionItemText: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 22,
    flex: 1,
  },
  objectSectionCategory: {
    marginBottom: 16,
  },
  categoryTitle: {
    color: '#00E676',
    fontWeight: '600',
    fontSize: 16,
    marginBottom: 8,
    textTransform: 'capitalize',
  },
  bulletPoint: {
    marginTop: 2,
    marginRight: 8,
  },
  // Health Risk specific styles
  riskSection: {
    borderColor: 'rgba(255, 179, 0, 0.3)',
  },
  riskIconContainer: {
    backgroundColor: 'rgba(255, 179, 0, 0.2)',
  },
  riskTitle: {
    color: '#FFB300',
  },
  riskItem: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: 'rgba(255, 179, 0, 0.05)',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FFB300',
  },
  riskCondition: {
    color: '#FFB300',
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 8,
  },
  riskDescription: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 12,
  },
  preventionSteps: {
    marginTop: 8,
  },
  preventionTitle: {
    color: '#00E676',
    fontWeight: '600',
    fontSize: 14,
    marginBottom: 8,
  },
  preventionStepText: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  insightsContainer: {
    marginBottom: 30,
  },
  insightsCard: {
    borderRadius: 20,
    padding: 28,
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.3)',
    alignItems: 'center',
    shadowColor: '#00E676',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  insightsIconContainer: {
    marginBottom: 16,
  },
  insightsIconGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  insightsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#00E676',
    marginBottom: 16,
    textAlign: 'center',
  },
  insightsText: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 24,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 14, 26, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingContainer: {
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    minWidth: 280,
    borderWidth: 1,
    borderColor: 'rgba(79, 195, 247, 0.3)',
  },
  loadingIconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  pulsingDots: {
    flexDirection: 'row',
    marginTop: 12,
    justifyContent: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4FC3F7',
    marginHorizontal: 4,
    opacity: 0.6,
  },
  loadingText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: 8,
  },
  loadingSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorCard: {
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 380,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.4)',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  errorIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 15,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyCard: {
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 380,
    borderWidth: 1,
    borderColor: 'rgba(79, 195, 247, 0.4)',
    shadowColor: '#4FC3F7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  emptyIconContainer: {
    marginBottom: 20,
  },
  iconGradientBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4FC3F7',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 15,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  retryButton: {
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  retryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 10,
  },
});