import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import axios from 'axios';

import MobileNumberVerificationScreen from './screens/MobileNumberVerificationScreen';
import OTPVerificationScreen from './screens/OTPVerificationScreen';
import MessagesScreen from './screens/MessagesScreen';
import AdminPanelScreen from './screens/AdminPanelScreen';
import SendMessagesScreen from './screens/SendMessagesScreen';
import MessageSettingsScreen from './screens/MessageSettingsScreen';
import MarkAttendance from './screens/MarkAttendance';
import ManageAttendanceScreen from './screens/ManageAttendanceScreen';
import TransportAttendanceCountScreen from './screens/TransportAttendanceCountScreen';
import TransportAttendanceReportScreen from './screens/TransportAttendanceReportScreen';
import MarkEventAttendanceScreen from './screens/MarkEventAttendanceScreen';
import BackAttendanceScreen from './screens/BackAttendanceScreen';
import UploadHomeWorkScreen from './screens/UploadHomeWorkScreen';
import MarkHomeWorkScreen from './screens/MarkHomeWorkScreen';
import ViewHomeWorkScreen from './screens/ViewHomeWorkScreen';
import ViewSyllabusScreen from './screens/ViewSyllabusScreen';
import SyllabusReportsScreen from './screens/SyllabusReportsScreen';
import SubjectsScreen from './screens/SubjectsScreen';
import AttendanceCountScreen from './screens/AttendanceCountScreen';
import ViewStudentAttendanceScreen from './screens/ViewStudentAttendanceScreen';
import SingleStudentAttendanceScreen from './screens/SingleStudentAttendanceScreen';
import ScanStudentScreen from './screens/ScanStudentScreen';
import UploadReportScreen from './screens/UploadReportScreen';
import ViewReportScreen from './screens/ViewReportScreen';
import ViewReportDateScreen from './screens/ViewReportDateScreen';
import CategoriesScreen from './screens/CategoriesScreen';
import ManageCounterScreen from './screens/ManageCounterScreen';
import ManageStaffScreen from './screens/ManageStaffScreen';
import AddStaffScreen from './screens/AddStaffScreen';
import StaffProfileScreen from './screens/StaffProfileScreen';
import StaffRemarksScreen from './screens/StaffRemarksScreen';
import DisciplineProfileScreen from './screens/DisciplineProfileScreen';
import SalaryDetailsScreen from './screens/SalaryDetailsScreen';
import StaffAttendanceScreen from './screens/StaffAttendanceScreen';
import AdvancePaymentScreen from './screens/AdvancePaymentScreen';
import AddEnquiryScreen from './screens/AddEnquiryScreen';
import EnquiryListScreen from './screens/EnquiryListScreen';
import AdminFeeReportScreen from './screens/AdminFeeReportScreen';
import FeeReminderScreen from './screens/FeeReminderScreen';
import DefaulterListScreen from './screens/DefaulterListScreen';
import PublishResultScreen from './screens/PublishResultScreen';
import HolidaysEventScreen from './screens/HolidaysEventScreen';
import MarksEntryScreen from './screens/MarksEntryScreen';
import StudentProfileScreen from './screens/StudentProfileScreen';
import SearchStudentScreen from './screens/SearchStudentScreen';
import ViewQueriesScreen from './screens/ViewQueriesScreen';
import PrepareOnlineMaterialScreen from './screens/PrepareOnlineMaterialScreen';
import ViewOnlineMaterialScreen from './screens/ViewOnlineMaterialScreen';
import ViewOnlineExamsScreen from './screens/ViewOnlineExamsScreen';
import CreateOnlineExamScreen from './screens/CreateOnlineExamScreen';
import ViewOnlineExamQuestionsScreen from './screens/ViewOnlineExamQuestionsScreen';
import AddOnlineExamQuestionScreen from './screens/AddOnlineExamQuestionScreen';
import OnlineExamSettingsScreen from './screens/OnlineExamSettingsScreen';
import OnlineClassSchedulesScreen from './screens/OnlineClassSchedulesScreen';
import AddOnlineClassScreen from './screens/AddOnlineClassScreen';
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
          let iconName = 'account-circle'; // proper default?
          if (route.name === 'Messages') iconName = 'account-circle';
          else if (route.name === 'AdminPanel') iconName = 'account-cog';

          return <Icon name={iconName} size={30} color={color} />;
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Messages" component={MessagesScreen} options={{ tabBarLabel: 'Messages' }} />
      <Tab.Screen name="AdminPanel" component={AdminPanelScreen} options={{ tabBarLabel: 'Admin' }} />
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
            <Stack.Screen
              name="MarkAttendance"
              component={MarkAttendance}
              options={{
                title: 'Mark Attendance',
                headerStyle: { backgroundColor: '#5a45d4' },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold' },
              }}
            />
            <Stack.Screen
              name="ManageAttendanceScreen"
              component={ManageAttendanceScreen}
              options={{
                title: 'Manage Attendance',
                headerStyle: { backgroundColor: '#5a45d4' },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold' },
              }}
            />
            <Stack.Screen
              name="TransportAttendanceCountScreen"
              component={TransportAttendanceCountScreen}
              options={{
                title: 'Transport Attendance Count',
                headerStyle: { backgroundColor: '#5a45d4' },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold' },
              }}
            />
            <Stack.Screen
              name="TransportAttendanceReportScreen"
              component={TransportAttendanceReportScreen}
              options={{
                title: 'Transport Attendance Report',
                headerStyle: { backgroundColor: '#5a45d4' },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold' },
              }}
            />
            <Stack.Screen
              name="MarkEventAttendanceScreen"
              component={MarkEventAttendanceScreen}
              options={{
                title: 'Mark Event Attendance',
                headerStyle: { backgroundColor: '#5a45d4' },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold' },
              }}
            />
            <Stack.Screen
              name="BackAttendanceScreen"
              component={BackAttendanceScreen}
              options={{
                title: 'Back Attendance',
                headerStyle: { backgroundColor: '#5a45d4' },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold' },
              }}
            />
            <Stack.Screen
              name="UploadHomeWorkScreen"
              component={UploadHomeWorkScreen}
              options={{
                title: 'Upload Homework',
                headerStyle: { backgroundColor: '#5a45d4' }, // Or match context color
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold' },
              }}
            />
            <Stack.Screen
              name="MarkHomeWorkScreen"
              component={MarkHomeWorkScreen}
              options={{
                title: 'Mark Homework',
                headerStyle: { backgroundColor: '#5a45d4' },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold' },
              }}
            />
            <Stack.Screen
              name="ViewHomeWorkScreen"
              component={ViewHomeWorkScreen}
              options={{
                title: 'View Homework',
                headerStyle: { backgroundColor: '#5a45d4' },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold' },
              }}
            />
            <Stack.Screen
              name="ViewSyllabusScreen"
              component={ViewSyllabusScreen}
              options={{
                title: 'View Syllabus',
                headerStyle: { backgroundColor: '#5a45d4' },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold' },
              }}
            />
            <Stack.Screen
              name="SyllabusReportsScreen"
              component={SyllabusReportsScreen}
              options={{
                title: 'Syllabus Reports',
                headerStyle: { backgroundColor: '#5a45d4' },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold' },
              }}
            />
            <Stack.Screen
              name="SubjectsScreen"
              component={SubjectsScreen}
              options={{
                title: 'Manage Subjects',
                headerStyle: { backgroundColor: '#5a45d4' },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold' },
              }}
            />
            <Stack.Screen
              name="AdminPanel"
              component={AdminPanelScreen}
              options={{
                title: 'Admin Panel',
                headerStyle: { backgroundColor: '#5a45d4' },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold' },
              }}
            />
            <Stack.Screen
              name="AttendanceCountScreen"
              component={AttendanceCountScreen}
              options={{
                title: 'Attendance Count',
                headerStyle: { backgroundColor: '#5a45d4' },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold' },
              }}
            />
            <Stack.Screen
              name="ViewStudentAttendanceScreen"
              component={ViewStudentAttendanceScreen}
              options={{
                title: 'View Attendance',
                headerStyle: { backgroundColor: '#5a45d4' },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold' },
              }}
            />
            <Stack.Screen
              name="SingleStudentAttendanceScreen"
              component={SingleStudentAttendanceScreen}
              options={{
                title: 'Single Student Attendance',
                headerStyle: { backgroundColor: '#5a45d4' },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold' },
              }}
            />
            <Stack.Screen
              name="ScanStudentScreen"
              component={ScanStudentScreen}
              options={{
                title: 'Scan QR/Barcode',
                headerStyle: { backgroundColor: '#5a45d4' },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold' },
              }}
            />
            <Stack.Screen
              name="UploadReportScreen"
              component={UploadReportScreen}
              options={{
                title: 'Upload Report',
                headerStyle: { backgroundColor: '#5a45d4' },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold' },
              }}
            />
            <Stack.Screen
              name="ViewReportScreen"
              component={ViewReportScreen}
              options={{
                title: 'View Report',
                headerStyle: { backgroundColor: '#5a45d4' },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold' },
              }}
            />
            <Stack.Screen
              name="CategoriesScreen"
              component={CategoriesScreen}
              options={{
                title: 'Manage Categories',
                headerStyle: { backgroundColor: '#5a45d4' },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold' },
              }}
            />
            <Stack.Screen
              name="ManageCounterScreen"
              component={ManageCounterScreen}
              options={{ title: 'Manage Counters' }}
            />
            <Stack.Screen
              name="ManageStaffScreen"
              component={ManageStaffScreen}
              options={{
                title: 'Manage Staff',
                headerStyle: { backgroundColor: '#5a45d4' },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold' },
              }}
            />
            <Stack.Screen
              name="ViewReportDateScreen"
              component={ViewReportDateScreen}
              options={{
                title: 'View Date Wise Report',
                headerStyle: { backgroundColor: '#5a45d4' },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold' },
              }}
            />
            <Stack.Screen
              name="AddStaffScreen"
              component={AddStaffScreen}
              options={({ route }) => ({
                title: route.params?.staff ? 'Edit Staff' : 'Add Staff',
                headerStyle: { backgroundColor: '#5a45d4' },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold' },
              })}
            />
            <Stack.Screen
              name="StaffProfileScreen"
              component={StaffProfileScreen}
              options={{
                title: 'Employee Profile',
                headerStyle: { backgroundColor: '#5a45d4' },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold' },
              }}
            />
            <Stack.Screen
              name="StaffRemarksScreen"
              component={StaffRemarksScreen}
              options={{
                title: 'Add Remarks',
                headerStyle: { backgroundColor: '#5a45d4' },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold' },
              }}
            />
            <Stack.Screen
              name="DisciplineProfileScreen"
              component={DisciplineProfileScreen}
              options={{
                title: 'Discipline Profile',
                headerStyle: { backgroundColor: '#5a45d4' },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold' },
              }}
            />
            <Stack.Screen
              name="SalaryDetailsScreen"
              component={SalaryDetailsScreen}
              options={{
                title: 'Salary Details',
                headerStyle: { backgroundColor: '#5a45d4' },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold' },
              }}
            />
            <Stack.Screen
              name="StaffAttendanceScreen"
              component={StaffAttendanceScreen}
              options={{
                title: 'Staff Attendance',
                headerStyle: { backgroundColor: '#5a45d4' },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold' },
              }}
            />
            <Stack.Screen
              name="AdvancePaymentScreen"
              component={AdvancePaymentScreen}
              options={{
                title: 'Advance Payment',
                headerStyle: { backgroundColor: '#5a45d4' },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold' },
              }}
            />
            <Stack.Screen
              name="AddEnquiryScreen"
              component={AddEnquiryScreen}
              options={{
                title: 'Add Enquiry',
                headerStyle: { backgroundColor: '#5a45d4' },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold' },
              }}
            />
            <Stack.Screen
              name="EnquiryListScreen"
              component={EnquiryListScreen}
              options={{
                title: 'Enquiries List',
                headerStyle: { backgroundColor: '#5a45d4' },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold' },
              }}
            />
            <Stack.Screen
              name="AdminFeeReportScreen"
              component={AdminFeeReportScreen}
              options={{
                title: 'Fee Report',
                headerStyle: { backgroundColor: '#5a45d4' },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold' },
              }}
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
            <Stack.Screen
              name="MessageSettingsScreen"
              component={MessageSettingsScreen}
              options={{
                title: 'Message Settings',
                headerStyle: { backgroundColor: mainButtonColor },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold' },
              }}
            />
            <Stack.Screen
              name="FeeReminderScreen"
              component={FeeReminderScreen}
              options={{
                title: 'Fee Reminder',
                headerStyle: { backgroundColor: '#5a45d4' },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold' },
              }}
            />
            <Stack.Screen
              name="DefaulterListScreen"
              component={DefaulterListScreen}
              options={{
                title: 'Defaulter List',
                headerStyle: { backgroundColor: '#5a45d4' },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold' },
              }}
            />
            <Stack.Screen
              name="PublishResultScreen"
              component={PublishResultScreen}
              options={{
                title: 'Publish Result',
                headerStyle: { backgroundColor: '#5a45d4' },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold' },
              }}
            />
            <Stack.Screen
              name="HolidaysEventScreen"
              component={HolidaysEventScreen}
              options={{
                title: 'Holidays / Events',
                headerStyle: { backgroundColor: '#5a45d4' },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold' },
              }}
            />

            <Stack.Screen
              name="MarksEntryScreen"
              component={MarksEntryScreen}
              options={{
                title: 'Marks Entry',
                headerStyle: { backgroundColor: '#5a45d4' },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold' },
              }}
            />
            <Stack.Screen
              name="StudentProfileScreen"
              component={StudentProfileScreen}
              options={{
                title: 'Student Profile',
                headerStyle: { backgroundColor: '#5a45d4' },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold' },
              }}
            />
            <Stack.Screen
              name="SearchStudentScreen"
              component={SearchStudentScreen}
              options={{
                title: 'Search by Class',
                headerStyle: { backgroundColor: '#5a45d4' },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold' },
              }}
            />

            <Stack.Screen
              name="ViewQueriesScreen"
              component={ViewQueriesScreen}
              options={{
                title: 'View Queries',
                headerStyle: { backgroundColor: '#5a45d4' },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold' },
              }}
            />
            <Stack.Screen
              name="PrepareOnlineMaterialScreen"
              component={PrepareOnlineMaterialScreen}
              options={{
                title: 'Prepare Online Material',
                headerStyle: { backgroundColor: '#5a45d4' },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold' },
              }}
            />
            <Stack.Screen
              name="ViewOnlineMaterialScreen"
              component={ViewOnlineMaterialScreen}
              options={{
                title: 'View Online Material',
                headerStyle: { backgroundColor: '#5a45d4' },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold' },
              }}
            />
            <Stack.Screen
              name="ViewOnlineExamsScreen"
              component={ViewOnlineExamsScreen}
              options={{
                title: 'Online Exams',
                headerStyle: { backgroundColor: '#5a45d4' },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold' },
              }}
            />
            <Stack.Screen
              name="CreateOnlineExamScreen"
              component={CreateOnlineExamScreen}
              options={{
                title: 'Create/Edit Exam',
                headerStyle: { backgroundColor: '#5a45d4' },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold' },
              }}
            />
            <Stack.Screen
              name="ViewOnlineExamQuestionsScreen"
              component={ViewOnlineExamQuestionsScreen}
              options={{
                title: 'Exam Questions',
                headerStyle: { backgroundColor: '#5a45d4' },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold' },
              }}
            />
            <Stack.Screen
              name="AddOnlineExamQuestionScreen"
              component={AddOnlineExamQuestionScreen}
              options={{
                title: 'Add/Edit Question',
                headerStyle: { backgroundColor: '#5a45d4' },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold' },
              }}
            />

            <Stack.Screen
              name="OnlineClassSchedulesScreen"
              component={OnlineClassSchedulesScreen}
              options={{
                title: 'Online Classes',
                headerStyle: { backgroundColor: '#5a45d4' },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold' },
              }}
            />
            <Stack.Screen
              name="AddOnlineClassScreen"
              component={AddOnlineClassScreen}
              options={{
                title: 'Schedule Class',
                headerStyle: { backgroundColor: '#5a45d4' },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold' },
              }}
            />
            <Stack.Screen
              name="OnlineExamSettingsScreen"
              component={OnlineExamSettingsScreen}
              options={{
                title: 'Exam Settings',
                headerStyle: { backgroundColor: '#5a45d4' },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold' },
              }}
            />
        </Stack.Navigator>
      </NavigationContainer>
      </StyleProvider>
      <Toast />
    </CoreProvider>
  );
}