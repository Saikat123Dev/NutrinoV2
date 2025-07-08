import { useAuth, useUser } from "@clerk/clerk-expo";
import { Redirect, router, Stack, usePathname } from "expo-router";
import { useEffect, useState } from "react";
import axios from 'axios';

const API_BASE_URL = 'https://nutrinov2.onrender.com/api/v1';

export const createSubscriptionOrder = async (userId, planId) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/subscription/create-order`, {
      userId,
      planId
    });
    return response.data;
  } catch (error) {
    console.error('Error creating subscription order:', error);
    throw error;
  }
};

export const verifyPayment = async (paymentData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/subscription/verify`, paymentData);
    return response.data;
  } catch (error) {
    console.error('Error verifying payment:', error);
    throw error;
  }
};

export const checkUserSubscription = async (email) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/subscriptions/user/${email}`);
    return response.data;
  } catch (error) {
    console.error('Error checking subscription:', error);
    throw error;
  }
};

export default function AuthLayout() {
  const { user } = useUser();
  const pathName = usePathname();
  const { isSignedIn } = useAuth();
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkSubscription = async () => {
      if (isSignedIn && user?.emailAddresses?.[0]?.emailAddress) {
        try {
          const subscriptionData = await checkUserSubscription(user.emailAddresses[0].emailAddress);
          setSubscriptionStatus(subscriptionData);
        } catch (error) {
          console.error('Failed to check subscription:', error);
          setSubscriptionStatus(null);
        }
      }
      setIsLoading(false);
    };

    if (isSignedIn && user) {
      checkSubscription();
    } else {
      setIsLoading(false);
    }
  }, [isSignedIn, user]);

  // Show loading while checking subscription
  if (isLoading) {
    return null; // or a loading component
  }

  // If user is signed in but onboarding is not completed, redirect to tabs
  if (isSignedIn && user?.unsafeMetadata?.onboarding_completed !== true) {
    router.push("/(tabs)");
    return null;
  }

  // If user is signed in and onboarding is completed
  if (isSignedIn && user?.unsafeMetadata?.onboarding_completed === true) {
    // Check subscription status
    if (subscriptionStatus?.isActive || subscriptionStatus?.status === 'active') {
      // User has active subscription, redirect to main tabs
      return <Redirect href="/(tabs)" />;
    } else {
      // User doesn't have active subscription, redirect to subscription page
      return <Redirect href="/(tabs)/subscription" />;
    }
  }

  // Default render for non-signed in users
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
    </Stack>
  );
}