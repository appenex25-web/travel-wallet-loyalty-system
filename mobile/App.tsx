import { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { getTokenAsync } from './src/api';
import LoginScreen from './src/screens/LoginScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import ChangePasswordScreen from './src/screens/ChangePasswordScreen';
import TransactionPinScreen from './src/screens/TransactionPinScreen';
import HomeScreen from './src/screens/HomeScreen';
import WalletScreen from './src/screens/WalletScreen';
import QrScreen from './src/screens/QrScreen';
import MessagesScreen from './src/screens/MessagesScreen';
import PostScreen from './src/screens/PostScreen';
import BookingsScreen from './src/screens/BookingsScreen';
import AccountScreen from './src/screens/AccountScreen';
import CampaignDetailScreen from './src/screens/CampaignDetailScreen';
import ChatScreen from './src/screens/ChatScreen';
import WriteReviewScreen from './src/screens/WriteReviewScreen';
import HotelsScreen from './src/screens/HotelsScreen';
import FlightsScreen from './src/screens/FlightsScreen';
import HotelDetailScreen from './src/screens/HotelDetailScreen';
import FlightDetailScreen from './src/screens/FlightDetailScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TAB_BG = '#f8fafc';
const TAB_ACTIVE = '#2F7DFF';
const TAB_INACTIVE = '#64748b';

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: '#fff', borderTopColor: '#e2e8f0' },
        tabBarActiveTintColor: TAB_ACTIVE,
        tabBarInactiveTintColor: TAB_INACTIVE,
        tabBarLabelStyle: { fontSize: 11 },
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Home', tabBarIcon: ({ color }) => <Text style={{ fontSize: 22 }}>🏠</Text> }} />
      <Tab.Screen name="Messages" component={MessagesScreen} options={{ title: 'Messages', tabBarIcon: ({ color }) => <Text style={{ fontSize: 22 }}>💬</Text> }} />
      <Tab.Screen name="Post" component={PostScreen} options={{ title: 'Share trip', tabBarIcon: ({ color }) => <Text style={{ fontSize: 22 }}>📝</Text> }} />
      <Tab.Screen name="MyTrips" component={BookingsScreen} options={{ title: 'My Trips', tabBarIcon: ({ color }) => <Text style={{ fontSize: 22 }}>📅</Text> }} />
      <Tab.Screen name="Account" component={AccountScreen} options={{ title: 'Account', tabBarIcon: ({ color }) => <Text style={{ fontSize: 22 }}>👤</Text> }} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [ready, setReady] = useState(false);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    getTokenAsync().then((t) => {
      setHasToken(!!t);
      setReady(true);
    });
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: TAB_BG, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={TAB_ACTIVE} />
        <Text style={{ color: TAB_INACTIVE, marginTop: 12 }}>Loading…</Text>
        <StatusBar style="dark" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="dark" />
        <Stack.Navigator screenOptions={{ headerShown: true, contentStyle: { backgroundColor: TAB_BG } }} initialRouteName={hasToken ? 'Main' : 'Login'}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
        <Stack.Screen name="TransactionPin" component={TransactionPinScreen} options={{ title: 'Transaction PIN' }} />
        <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
        <Stack.Screen name="Wallet" component={WalletScreen} options={{ title: 'Wallet' }} />
        <Stack.Screen name="Scan" component={QrScreen} options={{ title: 'Show at till' }} />
        <Stack.Screen name="CampaignDetail" component={CampaignDetailScreen} options={{ title: 'Campaign' }} />
        <Stack.Screen name="Hotels" component={HotelsScreen} options={{ title: 'Hotels' }} />
        <Stack.Screen name="Flights" component={FlightsScreen} options={{ title: 'Flights' }} />
        <Stack.Screen name="HotelDetail" component={HotelDetailScreen} options={{ title: 'Hotel' }} />
        <Stack.Screen name="FlightDetail" component={FlightDetailScreen} options={{ title: 'Flight' }} />
        <Stack.Screen name="Chat" component={ChatScreen} options={{ title: 'Chat' }} />
        <Stack.Screen name="WriteReview" component={WriteReviewScreen} options={{ title: 'Write review' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
