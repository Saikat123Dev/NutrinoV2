import { useEffect, useState } from 'react';
import { checkUserSubscription } from '../configs/subscription';
import { router } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import { PlanContext } from '@/context/PlanContext';

export default function PremiumGuard({ children }) {
  const { user } = useUser();
  const [subscriptionId, setSubscriptionId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const verifySubscription = async () => {
      try {
        const { hasActiveSubscription, subscriptionId } = await checkUserSubscription(
          user?.primaryEmailAddress?.emailAddress
        );
        console.log("subscription Id", subscriptionId)
        setSubscriptionId(subscriptionId); // Set it regardless (will be null if no subscription)
        setIsLoading(false);
        
        if (!hasActiveSubscription) {
          router.replace('/(tabs)/subscription');
        }
      } catch (error) {
        console.error('Subscription verification error:', error);
        setIsLoading(false); // Set loading to false before redirect
        router.replace('/(tabs)/subscription');
      }
    };

    if (user?.primaryEmailAddress?.emailAddress) {
      verifySubscription();
    } else {
      setIsLoading(false); // Set loading to false before redirect
      router.replace('/auth');
    }
  }, [user]);

  if (!user || isLoading) {
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