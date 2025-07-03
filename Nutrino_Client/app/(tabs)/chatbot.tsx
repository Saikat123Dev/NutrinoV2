import { useUser } from '@clerk/clerk-expo';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Easing,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');
const PARTICLE_COUNT = 25

type Message = {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  sources?: any[];
  followUp?: string;
  explanation?: string;
};

export default function ChatbotScreen() {
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


  const { user } = useUser();
  const email = user?.emailAddresses?.[0]?.emailAddress;
  console.log('User email:', user?.id);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I\'m Nutrino, your health AI assistant. How can I help you today?',
      sender: 'bot',
      timestamp: new Date(),
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(50)).current;
  const typingDot1 = useRef(new Animated.Value(0)).current;
  const typingDot2 = useRef(new Animated.Value(0)).current;
  const typingDot3 = useRef(new Animated.Value(0)).current;
  const scrollButtonAnim = useRef(new Animated.Value(0)).current;
  const [lastScrollPosition, setLastScrollPosition] = useState(0);
  const [isScrollingUp, setIsScrollingUp] = useState(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true
      })
    ]).start();
  }, []);

  useEffect(() => {
    if (messages.length > 1) {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages]);

  useEffect(() => {
    if (isLoading) {
      startTypingAnimation();
    } else {
      typingDot1.setValue(0);
      typingDot2.setValue(0);
      typingDot3.setValue(0);
    }
  }, [isLoading]);

  const startTypingAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(typingDot1, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(typingDot2, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(typingDot3, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(typingDot1, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(typingDot2, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(typingDot3, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const handleSendMessage = async () => {
    console.log('Send button pressed');
    if (inputText.trim() === '' || !email) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Add user message
    const newUserMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, newUserMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await fetch('https://nutrinov2.onrender.com/api/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          message: inputText
        })
      });
      if (!response.ok) {
        console.log('Network response was not ok:', response);
        throw new Error('Network response was not ok');
      }
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response from server');
      }

      const botMessage: Message = {
        id: Date.now().toString(),
        text: data.answer,
        sender: 'bot',
        timestamp: new Date(),
        sources: data.sources,
        followUp: data.followUp,
        explanation: data.explanation
      };

      setMessages(prev => [...prev, botMessage]);

      // If there's a follow-up question, add it after a delay
      if (data.followUp) {
        setTimeout(() => {
          const followUpMessage: Message = {
            id: Date.now().toString(),
            text: data.followUp,
            sender: 'bot',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, followUpMessage]);
        }, 1500);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');

      // Add error message to chat
      const errorMessage: Message = {
        id: Date.now().toString(),
        text: 'Sorry, I encountered an error. Please try again.',
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.y;
    const scrollingUp = scrollPosition < lastScrollPosition;
    setLastScrollPosition(scrollPosition);
    setIsScrollingUp(scrollingUp);

    const shouldShowScrollButton = scrollPosition > 300;

    if (shouldShowScrollButton) {
      Animated.spring(scrollButtonAnim, {
        toValue: 1,
        friction: 8,
        tension: 60,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(scrollButtonAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  };

  const scrollToTop = () => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: 0, animated: true });
    }
  };

  const scrollToBottom = () => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  };

  const showSources = (sources: any[]) => {
    if (!sources || sources.length === 0) return null;

    return (
      <View style={styles.sourcesContainer}>
        <Text style={styles.sourcesTitle}>Sources:</Text>
        {sources.map((source, index) => (
          <TouchableOpacity
            key={index}
            style={styles.sourceItem}
            onPress={() => Linking.openURL(source.url)}
          >
            <Text style={styles.sourceText} numberOfLines={1}>
              {source.title || 'Untitled source'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const showExplanation = (explanation: string) => {
    if (!explanation) return null;

    return (
      <View style={styles.explanationContainer}>
        <Text style={styles.explanationTitle}>More Details:</Text>
        <Text style={styles.explanationText}>{explanation}</Text>
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

        <View style={styles.header}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.back();
            }}
            style={styles.backButton}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="#57cbff" />
          </Pressable>
          <Text style={styles.headerTitle}>Nutrino Chat</Text>
          <MaterialCommunityIcons name="robot-outline" size={24} color="#00E676" />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
          keyboardVerticalOffset={80}
        >
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={true}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          >
            {messages.map((message, index) => (
              <Animated.View
                key={message.id}
                style={[
                  styles.messageContainer,
                  message.sender === 'user' ? styles.userContainer : styles.botContainer,
                  {
                    opacity: fadeAnim,
                    transform: [
                      {
                        translateY: fadeAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [20, 0],
                        })
                      }
                    ]
                  }
                ]}
              >
                {message.sender === 'bot' && index === 0 ? (
                  <View style={styles.welcomeCard}>
                    <LinearGradient
                      colors={['#0a402e', '#072622']}
                      style={styles.welcomeGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <View style={styles.welcomeHeader}>
                        <View style={styles.welcomeAvatarContainer}>
                          <View style={styles.welcomeAvatarInner}>
                            <MaterialCommunityIcons
                              name="robot-happy"
                              size={36}
                              color="#23cc96"
                            />
                          </View>
                        </View>
                        <View style={styles.welcomeTitleContainer}>
                          <Text style={styles.welcomeTitle}>Welcome to Nutrino</Text>
                          <View style={styles.welcomeSubtitleContainer}>
                            <View style={styles.onlineDot} />
                            <Text style={styles.welcomeSubtitle}>AI Health Assistant</Text>
                          </View>
                        </View>
                      </View>

                      <Text style={styles.welcomeText}>
                        {message.text}
                      </Text>

                      <View style={styles.welcomeDivider} />

                      <View style={styles.welcomeTips}>
                        <View style={styles.tipItem}>
                          <View style={styles.tipIconContainer}>
                            <MaterialCommunityIcons name="food-apple-outline" size={18} color="#FFD700" />
                          </View>
                          <Text style={styles.tipText}>Personalized nutrition advice</Text>
                        </View>
                        <View style={styles.tipItem}>
                          <View style={styles.tipIconContainer}>
                            <MaterialCommunityIcons name="lightbulb-on-outline" size={18} color="#76FF03" />
                          </View>
                          <Text style={styles.tipText}>Dietary recommendations based on your needs</Text>
                        </View>
                        <View style={styles.tipItem}>
                          <View style={styles.tipIconContainer}>
                            <MaterialCommunityIcons name="chart-line-variant" size={18} color="#FF9800" />
                          </View>
                          <Text style={styles.tipText}>Health tracking and progress monitoring</Text>
                        </View>
                      </View>
                    </LinearGradient>
                  </View>
                ) : (
                  <View style={[
                    styles.messageBubble,
                    message.sender === 'user' ? styles.userBubble : styles.botBubble,
                  ]}>
                    <LinearGradient
                      colors={message.sender === 'user'
                        ? ['#173E19', '#0D2F10']
                        : ['#062350', '#0C3B69']}
                      style={styles.messageGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Text style={styles.messageText}>{message.text}</Text>
                      {message.sender === 'bot' && showExplanation(message.explanation)}
                      {message.sender === 'bot' && showSources(message.sources)}
                      <View style={styles.messageFooter}>
                        <Text style={styles.messageTime}>
                          {formatTime(message.timestamp)}
                        </Text>
                        {message.sender === 'bot' && (
                          <TouchableOpacity style={styles.actionButton}>
                            <Ionicons name="volume-high" size={16} color="#23cc96" />
                          </TouchableOpacity>
                        )}
                      </View>
                    </LinearGradient>
                  </View>
                )}
              </Animated.View>
            ))}

            {isLoading && (
              <View style={styles.loadingContainer}>
                <BlurView intensity={80} style={styles.loadingBlur} tint="dark">
                  <View style={styles.typingIndicator}>
                    <Animated.View
                      style={[
                        styles.typingDot,
                        { opacity: typingDot1 }
                      ]}
                    />
                    <Animated.View
                      style={[
                        styles.typingDot,
                        { opacity: typingDot2 }
                      ]}
                    />
                    <Animated.View
                      style={[
                        styles.typingDot,
                        { opacity: typingDot3 }
                      ]}
                    />
                  </View>
                </BlurView>
              </View>
            )}
          </ScrollView>

          <Animated.View
            style={[
              styles.scrollButton,
              {
                opacity: scrollButtonAnim,
                transform: [
                  {
                    scale: scrollButtonAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.5, 1]
                    })
                  }
                ]
              }
            ]}
          >
            <TouchableOpacity
              onPress={isScrollingUp ? scrollToTop : scrollToBottom}
              style={styles.scrollButtonInner}
              activeOpacity={0.8}
            >
              <BlurView intensity={90} style={styles.scrollButtonBlur} tint="dark">
                <LinearGradient
                  colors={isScrollingUp ? ['#3b82f6', '#1d4ed8'] : ['#1c855c', '#16a34a']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.scrollButtonGradient}
                />
                <MaterialCommunityIcons
                  name={isScrollingUp ? "arrow-up" : "arrow-down"}
                  size={28}
                  color="#FFF"
                  style={styles.scrollButtonIcon}
                />
              </BlurView>
            </TouchableOpacity>
          </Animated.View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Ask me about nutrition, health..."
              placeholderTextColor="rgba(255,255,255,0.5)"
              multiline
            />
            <TouchableOpacity
              onPress={handleSendMessage}
              style={[
                styles.sendButton,
                {
                  backgroundColor: inputText.trim() ? '#00E676' : '#2D3748'
                }
              ]}
              disabled={!inputText.trim()}
            >
              <MaterialCommunityIcons
                name={inputText.trim() ? "send" : "microphone"}
                size={24}
                color="white"
              />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 8,
    backgroundColor: '#03302c',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(30, 41, 59, 0.2)',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  messagesContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  messageContainer: {
    marginBottom: 8,
    maxWidth: '85%',
  },
  userContainer: {
    alignSelf: 'flex-end',
  },
  botContainer: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
  },
  botBubble: {
    borderColor: '#1f2a30',
  },
  userBubble: {
    borderColor: '#1f2a30',
  },
  messageGradient: {
    padding: 14,
  },
  messageText: {
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 22,
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  messageTime: {
    fontSize: 12,
    color: '#B0BEC5',
    opacity: 0.7,
  },
  actionButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(3, 48, 44, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(35, 204, 150, 0.3)',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    paddingBottom: 24,
    backgroundColor: '#031A18',
    borderTopWidth: 1,
    borderTopColor: 'rgba(30, 41, 59, 0.4)',
  },
  input: {
    flex: 1,
    minHeight: 48,
    maxHeight: 120,
    backgroundColor: '#2a3942',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 16,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#1f2a30',
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  scrollButton: {
    position: 'absolute',
    right: 16,
    bottom: 120,
    width: 36,
    height: 36,
    zIndex: 10,
    borderRadius: 18,
    backgroundColor: 'rgba(3, 48, 44, 0.7)',
    borderWidth: 0.7,
    borderColor: 'rgba(35, 204, 150, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  scrollButtonInner: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(35, 204, 150, 0.3)',
  },
  scrollButtonBlur: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  scrollButtonGradient: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 20,
    opacity: 0.6,
  },
  scrollButtonIcon: {
    position: 'relative',
    zIndex: 1,
  },
  loadingContainer: {
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  loadingBlur: {
    borderRadius: 18,
    overflow: 'hidden',
    padding: 14,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#23cc96',
    marginHorizontal: 2,
  },
  welcomeCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#202225',
  },
  welcomeGradient: {
    padding: 18,
    borderRadius: 16,
    backgroundColor: '#23cc96',
  },
  welcomeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  welcomeAvatarContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#4752C4',
  },
  welcomeAvatarInner: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  welcomeTitleContainer: {
    flex: 1,
  },
  welcomeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  welcomeSubtitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#23cc96',
    marginRight: 6,
  },
  welcomeSubtitle: {
    fontSize: 12,
    color: '#B9BBBE',
  },
  welcomeText: {
    fontSize: 16,
    color: '#DCDDDE',
    lineHeight: 24,
    marginBottom: 16,
  },
  welcomeDivider: {
    height: 1,
    backgroundColor: '#40444B',
    marginVertical: 16,
  },
  welcomeTips: {
    marginTop: 8,
    gap: 14,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tipIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(88, 101, 242, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(88, 101, 242, 0.3)',
  },
  tipText: {
    fontSize: 14,
    color: '#DCDDDE',
    flex: 1,
    lineHeight: 20,
  },
  sourcesContainer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  sourcesTitle: {
    fontSize: 12,
    color: '#B0BEC5',
    marginBottom: 5,
    fontWeight: 'bold',
  },
  sourceItem: {
    paddingVertical: 5,
  },
  sourceText: {
    fontSize: 12,
    color: '#64B5F6',
    textDecorationLine: 'underline',
  },
  explanationContainer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  explanationTitle: {
    fontSize: 12,
    color: '#B0BEC5',
    marginBottom: 5,
    fontWeight: 'bold',
  },
  explanationText: {
    fontSize: 14,
    color: '#EEEEEE',
    lineHeight: 20,
  },
});