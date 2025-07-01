import axiosInsatance from '@/configs/axios-config';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import axios from 'axios';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Dimensions, Easing, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');
const nodeCount = 10;

export default function WorkoutScreen() {
    const [nodePositions, setNodePositions] = useState<Array<Record<string, any>>>([]);
    const nodeAnimations = useRef(Array(nodeCount).fill(undefined).map(() => ({
        opacity: new Animated.Value(0),
        scale: new Animated.Value(0.5),
        position: new Animated.ValueXY()
    }))).current;

    useEffect(() => {
        const initialNodePositions = Array(nodeCount).fill(undefined).map(() => {
            const centerX = width / 2;
            const centerY = height / 2;
            const radius = Math.min(width, height) * 0.3;
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * radius;

            return {
                x: centerX + Math.cos(angle) * distance,
                y: centerY + Math.sin(angle) * distance,
                size: Math.random() * 80 + 50,
                delay: Math.random() * 2500,
                duration: Math.random() * 2500 + 2500,
                color: `rgba(${Math.floor(Math.random() * 100 + 155)}, ${Math.floor(Math.random() * 100 + 155)}, 255, 0.65)`
            };
        });
        setNodePositions(initialNodePositions);

        nodeAnimations.forEach((anim, index) => {
            const { x, y, delay, duration } = initialNodePositions[index];
            const destX = x + (Math.random() - 0.5) * width * 0.2;
            const destY = y + (Math.random() - 0.5) * height * 0.2;

            anim.position.setValue({ x, y });

            Animated.sequence([
                Animated.delay(delay),
                Animated.parallel([
                    Animated.timing(anim.opacity, {
                        toValue: 0.4,
                        duration: duration * 0.3,
                        easing: Easing.out(Easing.cubic),
                        useNativeDriver: true,
                    }),
                    Animated.timing(anim.scale, {
                        toValue: 1,
                        duration: duration * 0.4,
                        easing: Easing.out(Easing.elastic(1)),
                        useNativeDriver: true,
                    })
                ]),
                Animated.loop(Animated.sequence([
                    Animated.timing(anim.position, {
                        toValue: { x: destX, y: destY },
                        duration,
                        easing: Easing.inOut(Easing.quad),
                        useNativeDriver: true,
                    }),
                    Animated.timing(anim.position, {
                        toValue: { x, y },
                        duration,
                        easing: Easing.inOut(Easing.quad),
                        useNativeDriver: true,
                    })
                ]))
            ]).start();
        });

        return () => nodeAnimations.forEach(anim => {
            anim.opacity.stopAnimation();
            anim.scale.stopAnimation();
            anim.position.stopAnimation();
        });
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
        <SafeAreaView style={styles.container}>
            <View style={styles.backgroundContainer}>
                <LinearGradient
                    colors={['#0D1421', '#1A237E', '#000051']}
                    style={styles.backgroundGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                />
                {nodePositions.map((node, index) => (
                    <Animated.View
                        key={`node-${index}`}
                        style={{
                            position: 'absolute',
                            width: node.size,
                            height: node.size,
                            borderRadius: node.size / 2,
                            backgroundColor: node.color,
                            transform: [
                                { translateX: Animated.subtract(nodeAnimations[index].position.x, node.size / 2) },
                                { translateY: Animated.subtract(nodeAnimations[index].position.y, node.size / 2) },
                                { scale: nodeAnimations[index].scale }
                            ],
                            opacity: nodeAnimations[index].opacity,
                        }}
                    />
                ))}
            </View>

            <ScrollView contentContainerStyle={styles.scrollViewContent}>
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
        backgroundColor: '#0D1421'
    },
    backgroundContainer: {
        position: 'absolute',
        width: 400,
        height: 785,
    },
    backgroundGradient: {
        flex: 1
    },
    scrollViewContent: {
        padding: 20,
        paddingBottom: 40
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