import axiosInsatance from '@/configs/axios-config';
import { useAuth, useUser } from '@clerk/clerk-expo';
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

export default function ProfilePage() {
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
        // Create particle positions with better distribution
        const particles = Array(PARTICLE_COUNT).fill(null).map((_, index) => {
            const isLarge = index < 6;
            const isMedium = index >= 6 && index < 14;
            const colorIndex = index % 5;
            
            return {
                x: Math.random() * width,
                y: Math.random() * height,
                size: isLarge ? Math.random() * 100 + 60 : isMedium ? Math.random() * 50 + 25 : Math.random() * 30 + 10,
                speed: Math.random() * 0.3 + 0.1,
                direction: Math.random() * Math.PI * 2,
                color: [
                    'rgba(100, 255, 218, 0.08)',
                    'rgba(139, 69, 255, 0.12)',
                    'rgba(255, 107, 107, 0.08)',
                    'rgba(255, 183, 77, 0.1)',
                    'rgba(79, 195, 247, 0.08)'
                ][colorIndex],
                glowColor: [
                    '#64FFDA',
                    '#8B45FF',
                    '#FF6B6B',
                    '#FFB74D',
                    '#4FC3F7'
                ][colorIndex]
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
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.back();
    };

    const isFocused = useIsFocused();
    // get user
    const { user } = useUser();
    const email = user?.primaryEmailAddress?.emailAddress;

    const healthDetailsList = [
        { key: 'age', label: 'Age', value: null, icon: 'calendar' },
        { key: 'gender', label: 'Gender', value: null, icon: 'gender-male' },
        { key: 'height', label: 'Height', value: null, icon: 'human-male-height' },
        { key: 'weight', label: 'Weight', value: null, icon: 'weight-kilogram' },
        { key: 'activityLevel', label: 'Activity Level', value: null, icon: 'run' },
        { key: 'medicalConditions', label: 'Medical Conditions', value: null, icon: 'hospital-box-outline' },
        { key: 'allergies', label: 'Allergies', value: null, icon: 'allergy' },
        { key: 'pregnancyStatus', label: 'Pregnancy Status', value: null, icon: 'baby-face-outline' },
        { key: 'breastfeeding', label: 'Breastfeeding', value: null, icon: 'baby-bottle-outline' },
        { key: 'recentSurgery', label: 'Recent Surgery', value: null, icon: 'medical-bag' },
        { key: 'chronicPain', label: 'Chronic Pain', value: null, icon: 'emoticon-sad-outline' },
        { key: 'digestiveIssues', label: 'Digestive Issues', value: null, icon: 'food-variant' },
    ];

    const [healthDetails, setHealthDetails] = useState<Array<Record<string, any>>>(healthDetailsList);

    // fetch health details 
    const [fetchedData, setFetchedData] = useState<Record<string, any> | null>(null);
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        const fetchData = async () => {
            if (!email) return;
            try {
                setLoading(true);
                await axiosInsatance.get(`/v1/healthstatus/healthprofile/${email}`)
                    .then((res) => {
                        console.log(res.data.data);
                        setFetchedData(res.data.data);
                    })
            } catch (error) {
                if (axios.isAxiosError?.(error)) {
                   // console.error("Report error: ", error.response);
                }
            }
            setLoading(false);
        };
        fetchData();
    }, [email, isFocused]);

    // key value pairs
    const keyaPirs = {
        MALE: 'Male',
        FEMALE: 'Female',
        OTHER: 'Other',
        SEDENTARY: 'Sedentary',
        LIGHTLY_ACTIVE: 'Lightly active',
        MODERATELY_ACTIVE: 'Moderately active',
        VERY_ACTIVE: 'Very active',
        EXTREMELY_ACTIVE: 'Extremely active',
    }
    // fill data
    useEffect(() => {
        if (!fetchedData) return;
        setHealthDetails([
            ...healthDetails.map(item => {
                let value = fetchedData[item.key];
                if (value === undefined || value === null) {
                    value = null;
                } else if (typeof value === 'boolean') {
                    value = value ? 'Yes' : 'No';
                } else if (
                    Array.isArray(value) &&
                    typeof value !== 'number'
                ) {
                    value = value.length > 0 ? value.join(', ') : null;
                }
                if (typeof value === 'string' && value in keyaPirs) value = keyaPirs[value as keyof typeof keyaPirs];

                return {
                    ...item,
                    value
                };
            })
        ])
    }, [fetchedData]);

    // handle logout
    const { signOut } = useAuth();
    const [signingOut, setSigningOut] = useState(false);
    const handleSignLout = async () => {
        setSigningOut(true);
        await signOut();
        router.replace('/auth');
        setSigningOut(false);
    }
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
                    scrollEventThrottle={16}
                >
                    <View style={styles.headerContainer}>
                        <Pressable style={styles.backButton} onPress={handleBackPress}>
                            <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
                        </Pressable>
                        <Animated.View style={{
                            opacity: headerAnimation,
                            transform: [{
                                translateY: headerAnimation.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [-20, 0],
                                })
                            }]
                        }}>
                            <Text style={styles.title}>Profile</Text>
                            <Text style={styles.subtitle}>
                                {(() => {
                                    const hour = new Date().getHours();
                                    if (hour < 12) return "Good Morning! ☀️";
                                    if (hour < 17) return "Good Afternoon! 🌤️";
                                    if (hour < 21) return "Good Evening! 🌅";
                                    return "Good Night! 🌙";
                                })()}
                            </Text>
                        </Animated.View>
                    </View>
                    
                    <Animated.View style={[styles.profileCard, {
                        opacity: headerAnimation,
                        transform: [{
                            scale: headerAnimation.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0.8, 1],
                            })
                        }]
                    }]}>
                        <View style={styles.profileImageContainer}>
                            <LinearGradient
                                colors={['#64FFDA', '#4FC3F7', '#8B45FF']}
                                style={styles.profileImageGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                <MaterialCommunityIcons name='account' size={60} color="#FFFFFF" />
                            </LinearGradient>
                            <View style={styles.statusIndicator}>
                                <MaterialCommunityIcons name="check-circle" size={20} color="#4CAF50" />
                            </View>
                        </View>
                        <View style={styles.profileInfo}>
                            <Text style={styles.profileName}>{user?.fullName || 'User'}</Text>
                            <Text style={styles.profileEmail}>{user?.emailAddresses[0]?.emailAddress}</Text>
                            <View style={styles.profileStats}>
                                <View style={styles.statItem}>
                                    <MaterialCommunityIcons name="heart-pulse" size={16} color="#FF6B6B" />
                                    <Text style={styles.statText}>Health Profile</Text>
                                </View>
                                <View style={styles.statDivider} />
                                <View style={styles.statItem}>
                                    <MaterialCommunityIcons name="shield-check" size={16} color="#4CAF50" />
                                    <Text style={styles.statText}>Verified</Text>
                                </View>
                            </View>
                        </View>
                    </Animated.View>

                    <View style={styles.healthSection}>
                        <View style={styles.sectionHeader}>
                            <MaterialCommunityIcons name="heart-pulse" size={24} color="#FF6B6B" />
                            <Text style={styles.sectionTitle}>Health Overview</Text>
                        </View>
                        {loading && (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size={30} color="#64FFDA" />
                                <Text style={styles.loadingText}>Loading health data...</Text>
                            </View>
                        )}
                        {!loading && (
                            <View style={styles.healthGrid}>
                                {healthDetails.filter(item => item.value).map((item, index) => (
                                    <Animated.View 
                                        key={index}
                                        style={[styles.healthCard, {
                                            opacity: headerAnimation,
                                            transform: [{
                                                translateY: headerAnimation.interpolate({
                                                    inputRange: [0, 1],
                                                    outputRange: [30, 0],
                                                })
                                            }]
                                        }]}
                                    >
                                        <View style={styles.healthCardIcon}>
                                            <MaterialCommunityIcons size={20} name={item.icon as any} color="#FFFFFF" />
                                        </View>
                                        <View style={styles.healthCardContent}>
                                            <Text style={styles.healthCardLabel}>{item.label}</Text>
                                            <Text style={styles.healthCardValue}>{item.value}</Text>
                                        </View>
                                        <View style={styles.healthCardAccent} />
                                    </Animated.View>
                                ))}
                                {healthDetails.filter(item => item.value).length === 0 && !loading && (
                                    <View style={styles.emptyState}>
                                        <MaterialCommunityIcons name="clipboard-text-outline" size={48} color="#666" />
                                        <Text style={styles.emptyStateTitle}>No Health Data</Text>
                                        <Text style={styles.emptyStateText}>Add your health details to get started</Text>
                                    </View>
                                )}
                            </View>
                        )}
                    </View>
                    <View style={styles.actionsContainer}>
                        {!loading && (
                            <Pressable 
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                    router.push('/profile/edithealth');
                                }} 
                                style={({ pressed }) => [
                                    styles.primaryButton,
                                    { opacity: pressed ? 0.8 : 1 }
                                ]} 
                                android_ripple={{ color: 'rgba(255, 255, 255, 0.2)' }}
                            >
                                <LinearGradient
                                    colors={['#64FFDA', '#4FC3F7']}
                                    style={styles.buttonGradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                >
                                    <MaterialCommunityIcons name={fetchedData ? 'pencil' : 'plus-circle'} size={24} color="#FFFFFF" />
                                    <Text style={styles.primaryButtonText}>
                                        {fetchedData ? "Edit Health Profile" : "Add Health Details"}
                                    </Text>
                                </LinearGradient>
                            </Pressable>
                        )}
                        
                        <Pressable 
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                handleSignLout();
                            }}
                            style={({ pressed }) => [
                                styles.secondaryButton,
                                { opacity: pressed ? 0.7 : 1 }
                            ]}
                            android_ripple={{ color: 'rgba(255, 255, 255, 0.1)' }}
                            disabled={signingOut}
                        >
                            <MaterialCommunityIcons name="logout" size={20} color="#FF6B6B" />
                            <Text style={styles.secondaryButtonText}>
                                {signingOut ? "Signing out..." : "Sign Out"}
                            </Text>
                            {signingOut && <ActivityIndicator size={20} color="#FF6B6B" style={{ marginLeft: 8 }} />}
                        </Pressable>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </>
    )
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
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 40,
    },
    headerContainer: {
        alignItems: 'center',
        marginBottom: 30,
        paddingTop: 10,
    },
    backButton: {
        position: 'absolute',
        left: 0,
        top: 15,
        padding: 12,
        borderRadius: 25,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: '#FFFFFF',
        textAlign: 'center',
        letterSpacing: 1.5,
        marginBottom: 5,
    },
    subtitle: {
        fontSize: 16,
        color: '#64FFDA',
        textAlign: 'center',
        fontWeight: '500',
        opacity: 0.8,
    },
    
    // Profile Card Styles
    profileCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderRadius: 24,
        padding: 20,
        marginBottom: 30,
        borderWidth: 1,
        borderColor: 'rgba(100, 255, 218, 0.2)',
        shadowColor: '#64FFDA',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
    },
    profileImageContainer: {
        position: 'relative',
        alignSelf: 'center',
        marginBottom: 16,
    },
    profileImageGradient: {
        width: 100,
        height: 100,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#64FFDA',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
    },
    statusIndicator: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#0A0E1A',
        borderRadius: 15,
        padding: 2,
    },
    profileInfo: {
        alignItems: 'center',
    },
    profileName: {
        fontSize: 24,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 4,
        textAlign: 'center',
    },
    profileEmail: {
        fontSize: 16,
        color: '#B0BEC5',
        marginBottom: 16,
        textAlign: 'center',
    },
    profileStats: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    statText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '500',
        marginLeft: 6,
    },
    statDivider: {
        width: 1,
        height: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        marginHorizontal: 8,
    },
    
    // Health Section Styles
    healthSection: {
        marginBottom: 30,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        paddingHorizontal: 4,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#FFFFFF',
        marginLeft: 12,
    },
    loadingContainer: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    loadingText: {
        color: '#B0BEC5',
        fontSize: 16,
        marginTop: 12,
        fontWeight: '500',
    },
    healthGrid: {
        gap: 12,
    },
    healthCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        position: 'relative',
        overflow: 'hidden',
    },
    healthCardIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(100, 255, 218, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    healthCardContent: {
        flex: 1,
    },
    healthCardLabel: {
        fontSize: 14,
        color: '#B0BEC5',
        fontWeight: '500',
        marginBottom: 2,
    },
    healthCardValue: {
        fontSize: 16,
        color: '#FFFFFF',
        fontWeight: '600',
    },
    healthCardAccent: {
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        width: 3,
        backgroundColor: '#64FFDA',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyStateTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FFFFFF',
        marginTop: 16,
        marginBottom: 8,
    },
    emptyStateText: {
        fontSize: 14,
        color: '#B0BEC5',
        textAlign: 'center',
    },
    
    // Action Buttons
    actionsContainer: {
        gap: 16,
        marginTop: 10,
    },
    primaryButton: {
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#64FFDA',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    buttonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 24,
        gap: 12,
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    secondaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 107, 107, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255, 107, 107, 0.3)',
        gap: 8,
    },
    secondaryButtonText: {
        color: '#FF6B6B',
        fontSize: 16,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
});