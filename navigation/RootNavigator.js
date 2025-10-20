import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MobileNumberVerificationScreen from '../screens/MobileNumberVerificationScreen';
import OTPVerificationScreen from '../screens/OTPVerificationScreen';
import MessagesScreen from '../screens/MessagesScreen';
import SendMessagesScreen from '../screens/SendMessagesScreen';
import AdminPanelScreen from '../screens/AdminPanelScreen';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MessagesStack() {
  return (
    <Stack.Navigator initialRouteName="MessagesScreen">
      <Stack.Screen
        name="MessagesScreen"
        component={MessagesScreen}
        options={{ title: 'Messages' }}
      />
      <Stack.Screen
        name="SendMessagesScreen"
        component={SendMessagesScreen}
        options={{ title: 'Send Message' }}
      />
    </Stack.Navigator>
  );
}

function AdminStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="AdminPanelScreen"
        component={AdminPanelScreen}
        options={{ title: 'Admin Panel' }}
      />
    </Stack.Navigator>
  );
}

export default function RootNavigator() {
  return (
    <Stack.Navigator initialRouteName="MobileNumberVerification">
      <Stack.Screen
        name="MobileNumberVerification"
        component={MobileNumberVerificationScreen}
        options={{ title: 'Enter Mobile Number' }}
      />
      <Stack.Screen
        name="OTPVerification"
        component={OTPVerificationScreen}
        options={{ title: 'Verify OTP' }}
      />
      <Stack.Screen
        name="MainTabs"
        component={MainTabsNavigator}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

function MainTabsNavigator() {
  // Conditionally show Admin tab if enabled
  const enableAdmin =
    typeof process.env.REACT_NATIVE_APP_ENABLE_ADMIN !== 'undefined'
      ? process.env.REACT_NATIVE_APP_ENABLE_ADMIN === 'true'
      : true; // default true

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Messages') {
            iconName = focused ? 'chatbubble' : 'chatbubble-outline';
          } else if (route.name === 'Admin') {
            iconName = focused ? 'settings' : 'settings-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2f95dc',
        tabBarInactiveTintColor: 'gray',
        tabBarLabelStyle: { paddingBottom: Platform.OS === 'android' ? 4 : 0 },
        tabBarStyle: { height: 60 }
      })}
    >
      <Tab.Screen name="Messages" component={MessagesStack} />
      {enableAdmin && <Tab.Screen name="Admin" component={AdminStack} />}
    </Tab.Navigator>
  );
}
