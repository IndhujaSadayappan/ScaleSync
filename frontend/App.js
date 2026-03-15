import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from './src/context/AuthContext';
import { LanguageProvider } from './src/context/LanguageContext';
import RootNavigator from './src/navigation/DrawerNavigator';

export default function App() {
  return (
    <LanguageProvider>
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
    </LanguageProvider>
  );
}
