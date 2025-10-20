import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import MobileNumberVerificationScreen from './screens/MobileNumberVerificationScreen';
import OTPVerificationScreen from './screens/OTPVerificationScreen';
import MessagesScreen from './screens/MessagesScreen';
import AdminPanelScreen from './screens/AdminPanelScreen';
import SendMessagesScreen from './screens/SendMessagesScreen';
import { MessagesProvider } from './context/MessagesContext';

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

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
    <MessagesProvider>
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
    </MessagesProvider>
  );
}