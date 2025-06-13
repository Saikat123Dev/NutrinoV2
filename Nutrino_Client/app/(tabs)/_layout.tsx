import { Tabs } from "expo-router";
import React, { useRef } from "react";
import { Animated, NativeScrollEvent, NativeSyntheticEvent, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
// import { ScrollContext } from "./ScrollContext"; // Import from the separate file

// Custom dimensions
const TAB_BAR_WIDTH = "98%";
const TAB_ICON_SIZE = 26;
const TAB_BAR_HEIGHT = 72;
const ACTIVE_INDICATOR_HEIGHT = 3;

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  // Animation value for tab bar slide in/out
  const tabBarTranslateY = useRef(new Animated.Value(0)).current;

  // Track scroll direction
  const scrollY = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);
  const isScrollingDown = useRef(false);

  const tabs = [
    { name: "index", label: "Home" },
    { name: "conversation", label: "Chat" },
    { name: "grammer", label: "Grammar" },
    { name: "pronounciation", label: "Speech" },
    { name: "vocubulary", label: "Words" },
    { name: "profile", label: "Me" },
  ];

  // Animation values
  const animationValues = useRef<{ [key: string]: Animated.Value }>(
    Object.fromEntries(tabs.map(tab => [tab.name, new Animated.Value(1)]))
  ).current;
  const translateYValues = useRef<{ [key: string]: Animated.Value }>(
    Object.fromEntries(tabs.map(tab => [tab.name, new Animated.Value(0)]))
  ).current;
  const opacityValues = useRef<{ [key: string]: Animated.Value }>(
    Object.fromEntries(tabs.map(tab => [tab.name, new Animated.Value(tab.name === "index" ? 1 : 0.7)]))
  ).current;
  const glowValues = useRef<{ [key: string]: Animated.Value }>(
    Object.fromEntries(tabs.map(tab => [tab.name, new Animated.Value(0)]))
  ).current;
  const previousTab = useRef<string>("index");

  // Total height of the tab bar including safe area
  const totalTabBarHeight = TAB_BAR_HEIGHT + insets.bottom;

  // Handle scroll events to show/hide tab bar
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;

    // Determine scroll direction
    if (currentScrollY > lastScrollY.current && !isScrollingDown.current && currentScrollY > 10) {
      // Scrolling down - hide the tab bar
      isScrollingDown.current = true;
      Animated.spring(tabBarTranslateY, {
        toValue: totalTabBarHeight,
        useNativeDriver: true,
        friction: 8,
      }).start();
    } else if (currentScrollY < lastScrollY.current && isScrollingDown.current) {
      // Scrolling up - show the tab bar
      isScrollingDown.current = false;
      Animated.spring(tabBarTranslateY, {
        toValue: 0,
        useNativeDriver: true,
        friction: 8,
      }).start();
    }

    lastScrollY.current = currentScrollY;
    scrollY.setValue(currentScrollY);
  };

  return (
   
      <View style={styles.container}>
        <Tabs
          screenOptions={{
            tabBarShowLabel: false,
            headerShown: false,
            tabBarStyle: {
              display: 'none', // This hides the tab bar
            },
          }}
        >
          {tabs.map((tab) => (
            <Tabs.Screen
              key={tab.name}
              name={tab.name}
              options={{
                tabBarIcon: ({ focused }) => null, // No need for icons
              }}
            />
          ))}
        </Tabs>
      </View>
  
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 11, 75, 0.8)',
    borderWidth: 4,
    borderColor: 'rgba(124, 58, 255, 0.9)',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  activeIconContainer: {
    backgroundColor: 'rgba(124, 58, 237, 0.3)',
  },
  activeIndicator: {
    width: 24,
    height: ACTIVE_INDICATOR_HEIGHT,
    backgroundColor: '#FFF',
    borderRadius: 2,
    marginTop: 4,
  },
});