import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import axios from 'axios';

import MobileNumberVerificationScreen from './screens/MobileNumberVerificationScreen';
import OTPVerificationScreen from './screens/OTPVerificationScreen';
import MessagesScreen from './screens/MessagesScreen';
import AdminPanelScreen from './screens/AdminPanelScreen';
import SendMessagesScreen from './screens/SendMessagesScreen';
import { CoreProvider } from './context/CoreContext';
import {StyleProvider} from './context/StyleContext';

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

import Toast from 'react-native-toast-message';

const security = 'sCHoOl-*&^et11@0o9<<$pdXxzrWlY*#';
axios.defaults.baseURL = 'https://schoolappdev.siddhantait.com'; // Replace with your actual API URL
axios.defaults.headers.common.Authorization = security;

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

import { LayoutAnimation, UIManager, Platform } from 'react-native';

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const mainButtonColor = '#6a00ff';
const mainTextColor = '#fff';

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: '#6a00ff',
        tabBarInactiveTintColor: '#999',
        tabBarLabelStyle: { fontSize: 13, fontWeight: 'bold', marginBottom: 5 },
        tabBarStyle: { backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#ddd', height: 80, paddingBottom: 5, paddingTop: 15 },
        tabBarIcon: ({ color, size }) => {
          let iconName = route.name === 'Messages' ? 'account-circle' : 'account-cog';
          return <Icon name={iconName} size={30} color={color} />;
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Messages" component={MessagesScreen} />
      <Tab.Screen name="AdminPanel" component={AdminPanelScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <CoreProvider>
      <StyleProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="MobileNumberVerification">
          <Stack.Screen name="MobileNumberVerification" component={MobileNumberVerificationScreen} options={{ headerShown: false }} />
          <Stack.Screen
            name="OTPVerification"
            component={OTPVerificationScreen}
            options={{ title: 'OTP Verification', headerStyle: { backgroundColor: mainButtonColor }, headerTintColor: mainTextColor, headerTitleStyle: { fontWeight: 'bold' } }}
          />
          <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
          <Stack.Screen
            name="SendMessages"
            component={SendMessagesScreen}
            options={{
              title: 'Send Messages',
              headerStyle: { backgroundColor: mainButtonColor },
              headerTintColor: '#fff',
              headerTitleStyle: { fontWeight: 'bold' },
              headerBackTitleVisible: false,
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
      </StyleProvider>
      <Toast />
    </CoreProvider>
  );
}