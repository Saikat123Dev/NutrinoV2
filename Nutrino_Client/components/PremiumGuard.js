import { useEffect, useState, useRef } from 'react';
import { checkUserSubscription } from '../configs/subscription';
import { router } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import { PlanContext } from '@/context/PlanContext';

export default function PremiumGuard({ children }) {
  const { user, isLoaded } = useUser();
  const [subscriptionId, setSubscriptionId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const hasRedirected = useRef(false); // <- controls infinite redirects

  useEffect(() => {
    let isActive = true;

    const verifySubscription = async () => {
      if (!user?.primaryEmailAddress?.emailAddress) {
        if (!hasRedirected.current) {
          hasRedirected.current = true;
          await router.replace('/auth');
        }
        return;
      }

      try {
        const result = await checkUserSubscription(
          user.primaryEmailAddress.emailAddress
        );

        if (!isActive) return;

        if (result?.hasActiveSubscription) {
          setSubscriptionId(result.subscriptionId);
          setIsLoading(false);
        } else {
          if (!hasRedirected.current) {
            hasRedirected.current = true;
            await router.replace('/(tabs)/subscription');
          }
        }
      } catch (error) {
        console.error('Unexpected subscription verification error: from sub', error);
        if (!hasRedirected.current) {
          hasRedirected.current = true;
          await router.replace('/(tabs)/subscription');
        }
      }
    };

    if (isLoaded && !hasRedirected.current) {
      verifySubscription();
    }

    return () => {
      isActive = false;
    };
  }, [isLoaded, user]);

  if (!isLoaded || isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <PlanContext.Provider value={subscriptionId}>
      {children}
    </PlanContext.Provider>
  );
}
