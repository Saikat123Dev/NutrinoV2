import axiosInsatance from '@/configs/axios-config';
import { useUser } from '@clerk/clerk-expo';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import axios from 'axios';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Dimensions, Easing, KeyboardAvoidingView, Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');
const PARTICLE_COUNT = 25;
const nodeCount = 8;

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
        router.push('/(tabs)/profile');
    };

    const isFocused = useIsFocused();

    // get user
    const { user } = useUser();
    const clerkId = user?.id;


    // handle inputs
    const healthFields = [
        { key: 'age', label: 'Age', placeholder: 'Enter your age', type: 'text' },
        {
            key: 'gender',
            label: 'Gender',
            placeholder: 'Select your gender',
            type: 'dropdown',
            options: [
                { label: 'Male', key: 'MALE' },
                { label: 'Female', key: 'FEMALE' },
                { label: 'Other', key: 'OTHER' }
            ]
        },
        { key: 'height', label: 'Height', placeholder: 'Enter your height (cm)', type: 'text' },
        { key: 'weight', label: 'Weight', placeholder: 'Enter your weight (kg)', type: 'text' },
        {
            key: 'activityLevel',
            label: 'Activity Level',
            placeholder: 'Select your activity level',
            type: 'dropdown',
            options: [
                { label: 'Sedentary', key: 'SEDENTARY' },
                { label: 'Lightly Active', key: 'LIGHTLY_ACTIVE' },
                { label: 'Moderately Active', key: 'MODERATELY_ACTIVE' },
                { label: 'Very Active', key: 'VERY_ACTIVE' },
                { label: 'Extreamly Active', key: 'EXTREMELY_ACTIVE' }
            ]
        },
        { key: 'medicalConditions', label: 'Medical Conditions', placeholder: 'List any medical conditions', type: 'list' },
        { key: 'allergies', label: 'Allergies', placeholder: 'List any allergies', type: 'list' },
        { key: 'digestiveIssues', label: 'Digestive Issues', placeholder: 'Any digestive issues?', type: 'list' },
        { key: 'pregnancyStatus', label: 'Pregnancy Status', placeholder: 'Are you pregnant?', type: 'select' },
        { key: 'breastfeeding', label: 'Breastfeeding', placeholder: 'Are you breastfeeding?', type: 'select' },
        { key: 'recentSurgery', label: 'Recent Surgery', placeholder: 'Any recent surgery?', type: 'select' },
        { key: 'chronicPain', label: 'Chronic Pain', placeholder: 'Do you have chronic pain?', type: 'select' },
    ];

    type HealthInputValue = string | boolean | string[];

    const [healthInputs, setHealthInputs] = useState<Record<string, HealthInputValue>>(
        healthFields.reduce((acc, field) => {
            let value: any = '';
            if (field.type === 'list') value = [];
            else if (field.type === 'select') value = false;
            return ({
                ...acc,
                [field.key]: value,
            })
        }, {})
    );

    const handleInputChange = (key: string, value: HealthInputValue) => {
        setHealthInputs(prev => ({
            ...prev,
            [key]: value,
        }));
    };

    // fill fields with available values
    const [loading, setLoading] = useState(false);
    const [fetchedData, setFetchedData] = useState<Record<string, any> | null>(null);
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

    // fill data
    useEffect(() => {
        if (!fetchedData) return;
        setHealthInputs(
            healthFields.reduce((acc, field) => {
                let value = fetchedData[field.key] || healthInputs[field.key];
                if (typeof value === 'number') value = String(value);
                return {
                    ...acc,
                    [field.key]: value
                }
            }, {})
        )
    }, [fetchedData]);

    // handle health input save
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const handleSave = async () => {
        if (!clerkId) return;
        try {
            setIsSaving(true);
            await axiosInsatance.post('/v1/healthstatus/healthprofile', { clerkId, ...healthInputs })
        } catch (error) {
            if (axios.isAxiosError?.(error)) {
                console.error("Report error: ", error.response);
            }
        }
        setIsSaving(false);
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
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        bounces={true}
                    >
                        <View style={styles.headerContainer}>
                            <Pressable style={styles.backButton} onPress={handleBackPress}>
                                <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
                            </Pressable>
                            <Text style={styles.title}>Edit health details</Text>
                        </View>
                        <View>
                            {healthFields.map(field => (
                                <View key={field.key} style={{ marginBottom: 18 }}>
                                    <Text style={{ color: '#fff', fontWeight: '600', marginBottom: 6, fontSize: 16 }}>
                                        {field.label}
                                    </Text>
                                    {field.type === 'select' ? (
                                        <View style={styles.selectionInput}>
                                            {[{ label: 'Yes', key: true }, { label: 'No', key: false }].map(option => (
                                                <Pressable
                                                    key={option.label}
                                                    style={{
                                                        flex: 1,
                                                        paddingVertical: 10,
                                                        backgroundColor: healthInputs[field.key] === option.key ? 'rgba(25,152,225,0.7)' : 'transparent',
                                                        alignItems: 'center',
                                                    }}
                                                    android_ripple={{ color: '#1A237E' }}
                                                    onPress={() => handleInputChange(field.key, option.key as boolean)}
                                                >
                                                    <Text style={{ color: healthInputs[field.key] === option.key ? '#fff' : '#B0BEC5', fontWeight: 'bold' }}>{option.label}</Text>
                                                </Pressable>
                                            ))}
                                        </View>
                                    ) : field.type === 'dropdown' ? (
                                        <View style={styles.textInputBox}>
                                            <Text style={{ color: '#B0BEC5', fontSize: 16, marginBottom: 4 }}>
                                                {healthInputs[field.key]
                                                    ? field.options?.find(opt => opt.key === healthInputs[field.key])?.label
                                                    : field.placeholder}
                                            </Text>
                                            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                                                {field.options?.map(option => (
                                                    <Pressable
                                                        key={option.key}
                                                        style={{
                                                            paddingVertical: 6,
                                                            paddingHorizontal: 12,
                                                            marginRight: 8,
                                                            marginBottom: 6,
                                                            borderRadius: 8,
                                                            backgroundColor: healthInputs[field.key] === option.key ? 'rgba(25,152,225,0.7)' : 'rgba(255,255,255,0.08)',
                                                            borderWidth: healthInputs[field.key] === option.key ? 1 : 0,
                                                            borderColor: '#1998E1'
                                                        }}
                                                        android_ripple={{ color: '#1A237E' }}
                                                        onPress={() => handleInputChange(field.key, option.key)}
                                                    >
                                                        <Text style={{
                                                            color: healthInputs[field.key] === option.key ? '#fff' : '#B0BEC5',
                                                            fontWeight: 'bold'
                                                        }}>{option.label}</Text>
                                                    </Pressable>
                                                ))}
                                            </View>
                                        </View>
                                    ) : field.type === 'list' ? (
                                        <ListInput
                                            value={healthInputs[field.key] as string[]}
                                            onChange={list => handleInputChange(field.key, list)}
                                            placeholder={field.placeholder}
                                        />
                                    ) : (
                                        <View style={styles.textInputBox}>
                                            <TextInput
                                                placeholder={field.placeholder}
                                                placeholderTextColor="#B0BEC5"
                                                style={styles.textInput}
                                                value={healthInputs[field.key] as string}
                                                onChangeText={text => handleInputChange(field.key, text)}
                                                selectionColor="#1998E1"
                                            />
                                        </View>
                                    )}
                                </View>
                            ))}
                        </View>
                        <View style={{ marginVertical: 10 }}>
                            <Pressable style={styles.editHealthButton} android_ripple={{ color: '#1A237E' }} onPress={handleSave}>
                                {!isSaving ?
                                    <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>Save changes</Text>
                                    : <ActivityIndicator size={20}
                                    />}
                            </Pressable>
                        </View>
                    </ScrollView>
                    {loading &&
                        <View style={styles.loadingBack}>
                            <View style={styles.loadingBox}>
                                <ActivityIndicator size={20} />
                                <Text>Loading Meals...</Text>
                            </View>
                        </View>}
                </KeyboardAvoidingView>
            </SafeAreaView>
        </>

    )
};

