import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Alert,
  TouchableOpacity,
  FlatList,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { CoreContext } from '../context/CoreContext';
import { StyleContext } from '../context/StyleContext';



const adminPanelStyles = {
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 20,
  },
  featureBox: {
    backgroundColor: '#fff',
    flex: 1,
    margin: 8,
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#a1887f',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
    borderWidth: 1,
  },
  featureLabel: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  headerContainer: {
    paddingTop: Platform.OS === 'android' ? 40 : 24,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greetingText: {
    fontSize: 18,
    color: '#ddd',
  },
  greetingName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 4,
  },
  headerIcons: {
    flexDirection: 'row',
  },
  iconButton: {
    marginLeft: 20,
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
  },
  attendanceCard: {
    marginTop: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  attendanceIconCircle: {
    backgroundColor: '#7a68f4',
    borderRadius: 40,
    padding: 12,
  },
  attendancePercentage: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  attendanceRemark: {
    color: '#eee',
    fontSize: 14,
    marginTop: 4,
  },
  statsRow: {
    marginTop: 28,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
    flex: 1,
    marginHorizontal: 6,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
  },
  statLabel: {
    fontSize: 14,
    color: '#555',
    marginTop: 4,
  },
  statSubTextRed: {
    color: '#d32f2f',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
  },
  statSubTextGreen: {
    color: '#388e3c',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
  },
  statSubTextBlue: {
    color: '#1976d2',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
  },
};

const adminPanelItems = [
  { key: 'sendMessages', label: 'Send Messages', icon: 'message-text', color: '#1976d2' },
  { key: 'manageAttendance', label: 'Manage Attendance', icon: 'calendar-check', color: '#388e3c' },
  { key: 'manageHomework', label: 'Manage Home Work', icon: 'clipboard-text', color: '#f57c00' },
  { key: 'manageReports', label: 'Manage Reports', icon: 'alert-circle-outline', color: '#d32f2f' },
  { key: 'manageStaff', label: 'Manage Staff', icon: 'account-group', color: '#9c27b0' },
  { key: 'addEnquiry', label: 'Add Enquiry', icon: 'account-plus', color: '#e91e63' },
  { key: 'manageCounters', label: 'Manage Counters', icon: 'key', color: '#303f9f' },
  { key: 'manageFee', label: 'Manage Fee', icon: 'currency-usd', color: '#388e3c' },
  { key: 'publishResult', label: 'Publish Result', icon: 'trending-up', color: '#388e3c' },
  { key: 'holidaysEvents', label: 'Holidays Events', icon: 'calendar-check', color: '#d32f2f' },
  { key: 'marksEntry', label: 'Marks Entry', icon: 'checkbox-marked-circle-outline', color: '#1976d2' },
  { key: 'studentProfile', label: 'Student Profile', icon: 'account', color: '#9c27b0' },
  { key: 'viewQueries', label: 'View Queries', icon: 'comment-alert-outline', color: '#fbc02d' },
  { key: 'softwareLink', label: 'Software Link', icon: 'file-document', color: '#e91e63' },
  { key: 'accountReports', label: 'Account Reports', icon: 'currency-usd', color: '#388e3c' },
  { key: 'onlineMaterial', label: 'Online Material', icon: 'bookmark', color: '#fbc02d' },
  { key: 'onlineExam', label: 'Online Exam', icon: 'message-text-outline', color: '#9c27b0' },
  { key: 'onlineClasses', label: 'Online Classes', icon: 'bookmark-outline', color: '#1976d2' },
  { key: 'transportGPS', label: 'Transport GPS', icon: 'train-car', color: '#1976d2' },

  { key: 'leavePlanner', label: 'Leave Planner', icon: 'calendar-clock', color: '#f57c00' },
  { key: 'myProfile', label: 'My Profile', icon: 'account-circle', color: '#9c27b0' },
];

function AdminHeader({ onLogout }) {
  return (
    <LinearGradient colors={['#5a45d4', '#8562ff']} style={adminPanelStyles.headerContainer}>
      <View style={adminPanelStyles.headerTopRow}>
        <View>
          <Text style={adminPanelStyles.greetingText}>Good Morning,</Text>
          <Text style={adminPanelStyles.greetingName}>Alex!</Text>
        </View>
        <View style={adminPanelStyles.headerIcons}>
          <TouchableOpacity style={adminPanelStyles.iconButton} activeOpacity={0.7}>
            <Icon name="bell" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={adminPanelStyles.iconButton} activeOpacity={0.7}>
            <Icon name="cog" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={[adminPanelStyles.iconButton, { marginLeft: 12 }]} onPress={onLogout} activeOpacity={0.7}>
            <Icon name="logout" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
      <View style={adminPanelStyles.attendanceCard}>
        <View style={adminPanelStyles.attendanceIconCircle}>
          <Icon name="checkbox-marked-circle-outline" size={28} color="#fff" />
        </View>
        <View style={{ marginLeft: 12, flex: 1 }}>
          <Text style={adminPanelStyles.attendancePercentage}>Attendance: 92%</Text>
          <Text style={adminPanelStyles.attendanceRemark}>Excellent! Keep it up</Text>
        </View>
      </View>
      <View style={adminPanelStyles.statsRow}>
        <View style={adminPanelStyles.statBox}>
          <Text style={adminPanelStyles.statNumber}>3</Text>
          <Text style={adminPanelStyles.statLabel}>Homework</Text>
          <Text style={adminPanelStyles.statSubTextRed}>2 due soon</Text>
        </View>
        <View style={adminPanelStyles.statBox}>
          <Text style={adminPanelStyles.statNumber}>$120</Text>
          <Text style={adminPanelStyles.statLabel}>Fees</Text>
          <Text style={adminPanelStyles.statSubTextGreen}>Paid</Text>
        </View>
        <View style={adminPanelStyles.statBox}>
          <Text style={adminPanelStyles.statNumber}>5</Text>
          <Text style={adminPanelStyles.statLabel}>Events</Text>
          <Text style={adminPanelStyles.statSubTextBlue}>This month</Text>
        </View>
      </View>
    </LinearGradient>
  );
}

