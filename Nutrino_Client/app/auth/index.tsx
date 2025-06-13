import SocialLoginButton from "../../components/SocialLoginButton";
import { LinearGradient } from "expo-linear-gradient";
import * as WebBrowser from "expo-web-browser";
import { useEffect } from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const useWarmUpBrowser = () => {
  useEffect(() => {
    // Warm up the android browser to improve UX
    // https://docs.expo.dev/guides/authentication/#improving-user-experience
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
};

WebBrowser.maybeCompleteAuthSession();

const AuthScreen = () => {
  useWarmUpBrowser();
  const insets = useSafeAreaInsets();
  const { width } = Dimensions.get("window");

  return (
    <View style={styles.container}>
      {/* Top area with gradient background */}
      <LinearGradient
        colors={["#4A80F0", "#3366FF"]}
        style={[
          styles.headerArea,
          { paddingTop: insets.top + 60, paddingBottom: 50 }
        ]}
      >
        <View style={styles.logoContainer}>
          {/* You can replace this with your actual logo */}
          <View style={styles.logoPlaceholder}>
            <Text style={styles.logoText}>DEV</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Content area */}
      <View style={[styles.contentArea, { paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.card}>
          <View style={styles.headingContainer}>
            <Text style={styles.welcomeText}>Welcome</Text>
            <Text style={styles.label}>Sign in to continue</Text>
            <Text style={styles.description}>
              Join thousands of developers around the world in building amazing projects.
            </Text>
          </View>

          <View style={styles.socialButtonsContainer}>
            <SocialLoginButton strategy="google" />
            <SocialLoginButton strategy="apple" />
            <SocialLoginButton strategy="facebook" />
          </View>

          <View style={styles.termsContainer}>
            <Text style={styles.termsText}>
              By continuing, you agree to our{" "}
              <Text style={styles.termsLink}>Terms of Service</Text> and{" "}
              <Text style={styles.termsLink}>Privacy Policy</Text>
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default AuthScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  headerArea: {
    height: "30%",
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  logoContainer: {
    alignItems: "center",
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  logoText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#3366FF",
  },
  contentArea: {
    flex: 1,
    backgroundColor: "transparent",
    marginTop: -40,
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headingContainer: {
    width: "100%",
    marginBottom: 24,
    alignItems: "center",
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#3366FF",
    marginBottom: 4,
  },
  label: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1A2138",
    marginBottom: 8,
    textAlign: "center",
  },
  description: {
    fontSize: 15,
    color: "#7B849B",
    textAlign: "center",
    lineHeight: 22,
    marginTop: 8,
  },
  socialButtonsContainer: {
    width: "100%",
    marginTop: 16,
    gap: 16,
  },
  termsContainer: {
    marginTop: 24,
    alignItems: "center",
  },
  termsText: {
    fontSize: 13,
    color: "#7B849B",
    textAlign: "center",
    lineHeight: 18,
  },
  termsLink: {
    color: "#3366FF",
    fontWeight: "500",
  },
});