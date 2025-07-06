import axiosInsatance from '@/configs/axios-config';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import axios from 'axios';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Dimensions, Easing, Image, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');
const PARTICLE_COUNT = 25;

export default function WorkoutScreen() {
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

    const isFocused = useIsFocused();


    const handleBackPress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push('/(tabs)/workout');
    };

    const { type, id } = useLocalSearchParams();

    // get list
    const [exerciseList, setExerciseList] = useState<Record<string, any>[] | null>(null);
    const [loading, setLoading] = useState(false);
    const getExcersises = async () => {
        if (!type || !id) return;
        try {
            setExerciseList(null);
            setLoading(true);
            // fetch exercises based on the type and id
            await axiosInsatance.get(`/exercise/${type}/${id}`)
                .then((res) => {
                    const data = res.data.data
                    setExerciseList(data)
                })
        } catch (error) {
            if (axios.isAxiosError(error))
                console.log(error.response);

        };
        setLoading(false);
    }

    useEffect(() => {
        getExcersises();
    }, [type, id]);

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
                            <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
                        </Pressable>
                        <Text style={styles.title}>Workout</Text>
                        <Text style={styles.subtitle}>Transform your fitness journey</Text>
                    </View>
                    {
                        loading &&
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                            <ActivityIndicator size={20} />
                            <Text style={{ color: '#ffff' }}>Loading exercises...</Text>
                        </View>
                    }
                    {
                        (exerciseList && Array.isArray(exerciseList) && !loading) ? <ExerciseCarousel exercises={exerciseList} />
                            : <Text style={{ textAlign: 'center', color: '#ffff' }}>Something went wrong to fetch exercise!</Text>
                    }
                </ScrollView>
            </SafeAreaView>
        </>
    );
}

// Exercise carousel
function ExerciseCarousel({ exercises, }: { exercises: Record<string, any>[] | null; }) {
    const [index, setIndex] = useState(0);

    if (!exercises || exercises.length === 0) {
        return (
            <View style={{ alignItems: 'center', marginTop: 40 }}>
                <Text style={{ color: '#fff', fontSize: 18 }}>No exercises found.</Text>
            </View>
        );
    }

    const exercise = exercises[index];

    return (
        <View style={styles.corousel}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                <MaterialCommunityIcons name="dumbbell" size={26} color="#BA68C8" style={{ marginRight: 8 }} />
                <Text style={{ color: '#BA68C8', fontSize: 22, fontWeight: 'bold', textAlign: 'center' }}>
                    {exercise.name}
                </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                <MaterialCommunityIcons name="arm-flex" size={18} color="#B0BEC5" style={{ marginRight: 4 }} />
                <Text style={{ color: '#B0BEC5', fontSize: 14, fontStyle: 'italic', textAlign: 'center' }}>
                    {exercise.bodyPart}
                </Text>
                <MaterialCommunityIcons name="dots-horizontal" size={14} color="#B0BEC5" style={{ marginHorizontal: 6 }} />
                <MaterialCommunityIcons name="weight-lifter" size={18} color="#B0BEC5" style={{ marginRight: 4 }} />
                <Text style={{ color: '#B0BEC5', fontSize: 14, fontStyle: 'italic', textAlign: 'center' }}>
                    {exercise.equipment}
                </Text>
                <MaterialCommunityIcons name="dots-horizontal" size={14} color="#B0BEC5" style={{ marginHorizontal: 6 }} />
                <MaterialCommunityIcons name="star-circle" size={18} color="#B0BEC5" style={{ marginRight: 4 }} />
                <Text style={{ color: '#B0BEC5', fontSize: 14, fontStyle: 'italic', textAlign: 'center' }}>
                    {exercise.difficulty}
                </Text>
            </View>
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
                <View style={styles.corouselBody}>
                    <Image
                        source={{ uri: exercise.gifUrl }}
                        style={{ width: 200, height: 200 }}
                        resizeMode="contain"
                        fadeDuration={400}
                    />
                </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <MaterialCommunityIcons name="target" size={18} color="#fff" style={{ marginRight: 6 }} />
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Target:</Text>
            </View>
            <Text style={{ color: '#B0BEC5', marginBottom: 8 }}>
                {exercise.target} {exercise.secondaryMuscles.length > 0 ? `(Secondary: ${exercise.secondaryMuscles.join(', ')})` : ''}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <MaterialCommunityIcons name="file-document-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Description:</Text>
            </View>
            <Text style={{ color: '#B0BEC5', marginBottom: 8 }}>{exercise.description}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <MaterialCommunityIcons name="format-list-numbered" size={18} color="#fff" style={{ marginRight: 6 }} />
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Instructions:</Text>
            </View>
            {exercise.instructions.map((ins: any, i: number) => (
                ins && <Text key={i} style={{ color: '#B0BEC5', marginBottom: 2 }}>{`${i + 1}. ${ins}`}</Text>
            ))}
            <View style={styles.navbuttonBox}>
                <Pressable
                    onPress={() => setIndex(i => Math.max(i - 1, 0))}
                    disabled={index === 0}
                    style={[styles.navButton, {
                        backgroundColor: index === 0 ? '#444857' : '#BA68C8',
                        opacity: index === 0 ? 0.5 : 1,
                    }]}
                    android_ripple={{ color: 'rgba(0, 0, 0, 0.16)' }}
                >
                    <MaterialCommunityIcons name="chevron-left" size={20} color="#fff" style={{ marginRight: 6 }} />
                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Prev</Text>
                </Pressable>
                <Pressable
                    onPress={() => setIndex(i => Math.min(i + 1, exercises.length - 1))}
                    disabled={index === exercises.length - 1}
                    style={[styles.navButton, {
                        backgroundColor: index === exercises.length - 1 ? '#444857' : '#BA68C8',
                        opacity: index === exercises.length - 1 ? 0.5 : 1,
                    }]}
                    android_ripple={{ color: 'rgba(0, 0, 0, 0.16)' }}
                >
                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16, marginRight: 6 }}>Next</Text>
                    <MaterialCommunityIcons name="chevron-right" size={20} color="#fff" />
                </Pressable>
            </View>
        </View>
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
        color: '#BA68C8',
        marginBottom: 5,
        textAlign: 'center',
        letterSpacing: 1
    },
    subtitle: {
        fontSize: 14,
        color: '#B0BEC5',
        fontStyle: 'italic'
    },
    corousel: {
        backgroundColor: 'rgba(13,20,33,0.95)',
        borderRadius: 24,
        padding: 20,
        marginTop: 20,
        marginBottom: 80,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 4,
    },
    corouselBody: {
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: '#BA68C8',
        backgroundColor: '#222B45',
        width: 220,
        height: 220,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#BA68C8',
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    navbuttonBox: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: -60,
        paddingHorizontal: 30,
    },
    navButton: {
        paddingVertical: 12,
        paddingHorizontal: 28,
        borderRadius: 30,
        flexDirection: 'row',
        alignItems: 'center',
    }
});