export default function AdminPanelScreen({ navigation }) {
  const coreContext = React.useContext(CoreContext);
  const styleContext = React.useContext(StyleContext);

  const [filteredItems, setFilteredItems] = React.useState([]);

  useEffect(() => {
    coreContext.getSchoolData();
    coreContext.getAllowedTabs(); // Fetch allowed tabs
    coreContext.fetchSubjects();
    coreContext.fetchRoles();
    coreContext.fetchFeedbacks('');
    coreContext.fetchStaffs('active');
    if (!coreContext.isCached) coreContext.cacheStudents();
  }, []);

  useEffect(() => {
    setAccessibleTabs();
  }, [coreContext.allowedTabs, coreContext.role]);

  const setAccessibleTabs = () => {
    if (coreContext.role === 'super' || coreContext.role === 'tech') {
      setFilteredItems(adminPanelItems);
      return;
    }
    const accessible = adminPanelItems.filter(item => coreContext.hasTabPermission(item.key));
    setFilteredItems(accessible);
  };


  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            coreContext.deleteAsyncData(coreContext?.branchid);
            navigation.reset({
              index: 0,
              routes: [{ name: 'MobileNumberVerification' }],
            });
          },
        },
      ],
      { cancelable: true }
    );
  };


  const onItemPress = (item) => {
    if (item.key === 'sendMessages') {
      navigation.navigate('SendMessages');
    } else if (item.key === 'manageAttendance') {
      navigation.navigate('MarkAttendance');
    } else if (item.key === 'manageHomework') {
      navigation.navigate('UploadHomeWorkScreen');
    } else if (item.key === 'manageReports') {
      navigation.navigate('UploadReportScreen');
    } else if (item.key === 'manageStaff') {
      navigation.navigate('ManageStaffScreen');
    } else if (item.key === 'addEnquiry') {
      navigation.navigate('AddEnquiryScreen');
    } else if (item.key === 'manageCounters') {
      navigation.navigate('ManageCounterScreen');
    } else if (item.key === 'manageFee') {
      navigation.navigate('AdminFeeReportScreen');
    } else if (item.key === 'publishResult') {
      navigation.navigate('PublishResultScreen');
    } else if (item.key === 'holidaysEvents') {
      navigation.navigate('HolidaysEventScreen');
    } else if (item.key === 'marksEntry') {
      navigation.navigate('MarksEntryScreen');
    } else if (item.key === 'studentProfile') {
      navigation.navigate('StudentProfileScreen');
    } else if (item.key === 'viewQueries') {
      navigation.navigate('ViewQueriesScreen');
    } else if (item.key === 'softwareLink') {
      const url = coreContext.schoolData?.studentimgpath;
      if (url) {
        Linking.openURL(url).catch(err => {
          Alert.alert('Error', 'Could not open the link: ' + err.message);
        });
      } else {
        Alert.alert('Error', 'Software link not found. Please check your internet connection or contact support.');
      }
    } else if (item.key === 'accountReports') {
      const path = coreContext.schoolData?.studentimgpath;
      const bgcolor = coreContext.schoolData?.erpbg;
      const grp = coreContext.schoolData?.wgroup;
      const branchid = coreContext.branchid;

      if (path && bgcolor && grp && branchid) {
        let app = path.replace('admin', 'apps');
        app = app + 'MasterLedger.php?branch=' + branchid + '&grp=' + grp + '&appcode=x_yp@84P2S2s55R{>ul]dk%2&bgcolor=' + bgcolor + '&color=e7e7e7';

        Linking.openURL(app).catch(err => {
          Alert.alert('Error', 'Could not open the link: ' + err.message);
        });
      } else {
        Alert.alert('Error', 'Missing configuration data. Please check logic or internet connection.');
        console.log("Debug Info:", { path, bgcolor, grp, branchid });
      }
    } else if (item.key === 'onlineMaterial') {
      navigation.navigate('PrepareOnlineMaterialScreen');
    } else if (item.key === 'onlineExam') {
      navigation.navigate('ViewOnlineExamsScreen');
    } else if (item.key === 'onlineClasses') {
      navigation.navigate('OnlineClassSchedulesScreen');
    } else {
      Alert.alert(item.label, `You clicked on ${item.label}`);
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[adminPanelStyles.featureBox, { borderColor: item.color, borderWidth: 1 }]}
      onPress={() => onItemPress(item)}
      activeOpacity={0.7}
    >
      <Icon name={item.icon} size={36} color={item.color} />
      <Text style={[adminPanelStyles.featureLabel, { color: item.color }]}>{item.label}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView 
      style={{ 
        flex: 1, 
        backgroundColor: styleContext?.background?.backgroundColor || '#f4e0ff',
        paddingTop: Platform.OS === 'android' ? 0 : 0,
      }}
      edges={Platform.OS === 'ios' ? ['top', 'bottom'] : ['bottom']}
    >
      <AdminHeader onLogout={handleLogout} />
      <FlatList
        data={filteredItems}
        renderItem={renderItem}
        keyExtractor={(item) => item.key}
        numColumns={3}
        contentContainerStyle={adminPanelStyles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}