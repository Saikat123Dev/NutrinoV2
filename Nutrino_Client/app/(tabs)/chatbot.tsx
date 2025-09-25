import PremiumGuard from '@/components/PremiumGuard';
import { useUser } from '@clerk/clerk-expo';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as Speech from 'expo-speech';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Easing,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  RefreshControl,
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
const PARTICLE_COUNT = 25;

type Message = {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  sources?: string[];
  followUp?: string;
  explanation?: string;
  feedback?: string;
  safety?: string;
  isFollowUp?: boolean;
};

type Conversation = {
  id: number;
  userMessage: string;
  aiResponse: {
    answer: string;
    explanation?: string;
    feedback?: string;
    followUp?: string;
    safety?: string;
    sources?: string[];
  };
  createdAt: string;
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

  const { user } = useUser();
  const email = user?.emailAddresses?.[0]?.emailAddress;
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(50)).current;
  const typingDot1 = useRef(new Animated.Value(0)).current;
  const typingDot2 = useRef(new Animated.Value(0)).current;
  const typingDot3 = useRef(new Animated.Value(0)).current;
  const scrollButtonAnim = useRef(new Animated.Value(0)).current;
  const historyPanelAnim = useRef(new Animated.Value(0)).current;
  const [lastScrollPosition, setLastScrollPosition] = useState(0);
  const [isScrollingUp, setIsScrollingUp] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [preparingSpeech, setPreparingSpeech] = useState<string | null>(null);
  const speechButtonPulse = useRef(new Animated.Value(1)).current;
  const inputRef = useRef<TextInput>(null);

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
    if (messages.length > 0) {
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

  useEffect(() => {
    if (email) {
      loadConversationHistory();
      // Add welcome message if no messages exist
      if (messages.length === 0) {
        setMessages([{
          id: '1',
          text: 'Hello! I\'m Nutrino, your health AI assistant. How can I help you today?',
          sender: 'bot',
          timestamp: new Date(),
        }]);
      }
    }
  }, [email]);

  // Keyboard event listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height);
      setIsKeyboardVisible(true);
      // Auto scroll to bottom when keyboard shows
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });

    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
      setIsKeyboardVisible(false);
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Cleanup speech when component unmounts
  useEffect(() => {
    return () => {
      if (isSpeaking) {
        Speech.stop();
      }
    };
  }, []);

  const loadConversationHistory = async () => {
    if (!email) return;
    
    try {
      setIsRefreshing(true);
      const response = await fetch(`https://nutrinov2.onrender.com/api/conversations/${encodeURIComponent(email)}`);
      const data = await response.json();
      
      if (response.ok && data.success) {
        setConversations(data.conversations);
      } else {
        throw new Error(data.error || 'Failed to load history');
      }
    } catch (error) {
      console.error('Error loading conversation history:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const loadConversation = (conversation: Conversation) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const newMessages: Message[] = [
      {
        id: conversation.id.toString(),
        text: conversation.userMessage,
        sender: 'user',
        timestamp: new Date(conversation.createdAt),
      },
      {
        id: `${conversation.id}-response`,
        text: conversation.aiResponse.answer,
        sender: 'bot',
        timestamp: new Date(conversation.createdAt),
        sources: conversation.aiResponse.sources,
        explanation: conversation.aiResponse.explanation,
        feedback: conversation.aiResponse.feedback,
        safety: conversation.aiResponse.safety
      }
    ];
    
    if (conversation.aiResponse.followUp) {
      newMessages.push({
        id: `${conversation.id}-followup`,
        text: conversation.aiResponse.followUp,
        sender: 'bot',
        timestamp: new Date(conversation.createdAt),
        isFollowUp: true
      });
    }
    
    setMessages(newMessages);
    setShowHistory(false);
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  const toggleHistory = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (showHistory) {
      Animated.timing(historyPanelAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setShowHistory(false));
    } else {
      setShowHistory(true);
      Animated.timing(historyPanelAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

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
    if (inputText.trim() === '' || !email) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Dismiss keyboard
    Keyboard.dismiss();

    const newUserMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, newUserMessage]);
    const currentInput = inputText;
    setInputText('');
    setIsLoading(true);

    // Scroll to bottom after adding message
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const response = await fetch('https://nutrinov2.onrender.com/api/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          message: currentInput
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Network response was not ok');
      }

      const botMessage: Message = {
        id: Date.now().toString(),
        text: data.answer,
        sender: 'bot',
        timestamp: new Date(),
        sources: data.sources,
        explanation: data.explanation,
        feedback: data.feedback,
        safety: data.safety
      };

      setMessages(prev => [...prev, botMessage]);

      if (data.followUp) {
        setTimeout(() => {
          const followUpMessage: Message = {
            id: (Date.now() + 1).toString(),
            text: data.followUp,
            sender: 'bot',
            timestamp: new Date(),
            isFollowUp: true
          };
          setMessages(prev => [...prev, followUpMessage]);
        }, 1500);
      }

      // Refresh conversation history after new message
      loadConversationHistory();
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
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

  const handleTextToSpeech = async (messageId: string, text: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // If already speaking this message, stop it
      if (speakingMessageId === messageId && isSpeaking) {
        Speech.stop();
        setSpeakingMessageId(null);
        setIsSpeaking(false);
        speechButtonPulse.setValue(1);
        return;
      }

      // If speaking another message, stop it first
      if (isSpeaking) {
        Speech.stop();
        speechButtonPulse.setValue(1);
      }

      // Show preparing state
      setPreparingSpeech(messageId);

      // Clean text for better speech (remove special characters, URLs, etc.)
      const cleanText = text
        .replace(/https?:\/\/[^\s]+/g, '') // Remove URLs
        .replace(/[*_~`]/g, '') // Remove markdown formatting
        .replace(/\n+/g, ' ') // Replace line breaks with spaces
        .trim();

      setSpeakingMessageId(messageId);
      setIsSpeaking(true);
      setPreparingSpeech(null);

      // Start pulsing animation
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(speechButtonPulse, {
            toValue: 1.2,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(speechButtonPulse, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();

      await Speech.speak(cleanText, {
        language: 'en-US',
        pitch: 1.0,
        rate: 0.9,
        onDone: () => {
          setSpeakingMessageId(null);
          setIsSpeaking(false);
          speechButtonPulse.setValue(1);
        },
        onStopped: () => {
          setSpeakingMessageId(null);
          setIsSpeaking(false);
          speechButtonPulse.setValue(1);
        },
        onError: (error) => {
          console.error('Speech error:', error);
          setSpeakingMessageId(null);
          setIsSpeaking(false);
          setPreparingSpeech(null);
          speechButtonPulse.setValue(1);
          Alert.alert('Speech Error', 'Unable to play text-to-speech. Please try again.');
        }
      });
    } catch (error) {
      console.error('Text-to-speech error:', error);
      setSpeakingMessageId(null);
      setIsSpeaking(false);
      setPreparingSpeech(null);
      speechButtonPulse.setValue(1);
      Alert.alert('Error', 'Text-to-speech is not available on this device.');
    }
  };

  const renderSources = (sources: string[]) => {
    if (!sources || sources.length === 0) return null;

    return (
      <View style={styles.sourcesContainer}>
        <View style={styles.sourcesHeader}>
          <MaterialCommunityIcons name="book-open-variant" size={14} color="#64B5F6" />
          <Text style={styles.sourcesTitle}>Sources</Text>
        </View>
        <View style={styles.sourcesGrid}>
          {sources.map((source, index) => (
            <TouchableOpacity
              key={index}
              style={styles.sourceItem}
              onPress={() => {
                const urlMatch = source.match(/https?:\/\/[^\s]+/);
                if (urlMatch) {
                  Linking.openURL(urlMatch[0]);
                } else {
                  Alert.alert('Source Information', source);
                }
              }}
            >
              <View style={styles.sourceIcon}>
                <MaterialCommunityIcons name="link-variant" size={12} color="#64B5F6" />
              </View>
              <Text style={styles.sourceText} numberOfLines={2}>
                {source}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderExplanation = (explanation: string) => {
    if (!explanation) return null;

    return (
      <View style={styles.explanationContainer}>
        <View style={styles.explanationHeader}>
          <MaterialCommunityIcons name="information-outline" size={14} color="#FFB74D" />
          <Text style={styles.explanationTitle}>Additional Details</Text>
        </View>
        <Text style={styles.explanationText}>{explanation}</Text>
      </View>
    );
  };

  const renderFeedback = (feedback: string) => {
    if (!feedback) return null;

    return (
      <View style={styles.feedbackContainer}>
        <View style={styles.feedbackHeader}>
          <MaterialCommunityIcons name="heart" size={14} color="#FF6B6B" />
          <Text style={styles.feedbackTitle}>Personal Note</Text>
        </View>
        <Text style={styles.feedbackText}>{feedback}</Text>
      </View>
    );
  };

  const renderSafety = (safety: string) => {
    if (!safety) return null;

    return (
      <View style={styles.safetyContainer}>
        <View style={styles.safetyHeader}>
          <MaterialCommunityIcons name="shield-check" size={14} color="#4CAF50" />
          <Text style={styles.safetyTitle}>Important Notice</Text>
        </View>
        <Text style={styles.safetyText}>{safety}</Text>
      </View>
    );
  };

  return (
    <>
     <PremiumGuard>
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

        <View style={styles.header}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.back();
            }}
            style={styles.backButton}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
          </Pressable>
          <Text style={styles.headerTitle}>Nutrino AI Chatbot</Text>
          <TouchableOpacity onPress={toggleHistory} style={styles.historyButton}>
            <MaterialCommunityIcons name="history" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* History Panel */}
        {showHistory && (
          <Animated.View 
            style={[
              styles.historyPanel,
              {
                transform: [{
                  translateX: historyPanelAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-width, 0]
                  })
                }],
                opacity: historyPanelAnim
              }
            ]}
          >
            <View style={styles.historyHeader}>
              <Text style={styles.historyTitle}>Your Conversations</Text>
              <TouchableOpacity onPress={toggleHistory} style={styles.closeHistoryButton}>
                <MaterialCommunityIcons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            
            <ScrollView
              contentContainerStyle={styles.historyContent}
              refreshControl={
                <RefreshControl
                  refreshing={isRefreshing}
                  onRefresh={loadConversationHistory}
                  tintColor="#FFFFFF"
                />
              }
            >
              {conversations.length === 0 ? (
                <View style={styles.emptyHistory}>
                  <MaterialCommunityIcons name="robot-confused" size={48} color="rgba(255,255,255,0.3)" />
                  <Text style={styles.emptyHistoryText}>No conversation history yet</Text>
                </View>
              ) : (
                conversations.map((conversation) => (
                  <TouchableOpacity
                    key={conversation.id}
                    style={styles.conversationItem}
                    onPress={() => loadConversation(conversation)}
                  >
                    <View style={styles.conversationIcon}>
                      <MaterialCommunityIcons 
                        name={conversation.userMessage.includes('?') ? "comment-question" : "comment-text"} 
                        size={20} 
                        color="#14d9bb" 
                      />
                    </View>
                    <View style={styles.conversationContent}>
                      <Text style={styles.conversationText} numberOfLines={2}>
                        {conversation.userMessage}
                      </Text>
                      <Text style={styles.conversationDate}>
                        {formatDate(conversation.createdAt)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </Animated.View>
        )}

        <View style={styles.chatContainer}>
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={[
              styles.scrollContent,
              {
                paddingBottom: isKeyboardVisible ? 
                  (Platform.OS === 'ios' ? 140 : keyboardHeight + 140) : 
                  120
              }
            ]}
            showsVerticalScrollIndicator={false}
            bounces={true}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
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
                    <View style={styles.welcomeHeader}>
                      <View style={styles.welcomeAvatar}>
                        <MaterialCommunityIcons name="robot-happy" size={28} color="#00E676" />
                      </View>
                      <View style={styles.welcomeInfo}>
                        <Text style={styles.welcomeTitle}>Nutrino</Text>
                        <Text style={styles.welcomeSubtitle}>AI Health Assistant</Text>
                      </View>
                    </View>
                    
                    <Text style={styles.welcomeMessage}>{message.text}</Text>
                    
                    <View style={styles.capabilitiesGrid}>
                      <View style={styles.capabilityItem}>
                        <MaterialCommunityIcons name="food-apple" size={16} color="#00E676" />
                        <Text style={styles.capabilityText}>Nutrition</Text>
                      </View>
                      <View style={styles.capabilityItem}>
                        <MaterialCommunityIcons name="heart-pulse" size={16} color="#FF6B6B" />
                        <Text style={styles.capabilityText}>Health</Text>
                      </View>
                      <View style={styles.capabilityItem}>
                        <MaterialCommunityIcons name="chart-line" size={16} color="#FFB74D" />
                        <Text style={styles.capabilityText}>Tracking</Text>
                      </View>
                    </View>
                  </View>
                ) : (
                  <View style={[
                    styles.messageBubble,
                    message.sender === 'user' ? styles.userBubble : styles.botBubble,
                    message.isFollowUp ? styles.followUpBubble : null
                  ]}>
                    {message.isFollowUp && (
                      <View style={styles.followUpIndicator}>
                        <MaterialCommunityIcons name="comment-question" size={14} color="#FFB74D" />
                        <Text style={styles.followUpLabel}>Follow-up Question</Text>
                      </View>
                    )}
                    
                    <Text style={styles.messageText}>{message.text}</Text>
                    
                    {message.sender === 'bot' && message.explanation && renderExplanation(message.explanation)}
                    {message.sender === 'bot' && message.feedback && renderFeedback(message.feedback)}
                    {message.sender === 'bot' && message.safety && renderSafety(message.safety)}
                    {message.sender === 'bot' && message.sources && renderSources(message.sources)}
                    
                    <View style={styles.messageFooter}>
                      <Text style={styles.messageTime}>
                        {formatTime(message.timestamp)}
                      </Text>
                      {message.sender === 'bot' && (
                        <Animated.View
                          style={[
                            {
                              transform: [{
                                scale: speakingMessageId === message.id ? speechButtonPulse : 1
                              }]
                            }
                          ]}
                        >
                          <TouchableOpacity 
                            style={[
                              styles.actionButton,
                              {
                                backgroundColor: (speakingMessageId === message.id || preparingSpeech === message.id) ? 
                                  'rgba(20, 217, 187, 0.3)' : 
                                  'rgba(255, 255, 255, 0.1)',
                                borderColor: (speakingMessageId === message.id || preparingSpeech === message.id) ? 
                                  'rgba(20, 217, 187, 0.5)' : 
                                  'rgba(255, 255, 255, 0.2)'
                              }
                            ]}
                            onPress={() => handleTextToSpeech(message.id, message.text)}
                            activeOpacity={0.7}
                          >
                            <MaterialCommunityIcons 
                              name={
                                preparingSpeech === message.id ? "loading" :
                                speakingMessageId === message.id ? "stop" : 
                                "volume-high"
                              } 
                              size={16} 
                              color={
                                (preparingSpeech === message.id || speakingMessageId === message.id) ? 
                                "#14d9bb" : "#FFFFFF"
                              } 
                            />
                          </TouchableOpacity>
                        </Animated.View>
                      )}
                    </View>
                  </View>
                )}
              </Animated.View>
            ))}

            {isLoading && (
              <View style={styles.loadingContainer}>
                <View style={styles.typingIndicator}>
                  <Animated.View style={[styles.typingDot, { opacity: typingDot1 }]} />
                  <Animated.View style={[styles.typingDot, { opacity: typingDot2 }]} />
                  <Animated.View style={[styles.typingDot, { opacity: typingDot3 }]} />
                </View>
              </View>
            )}
          </ScrollView>

          <Animated.View
            style={[
              styles.scrollButton,
              {
                bottom: isKeyboardVisible ? 
                  (Platform.OS === 'ios' ? 180 : keyboardHeight + 180) : 
                  140,
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
              <MaterialCommunityIcons
                name={isScrollingUp ? "arrow-up" : "arrow-down"}
                size={20}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          </Animated.View>
        </View>
        
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={[
            styles.inputAreaContainer,
            {
              bottom: Platform.OS === 'android' ? keyboardHeight : 0,
            }
          ]}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <Animated.View 
            style={[
              styles.inputBlurContainer,
              {
                transform: [{
                  translateY: isKeyboardVisible ? -10 : 0
                }]
              }
            ]}
          >
            <View style={styles.inputContainer}>
              <TextInput
                ref={inputRef}
                style={[
                  styles.input,
                  {
                    borderColor: isKeyboardVisible ? 
                      'rgba(20, 217, 187, 0.5)' : 
                      'rgba(20, 217, 187, 0.3)',
                    shadowOpacity: isKeyboardVisible ? 0.2 : 0.1,
                  }
                ]}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Ask about nutrition, health, fitness..."
                placeholderTextColor="rgba(255,255,255,0.5)"
                multiline
                maxLength={500}
                textAlignVertical="top"
                onFocus={() => {
                  // Ensure the input is visible when focused
                  setTimeout(() => {
                    scrollViewRef.current?.scrollToEnd({ animated: true });
                  }, 300);
                }}
                returnKeyType="send"
                blurOnSubmit={false}
                onSubmitEditing={() => {
                  if (inputText.trim()) {
                    handleSendMessage();
                  }
                }}
                enablesReturnKeyAutomatically={true}
              />
              <TouchableOpacity
                onPress={handleSendMessage}
                style={[
                  styles.sendButton,
                  {
                    backgroundColor: inputText.trim() ? '#11a899' : 'rgba(255,255,255,0.1)',
                    transform: [{ scale: inputText.trim() ? 1 : 0.9 }],
                    opacity: inputText.trim() ? 1 : 0.6
                  }
                ]}
                disabled={!inputText.trim()}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons
                  name={inputText.trim() ? "send" : "microphone"}
                  size={22}
                  color={inputText.trim() ? '#FFFFFF' : 'rgba(17, 168, 153, 1)'}
                />
              </TouchableOpacity>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </SafeAreaView>
      </PremiumGuard>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(10, 14, 26, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(20, 217, 187, 0.2)',
    shadowColor: '#14d9bb',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  historyButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#14d9bb',
    letterSpacing: 0.9,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  onlineDot: {
    width: 5,
    height: 5,
    borderRadius: 10,
    padding: 8,
    backgroundColor: '#14d9bb',
  },
  chatContainer: {
    flex: 1,
  },
  inputAreaContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  inputBlurContainer: {
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 20 : 12,
    backgroundColor: 'rgba(10, 14, 26, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(20, 217, 187, 0.2)',
    shadowColor: '#14d9bb',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: -2 },
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    flexGrow: 1,
  },
  messageContainer: {
    marginBottom: 16,
    maxWidth: '90%',
    paddingHorizontal: 4,
  },
  userContainer: {
    alignSelf: 'flex-end',
  },
  botContainer: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  botBubble: {
    backgroundColor: 'rgba(20, 217, 187, 0.15)',
    borderColor: 'rgba(20, 217, 187, 0.4)',
    borderWidth: 2,
    shadowColor: '#14d9bb',
    shadowOpacity: 0.2,
    borderTopLeftRadius: 8,
  },
  userBubble: {
    backgroundColor: 'rgba(17, 168, 153, 0.15)',
    borderColor: 'rgba(17, 168, 153, 0.4)',
    borderWidth: 2,
    shadowColor: '#11a899',
    shadowOpacity: 0.2,
    borderTopRightRadius: 8,
  },
  followUpBubble: {
    borderColor: 'rgba(255, 183, 77, 0.4)',
    backgroundColor: 'rgba(255, 183, 77, 0.1)',
  },
  followUpIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 183, 77, 0.2)',
  },
  followUpLabel: {
    fontSize: 12,
    color: '#FFB74D',
    marginLeft: 4,
    fontWeight: '600',
  },
  messageText: {
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 24,
    fontWeight: '400',
    letterSpacing: 0.3,
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  messageTime: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: '400',
  },
  actionButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#14d9bb',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
  },
  input: {
    flex: 1,
    minHeight: 50,
    maxHeight: 120,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: 15,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '400',
    borderWidth: 2,
    borderColor: 'rgba(20, 217, 187, 0.3)',
    shadowColor: '#14d9bb',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
  },
  sendButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#11a899',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  scrollButton: {
    position: 'absolute',
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    zIndex: 5,
  },
  scrollButtonInner: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(20, 217, 187, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(20, 217, 187, 0.4)',
    shadowColor: '#14d9bb',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  loadingContainer: {
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(20, 217, 187, 0.1)',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(20, 217, 187, 0.3)',
    borderTopLeftRadius: 8,
    shadowColor: '#14d9bb',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#14d9bb',
    marginHorizontal: 3,
    shadowColor: '#14d9bb',
    shadowOpacity: 0.5,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  welcomeCard: {
    backgroundColor: 'rgba(20, 217, 187, 0.08)',
    borderRadius: 28,
    padding: 20,
    borderWidth: 2,
    borderColor: 'rgba(20, 217, 187, 0.3)',
    shadowColor: '#14d9bb',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  welcomeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  welcomeAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 230, 118, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.2)',
  },
  welcomeInfo: {
    flex: 1,
  },
  welcomeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  welcomeSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '400',
  },
  welcomeMessage: {
    fontSize: 15,
    color: '#FFFFFF',
    lineHeight: 22,
    marginBottom: 20,
  },
  capabilitiesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  capabilityItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  capabilityText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 6,
    fontWeight: '500',
  },
  sourcesContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  sourcesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sourcesTitle: {
    fontSize: 12,
    color: '#64B5F6',
    marginLeft: 4,
    fontWeight: '600',
  },
  sourcesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  sourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(100, 181, 246, 0.1)',
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  sourceIcon: {
    marginRight: 4,
  },
  sourceText: {
    fontSize: 12,
    color: '#64B5F6',
  },
  explanationContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  explanationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  explanationTitle: {
    fontSize: 12,
    color: '#FFB74D',
    marginLeft: 4,
    fontWeight: '600',
  },
  explanationText: {
    fontSize: 14,
    color: '#EEEEEE',
    lineHeight: 20,
  },
  feedbackContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  feedbackTitle: {
    fontSize: 12,
    color: '#FF6B6B',
    marginLeft: 4,
    fontWeight: '600',
  },
  feedbackText: {
    fontSize: 14,
    color: '#EEEEEE',
    lineHeight: 20,
  },
  safetyContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  safetyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  safetyTitle: {
    fontSize: 12,
    color: '#4CAF50',
    marginLeft: 4,
    fontWeight: '600',
  },
  safetyText: {
    fontSize: 14,
    color: '#EEEEEE',
    lineHeight: 20,
  },
  // History panel styles
  historyPanel: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '80%',
    height: '100%',
    backgroundColor: '#0F121C',
    zIndex: 100,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.05)',
    paddingTop: 60,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  closeHistoryButton: {
    padding: 4,
  },
  historyContent: {
    paddingBottom: 100,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  conversationIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(20, 217, 187, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  conversationContent: {
    flex: 1,
  },
  conversationText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  conversationDate: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
  },
  emptyHistory: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyHistoryText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 16,
  },
});