import axiosInsatance from '@/configs/axios-config';
import { useUser } from '@clerk/clerk-expo';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import axios from 'axios';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Dimensions, Easing, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');
const nodeCount = 8;

export default function ProfilePage() {
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
            const radius = Math.min(width, height) * 0.25;
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * radius;

            return {
                x: centerX + Math.cos(angle) * distance,
                y: centerY + Math.sin(angle) * distance,
                size: Math.random() * 70 + 40,
                delay: Math.random() * 2000,
                duration: Math.random() * 3000 + 3000,
                color: `rgba(${Math.floor(Math.random() * 100 + 155)}, ${Math.floor(Math.random() * 150 + 100)}, ${Math.floor(Math.random() * 100 + 155)}, 0.6)`
            };
        });
        setNodePositions(initialNodePositions);

        nodeAnimations.forEach((anim, index) => {
            const { x, y, delay, duration } = initialNodePositions[index];
            const destX = x + (Math.random() - 0.5) * width * 0.15;
            const destY = y + (Math.random() - 0.5) * height * 0.15;

            anim.position.setValue({ x, y });

            Animated.sequence([
                Animated.delay(delay),
                Animated.parallel([
                    Animated.timing(anim.opacity, {
                        toValue: 0.3,
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
                <View style={{ marginVertical: 10 }}>
                    <Pressable onPress={() => router.push('/(tabs)/edithealth')} style={styles.editHealthButton} android_ripple={{ color: '#1A237E' }}>
                        <MaterialCommunityIcons name='pen-plus' size={22} color={'rgb(200, 18, 18)'} />
                        <Text style={[styles.textNormal, { fontSize: 18 }]}>{fetchedData ? "Edit" : "Add"} health details</Text>
                    </Pressable>
                </View>
            </ScrollView>
        </SafeAreaView>

    )
};


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
    }
});