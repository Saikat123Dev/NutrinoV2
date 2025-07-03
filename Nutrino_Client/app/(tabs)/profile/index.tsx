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
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.back();
    };

    const isFocused = useIsFocused();
    // get user
    const { user } = useUser();
    const clerkId = user?.id;

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
            if (!clerkId) return;
            try {
                setLoading(true);
                await axiosInsatance.get(`/v1/healthstatus/healthprofile/${clerkId}`)
                    .then((res) => {
                        console.log(res.data.data);
                        setFetchedData(res.data.data);
                    })
            } catch (error) {
                if (axios.isAxiosError?.(error)) {
                    console.error("Report error: ", error.response);
                }
            }
            setLoading(false);
        };
        fetchData();
    }, [clerkId, isFocused]);

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
                >
                    <View style={styles.headerContainer}>
                        <Pressable style={styles.backButton} onPress={handleBackPress}>
                            <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
                        </Pressable>
                        <Text style={styles.title}>Profile</Text>
                    </View>
                    <View style={styles.profileBox}>
                        <MaterialCommunityIcons name='account-circle' size={100} color="#9cdcf1" />
                        <View>
                            <Text style={{ fontSize: 30, fontWeight: 'bold', color: '#ffff' }}>{user?.fullName}</Text>
                            <Text style={{ fontSize: 20, color: '#e7e7e7' }}>{user?.emailAddresses[0].emailAddress}</Text>
                        </View>
                    </View>

                    <View>
                        <Text style={styles.textNormal}>Health details</Text>
                        {loading && <ActivityIndicator size={30} style={{ marginVertical: 10 }} />}
                        <View>
                            {
                                healthDetails.map((item, index) => (
                                    item.value && <View style={styles.healthDetailsItem} key={index} >
                                        <View style={styles.healthDetailsIconBack}>
                                            <MaterialCommunityIcons size={22} name={item.icon as any} color="#9cdcf1" />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>
                                                {item.label}
                                            </Text>
                                            {item.value && (
                                                <Text style={{ color: '#b3e5fc', fontSize: 15, marginTop: 2 }}>
                                                    {item.value}
                                                </Text>
                                            )}
                                        </View>
                                    </View>
                                ))
                            }
                        </View>
                    </View>
                    {!loading && <View style={{ marginVertical: 10 }}>
                        <Pressable onPress={() => router.push('/profile/edithealth')} style={styles.editHealthButton} android_ripple={{ color: '#1A237E' }}>
                            <MaterialCommunityIcons name='pen-plus' size={22} color={'rgb(200, 18, 18)'} />
                            <Text style={[styles.textNormal, { fontSize: 18 }]}>{fetchedData ? "Edit" : "Add"} health details</Text>
                        </Pressable>
                    </View>}
                    <View style={{ marginVertical: 16 }}>
                        <Pressable onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            handleSignLout();
                        }}
                            style={({ pressed }) => [styles.logoutButton, {
                                backgroundColor: pressed
                                    ? 'rgba(255,255,255,0.22)'
                                    : 'rgba(96, 96, 96, 0.39)',
                            }]}
                            android_ripple={{ color: 'rgba(255, 255, 255, 0.06)' }}
                            disabled={signingOut}
                        >
                            <MaterialCommunityIcons name="logout" size={24} color="#ae5252" style={{ marginRight: 10 }} />
                            <Text style={styles.logoutButtonText} >{signingOut ? "Logging out..." : "Logout"}</Text>
                            {signingOut && <ActivityIndicator size={24} />}
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
        top: 15,
        padding: 10,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.1)'
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#ae5252',
        marginBottom: 5,
        textAlign: 'center',
        letterSpacing: 1
    },
    subtitle: {
        fontSize: 14,
        color: '#B0BEC5',
        fontStyle: 'italic'
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FFFFFF',
        marginBottom: 15
    },
    profileBox: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 15
    },
    textNormal: {
        color: '#ffff',
        fontSize: 20
    },
    healthDetailsItem: {
        display: 'flex',
        flexDirection: 'row',
        gap: 10,
        alignItems: 'center',
        backgroundColor: 'rgba(204, 204, 204, 0.15)',
        borderRadius: 16,
        paddingVertical: 5,
        paddingHorizontal: 10,
        marginVertical: 5
    },
    healthDetailsIconBack: {
        backgroundColor: '#1A237E',
        borderRadius: 15,
        padding: 8,
        marginRight: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    editHealthButton: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        width: '100%',
        backgroundColor: 'rgb(25, 152, 225)',
        padding: 12,
        borderRadius: 20
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 24,
    },
    logoutButtonText: {
        color: '#ae5252',
        fontSize: 19,
        fontWeight: 'bold',
        letterSpacing: 1.2,
    }
});