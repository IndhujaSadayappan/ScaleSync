import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import PricesScreen from '../screens/PricesScreen';
import { useAuth } from '../context/AuthContext';

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

const DashboardStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: '#007AFF' },
      headerTintColor: '#FFF',
      headerTitleStyle: { fontWeight: 'bold' },
    }}
  >
    <Stack.Screen
      name="Dashboard"
      component={DashboardScreen}
      options={{ title: 'Dashboard' }}
    />
  </Stack.Navigator>
);

const NotificationsStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: '#007AFF' },
      headerTintColor: '#FFF',
      headerTitleStyle: { fontWeight: 'bold' },
    }}
  >
    <Stack.Screen
      name="NotificationsNav"
      component={NotificationsScreen}
      options={{ title: 'Notifications' }}
    />
  </Stack.Navigator>
);

const PricesStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: '#007AFF' },
      headerTintColor: '#FFF',
      headerTitleStyle: { fontWeight: 'bold' },
    }}
  >
    <Stack.Screen
      name="PricesNav"
      component={PricesScreen}
      options={{ title: 'Update Prices' }}
    />
  </Stack.Navigator>
);

const DrawerNavigatorComponent = () => {
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <Drawer.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#007AFF' },
        headerTintColor: '#FFF',
        headerTitleStyle: { fontWeight: 'bold' },
        drawerActiveTintColor: '#007AFF',
      }}
    >
      <Drawer.Screen
        name="Home"
        component={DashboardStack}
        options={{ title: 'Dashboard' }}
      />
      <Drawer.Screen
        name="Notifications"
        component={NotificationsStack}
        options={{ title: 'Notifications' }}
      />
      <Drawer.Screen
        name="Prices"
        component={PricesStack}
        options={{ title: 'Update Prices' }}
      />
    </Drawer.Navigator>
  );
};

export const RootNavigator = () => {
  const { token, loading } = useAuth();

  if (loading) {
    return null;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {token ? (
        <Stack.Screen
          name="App"
          component={DrawerNavigatorComponent}
          options={{ animationEnabled: false }}
        />
      ) : (
        <Stack.Screen
          name="Auth"
          component={LoginScreen}
          options={{ animationEnabled: false }}
        />
      )}
    </Stack.Navigator>
  );
};

export default RootNavigator;
