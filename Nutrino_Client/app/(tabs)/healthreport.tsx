import axiosInsatance from '@/configs/axios-config';
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

  const handleBackPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.back();
  };

  const { user } = useUser();
  const clerkId = user?.id;
  const isFocused = useIsFocused();

  // fetch or generate health report
  const [healthReport, setHealthReport] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  useEffect(() => {
    const fetchHealthReport = async () => {
      if (!clerkId) return;
      try {
        setLoading(true);
        await axiosInsatance.post('/v1/feedback/health', { clerkId })
          .then(res => {
            const report = res.data.data;
            setHealthReport(report?.structuredReport);
          })
      } catch (error) {
        if (axios.isAxiosError?.(error)) {
          console.error("Report error: ", error.response);
        }
      };
      setLoading(false);
    };

    fetchHealthReport();
  }, [clerkId]);



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
          <View style={styles.headerContainer}>
            <Pressable style={styles.backButton} onPress={handleBackPress}>
              <MaterialCommunityIcons name="arrow-left" size={24} color="#4FC3F7" />
            </Pressable>
            <Text style={styles.title}>Health Report</Text>
            <Text style={styles.subtitle}>Track your wellness journey</Text>
          </View>
          {healthReport && (
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
            </View>
          )}

          {healthReport?.insightSummary &&
            <View style={styles.insightsContainer}>
              <LinearGradient
                colors={['#0D2F10', '#173E19']}
                style={styles.insightsCard}
              >
                <MaterialCommunityIcons name="lightbulb-outline" size={24} color="#00E676" />
                <Text style={styles.insightsTitle}>Health Insights</Text>
                <Text style={styles.insightsText}>{healthReport?.insightSummary}</Text>
              </LinearGradient>
            </View>}

        </ScrollView>
        {loading &&
          <View style={styles.loadingBack}>
            <View style={styles.loadingBox}>
              <ActivityIndicator size={20} />
              <Text>Loading report...</Text>
            </View>
          </View>}
      </SafeAreaView>
    </>
  );
}

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
          <Text style={{ color: '#B0BEC5', fontSize: 14, flex: 1 }}>{item}</Text>
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
                <MaterialCommunityIcons name="circle-small" size={18} color="#B0BEC5" />
                <Text style={{ color: '#B0BEC5', fontSize: 14, flex: 1 }}>{v}</Text>
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
          <Text style={{ color: '#B0BEC5', fontSize: 14, marginBottom: 2 }}>{risk.description}</Text>
          {risk.preventionSteps && Array.isArray(risk.preventionSteps) && risk.preventionSteps.length > 0 && (
            <View style={{ marginLeft: 8 }}>
              {risk.preventionSteps.map((step: string, i: number) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                  <MaterialCommunityIcons name="circle-small" size={18} color="#B0BEC5" />
                  <Text style={{ color: '#B0BEC5', fontSize: 13, flex: 1 }}>{step}</Text>
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
                  <MaterialCommunityIcons name="circle-small" size={18} color="#B0BEC5" />
                  <Text style={{ color: '#B0BEC5', fontSize: 13, flex: 1 }}>{step}</Text>
                </View>
              ))}
            </View>
          )}
          {item.medicationAdvice && (
            <Text style={{ color: '#B0BEC5', fontSize: 13, fontStyle: 'italic' }}>{item.medicationAdvice}</Text>
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
                  <MaterialCommunityIcons name="circle-small" size={18} color="#B0BEC5" />
                  <Text style={{ color: '#B0BEC5', fontSize: 13, flex: 1 }}>{rec}</Text>
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
    paddingTop: 20,
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
    backgroundColor: 'rgba(79, 195, 247, 0.1)'
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4FC3F7',
    marginBottom: 5,
    textAlign: 'center',
    letterSpacing: 1
  },
  subtitle: {
    fontSize: 14,
    color: '#B0BEC5',
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
    borderColor: 'rgba(255, 255, 255, 0.1)',
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
    color: '#B0BEC5',
    textAlign: 'center',
    lineHeight: 20
  },
  loadingBack: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.2)'
  },
  loadingBox: {
    width: `60%`,
    height: 40,
    backgroundColor: '#ffff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    flexDirection: 'row',
    gap: 5
  }
});