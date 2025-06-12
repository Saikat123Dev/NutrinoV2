// import { useUser } from '@clerk/clerk-expo';
import { FontAwesome5, Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import * as Speech from 'expo-speech';
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Vibration,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScrollContext } from './ScrollContext';

// Add your Gemini API key here
const GEMINI_API_KEY = "AIzaSyDpgRM_SDRjbh-vliR6SnHCVmtzfgevbQs"; // Replace with your actual Gemini API key

export default function ConversationScreen() {
  const { user } = useUser();
  const insets = useSafeAreaInsets();
   console.log(user);
  // Get tabBar scroll handler from context
  const { handleScroll: tabBarScrollHandler, tabBarHeight } = useContext(ScrollContext);
  const focus = user?.unsafeMetadata?.focus;
  const challengeAreas = user?.unsafeMetadata?.challengeAreas;
  const preferredTopics = user?.unsafeMetadata?.preferredTopics;
  const vocabularyLevel = user?.unsafeMetadata?.vocabularyLevel
  // States
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hi${user?.firstName ? ` ${user.firstName}` : ''}! I'm your language learning assistant. Let's practice conversation! What would you like to talk about?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isInitial: true
    }
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [speakingMessageIndex, setSpeakingMessageIndex] = useState(null);
  const scrollViewRef = useRef(null);
  const scrollEndTimer = useRef(null);
  const [suggestions, setSuggestions] = useState([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(50)).current;
  const typingDot1 = useRef(new Animated.Value(0)).current;
  const typingDot2 = useRef(new Animated.Value(0)).current;
  const typingDot3 = useRef(new Animated.Value(0)).current;
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollButtonAnim = useRef(new Animated.Value(0)).current;
  const floatingAssistantAnim = useRef(new Animated.Value(0)).current;
  const [lastScrollPosition, setLastScrollPosition] = useState(0);
  const suggestionsEntrance = useRef(new Animated.Value(0)).current;
  const waveAnimation = useRef(new Animated.Value(0)).current;
  const typingAnimation = useRef(new Animated.Value(0)).current;
  const recordingAnimation = useRef(new Animated.Value(0)).current;
  const windowHeight = Dimensions.get('window').height;
  const recordingRef = useRef(null);
  const [isNearTop, setIsNearTop] = useState(false);
  const [editingMessageIndex, setEditingMessageIndex] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [expandedSections, setExpandedSections] = useState({});
  const [showTranslation, setShowTranslation] = useState({});
  const [translations, setTranslations] = useState({});
  const [targetLanguage, setTargetLanguage] = useState('es');
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [longPressedMessage, setLongPressedMessage] = useState(null);
  const [showMessageActions, setShowMessageActions] = useState(false);
  const [actionMenuPosition, setActionMenuPosition] = useState({ x: 0, y: 0 });
  const [actionMenuMessageIndex, setActionMenuMessageIndex] = useState(null);
  const [isScrollingUp, setIsScrollingUp] = useState(false);
  const [messageIds, setMessageIds] = useState({}); // Store message IDs from the API

  // Updated language options to include Hindi
  const languageOptions = [
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'zh', name: 'Chinese' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'ru', name: 'Russian' },
    { code: 'bn', name: 'Bengali' },
    { code: 'hi', name: 'Hindi' } // Added Hindi language
  ];

  const setFallbackSuggestions = () => {
    setSuggestions([
      "Tell me about yourself",
      "Let's talk about travel",
      "What's your favorite hobby?",
      "How do I improve my vocabulary?"
    ]);
  };

  const speakText = (text, messageIndex) => {
    Speech.stop();
    setSpeakingMessageIndex(messageIndex);
    Speech.speak(text, {
      language: 'en',
      onDone: () => setSpeakingMessageIndex(null),
      onStopped: () => setSpeakingMessageIndex(null),
      onError: () => setSpeakingMessageIndex(null)
    });
  };

  const replayText = (text, messageIndex) => {
    if (speakingMessageIndex === messageIndex) {
      Speech.stop();
      setSpeakingMessageIndex(null);
      return;
    }
    speakText(text, messageIndex);
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

    Animated.loop(
      Animated.sequence([
        Animated.timing(typingAnimation, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(typingAnimation, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const animateWave = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(waveAnimation, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(waveAnimation, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const animateRecording = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(recordingAnimation, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(recordingAnimation, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const animateFloatingAssistant = (show) => {
    Animated.spring(floatingAssistantAnim, {
      toValue: show ? 1 : 0,
      friction: 6,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const animateEntranceElements = () => {
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

    Animated.timing(suggestionsEntrance, {
      toValue: 1,
      duration: 600,
      delay: 800,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true
    }).start();
  };

  const requestAudioPermissions = async () => {
    const { status } = await Audio.requestPermissionsAsync();
    return status === 'granted';
  };

  const startRecording = async () => {
    try {
      const hasPermission = await requestAudioPermissions();
      if (!hasPermission) {
        alert("Microphone permission is required for recording");
        return;
      }
      setIsRecording(true);
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else {
        Vibration.vibrate(20);
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
      await recording.startAsync();
      recordingRef.current = recording;
      animateRecording();
    } catch (error) {
      console.error('Failed to start recording:', error);
      alert(`Recording failed: ${error.message}`);
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    try {
      if (recordingRef.current) {
        await recordingRef.current.stopAndUnloadAsync();
        const uri = recordingRef.current.getURI();
        setIsRecording(false);
        recordingAnimation.stopAnimation();
        recordingAnimation.setValue(0);

        const transcribedText = await transcribeAudio(uri);
        if (transcribedText) {
          setInput(transcribedText);
        }

        if (Platform.OS === 'ios') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          Vibration.vibrate(50);
        }
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
      alert(`Failed to stop recording: ${error.message}`);
      setIsRecording(false);
    } finally {
      recordingRef.current = null;
    }
  };

  const transcribeAudio = async (audioUri) => {
    if (!audioUri) return "";

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('audio', {
        uri: audioUri,
        type: 'audio/m4a',
        name: 'recording.m4a',
      });

      const response = await fetch('https://ai-english-tutor-9ixt.onrender.com/api/transcribe', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log(response)
      if (!response.ok) {
        throw new Error('Transcription failed');
      }

      const data = await response.json();

      if (data.success && data.transcription && data.transcription.text) {
        return data.transcription.text;
      } else {
        throw new Error('No transcription text returned');
      }
    } catch (error) {
      console.error('Transcription error:', error);
      alert('Could not transcribe audio. Please try again.');
      return "";
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSection = (messageIndex, sectionType) => {
    const key = `${messageIndex}-${sectionType}`;
    setExpandedSections(prev => ({
      ...prev,
      [key]: !prev[key]
    }));

    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const toggleTranslation = async (messageIndex, text, sectionType = 'answer') => {
    const key = `${messageIndex}-${sectionType}`;

    setShowTranslation(prev => ({
      ...prev,
      [key]: !prev[key]
    }));

    if (!showTranslation[key] && !translations[key]) {
      await translateText(messageIndex, text, sectionType);
    }

    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  // Helper function for Gemini translation
  const translateWithGemini = async (text, targetLanguage) => {
    try {
      // Map the language code to full language name that Gemini understands
      const languageMapping = {
        'es': 'Spanish',
        'fr': 'French',
        'de': 'German',
        'it': 'Italian',
        'zh': 'Chinese',
        'ja': 'Japanese',
        'ko': 'Korean',
        'ru': 'Russian',
        'bn': 'Bengali',
        'hi': 'Hindi'
      };

      const languageName = languageMapping[targetLanguage] || targetLanguage;

      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

      const requestBody = {
        contents: [{
          parts: [{
            text: `Translate the following text into ${languageName}. Only provide the translated text without any additional explanation or notes:\n\n"${text}"`
          }]
        }]
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();

      // Extract the translation from the response
      if (data.candidates &&
          data.candidates[0] &&
          data.candidates[0].content &&
          data.candidates[0].content.parts &&
          data.candidates[0].content.parts[0] &&
          data.candidates[0].content.parts[0].text) {
        return data.candidates[0].content.parts[0].text.trim();
      } else {
        throw new Error('Unexpected response format from Gemini API');
      }
    } catch (error) {
      console.error('Gemini translation error:', error);
      return null;
    }
  };

  // Updated translateText function using Gemini API
  const translateText = async (messageIndex, text, sectionType = 'answer') => {
    if (!text) return;

    setIsLoading(true);
    try {
      // First try to use Gemini API for translation
      const translatedText = await translateWithGemini(text, targetLanguage);

      if (translatedText) {
        const key = `${messageIndex}-${sectionType}`;
        setTranslations(prev => ({
          ...prev,
          [key]: translatedText
        }));
        setIsLoading(false);
        return;
      }

      // If Gemini API fails, try the original API as fallback
      try {
        const response = await fetch('https://ai-english-tutor-9ixt.onrender.com/api/translate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: text,
            targetLanguage: targetLanguage
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.translatedText) {
            const key = `${messageIndex}-${sectionType}`;
            setTranslations(prev => ({
              ...prev,
              [key]: data.translatedText
            }));
            return;
          }
        }
      } catch (apiError) {
        console.error('API translation error:', apiError);
      }

      // If both APIs fail, use mock translation as last resort
      let mockTranslation = '';
      const langName = languageOptions.find(l => l.code === targetLanguage)?.name || targetLanguage;

      if (targetLanguage === 'es') {
        mockTranslation = `[Español] ${text.substring(0, 10)}... (Texto traducido al español)`;
      } else if (targetLanguage === 'fr') {
        mockTranslation = `[Français] ${text.substring(0, 10)}... (Texte traduit en français)`;
      } else if (targetLanguage === 'de') {
        mockTranslation = `[Deutsch] ${text.substring(0, 10)}... (Text auf Deutsch übersetzt)`;
      } else if (targetLanguage === 'bn') {
        mockTranslation = `[বাংলা] ${text.substring(0, 10)}... (বাংলায় অনুবাদ করা পাঠ্য)`;
      } else if (targetLanguage === 'hi') {
        mockTranslation = `[हिंदी] ${text.substring(0, 10)}... (हिंदी में अनुवादित पाठ)`;
      } else {
        mockTranslation = `[${langName}] ${text.substring(0, 10)}... (Translated text in ${langName})`;
      }

      const key = `${messageIndex}-${sectionType}`;
      setTranslations(prev => ({
        ...prev,
        [key]: mockTranslation
      }));
    } catch (error) {
      console.error('Translation error:', error);
      const mockTranslation = `[Translation to ${targetLanguage}] ${text.substring(0, 20)}...`;
      const key = `${messageIndex}-${sectionType}`;
      setTranslations(prev => ({
        ...prev,
        [key]: mockTranslation
      }));
    } finally {
      setIsLoading(false);
    }
  };



  const startEditMessage = (index) => {
    if (messages[index].role === 'user') {
      setEditingMessageIndex(index);
      setEditingText(messages[index].content);
    }
  };

  const deleteMessage = async (index) => {
    const message = messages[index];

    // Check if we have an ID for this message
    if (!message.id && message.isInitial) {
      Alert.alert(
        "Cannot Delete",
        "The initial greeting message cannot be deleted.",
        [{ text: "OK", style: "default" }]
      );
      return;
    }

    Alert.alert(
      "Delete Message",
      "Are you sure you want to delete this message?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          onPress: async () => {
            setIsLoading(true);
            try {
              // Check if there's a corresponding assistant message to delete
              const hasAssistantResponse = index < messages.length - 1 &&
                  messages[index].role === 'user' &&
                  messages[index + 1].role === 'assistant';

              // If we have a message ID, delete it from the server
              if (message.id) {
                const response = await fetch(
                  `https://ai-english-tutor-9ixt.onrender.com/api/conversation/${message.id}?email=${encodeURIComponent(user?.primaryEmailAddress?.emailAddress || '')}`,
                  {
                    method: 'DELETE',
                    headers: {
                      "ngrok-skip-browser-warning": "true",
                      'Accept': 'application/json',
                      'Content-Type': 'application/json',
                    }
                  }
                );

                if (!response.ok) {
                  throw new Error('Failed to delete message from server');
                }

                // If there's an assistant response, also delete it
                if (hasAssistantResponse && messages[index + 1].id) {
                  await fetch(
                    `https://ai-english-tutor-9ixt.onrender.com/api/conversation/${messages[index + 1].id}?email=${encodeURIComponent(user?.primaryEmailAddress?.emailAddress || '')}`,
                    {
                      method: 'DELETE',
                      headers: {
                        "ngrok-skip-browser-warning": "true",
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                      }
                    }
                  );
                }
              }

              // Update the UI state
              setMessages(prev => {
                const newMessages = [...prev];
                if (hasAssistantResponse) {
                  newMessages.splice(index, 2); // Delete both user and assistant messages
                } else {
                  newMessages.splice(index, 1); // Just delete the single message
                }
                return newMessages;
              });

              if (Platform.OS === 'ios') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
            } catch (error) {
              console.error('Error deleting message:', error);
              Alert.alert(
                "Error",
                "Failed to delete the message. Please try again later.",
                [{ text: "OK", style: "default" }]
              );
            } finally {
              setIsLoading(false);
            }
          },
          style: "destructive"
        }
      ]
    );
  };
  const saveEditedMessage = async () => {
    if (editingMessageIndex === null || !editingText.trim()) return;
    const message = messages[editingMessageIndex];
    if (!message) return;

    setIsLoading(true);
    try {
      // Update the message on the server if we have an ID
      if (message.id) {
        // Check if we need a new AI response
        const oldMessageContent = message.content;
        const needsNewResponse = oldMessageContent !== editingText;

        const response = await fetch(
          `https://ai-english-tutor-9ixt.onrender.com/api/conversation/${message.id}`,
          {
            method: 'PUT',
            headers: {
              "ngrok-skip-browser-warning": "true",
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: user?.primaryEmailAddress?.emailAddress,
              content: editingText,
              generateNewResponse: needsNewResponse
            })
          }
        );

        if (!response.ok) {
          throw new Error('Failed to update message on server');
        }

        // Get the response data
        const responseData = await response.json();
        console.log('Server response:', responseData);

        // Check if there's an assistant response that needs updating
        const hasAssistantResponse = editingMessageIndex < messages.length - 1 &&
          messages[editingMessageIndex].role === 'user' &&
          messages[editingMessageIndex + 1].role === 'assistant';

        // Update the message in the UI
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[editingMessageIndex] = {
            ...newMessages[editingMessageIndex],
            content: editingText
          };

          // If the backend generated a new response and returned it
          if (needsNewResponse && hasAssistantResponse && responseData.data && responseData.data.llmres) {
            try {
              // Try to parse the LLM response
              const llmData = JSON.parse(responseData.data.llmres);

              // Format the response
              const formattedResponse = formatResponseFromAPI(llmData);

              // Update the assistant message
              newMessages[editingMessageIndex + 1] = {
                ...newMessages[editingMessageIndex + 1],
                content: formattedResponse.content,
                sections: formattedResponse.sections,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                isInitial: false,
                id: responseData.data.id // Keep the same ID
              };

              // Generate suggestions if there's a follow-up
              if (llmData.followUp) {
                generateSuggestionsFromFollowUp(llmData.followUp);
              }
            } catch (parseError) {
              console.error('Error parsing LLM response:', parseError);
              // Just update the timestamp if parsing fails
              newMessages[editingMessageIndex + 1] = {
                ...newMessages[editingMessageIndex + 1],
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              };
            }
          } else if (needsNewResponse && hasAssistantResponse) {
            // If we need a new response but it's not in the response data
            // Just update the timestamp to show the message was updated
            newMessages[editingMessageIndex + 1] = {
              ...newMessages[editingMessageIndex + 1],
              content: "Response was updated. Refresh to see the latest content.",
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
          }

          return newMessages;
        });
      } else {
        // If there's no ID, just update in the UI
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[editingMessageIndex] = {
            ...newMessages[editingMessageIndex],
            content: editingText
          };
          return newMessages;
        });

        // Optionally show an alert about local-only changes
        Alert.alert(
          "Local Change Only",
          "This message was updated locally but not saved to the server because it has no ID.",
          [{ text: "OK", style: "default" }]
        );
      }

      // Clear editing state
      setEditingMessageIndex(null);
      setEditingText('');

      // Provide haptic feedback on success
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Error updating message:', error);
      Alert.alert(
        "Error",
        `Failed to update the message: ${error.message}`,
        [{ text: "OK", style: "default" }]
      );
    } finally {
      setIsLoading(false);
    }
  };
  const cancelEditing = () => {
    setEditingMessageIndex(null);
    setEditingText('');
  };

  const handleLongPress = (messageIndex, event) => {
    if (messages[messageIndex].role !== 'user') return;

    const { pageX, pageY } = event.nativeEvent;
    setLongPressedMessage(messageIndex);
    setActionMenuPosition({ x: pageX, y: pageY });
    setShowMessageActions(true);

    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const closeActionMenu = () => {
    setShowMessageActions(false);
    setLongPressedMessage(null);
  };

// Improved message loading that properly handles message IDs
useEffect(() => {
  animateEntranceElements();
  animateWave();
  startTypingAnimation();

  const fetchInitialQuestions = async () => {
    try {
      if (!user?.primaryEmailAddress?.emailAddress) {
        setFallbackSuggestions();
        return;
      }

      const response = await fetch(
        `https://ai-english-tutor-9ixt.onrender.com/api/chat/getHistory?email=${encodeURIComponent(user.primaryEmailAddress.emailAddress)}`,
        {
          method: 'GET',
          headers: {
            "ngrok-skip-browser-warning": "true",
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          }
        }
      );

      const data = await response.json();

      if (data.success && data.history && data.history.length > 0) {
        const processedMessages = data.history.flatMap(item => {
          const userMessage = {
            role: 'user',
            content: item.userres,
            timestamp: new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            id: item.id // Store the ID from the server
          };

          try {
            const parsedLLM = JSON.parse(item.llmres);
            const assistantMessage = {
              role: 'assistant',
              content: parsedLLM.answer || "Response from tutor",
              sections: [
                { type: 'answer', content: parsedLLM.answer },
                { type: 'explanation', content: parsedLLM.explanation },
                { type: 'feedback', content: parsedLLM.feedback },
                { type: 'followUp', content: parsedLLM.followUp }
              ].filter(section => section.content),
              timestamp: new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              id: item.id // Same ID for the response
            };

            return [userMessage, assistantMessage];
          } catch (e) {
            return [userMessage];
          }
        });

        setMessages(processedMessages);
      } else {
        setMessages([{
          role: 'assistant',
          content: `Hi${user?.firstName ? ` ${user.firstName}` : ''}! I'm your language learning assistant.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isInitial: true
        }]);
      }
    } catch (error) {
      console.error('Error fetching chat history:', error);
      setMessages([{
        role: 'assistant',
        content: `Hi${user?.firstName ? ` ${user.firstName}` : ''}! I'm your language learning assistant.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isInitial: true
      }]);
    }
  };

  fetchInitialQuestions();

  return () => {
    Speech.stop();
    if (recordingRef.current) {
      recordingRef.current.stopAndUnloadAsync();
    }
  };
}, []);

// Add this to your component for debugging
const logMessageIdsDebug = () => {
  let msgCount = 0;
  let idCount = 0;

  if (messages) {
    msgCount = messages.length;
  }

  if (messageIds) {
    idCount = Object.keys(messageIds).length;
  }

  console.log(`Messages: ${msgCount}, IDs: ${idCount}`);
  console.log("Message IDs mapping:", JSON.stringify(messageIds, null, 2));

  // Check if we're missing any IDs
  if (messages) {
    messages.forEach((msg, idx) => {
      if (!messageIds[idx]) {
        console.log(`Missing ID for message ${idx} (${msg.role}): ${msg.content.substring(0, 20)}...`);
      }
    });
  }
};
    useEffect(() => {
      if (scrollViewRef.current && messages.length > 1) {
        scrollViewRef.current.scrollToEnd({ animated: true });
      }
    }, [messages]);

    useEffect(() => {
      if (isLoading) {
        startTypingAnimation();
      } else {
        typingDot1.setValue(0);
        typingDot2.setValue(0);
        typingDot3.setValue(0);
        typingAnimation.setValue(0);
      }
    }, [isLoading]);

    useEffect(() => {
      const latestMessage = messages[messages.length - 1];
      if (latestMessage?.role === 'assistant' && !latestMessage.isInitial && messages.length > 1) {
        const content = latestMessage.sections
          ? latestMessage.sections.find((section) => section.type === 'answer')?.content
          : latestMessage.content;
        if (content) {
          speakText(content, messages.length - 1);
        }
      }
    }, [messages]);

    const scrollToTop = () => {
      if (scrollViewRef.current) {
        try {
          scrollViewRef.current.scrollTo({ y: 0, animated: true });
        } catch (error) {
          console.log('Error scrolling to top', error);
        }
      }
    };

    const scrollToBottom = () => {
      if (scrollViewRef.current) {
        try {
          scrollViewRef.current.scrollToEnd({ animated: true });
        } catch (error) {
          console.log('Error scrolling to bottom', error);
        }
      }
    };

    const handleScroll = useCallback((event) => {
      const scrollPosition = event.nativeEvent.contentOffset.y;
      const scrollingUp = scrollPosition < lastScrollPosition;
      setLastScrollPosition(scrollPosition);

      // Update scrolling direction state
      setIsScrollingUp(scrollingUp);

      const nearTop = scrollPosition < 100;
      if (nearTop !== isNearTop) {
        setIsNearTop(nearTop);
      }

      tabBarScrollHandler(event);

      // Only show scroll button when scroll position exceeds threshold
      const shouldShowScrollButton = scrollPosition > 300;

      if (shouldShowScrollButton) {
        Animated.spring(scrollButtonAnim, {
          toValue: 1,
          friction: 8,
          tension: 60,
          useNativeDriver: true,
        }).start();
      } else {
        // Hide button when near the top
        Animated.timing(scrollButtonAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }

      if (scrollingUp && scrollPosition > 200) {
        animateFloatingAssistant(true);
      } else {
        animateFloatingAssistant(false);
      }

      // Manage scrolling state
      setIsScrolling(true);

      if (scrollEndTimer.current) {
        clearTimeout(scrollEndTimer.current);
      }
      scrollEndTimer.current = setTimeout(() => {
        setIsScrolling(false);
      }, 150);
    }, [lastScrollPosition, tabBarScrollHandler, isNearTop]);

    const sendMessage = async (text) => {
      const messageText = text !== undefined ? text : input;
      if (!messageText || messageText.trim() === '') return;

      setInput('');
      setSuggestions([]);
      setSelectedTopic(null);
      setExpandedSections({});

      // Add the user message to the state with a temporary ID
      const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const userMessageIndex = messages.length;

      setMessages(prev => [...prev, {
        role: 'user',
        content: messageText,
        timestamp,
        isInitial: false,
        tempId: Date.now() // Temporary ID until we get the real one from server
      }]);

      setIsLoading(true);

      try {
        // Prepare the context from previous messages
        const recentMessages = messages.slice(-4).map(msg => ({
          role: msg.role,
          content: msg.content
        }));

        const response = await fetch('https://ai-english-tutor-9ixt.onrender.com/api/conversation/ask', {
          method: 'POST',
          headers: {
            "ngrok-skip-browser-warning": "true",
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: user?.primaryEmailAddress?.emailAddress,
            message: messageText,
            selectedTopic: selectedTopic,
            context: recentMessages,
            requestHighQuality: true
          }),
        });

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Invalid response format');
        }

        const data = await response.json();

        if (data.success) {
          // Update the message with the real ID from the server
          setMessages(prev => {
            const newMessages = [...prev];
            // Find the user message we just added (it will be the last one before this update)
            const userMessage = newMessages[newMessages.length - 1];
            if (userMessage) {
              // Replace the temporary ID with the real one
              userMessage.id = data.questionId;
            }
            return newMessages;
          });

          // Add the assistant response with its ID
          const formattedResponse = formatResponseFromAPI(data);
          setTimeout(() => {
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: formattedResponse.content,
              sections: formattedResponse.sections,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              isInitial: false,
              id: data.assistantId || data.questionId // Use assistantId if available, fallback to questionId
            }]);

            if (data.followUp) {
              generateSuggestionsFromFollowUp(data.followUp);
            }
            setIsLoading(false);
          }, 1000);
        } else {
          // Error handling
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: data.error || "I'm sorry, I couldn't process your message properly.",
            timestamp,
            isInitial: false
          }]);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error sending message:', error);
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: "Sorry, there was an error connecting to the service.",
          timestamp,
          isInitial: false
        }]);
        setIsLoading(false);
      }
    };
// Add a debugging button component to your UI for testing message IDs
const DebugButton = () => {
  if (__DEV__) { // Only show in development mode
    return (
      <TouchableOpacity
        style={{
          position: 'absolute',
          top: 40,
          right: 10,
          backgroundColor: 'rgba(255,0,0,0.2)',
          padding: 5,
          borderRadius: 5,
          zIndex: 9999,
        }}
        onPress={() => {
          console.log("=== DEBUG INFO ===");
          console.log("Messages:", messages.length);
          console.log("MessageIds:", JSON.stringify(messageIds, null, 2));

          // Check if each message has a corresponding ID
          messages.forEach((msg, idx) => {
            console.log(`Message ${idx} (${msg.role}): ${messageIds[idx] ? `ID ${messageIds[idx]}` : 'NO ID'}`);
          });

          Alert.alert(
            "Debug Info",
            `Messages: ${messages.length}\nIDs mapped: ${Object.keys(messageIds).length}`,
            [{ text: "OK" }]
          );
        }}
      >
        <Text style={{ color: 'white' }}>Debug</Text>
      </TouchableOpacity>
    );
  }
  return null;
};

// Return this component in your JSX
// Add this inside your main view:
// <DebugButton />

    const formatResponseFromAPI = (data) => {
      const sections = [];

      // Ensure the answer has proper content and formatting
      if (data.answer) {
        sections.push({
          type: 'answer',
          content: data.answer.trim()
        });
      }

      // Ensure explanations are properly formatted
      if (data.explanation && data.explanation.trim()) {
        sections.push({
          type: 'explanation',
          content: data.explanation.trim(),
          icon: 'school'
        });
      }

      // Ensure feedback is properly formatted
      if (data.feedback && data.feedback.trim()) {
        sections.push({
          type: 'feedback',
          content: data.feedback.trim(),
          icon: 'check-circle'
        });
      }

      // Enhance follow-up questions section
      if (data.followUp && data.followUp.trim() !== '') {
        // Format the follow-up content for better readability
        const formattedFollowUp = data.followUp
          .split(/\d+\./)
          .filter(item => item.trim())
          .map(item => `• ${item.trim()}`)
          .join('\n\n');

        sections.push({
          type: 'followUp',
          content: formattedFollowUp || data.followUp.trim(),
          icon: 'help-circle'
        });

        // Add suggestions section after followUp
        sections.push({
          type: 'suggestions',
          content: 'Click to see suggestions based on these questions',
          icon: 'lightbulb'
        });
      }

      return {
        content: data.answer?.trim() || "I'm here to help with your English learning!",
        sections,
        questionId: data.questionId // Store the question ID
      };
    };

    const generateSuggestionsFromFollowUp = (followUp) => {
      const newSuggestions = [];

      if (followUp.includes("aspect of travel")) {
        setSelectedTopic("travel");
        newSuggestions.push(
          "I love exploring historical sites",
          "I prefer relaxing beach vacations",
          "I enjoy trying local cuisine when traveling",
          "Adventure travel is my favorite"
        );
      } else if (followUp.includes("vocabulary")) {
        setSelectedTopic("vocabulary");
        newSuggestions.push(
          "Help me with business vocabulary",
          "I need everyday conversation phrases",
          "Let's practice advanced idioms",
          "Formal language for presentations"
        );
      } else if (followUp.includes("hobby")) {
        setSelectedTopic("hobbies");
        newSuggestions.push(
          "I enjoy photography",
          "I love cooking new recipes",
          "Reading books is my favorite pastime",
          "I play tennis regularly"
        );
      } else {
        newSuggestions.push(
          "Can you explain that more clearly?",
          "Let's continue practicing",
          "Give me a challenging exercise",
          "How can I improve my grammar?"
        );
      }

      setSuggestions(newSuggestions);
    };

    const handleSuggestionPress = (suggestion) => {
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      sendMessage(suggestion);
    };

    const renderTopicBadge = (index) => {
      if (!selectedTopic) return null;

      const topicIcons = {
        "travel": <FontAwesome5 name="plane" size={14} color="#FFF" />,
        "vocabulary": <FontAwesome5 name="book" size={14} color="#FFF" />,
        "hobbies": <FontAwesome5 name="palette" size={14} color="#FFF" />
      };

      const topicColors = {
        "travel": ['#FF9800', '#FF5722'],
        "vocabulary": ['#4CAF50', '#2E7D32'],
        "hobbies": ['#9C27B0', '#7B1FA2']
      };

      return (
        <LinearGradient
          colors={topicColors[selectedTopic] || ['#3B82F6', '#6366F1']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.topicBadge}
        >
          {topicIcons[selectedTopic]}
        </LinearGradient>
      );
    };

    const renderWelcomeCard = () => {
      return (
        <Animated.View
          style={[
            styles.welcomeCard,
            {
              opacity: fadeAnim,
              transform: [{ translateY }]
            }
          ]}
        >
          <LinearGradient
            colors={['#0a402e', '#072622']}
            style={styles.welcomeGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.welcomeHeader}>
              <View style={styles.welcomeAvatarContainer}>
                <View style={styles.welcomeAvatarInner}>
                  <Animated.View
                    style={{
                      transform: [
                        {
                          rotate: waveAnimation.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['-15deg', '15deg']
                          })
                        }
                      ]
                    }}
                  >
                    <MaterialCommunityIcons
                      name="robot-happy"
                      size={36}
                      color="#23cc96"
                    />
                  </Animated.View>
                </View>
              </View>
              <View style={styles.welcomeTitleContainer}>
                <Text style={styles.welcomeTitle}>Welcome to Language Partner</Text>
                <View style={styles.welcomeSubtitleContainer}>
                  <View style={styles.onlineDot} />
                  <Text style={styles.welcomeSubtitle}>AI-Powered Learning</Text>
                </View>
              </View>
            </View>

            <Text style={styles.welcomeText}>
              {`Hi${user?.firstName ? ` ${user.firstName}` : ''}! I'm your AI language coach. Let's practice conversation to improve your skills!`}
            </Text>

            <View style={styles.welcomeDivider} />

            <View style={styles.welcomeTips}>
              <View style={styles.tipItem}>
                <View style={styles.tipIconContainer}>
                  <MaterialCommunityIcons name="message-text-outline" size={18} color="#FFD700" />
                </View>
                <Text style={styles.tipText}>Natural conversations with tailored feedback</Text>
              </View>
              <View style={styles.tipItem}>
                <View style={styles.tipIconContainer}>
                  <MaterialCommunityIcons name="lightbulb-on-outline" size={18} color="#76FF03" />
                </View>
                <Text style={styles.tipText}>Learn vocabulary, grammar, and cultural nuances</Text>
              </View>
              <View style={styles.tipItem}>
                <View style={styles.tipIconContainer}>
                  <MaterialCommunityIcons name="chart-line-variant" size={18} color="#FF9800" />
                </View>
                <Text style={styles.tipText}>Track your progress and build confidence</Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>
      );
    };

    const renderMessageSection = (section, sectionIndex, messageIndex) => {
      const isExpanded = expandedSections[`${messageIndex}-${section.type}`];
      const shouldRenderContent = section.type === 'answer' || isExpanded;

      const sectionColors = {
        answer: {
          bg: 'rgba(35, 204, 150, 0.1)', // Light green for main answer
          border: '#23cc96',
          icon: '#23cc96'
        },
        explanation: {
          bg: 'rgba(56, 189, 248, 0.1)', // Light blue
          border: '#38BDF8',
          icon: '#38BDF8'
        },
        feedback: {
          bg: 'rgba(9, 184, 243, 0.1)', // Lighter purple (reduced opacity)
          border: '#6366F1',
          icon: '#6366F1'
        },
        followUp: {
          bg: 'rgba(251, 191, 36, 0.1)', // Light yellow
          border: '#FBB848',
          icon: '#FBB848'
        },
        suggestions: {
          bg: 'rgba(251, 191, 36, 0.1)', // Match the followUp style
          border: '#15a387',
          icon: '#15a387'
        }
      };

      const sectionColor = sectionColors[section.type] || {
        bg: 'transparent',
        border: 'transparent',
        icon: '#FFF'
      };

      const sectionTitles = {
        answer: 'Response',
        explanation: 'Tips & Explanation',
        feedback: 'Feedback',
        followUp: 'Follow-up Questions',
        suggestions: 'Suggestions'
      };

      const sectionIcons = {
        answer: 'chat-outline',
        explanation: 'lightbulb-outline',
        feedback: 'message-alert-outline',
        followUp: 'chat-question-outline',
        suggestions: 'lightbulb-on'
      };

      return (
        <View
          key={sectionIndex}
          style={[
            styles.sectionBox,
            {
              backgroundColor: sectionColor.bg,
              borderColor: sectionColor.border,
              marginBottom: section.type === 'followUp' ? 4 : 8 // Reduce margin between followUp and suggestions
            }
          ]}
        >
          {section.type !== 'answer' && (
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => toggleSection(messageIndex, section.type)}
              activeOpacity={0.7}
            >
              <View style={styles.sectionHeaderContent}>
                <View style={[
                  styles.sectionIconContainer,
                  { backgroundColor: 'rgba(255, 255, 255, 0.1)', borderColor: sectionColor.border }
                ]}>
                  <MaterialCommunityIcons
                    name={sectionIcons[section.type]}
                    size={16}
                    color={sectionColor.icon}
                  />
                </View>
                <Text style={[styles.sectionTitle, { color: sectionColor.icon }]}>
                  {sectionTitles[section.type]}
                </Text>
              </View>
              <MaterialIcons
                name={isExpanded ? "keyboard-arrow-up" : "keyboard-arrow-down"}
                size={22}
                color={sectionColor.icon}
              />
            </TouchableOpacity>
          )}

          {shouldRenderContent && section.type !== 'suggestions' && (
            <View style={styles.sectionContent}>
              {section.type === 'answer' && (
                <View style={styles.answerHeader}>
                  <View style={[
                    styles.sectionIconContainer,
                    { backgroundColor: 'rgba(255, 255, 255, 0.1)', borderColor: sectionColor.border }
                  ]}>
                    <MaterialCommunityIcons
                      name={sectionIcons.answer}
                      size={16}
                      color={sectionColor.icon}
                    />
                  </View>
                  <Text style={[styles.sectionTitle, { color: sectionColor.icon }]}>
                    {sectionTitles.answer}
                  </Text>
                </View>
              )}
              <Text style={styles.sectionText}>
                {section.content}
              </Text>

              <View style={styles.messageActionButtons}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => replayText(section.content, messageIndex)}
                >
                  <Ionicons
                    name={speakingMessageIndex === messageIndex ? "volume-mute" : "volume-high"}
                    size={16}
                    color={speakingMessageIndex === messageIndex ? "#FF5722" : "#23cc96"}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => toggleTranslation(messageIndex, section.content, section.type)}
                >
                  <MaterialIcons name="translate" size={16} color="#3B82F6" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Suggestions section content */}
          {isExpanded && section.type === 'suggestions' && (
            <View style={styles.suggestionsContent}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.suggestionsScrollContent}
              >
                {suggestions.map((suggestion, i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.suggestionButton}
                    onPress={() => handleSuggestionPress(suggestion)}
                  >
                    <Text style={styles.suggestionText}>{suggestion}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {showTranslation[`${messageIndex}-${section.type}`] && (
            <View style={styles.translationContainer}>
              <Text style={styles.translationText}>
                {translations[`${messageIndex}-${section.type}`] || 'Translating...'}
              </Text>
            </View>
          )}
        </View>
      );
    };

    // Add this to finish the code content with all required functions
    const renderMessageContent = (message, index) => {
      if (message.isInitial) {
        return renderWelcomeCard();
      }

      if (message.role === 'user') {
        // If we're editing this message, show the edit interface
        if (editingMessageIndex === index) {
          return (
            <View style={styles.editContainer}>
              <TextInput
                style={styles.editInput}
                value={editingText}
                onChangeText={setEditingText}
                multiline
              />
              <View style={styles.editButtons}>
                <TouchableOpacity
                  style={[styles.editButton, styles.cancelButton]}
                  onPress={cancelEditing}
                >
                  <Text style={styles.editButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.editButton, styles.saveButton]}
                  onPress={saveEditedMessage}
                >
                  <Text style={styles.editButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }

        // Regular user message with action buttons - updated styling
        return (
          <View style={styles.userMessageContainer}>
            <Text style={[styles.messageText, styles.userMessageText]}>
              {message.content}
            </Text>
            <View style={styles.userMessageActions}>
              <View style={styles.userMessageButtons}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => startEditMessage(index)}
                >
                  <MaterialIcons name="edit" size={16} color="#23cc96" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => deleteMessage(index)}
                >
                  <MaterialIcons name="delete" size={16} color="#ef4444" />
                </TouchableOpacity>
              </View>
              <Text style={[styles.timestamp, styles.userTimestamp]}>
                {message.timestamp}
              </Text>
            </View>
          </View>
        );
      }

      // Assistant message with sections
      if (message.sections) {
        return (
          <View style={styles.assistantContainer}>
            <View style={styles.assistantMessageContainer}>
              {message.sections.map((section, sectionIndex) =>
                renderMessageSection(section, sectionIndex, index)
              )}
            </View>
            <Text style={[styles.timestamp, styles.assistantTimestamp]}>
              {message.timestamp}
            </Text>
          </View>
        );
      }

      // Standard assistant message without sections
      return (
        <View>
          <View style={[styles.assistantMessageContainer, styles.standardAssistantMessage]}>
            <Text style={[styles.messageText, styles.assistantMessageText]}>
              {message.content}
            </Text>
            <View style={styles.messageActionButtons}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => replayText(message.content, index)}
              >
                <Ionicons
                  name={speakingMessageIndex === index ? "volume-mute" : "volume-high"}
                  size={18}
                  color={speakingMessageIndex === index ? "#FF5722" : "#23cc96"}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => toggleTranslation(index, message.content, message.sections ? message.sections[0].type : 'answer')}
              >
                <MaterialIcons name="translate" size={18} color="#3B82F6" />
              </TouchableOpacity>
            </View>

            {showTranslation[`${index}-${message.sections ? message.sections[0].type : 'answer'}`] && (
              <View style={styles.translationContainer}>
                <Text style={styles.translationText}>
                  {translations[`${index}-${message.sections ? message.sections[0].type : 'answer'}`] || 'Translating...'}
                </Text>
              </View>
            )}
          </View>

          <Text style={[styles.timestamp, styles.assistantTimestamp]}>
            {message.timestamp}
          </Text>
        </View>
      );
    };

    return (
      <View style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          <StatusBar barStyle="light-content" />
          <View style={[styles.header, { paddingTop: insets.top }]}>
            {/* Completely empty header */}
          </View>

          {/* Translation toggle button */}
          <TouchableOpacity
            style={styles.translationButton}
            onPress={() => setShowLanguageModal(true)}
          >
            <MaterialIcons name="translate" size={20} color="#FFF" />
          </TouchableOpacity>

          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={[
              styles.messagesContent,
              { paddingBottom: 120 } // Increased padding to make room for lower input
            ]}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          >
            {messages.map((message, index) => (
              <View
                key={index}
                style={[
                  styles.messageContainer,
                  message.role === 'user' ? styles.userContainer : styles.assistantContainer
                ]}
              >
                {renderMessageContent(message, index)}
              </View>
            ))}

            {isLoading && (
              <View style={styles.loadingContainer}>
                <BlurView intensity={80} style={styles.loadingBlur} tint="dark">
                  <View style={styles.typingIndicator}>
                    <Animated.View
                      style={[
                        styles.typingDot,
                        {
                          opacity: typingDot1
                        }
                      ]}
                    />
                    <Animated.View
                      style={[
                        styles.typingDot,
                        {
                          opacity: typingDot2
                        }
                      ]}
                    />
                    <Animated.View
                      style={[
                        styles.typingDot,
                        {
                          opacity: typingDot3
                        }
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
                ],
                pointerEvents: scrollButtonAnim._value === 0 ? 'none' : 'auto'
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

          <View style={[
            styles.inputContainer,
            {
              paddingBottom: Math.max(insets.bottom, 20), // Add extra bottom padding based on safe area
              bottom: -10 // Push further down
            }
          ]}>
            <TextInput
              style={styles.input}
              placeholder="Type a message..."
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={input}
              onChangeText={setInput}
              multiline
              maxHeight={100}
            />
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[
                  styles.recordButton,
                  isRecording ? styles.recordingButton : styles.startRecordingButton
                ]}
                onPress={isRecording ? stopRecording : startRecording}
              >
                {isRecording ? (
                  <Animated.View
                    style={{
                      transform: [
                        {
                          scale: recordingAnimation.interpolate({
                            inputRange: [0, 1],
                            outputRange: [1, 1.2]
                          })
                        }
                      ]
                    }}
                  >
                    <FontAwesome5 name="stop" size={18} color="#FFF" />
                  </Animated.View>
                ) : (
                  <FontAwesome5 name="microphone" size={18} color="#000" />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  input.trim().length === 0 ? styles.sendButtonDisabled : {}
              ]}
              onPress={() => sendMessage()}
              disabled={input.trim().length === 0}
            >
              <Ionicons name="send" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Language selection modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={showLanguageModal}
          onRequestClose={() => setShowLanguageModal(false)}
        >
          <View style={styles.modalOverlay}>
            <BlurView intensity={60} style={styles.modalBlurOverlay} tint="dark">
              <View style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Select Translation Language</Text>
                  <TouchableOpacity onPress={() => setShowLanguageModal(false)}>
                    <MaterialCommunityIcons name="close" size={24} color="#FFF" />
                  </TouchableOpacity>
                </View>

                <View style={styles.languageOptionsContainer}>
                  {languageOptions.map((language) => (
                    <TouchableOpacity
                      key={language.code}
                      style={[
                        styles.languageOption,
                        targetLanguage === language.code && styles.languageOptionSelected
                      ]}
                      onPress={() => {
                        setTargetLanguage(language.code);
                        setShowLanguageModal(false);
                        // Clear existing translations when changing language
                        setTranslations({});
                        setShowTranslation({});
                      }}
                    >
                      <Text style={[
                        styles.languageOptionText,
                        targetLanguage === language.code && styles.languageOptionTextSelected
                      ]}>
                        {language.name}
                      </Text>
                      {targetLanguage === language.code && (
                        <MaterialIcons name="check" size={18} color="#3B82F6" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </BlurView>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollButton: {
    position: 'absolute',
    right: 16,
    bottom: 120, // Moved up to account for lower input
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
  header: {
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(30, 41, 59, 0.2)',
    backgroundColor: '#03302c', // Updated to match theme
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: '#022623', // Updated to match theme
  },
  messagesContent: {
    padding: 16,
    paddingTop: 8,
  },
  messageContainer: {
    marginBottom: 8,
    maxWidth: '85%',
  },
  userContainer: {
    alignSelf: 'flex-end',
  },
  assistantContainer: {
    alignSelf: 'flex-start',
  },
  messageText: {
    fontSize: 16,
    padding: 14,
    borderRadius: 20,
    lineHeight: 22,
  },
  userMessageText: {
    backgroundColor: '#05382b', // Updated to match theme from first stylesheet
    color: '#FFF',
    borderBottomRightRadius: 4,
    shadowColor: "#FFF",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4.65,

    elevation: 6,
    // borderColor: '#4752C4', // Updated to match theme
  },
  assistantMessageText: {
    backgroundColor: '#2d405e', // Updated to match theme from first stylesheet
    color: '#FFF', // Updated to match theme
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#1a4499', // Updated to match theme
  },
  timestamp: {
    fontSize: 12,
    color: '#a6a6ab',
    marginTop: -4,
    textAlign: 'right',
    marginRight: 8,
  },
  userTimestamp: {
    textAlign: 'left',
    marginLeft: 8,
    marginRight: 0,
  },
  assistantTimestamp: {
    textAlign: 'left',
    marginLeft: 8,
    marginTop: 3,
    marginRight: 0,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: '#031A18',
    borderTopWidth: 1,
    borderTopColor: 'rgba(30, 41, 59, 0.4)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 10,
  },
  input: {
    flex: 1,
    backgroundColor: '#2a3942', // Updated to match theme
    borderRadius: 24,
    padding: 14,
    paddingRight: 100,
    color: '#FFF',
    fontSize: 16,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#1f2a30', // Updated to match theme
  },
  buttonContainer: {
    position: 'absolute',
    right: 16,
    top: 13, // Move buttons slightly lower
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButton: {
    backgroundColor: '#23cc96', // Using theme accent color
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  sendButtonDisabled: {
    backgroundColor: '#062e25', // Updated to match theme
    opacity: 0.7,
  },
  recordButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  // Updated record button styles
  startRecordingButton: {
    backgroundColor: '#23cc96', // Updated to match theme accent color
  },
  recordingButton: {
    backgroundColor: '#ef4444', // Keeping red for recording indicator
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
    backgroundColor: '#23cc96', // Updated to match theme accent color
    marginHorizontal: 2,
  },
  welcomeCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#202225', // From first stylesheet
    backgroundColor: '#23cc96', // Using theme accent color
  },
  welcomeGradient: {
    padding: 18,
    borderRadius: 16,
    backgroundColor: '#23cc96', // Using theme accent color
  },
  welcomeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  welcomeAvatarContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 50, // Matching dimensions from first stylesheet
    height: 50, // Matching dimensions from first stylesheet
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#4752C4', // From first stylesheet
  },
  welcomeAvatarInner: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)', // Updated to match theme
    width: 46, // Matching dimensions from first stylesheet
    height: 46, // Matching dimensions from first stylesheet
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
    fontSize: 18, // Matching from first stylesheet
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
    width: 8, // Matching from first stylesheet
    height: 8, // Matching from first stylesheet
    borderRadius: 4,
    backgroundColor: '#23cc96', // Updated to match theme accent color
    marginRight: 6,
  },
  welcomeSubtitle: {
    fontSize: 12, // Matching from first stylesheet
    color: '#B9BBBE', // From first stylesheet
  },
  welcomeText: {
    fontSize: 16, // Matching from first stylesheet
    color: '#DCDDDE', // From first stylesheet
    lineHeight: 24, // Matching from first stylesheet
    marginBottom: 16, // Matching from first stylesheet
  },
  welcomeDivider: {
    height: 1,
    backgroundColor: '#40444B', // From first stylesheet
    marginVertical: 16, // Matching from first stylesheet
  },
  welcomeTips: {
    marginTop: 8,
    gap: 14, // Matching from first stylesheet
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tipIconContainer: {
    width: 32, // Matching from first stylesheet
    height: 32, // Matching from first stylesheet
    borderRadius: 16,
    backgroundColor: 'rgba(88, 101, 242, 0.15)', // From first stylesheet
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(88, 101, 242, 0.3)', // From first stylesheet
  },
  tipText: {
    fontSize: 14, // Matching from first stylesheet
    color: '#DCDDDE', // From first stylesheet
    flex: 1,
    lineHeight: 20, // Matching from first stylesheet
  },
  // Reduced spacing for collapsible sections
  messageSection: {
    marginBottom: 12, // Matching from first stylesheet
    marginTop: 4, // Matching from first stylesheet
  },
  collapsibleSectionHeader: {
    borderRadius: 12, // Updated to match theme
    overflow: 'hidden',
    borderLeftWidth: 3,
    marginTop: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
    marginBottom: 8, // Matching from first stylesheet
  },
  sectionIconContainer: {
    width: 26, // Matching from first stylesheet
    height: 26, // Matching from first stylesheet
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    borderWidth: 1, // Matching from first stylesheet
  },
  sectionTitle: {
    fontSize: 14, // Matching from first stylesheet
    fontWeight: '600',
    color: '#FFF',
    opacity: 0.95,
  },
  sectionText: {
    fontSize: 14,
    lineHeight: 20,
    padding: 10,
    paddingTop: 2,
  },
  explanationSection: {
    backgroundColor: 'rgba(87, 242, 135, 0.1)', // Matching theme color scheme
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(87, 242, 135, 0.3)', // Matching theme color scheme
  },
  explanationIcon: {
    backgroundColor: 'rgba(87, 242, 135, 0.15)', // Matching theme color scheme
    borderColor: 'rgba(87, 242, 135, 0.3)', // Matching theme color scheme
  },
  explanationTitle: {
    color: '#23cc96', // Updated to match theme accent color
  },
  explanationText: {
    color: '#DCDDDE', // From first stylesheet
  },
  feedbackSection: {
    backgroundColor: 'rgba(255, 177, 66, 0.18)', // Keeping for visual distinction
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 177, 66, 0.4)', // Keeping for visual distinction
  },
  feedbackIcon: {
    backgroundColor: 'rgba(255, 177, 66, 0.15)', // Keeping for visual distinction
    borderColor: 'rgba(255, 177, 66, 0.3)', // Keeping for visual distinction
  },
  feedbackTitle: {
    color: '#FBB848', // Keeping for visual distinction
  },
  feedbackText: {
    color: '#DCDDDE', // From first stylesheet
  },
  followUpSection: {
    backgroundColor: 'rgba(235, 69, 158, 0.2)', // Keeping for visual distinction
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(235, 69, 158, 0.4)', // Keeping for visual distinction
  },
  followUpIcon: {
    backgroundColor: 'rgba(235, 69, 158, 0.15)', // Keeping for visual distinction
    borderColor: 'rgba(235, 69, 158, 0.3)', // Keeping for visual distinction
  },
  followUpTitle: {
    color: '#23cc96', // Updated to match theme accent color
  },
  followUpText: {
    color: '#DCDDDE', // From first stylesheet
  },
  // Edit message styles
  editContainer: {
    backgroundColor: '#03302c', // Updated to match theme
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 5,
    borderWidth: 1,
    borderColor: 'rgba(35, 204, 150, 0.2)', // Using theme accent color
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  editInput: {
    color: '#FFF',
    fontSize: 16,
    padding: 14,
    lineHeight: 22,
  },
  editButtons: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(51, 65, 85, 0.5)',
  },
  editButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButton: {
    borderRightWidth: 1,
    borderRightColor: 'rgba(51, 65, 85, 0.5)',
  },
  saveButton: {
    backgroundColor: 'rgba(35, 204, 150, 0.15)', // Using theme accent color
  },
  editButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 15,
  },
  // User message actions
  userMessageContainer: {
    backgroundColor: '#05382b',
    padding: 4,
    borderRadius: 20,
    borderBottomRightRadius: 4,
    // borderWidth: 2,
    // borderColor: '#4752C4',
    overflow: 'hidden',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.9)',
  },
  userMessageActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  userMessageButtons: {
    flexDirection: 'row',
  },
  userMessageButton: {
    marginLeft: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(3, 48, 44, 0.7)', // Match the actionButton style
    borderWidth: 1,
    borderColor: 'rgba(35, 204, 150, 0.3)', // Match the actionButton border
  },
  // Move message actions to the right side of messages
  messageActionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 6,
    marginTop: 4,
  },
  messageControls: {
    flexDirection: 'row',
    marginTop: 4,
  },
  // Updated action button
  actionButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(3, 48, 44, 0.7)', // Updated to match theme
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
    borderWidth: 1,
    borderColor: 'rgba(35, 204, 150, 0.3)', // Using theme accent color
  },
  // Better translation button
  translationButton: {
    position: 'absolute',
    bottom: 17,
    right: 118,
    width: 40,
    height: 40,
    borderRadius: 24,
    backgroundColor: '#064739', // Updated to match theme
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 2,
    zIndex: 100,
  },
  // Translation styles
  translationContainer: {
    marginTop: 10,
    backgroundColor: 'rgba(35, 204, 150, 0.1)', // Using theme accent color
    borderRadius: 14,
    padding: 12,
    borderLeftWidth: 2,
    borderLeftColor: '#23cc96', // Updated to match theme accent color
  },
  translationText: {
    color: '#DCDDDE', // From first stylesheet
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalBlurOverlay: {
    width: '85%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalContainer: {
    backgroundColor: 'rgba(3, 48, 44, 0.95)', // Updated to match theme
    borderRadius: 16,
    padding: 22,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(35, 204, 150, 0.2)', // Using theme accent color
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  languageOptionsContainer: {
    marginBottom: 10,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 12,
    marginBottom: 10,
    backgroundColor: 'rgba(12, 53, 47, 0.6)', // Updated to match theme
  },
  languageOptionSelected: {
    backgroundColor: 'rgba(35, 204, 150, 0.15)', // Using theme accent color
    borderWidth: 1,
    borderColor: 'rgba(35, 204, 150, 0.5)', // Using theme accent color
  },
  languageOptionText: {
    color: '#DCDDDE', // From first stylesheet
    fontSize: 16,
  },
  languageOptionTextSelected: {
    color: '#FFF',
    fontWeight: '600',
  },
  // Add these new styles to your stylesheet
  actionMenuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  actionMenu: {
    position: 'absolute',
    backgroundColor: '#1b2638',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
    minWidth: 150,
    zIndex: 1000,
  },
  actionMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  actionMenuText: {
    color: '#FFF',
    marginLeft: 10,
    fontSize: 16,
  },
  assistantMessageContainer: {
    backgroundColor: 'rgba(27, 38, 56, 0.5)',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1f2a30',
    padding: 2,
    marginBottom: 4,
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.9)',
  },
  standardAssistantMessage: {
    padding: 0,
    overflow: 'visible',
  },
  sectionBox: {
    borderRadius: 12,
    borderLeftWidth: 3,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  sectionHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  answerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  sectionContent: {
    padding: 12,
    paddingTop: 6,
  },
  sectionText: {
    color: '#FFF',
    fontSize: 15,
    lineHeight: 22,
  },
  suggestionsContent: {
    paddingVertical: 8,
  },
  suggestionsScrollContent: {
    paddingBottom: 4,
  },
  suggestionButton: {
    backgroundColor: 'rgba(12, 53, 47, 0.85)',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.4)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  suggestionText: {
    color: '#FBB848',
    fontSize: 13,
    fontWeight: '500',
  },
  topicBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  }
});
