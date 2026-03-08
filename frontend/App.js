import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from './src/context/AuthContext';
import RootNavigator from './src/navigation/DrawerNavigator';

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer
        documentTitle={{
          formatter: (options, route) => {
            if (!options) return route?.name || 'ScaleSync';
            return options.title || route?.name || 'ScaleSync';
          }
        }}
      >
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
