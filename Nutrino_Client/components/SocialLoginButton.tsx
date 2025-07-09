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
  View,
} from "react-native";

const SocialLoginButton = ({
  strategy,
}: {
  strategy: "facebook" | "google" | "apple";
}) => {
  const getStrategy = () => {
    switch (strategy) {
      case "facebook":
        return "oauth_facebook";
      case "google":
        return "oauth_google";
      case "apple":
        return "oauth_apple";
      default:
        return "oauth_facebook";
    }
  };

  const { startOAuthFlow } = useOAuth({ strategy: getStrategy() });
  const { user, isLoaded, isSignedIn } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [sessionActivated, setSessionActivated] = useState(false); // 🔧 New state
  const router = useRouter();

  useEffect(() => {
    if (sessionActivated && isLoaded && isSignedIn) {
      console.log("✅ User is signed in, navigating...");
      router.replace("/(tabs)/subscription");
    }
  }, [sessionActivated, isLoaded, isSignedIn]);

  const buttonText = () => {
    if (isLoading) {
      return "Loading...";
    }
    switch (strategy) {
      case "facebook":
        return "Continue with Facebook";
      case "google":
        return "Continue with Google";
      case "apple":
        return "Continue with Apple";
      default:
        return "Continue";
    }
  };

  const buttonIcon = () => {
    switch (strategy) {
      case "facebook":
        return <Ionicons name="logo-facebook" size={24} color="#1977F3" />;
      case "google":
        return <Ionicons name="logo-google" size={24} color="#DB4437" />;
      case "apple":
        return <Ionicons name="logo-apple" size={24} color="black" />;
      default:
        return null;
    }
  };

  const onSocialLoginPress = useCallback(async () => {
    try {
      setIsLoading(true);

      const { createdSessionId, setActive } = await startOAuthFlow({
        redirectUrl: Linking.createURL("/", {
          scheme: "nutrinoclient", // make sure this matches your app.json scheme
        }),
      });

      if (createdSessionId && setActive) {
        console.log("✅ Session created", createdSessionId);
        await setActive({ session: createdSessionId });

        // Wait briefly to allow Clerk to refresh state
        setSessionActivated(true);
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
