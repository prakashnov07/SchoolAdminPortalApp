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

const mainButtonColor = '#6a00ff';
const mainTextColor = '#fff';

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: '#6a00ff',
        tabBarInactiveTintColor: '#999',
        tabBarLabelStyle: { fontSize: 14, fontWeight: 'bold' },
        tabBarStyle: { backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#ddd' },
        tabBarIcon: ({ color, size }) => {
          let iconName = route.name === 'Messages' ? 'account-circle' : 'account-cog';
          return <Icon name={iconName} size={size} color={color} />;
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
    </CoreProvider>
  );
}