type ListInputProps = {
    value: string[];
    onChange: (list: string[]) => void;
    placeholder?: string;
};

function ListInput({ value, onChange, placeholder }: ListInputProps) {
    const [input, setInput] = useState('');

    const handleAdd = () => {
        const trimmed = input.trim();
        if (trimmed && !value.includes(trimmed)) {
            onChange([...value, trimmed]);
            setInput('');
        }
    };

    const handleRemove = (item: string) => {
        onChange(value.filter(v => v !== item));
    };

    return (
        <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 5 }}>
                <View style={[styles.textInputBox, { flex: 1 }]}>
                    <TextInput
                        style={[styles.textInput]}
                        placeholder={placeholder}
                        placeholderTextColor="#B0BEC5"
                        value={input}
                        onChangeText={setInput}
                        onSubmitEditing={handleAdd}
                        returnKeyType="done"
                    />
                </View>
                <Pressable
                    onPress={handleAdd}
                    style={{
                        backgroundColor: '#1998E1',
                        paddingHorizontal: 14,
                        paddingVertical: 13,
                        borderRadius: 10
                    }}
                    android_ripple={{ color: '#1A237E' }}
                >
                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Add</Text>
                </Pressable>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {value.map((item, idx) => (
                    <View key={item + idx} style={styles.listBox}>
                        <Text style={{ color: '#fff', fontSize: 15, marginRight: 6 }}>{item}</Text>
                        <Pressable onPress={() => handleRemove(item)}>
                            <MaterialCommunityIcons name="close-circle" size={18} color="#fff" />
                        </Pressable>
                    </View>
                ))}
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
    textInputBox: {
        backgroundColor: 'rgba(207, 207, 207, 0.3)',
        color: '#ffff',
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#1A237E',
        marginBottom: 0,
    },
    textInput: {
        color: '#fff',
        fontSize: 16,
        paddingVertical: 8,
        paddingHorizontal: 6,
        letterSpacing: 0.2
    },
    selectionInput: {
        flexDirection: 'row',
        backgroundColor: 'rgba(207, 207, 207, 0.18)',
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#1A237E'
    },
    listBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(25,152,225,0.7)',
        borderRadius: 16,
        paddingHorizontal: 10,
        paddingVertical: 4,
        marginRight: 8,
        marginBottom: 8
    },
    editHealthButton: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        width: '100%',
        backgroundColor: 'rgb(25, 225, 128)',
        padding: 12,
        borderRadius: 20
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