import React from 'react';
import { Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppProvider } from './src/context/AppContext';
import HomeScreen from './src/screens/HomeScreen';
import AddFoodScreen from './src/screens/AddFoodScreen';
import CreateFoodScreen from './src/screens/CreateFoodScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { colors } from './src/theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const navTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    background: colors.bg,
    card: colors.card,
    text: colors.text,
    border: colors.border,
    primary: colors.primary,
  },
};

const headerOptions = {
  headerStyle: { backgroundColor: colors.card },
  headerTintColor: colors.text,
  headerTitleStyle: { fontWeight: '700' },
  contentStyle: { backgroundColor: colors.bg },
};

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={headerOptions}>
      <Stack.Screen name="HomeMain" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="AddFood" component={AddFoodScreen} options={{ title: 'Add Food' }} />
      <Stack.Screen name="CreateFood" component={CreateFoodScreen} options={{ title: 'New Custom Food' }} />
    </Stack.Navigator>
  );
}

function tabIcon(icon) {
  return ({ focused }) => (
    <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{icon}</Text>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <StatusBar style="light" />
        <NavigationContainer theme={navTheme}>
          <Tab.Navigator
            screenOptions={{
              headerShown: false,
              tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
              tabBarActiveTintColor: colors.primary,
              tabBarInactiveTintColor: colors.textDim,
            }}
          >
            <Tab.Screen
              name="Home"
              component={HomeStack}
              options={{ tabBarIcon: tabIcon('🍽️'), title: 'Today' }}
            />
            <Tab.Screen
              name="Profile"
              component={ProfileScreen}
              options={{ tabBarIcon: tabIcon('💪'), title: 'Profile' }}
            />
            <Tab.Screen
              name="Settings"
              component={SettingsScreen}
              options={{ tabBarIcon: tabIcon('⚙️'), title: 'Settings' }}
            />
          </Tab.Navigator>
        </NavigationContainer>
      </AppProvider>
    </SafeAreaProvider>
  );
}
