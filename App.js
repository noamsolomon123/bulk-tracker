import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import {
  Heebo_300Light,
  Heebo_400Regular,
  Heebo_500Medium,
  Heebo_700Bold,
  Heebo_800ExtraBold,
  Heebo_900Black,
} from '@expo-google-fonts/heebo';
import { SecularOne_400Regular } from '@expo-google-fonts/secular-one';

import { AppProvider } from './src/context/AppContext';
import HomeScreen from './src/screens/HomeScreen';
import AddFoodScreen from './src/screens/AddFoodScreen';
import CreateFoodScreen from './src/screens/CreateFoodScreen';
import ScanBarcodeScreen from './src/screens/ScanBarcodeScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import StatsScreen from './src/screens/StatsScreen';
import DayDetailScreen from './src/screens/DayDetailScreen';
import { colors, fonts } from './src/theme';

function dayTitle(key) {
  if (!key) return 'פירוט יום';
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' });
}

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const navTheme = {
  ...DefaultTheme,
  dark: true,
  colors: { ...DefaultTheme.colors, background: colors.bg, card: colors.card, text: colors.text, border: colors.border, primary: colors.volt },
};

const headerOptions = {
  headerStyle: { backgroundColor: colors.bgElev },
  headerTintColor: colors.volt,
  headerTitleStyle: { fontFamily: fonts.display, fontSize: 20, color: colors.text },
  headerShadowVisible: false,
  contentStyle: { backgroundColor: colors.bg },
};

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={headerOptions}>
      <Stack.Screen name="HomeMain" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="AddFood" component={AddFoodScreen} options={{ title: 'הוספת מזון' }} />
      <Stack.Screen name="CreateFood" component={CreateFoodScreen} options={{ title: 'מזון שלי חדש' }} />
      <Stack.Screen name="ScanBarcode" component={ScanBarcodeScreen} options={{ title: 'סריקת ברקוד' }} />
    </Stack.Navigator>
  );
}

function StatsStack() {
  return (
    <Stack.Navigator screenOptions={headerOptions}>
      <Stack.Screen name="StatsMain" component={StatsScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="DayDetail"
        component={DayDetailScreen}
        options={({ route }) => ({ title: dayTitle(route.params?.dateKey) })}
      />
    </Stack.Navigator>
  );
}

const TAB_ICONS = { Home: '🔥', Stats: '📊', Profile: '💪', Settings: '⚙️' };

function IronTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[tab.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = options.title ?? route.name;
        const focused = state.index === index;
        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
        };
        return (
          <Pressable key={route.key} onPress={onPress} style={tab.item}>
            <View style={[tab.indicator, focused && tab.indicatorOn]} />
            <Text style={[tab.icon, { opacity: focused ? 1 : 0.45 }]}>{TAB_ICONS[route.name]}</Text>
            <Text style={[tab.label, focused ? tab.labelOn : tab.labelOff]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function LoadingScreen() {
  return (
    <View style={load.root}>
      <View style={load.seam} />
      <Text style={load.mark}>מסה</Text>
      <Text style={load.sub}>IRON SURPLUS</Text>
    </View>
  );
}

export default function App() {
  const [loaded] = useFonts({
    Heebo_300Light,
    Heebo_400Regular,
    Heebo_500Medium,
    Heebo_700Bold,
    Heebo_800ExtraBold,
    Heebo_900Black,
    SecularOne_400Regular,
  });

  if (!loaded) {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" />
        <LoadingScreen />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <AppProvider>
        <StatusBar style="light" />
        <NavigationContainer theme={navTheme}>
          <Tab.Navigator screenOptions={{ headerShown: false }} tabBar={(props) => <IronTabBar {...props} />}>
            <Tab.Screen name="Home" component={HomeStack} options={{ title: 'היום' }} />
            <Tab.Screen name="Stats" component={StatsStack} options={{ title: 'נתונים' }} />
            <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'פרופיל' }} />
            <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: 'הגדרות' }} />
          </Tab.Navigator>
        </NavigationContainer>
      </AppProvider>
    </SafeAreaProvider>
  );
}

const tab = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.bgElev,
    borderTopWidth: 1.5,
    borderTopColor: colors.border,
    paddingTop: 8,
  },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  indicator: { width: 26, height: 3, borderRadius: 3, backgroundColor: 'transparent', marginBottom: 7 },
  indicatorOn: { backgroundColor: colors.volt },
  icon: { fontSize: 20, marginBottom: 3 },
  label: { fontSize: 11, letterSpacing: 0.5 },
  labelOn: { fontFamily: fonts.extrabold, color: colors.text },
  labelOff: { fontFamily: fonts.medium, color: colors.textFaint },
});

const load = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  seam: { position: 'absolute', top: 0, left: 0, right: 0, height: 3, backgroundColor: colors.volt },
  mark: { fontFamily: fonts.display, fontSize: 64, color: colors.text },
  sub: { fontFamily: fonts.bold, fontSize: 13, letterSpacing: 6, color: colors.volt, marginTop: 4 },
});
