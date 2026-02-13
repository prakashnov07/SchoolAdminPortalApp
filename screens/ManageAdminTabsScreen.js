import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Switch, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import { CoreContext } from '../context/CoreContext';
import { StyleContext } from '../context/StyleContext';

export default function ManageAdminTabsScreen({ navigation }) {
    const coreContext = useContext(CoreContext);
    const styleContext = useContext(StyleContext);
    const { branchid, phone } = coreContext;

    const [roles, setRoles] = useState([]);
    const [loadingRoles, setLoadingRoles] = useState(true);
    const [expandedTab, setExpandedTab] = useState(null);
    const [tabPermissions, setTabPermissions] = useState({});
    const [loadingPermissions, setLoadingPermissions] = useState(false);

    // Hardcoded list of tabs from legacy ManageAdminTabs.js
    const adminTabs = [
        { key: 'messageForm', label: 'Send Messages', icon: 'message-text' },
        { key: 'markAttendance', label: 'Mark Attendance', icon: 'calendar-check' },
        { key: 'manageAttendance', label: 'Manage Attendance', icon: 'pencil' },
        { key: 'homeWork', label: 'Mark Homework', icon: 'clipboard-alert' },
        { key: 'uploadHomeWork', label: 'Upload Homework', icon: 'clipboard-text' },
        { key: 'viewReportAdmin', label: 'View Reports', icon: 'file-document-outline' },
        { key: 'otherReports', label: 'Upload Reports', icon: 'upload' },
        { key: 'addStaff', label: 'Add / Edit Users', icon: 'account-plus' },
        { key: 'allStaffs', label: 'Manage Users', icon: 'view-grid' },
        { key: 'addEnquiry', label: 'Add Enquiry', icon: 'account-plus' },
        { key: 'manageCounter', label: 'Manage Counter', icon: 'key' },
        { key: 'adminFeeReport', label: 'Fee Report', icon: 'text-box-outline' },
        { key: 'feeReminder', label: 'Fee Reminder', icon: 'bell' },
        { key: 'personalMessages', label: 'Personal Message', icon: 'message-text' },
        { key: 'viewHomeWorkStaff', label: 'View Homework', icon: 'clipboard-text' },
        { key: 'publishResult', label: 'Publish Result', icon: 'trending-up' },
        { key: 'uploadHolidays', label: 'Upload Holidays', icon: 'calendar-blank' },
        { key: 'viewStudentAttendance', label: 'View Attendance', icon: 'calendar-check' },
        { key: 'viewTimeTable', label: 'View Time-table', icon: 'clock-outline' },
        { key: 'uploadTimeTable', label: 'Upload Time-table', icon: 'clock-time-four-outline' },
        { key: 'adminStudent', label: 'Edit Profile', icon: 'account' },
        { key: 'backAttendance', label: 'Back Attendance', icon: 'history' },
        { key: 'googleQuiz', label: 'Google Quiz', icon: 'comment-question' },
        { key: 'viewFeedbacks', label: 'View Queries', icon: 'comment-alert' },
        { key: 'prepareOnlineMaterial', label: 'Online Material', icon: 'book' },
        { key: 'onlineExamList', label: 'Online Exam', icon: 'laptop' },
        { key: 'onlineClassSchedules', label: 'Online Classes', icon: 'school' },
        { key: 'codeScanner', label: 'QR Code Scanner', icon: 'qrcode' },
        { key: 'staffLeaveApplications', label: 'Staff Leave Applications', icon: 'account-group' },
        { key: 'staffManualAttendance', label: 'Staff Manual Attendance', icon: 'account-group' },
        { key: 'defaulterList', label: 'Defaulter List', icon: 'cash-remove' },
        { key: 'attendanceReport', label: 'Attendance Report', icon: 'calendar-clock' },
        { key: 'viewContactDetails', label: 'Contact Details', icon: 'phone' },
        { key: 'driverBuses', label: 'Transport GPS', icon: 'bus' },
        { key: 'markSingleStudentAttendance', label: 'Single Student Attendance', icon: 'account' },
        { key: 'onlineExamSettings', label: 'Online Exam Settings', icon: 'cog' },
        { key: 'marksEntry', label: 'Marks Entry', icon: 'format-list-numbered' },
        { key: 'accountReports', label: 'Account Reports', icon: 'cash' },
    ];

    useEffect(() => {
        fetchRoles();
    }, []);

    const fetchRoles = () => {
        setLoadingRoles(true);
        axios.get('/getroles', { params: { branchid } })
            .then(response => {
                setRoles(response.data.roles || []);
            })
            .catch(err => {
                console.error(err);
                Alert.alert('Error', 'Failed to fetch roles');
            })
            .finally(() => setLoadingRoles(false));
    };

    const fetchPermissions = (tabKey) => {
        setLoadingPermissions(true);
        axios.get('/gettabaccessreport', { params: { tab: tabKey, branchid } })
            .then(response => {
                // response.data.row is an object like { admin_role: "yes", user_role: "no", ... }
                setTabPermissions(response.data.row || {});
            })
            .catch(err => {
                console.error(err);
                Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to fetch permissions' });
            })
            .finally(() => setLoadingPermissions(false));
    };

    const handleExpandToggle = (tabKey) => {
        if (expandedTab === tabKey) {
            setExpandedTab(null);
            setTabPermissions({});
        } else {
            setExpandedTab(tabKey);
            setTabPermissions({}); // Clear previous
            fetchPermissions(tabKey);
        }
    };

    const togglePermission = (roleValue, currentStatus) => {
        const newStatus = currentStatus === 'yes' ? 'no' : 'yes'; // Toggle logic
        const tab = expandedTab;

        // Optimistic update
        const roleKey = `${roleValue}_role`;
        setTabPermissions(prev => ({ ...prev, [roleKey]: newStatus }));

        axios.post('/changeaccessreport', { 
            role: roleValue, 
            tab, 
            pstatus: newStatus, 
            owner: phone, 
            branchid 
        })
        .then(() => {
            // Success, maybe nothing to do?
            // fetchPermissions(tab); // Optionally re-fetch to confirm
        })
        .catch(err => {
            console.error(err);
            Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to update permission' });
            // Revert on error
            setTabPermissions(prev => ({ ...prev, [roleKey]: currentStatus }));
        });
    };

    const renderRoleItem = ({ item }) => {
        // item is a role object { id, rolenames, rolevalues }
        const roleKey = `${item.rolevalues}_role`;
        const hasAccess = tabPermissions[roleKey] === 'yes';

        return (
            <View style={styles.roleItem}>
                <Text style={styles.roleName}>{item.rolenames}</Text>
                <Switch
                    trackColor={{ false: "#767577", true: styleContext.primaryColor || '#81b0ff' }}
                    thumbColor={hasAccess ? styleContext.primaryColor || "#f5dd4b" : "#f4f3f4"}
                    onValueChange={() => togglePermission(item.rolevalues, tabPermissions[roleKey])}
                    value={hasAccess}
                    disabled={loadingPermissions}
                />
            </View>
        );
    };

    const renderTabItem = ({ item }) => {
        const isExpanded = expandedTab === item.key;

        return (
            <View style={styles.card}>
                <TouchableOpacity 
                    style={styles.cardHeader} 
                    onPress={() => handleExpandToggle(item.key)}
                >
                    <View style={styles.titleContainer}>
                        <Icon name={item.icon} size={24} color={styleContext.primaryColor || '#5a45d4'} />
                        <Text style={styles.tabLabel}>{item.label}</Text>
                    </View>
                    <Icon name={isExpanded ? "chevron-up" : "chevron-down"} size={24} color="#666" />
                </TouchableOpacity>

                {isExpanded && (
                    <View style={styles.cardBody}>
                        {loadingPermissions ? (
                            <ActivityIndicator size="small" color={styleContext.primaryColor || '#5a45d4'} />
                        ) : (
                            <View>
                                <Text style={styles.sectionTitle}>Manage Access:</Text>
                                {roles.map(role => (
                                    <View key={role.id}>
                                         {renderRoleItem({ item: role })}
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>
                )}
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
            {loadingRoles ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={styleContext.primaryColor || '#5a45d4'} />
                    <Text style={{ marginTop: 10 }}>Loading Roles...</Text>
                </View>
            ) : (
                <FlatList
                    data={adminTabs}
                    renderItem={renderTabItem}
                    keyExtractor={item => item.key}
                    contentContainerStyle={styles.listContent}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 10,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 8,
        marginBottom: 10,
        elevation: 2,
        overflow: 'hidden',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        backgroundColor: '#fff',
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    tabLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 10,
        color: '#333',
    },
    cardBody: {
        padding: 15,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        backgroundColor: '#fafafa',
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#666',
    },
    roleItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    roleName: {
        fontSize: 15,
        color: '#444',
    },
});
