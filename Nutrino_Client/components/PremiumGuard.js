// components/PremiumGuard.js
import { useEffect } from 'react';

import { checkUserSubscription } from '../configs/subscription';
import { router } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useUser } from '@clerk/clerk-expo';

export default function PremiumGuard({ children }) {
  const { user } = useUser();
  console.log('User in PremiumGuard:', user);
  useEffect(() => {
    const verifySubscription = async () => {
      try {
        const { hasActiveSubscription } = await checkUserSubscription(user?.primaryEmailAddress?.emailAddress);
        if (!hasActiveSubscription) {
          router.replace('/(tabs)/subscription');
        }
      } catch (error) {
        console.error('Subscription verification error:', error);
        router.replace('/(tabs)/subscription');
      }
    };

    if (user?.primaryEmailAddress?.emailAddress) {
      verifySubscription();
    } else {
      router.replace('/login');
    }
  }, [user]);

  if (!user) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return children;
}