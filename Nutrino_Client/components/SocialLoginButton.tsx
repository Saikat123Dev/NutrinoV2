import { useOAuth, useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

const SocialLoginButton = ({
  strategy,
}: {
  strategy: "facebook" | "google" | "apple";
}) => {
  const getStrategy = () => {
    switch (strategy) {
      case "facebook": return "oauth_facebook";
      case "google": return "oauth_google";
      case "apple": return "oauth_apple";
      default: return "oauth_facebook";
    }
  };

  const { startOAuthFlow } = useOAuth({ strategy: getStrategy() });
  const { user, isLoaded, isSignedIn } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Check if profile is complete
  //   const isProfileComplete = (userData: any) => {
  //     return !!(
  //       userData &&
  //       userData.englishLevel &&
  //       userData.learningGoal &&
  //       userData.interests &&
  //       userData.focus &&
  //       userData.voice &&
  //       userData.motherToung
  //     );
  //   };

  // Effect to handle navigation after user data is loaded
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      console.log("User is signed in, navigating...");


      // Always navigate to complete-your-profile after login
      //  router.push("/auth/complete-your-account");

      // Uncomment this if you want to conditionally navigate based on profile completion



    }
  }, [isLoaded, isSignedIn, user, router]);

  const buttonText = () => {
    if (isLoading) {
      return "Loading...";
    }
    switch (strategy) {
      case "facebook": return "Continue with Facebook";
      case "google": return "Continue with Google";
      case "apple": return "Continue with Apple";
      default: return "Continue";
    }
  };

  const buttonIcon = () => {
    switch (strategy) {
      case "facebook": return <Ionicons name="logo-facebook" size={24} color="#1977F3" />;
      case "google": return <Ionicons name="logo-google" size={24} color="#DB4437" />;
      case "apple": return <Ionicons name="logo-apple" size={24} color="black" />;
      default: return null;
    }
  };

  const onSocialLoginPress = useCallback(async () => {
    try {
      setIsLoading(true);

      const { createdSessionId, setActive } = await startOAuthFlow({
        redirectUrl: Linking.createURL("/", {
          scheme: "myapp",
        }),
      });

      // If sign in was successful, set the active session
      if (createdSessionId && setActive) {
        console.log("Session created", createdSessionId);
        await setActive({ session: createdSessionId });
        // The useEffect will handle navigation once user data is updated
      } else {
        setIsLoading(false);
      }
    } catch (err) {
      console.error("OAuth error:", JSON.stringify(err, null, 2));
      setIsLoading(false);
      Alert.alert(
        "Authentication Error",
        "There was a problem with the authentication process. Please try again."
      );
    }
  }, [startOAuthFlow]);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onSocialLoginPress}
      disabled={isLoading}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color="black" />
      ) : (
        buttonIcon()
      )}
      <Text style={styles.buttonText}>{buttonText()}</Text>
      <View />
    </TouchableOpacity>
  );
};

export default SocialLoginButton;

const styles = StyleSheet.create({
  container: {
    width: "100%",
    borderColor: "gray",
    borderWidth: StyleSheet.hairlineWidth,
    padding: 10,
    borderRadius: 10,
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
    alignItems: "center",
  },
  buttonText: {
    fontSize: 15,
    fontWeight: "500",
  },
});