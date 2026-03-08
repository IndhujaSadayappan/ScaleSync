import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItemList
} from '@react-navigation/drawer';
import { TouchableOpacity, Text, StyleSheet, Image, View, SafeAreaView, ActivityIndicator } from 'react-native';

import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import PricesScreen from '../screens/PricesScreen';
import { useAuth } from '../context/AuthContext';

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

const HeaderLogo = () => (
  <View style={{
    marginRight: 15,
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFF'
  }}>
    <Image
      source={require('../../assets/logo.png')}
      style={{ width: '100%', height: '100%' }}
      resizeMode="cover"
    />
  </View>
);

const CustomDrawerContent = (props) => {
  const { logout } = useAuth();

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <DrawerContentScrollView {...props}>
        <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', marginBottom: 10 }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#0B0F2F' }}>ScaleSync</Text>
        </View>
        <DrawerItemList {...props} />
      </DrawerContentScrollView>

      <View style={{ padding: 20, borderTopWidth: 1, borderTopColor: '#F3F4F6' }}>
        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            padding: 12,
            backgroundColor: '#FEE2E2',
            borderRadius: 8
          }}
          onPress={() => logout()}
        >
          <Text style={{ color: '#EF4444', fontWeight: 'bold', marginLeft: 10 }}>Logout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const DashboardStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Dashboard" component={DashboardScreen} />
  </Stack.Navigator>
);

const NotificationsStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="NotificationsNav" component={NotificationsScreen} />
  </Stack.Navigator>
);

const PricesStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="PricesNav" component={PricesScreen} />
  </Stack.Navigator>
);

const DrawerNavigatorComponent = () => {
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: '#FFFFFF', elevation: 2, shadowOpacity: 0.1 },
        headerTintColor: '#0B0F2F',
        headerTitleStyle: { fontWeight: 'bold' },
        headerRight: () => <HeaderLogo />,
        drawerActiveTintColor: '#0B0F2F',
        drawerActiveBackgroundColor: '#F3F4F6',
        drawerInactiveTintColor: '#4B5563',
        drawerStyle: { backgroundColor: '#FFFFFF', width: 280 },
        drawerLabelStyle: { fontWeight: '500' }
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
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
        <ActivityIndicator size="large" color="#0B0F2F" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {token ? (
        <Stack.Screen
          name="App"
          component={DrawerNavigatorComponent}
          options={{ title: 'ScaleSync', animationEnabled: false }}
        />
      ) : (
        <Stack.Screen
          name="Auth"
          component={LoginScreen}
          options={{ title: 'Login - ScaleSync', animationEnabled: false }}
        />
      )}
    </Stack.Navigator>
  );
};

export default RootNavigator;
