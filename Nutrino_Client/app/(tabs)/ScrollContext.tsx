// ScrollContext.tsx
import React from 'react';
import { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

// Create a context to share the scroll handler across screens
export const ScrollContext = React.createContext({
  handleScroll: (_event: NativeSyntheticEvent<NativeScrollEvent>) => {},
  tabBarHeight: 0,
});
