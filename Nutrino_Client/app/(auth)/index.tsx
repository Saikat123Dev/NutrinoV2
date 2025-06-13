import React, { useCallback, useEffect } from 'react'
import * as WebBrowser from 'expo-web-browser'
import * as AuthSession from 'expo-auth-session'
import { useSSO } from '@clerk/clerk-expo'
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Image,
  Platform,
} from 'react-native'

// Preload the browser for smoother auth
const useWarmUpBrowser = () => {
  useEffect(() => {
    void WebBrowser.warmUpAsync()
    return () => {
      void WebBrowser.coolDownAsync()
    }
  }, [])
}

export default function Page() {
  useWarmUpBrowser()

  // ✅ Avoid infinite re-renders
  useEffect(() => {
    WebBrowser.maybeCompleteAuthSession()
  }, [])

  const { startSSOFlow } = useSSO()

  const handleSSO = useCallback(
    async (provider: 'oauth_google' | 'oauth_facebook' | 'oauth_apple') => {
      try {
        const { createdSessionId, setActive } = await startSSOFlow({
          strategy: provider,
          redirectUrl: AuthSession.makeRedirectUri({
            native: 'expo://',
            useProxy: true,
          }),
        })

        if (createdSessionId) {
          await setActive!({ session: createdSessionId })
        }
      } catch (err) {
        console.error('SSO Error:', JSON.stringify(err, null, 2))
      }
    },
    [startSSOFlow]
  )

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome 👋</Text>
      <Text style={styles.subtitle}>Sign in to continue</Text>

      <TouchableOpacity
        style={[styles.button, styles.google]}
        onPress={() => handleSSO('oauth_google')}
      >
        <Image
          source={{
            uri: 'https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg',
          }}
          style={styles.icon}
        />
        <Text style={styles.buttonText}>Continue with Google</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.facebook]}
        onPress={() => handleSSO('oauth_facebook')}
      >
        <Image
          source={{
            uri: 'https://upload.wikimedia.org/wikipedia/commons/0/05/Facebook_Logo_%282019%29.png',
          }}
          style={styles.icon}
        />
        <Text style={styles.buttonText}>Continue with Facebook</Text>
      </TouchableOpacity>

      {Platform.OS === 'ios' && (
        <TouchableOpacity
          style={[styles.button, styles.apple]}
          onPress={() => handleSSO('oauth_apple')}
        >
          <Image
            source={{
              uri: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg',
            }}
            style={styles.icon}
          />
          <Text style={styles.buttonText}>Continue with Apple</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#111827',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 32,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 16,
    elevation: 2,
  },
  icon: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  google: {
    backgroundColor: '#4285F4',
  },
  facebook: {
    backgroundColor: '#1877F2',
  },
  apple: {
    backgroundColor: '#000',
  },
})
