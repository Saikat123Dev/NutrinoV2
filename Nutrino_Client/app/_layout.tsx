import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, Text, ActivityIndicator } from 'react-native';
import 'react-native-reanimated';
import { ClerkLoaded, ClerkProvider } from '@clerk/clerk-expo';
import { useColorScheme } from '@/hooks/useColorScheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

// Optimized token cache with AsyncStorage
const tokenCache = {
  async getToken(key: string) {
    try {
      return await AsyncStorage.getItem(key);
    } catch (err) {
      console.log('Token cache get error:', err);
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (err) {
      console.log('Token cache save error:', err);
    }
  },
};

function RootLayoutNav() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      
      <Stack.Screen name="auth" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="+not-found"
        options={{
          title: 'Oops!',
          presentation: 'modal',
          headerShown: true
        }}
      />
    </Stack>
  );
}

// Loading component for better UX
function LoadingScreen() {
  return (
    <View style={{ 
      flex: 1, 
      justifyContent: 'center', 
      alignItems: 'center', 
      backgroundColor: '#000' // or your app's background color
    }}>
      <ActivityIndicator size="large" color="#007AFF" />
      <Text style={{ 
        marginTop: 16, 
        fontSize: 16, 
        color: '#666',
        textAlign: 'center' 
      }}>
        Initializing...
      </Text>
    </View>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [isAppReady, setIsAppReady] = useState(false);
  
  const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
  
  if (!publishableKey) {
    throw new Error("Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in environment variables");
  }

  // Load fonts
  const [fontsLoaded, fontError] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // Parallel initialization effect
  useEffect(() => {
    async function prepareApp() {
      try {
        // Pre-warm AsyncStorage and any other background tasks
        await AsyncStorage.getItem('clerk-session'); // Pre-warm storage
        
        // Add any other background initialization here
        // await someOtherInitialization();
        
        // Small delay to ensure Clerk provider is ready
        await new Promise(resolve => setTimeout(resolve, 100));
        
        setIsAppReady(true);
      } catch (error) {
        console.warn('App preparation error:', error);
        setIsAppReady(true); // Continue anyway
      }
    }

    // Only start preparation once fonts are loaded (or failed)
    if (fontsLoaded || fontError) {
      prepareApp();
    }
  }, [fontsLoaded, fontError]);

  // Show loading screen until everything is ready
  if (!fontsLoaded && !fontError) {
    return <LoadingScreen />;
  }

  if (!isAppReady) {
    return <LoadingScreen />;
  }

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      tokenCache={tokenCache}
    >
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <ClerkLoaded>
          <RootLayoutNav />
          <StatusBar style="auto" />
        </ClerkLoaded>
      </ThemeProvider>
    </ClerkProvider>
  );
}