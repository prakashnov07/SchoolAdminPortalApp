import React, { useState, useContext, useCallback, useEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Image, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { StyleContext } from '../context/StyleContext';
import { CoreContext } from '../context/CoreContext';
import CustomPickerModal from '../components/CustomPickerModal';
import Toast from 'react-native-toast-message';
import axios from 'axios';

export default function EmployeeAttendanceListScreen({ route, navigation }) {
    const styleContext = useContext(StyleContext);
    const coreContext = useContext(CoreContext);
    const { branchid, phone, schoolData } = coreContext;
    const { emps = [], status = 'all', date = '' } = route.params || {};
    
    const [search, setSearch] = useState('');
    const [employees, setEmployees] = useState(emps);
    const [refreshing, setRefreshing] = useState(false);

    // Update employees when emps prop changes
    useEffect(() => {
        setEmployees(emps);
    }, [emps]);

    // Auto-refresh disabled - use pull-to-refresh instead
    // The auto-refresh was causing the list to clear
    /*
    useFocusEffect(
        useCallback(() => {
            if (isFirstRender.current) {
                isFirstRender.current = false;
                return;
            }
            
            if (date && employees.length > 0) {
                console.log('Screen focused, refreshing employee list...');
                refreshEmployeeList();
            }
        }, [date, employees.length])
    );
    */

    const refreshEmployeeList = async () => {
        setRefreshing(true);
        try {
            // Use the correct API endpoint with correct parameters
            const response = await axios.get('staff-attendance-report-v2', {
                params: {
                    attendancedate: date,
                    astatus: status,
                    etype: '', // Holiday group, empty for all
                    branchid,
                    owner: phone
                }
            });
            
            // API returns 'employees' not 'emps'
            if (response.data && response.data.employees) {
                setEmployees(response.data.employees);
                Toast.show({ type: 'success', text1: 'Refreshed', text2: 'Attendance list updated' });
            }
        } catch (err) {
            console.error('Refresh error:', err);
            Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to refresh data' });
        } finally {
            setRefreshing(false);
        }
    };

    // Calculate statistics
    const presentEmps = employees.filter(emp => emp && emp.att_status === 'present');
    const absentEmps = employees.filter(emp => emp && emp.att_status === 'absent');
    const lateEmps = employees.filter(emp => emp && emp.att_substatus === 'Late');
    const halfTimeEmps = employees.filter(emp => emp && emp.att_substatus === 'Half Time');
    const notMarkedOutEmps = employees.filter(emp => emp && emp.out_time === '' && emp.att_status === 'present');

    // Filter employees based on status
    let filteredEmps = [...employees].filter(emp => emp != null);
    if (status === 'absent') {
        filteredEmps = employees.filter(emp => emp && emp.att_status === 'absent');
    } else if (status === 'present') {
        filteredEmps = employees.filter(emp => emp && emp.att_status === 'present');
    } else if (status === 'Late') {
        filteredEmps = employees.filter(emp => emp && emp.att_substatus === 'Late');
    } else if (status === 'Half Time') {
        filteredEmps = employees.filter(emp => emp && emp.att_substatus === 'Half Time');
    } else if (status === 'not_marked_out') {
        filteredEmps = employees.filter(emp => emp && emp.out_time === '' && emp.att_status === 'present');
    }

    // Apply search filter
    if (search) {
        filteredEmps = filteredEmps.filter(emp => {
            if (!emp) return false;
            const name = emp.name || emp.empname || '';
            return name.toLowerCase().includes(search.toLowerCase());
        });
    }

    const EmployeeItem = ({ item, index }) => {
        const [action, setAction] = useState('');
        const [remarks, setRemarks] = useState('');
        const [loading, setLoading] = useState(false);
        const [actionPickerVisible, setActionPickerVisible] = useState(false);
        const [showRemarks, setShowRemarks] = useState(false);
        const [showImages, setShowImages] = useState(false);

        const isPresent = item.att_status === 'present';
        const isAbsent = item.att_status === 'absent';
        const isLeave = ['pl', 'cl', 'ol', 'sl'].includes(item.att_status);

        // Action options for present staff
        const presentActionOptions = [
            { label: 'Choose Action', value: '' },
            { label: 'Forfeit Full Day', value: 'full' },
            { label: 'Forfeit Half Day', value: 'half' },
            ...(item.att_substatus === 'Half Time' ? [
                { label: 'Approve Half Day Leave', value: 'approve-half' },
                { label: 'Approve Half CL', value: 'half-cl' }
            ] : [])
        ];

        // Action options for absent staff
        const absentActionOptions = [
            { label: 'Choose Action', value: '' },
            { label: 'CL', value: 'pl' },
            { label: 'LWP', value: 'cl' },
            { label: 'Half Day Leave', value: 'approve-half' },
            { label: 'On Office Duty', value: 'ol' },
            { label: 'Special Paid Leave', value: 'sl' }
        ];

        const submitAction = () => {
            if (!action) {
                Toast.show({ type: 'error', text1: 'Error', text2: 'Please choose an action' });
                return;
            }
            if (!remarks) {
                Toast.show({ type: 'error', text1: 'Error', text2: 'Please enter remarks' });
                return;
            }

            setLoading(true);
            const attendancedate = item.date || date;

            axios.post('mark-attendance-action', {
                branchid,
                owner: phone,
                empid: item.emp_id,
                mobile: item.mobile,
                attendancedate,
                action,
                remarks,
                astatus: item.att_status
            }).then(response => {
                setLoading(false);
                if (response.data.status === 'ok') {
                    Toast.show({ type: 'success', text1: 'Success', text2: 'Action marked successfully. Check employee salary details.' });
                    setAction('');
                    setRemarks('');
                    setShowRemarks(false);
                } else {
                    Toast.show({ type: 'error', text1: 'Error', text2: 'Action could not be marked' });
                }
            }).catch(err => {
                setLoading(false);
                Toast.show({ type: 'error', text1: 'Error', text2: 'Network error occurred' });
            });
        };

        const markStaffAttendance = (actionType) => {
            navigation.navigate('MarkStaffAttendanceScreen', {
                staffId: item.emp_id,
                staffMobile: item.mobile,
                staffName: item.name || item.empname || 'Staff Member',
                date: date,
                action: actionType
            });
        };

        const cancelStaffLeave = () => {
            Alert.alert(
                'Cancel Leave',
                'Are you sure you want to cancel this leave?',
                [
                    { text: 'No', style: 'cancel' },
                    {
                        text: 'Yes',
                        onPress: () => {
                            axios.post('/delete-staff-attendance-app', {
                                owner: phone,
                                branchid,
                                empid: item.emp_id,
                                mobile: item.mobile,
                                attendancedate: item.date || date
                            }).then(response => {
                                if (response.data.status === 'ok') {
                                    Toast.show({ type: 'success', text1: 'Success', text2: 'Leave cancellation request submitted' });
                                } else {
                                    Toast.show({ type: 'error', text1: 'Error', text2: 'Leave cannot be cancelled' });
                                }
                            }).catch(err => {
                                Toast.show({ type: 'error', text1: 'Error', text2: 'Network error occurred' });
                            });
                        }
                    }
                ]
            );
        };

        return (
            <View style={[styleContext.card, { marginBottom: 12, padding: 12 }]}>
                {/* Header */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#666', marginRight: 8 }}>
                                {index + 1}.
                            </Text>
                            <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#333', flex: 1 }}>
                                {item.name || item.empname || 'N/A'}
                                {item.empid ? ` (${item.empid})` : ''}
                            </Text>
                        </View>
                        {item.designation && (
                            <Text style={{ fontSize: 13, color: '#666', marginTop: 2, marginLeft: 24 }}>
                                {item.designation}
                            </Text>
                        )}
                    </View>
                </View>

                {/* Status Row */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={{
                            backgroundColor: isPresent ? '#4CAF50' : isAbsent ? '#F44336' : '#2196F3',
                            paddingHorizontal: 10,
                            paddingVertical: 4,
                            borderRadius: 12,
                            marginRight: 8
                        }}>
                            <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>
                                {item.att_status === 'pl' ? 'CL' : item.att_status === 'cl' ? 'LWP' : item.att_status?.toUpperCase() || 'N/A'}
                            </Text>
                        </View>
                        {item.att_substatus && (
                            <View style={{
                                backgroundColor: item.att_substatus === 'Late' ? '#FF9800' : '#9C27B0',
                                paddingHorizontal: 8,
                                paddingVertical: 2,
                                borderRadius: 8
                            }}>
                                <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>
                                    {item.att_substatus}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Action Buttons */}
                    {isAbsent && (
                        <TouchableOpacity
                            style={styles.smallButton}
                            onPress={() => markStaffAttendance('in')}
                        >
                            <Text style={styles.smallButtonText}>Mark In</Text>
                        </TouchableOpacity>
                    )}
                    {isPresent && !item.out_time && !isLeave && (
                        <TouchableOpacity
                            style={styles.smallButton}
                            onPress={() => markStaffAttendance('out')}
                        >
                            <Text style={styles.smallButtonText}>Mark Out</Text>
                        </TouchableOpacity>
                    )}
                    {isLeave && !item.out_time && (
                        <TouchableOpacity
                            style={[styles.smallButton, { backgroundColor: '#F44336' }]}
                            onPress={cancelStaffLeave}
                        >
                            <Text style={styles.smallButtonText}>Cancel Leave</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Time Display */}
                {!isLeave && (isPresent || item.att_time || item.out_time) && (
                    <View style={{ marginBottom: 10 }}>
                        {item.att_time && (
                            <Text style={{ fontSize: 12, color: '#666' }}>In Time: {item.att_time}</Text>
                        )}
                        {item.out_time && (
                            <Text style={{ fontSize: 12, color: '#666' }}>Out Time: {item.out_time}</Text>
                        )}
                    </View>
                )}

                {/* Images Toggle */}
                {isPresent && (
                    <TouchableOpacity
                        style={{ marginBottom: 10 }}
                        onPress={() => setShowImages(!showImages)}
                    >
                        <Text style={{ color: styleContext.primaryColor, fontSize: 14, fontWeight: 'bold' }}>
                            {showImages ? '▼ Hide Images' : '▶ Show Attendance Images'}
                        </Text>
                    </TouchableOpacity>
                )}

                {/* Images */}
                {showImages && isPresent && (
                    <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 10 }}>
                        <View style={{ alignItems: 'center' }}>
                            <Text style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>In Image</Text>
                            <Image
                                style={{ width: 80, height: 100, borderRadius: 4 }}
                                resizeMode="cover"
                                source={{ uri: item.img_url }}
                            />
                        </View>
                        <View style={{ alignItems: 'center' }}>
                            <Text style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>Profile</Text>
                            <Image
                                style={{ width: 80, height: 100, borderRadius: 4 }}
                                resizeMode="cover"
                                source={{ uri: `${schoolData?.studentimgpath || ''}${item.photo}` }}
                            />
                        </View>
                        <View style={{ alignItems: 'center' }}>
                            <Text style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>Out Image</Text>
                            <Image
                                style={{ width: 80, height: 100, borderRadius: 4 }}
                                resizeMode="cover"
                                source={{ uri: item.out_img_url }}
                            />
                        </View>
                    </View>
                )}

                {/* Action Picker */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                    <TouchableOpacity
                        style={[styles.pickerButton, { flex: 1, marginRight: 8 }]}
                        onPress={() => setActionPickerVisible(true)}
                    >
                        <Text style={{ fontSize: 14, color: action ? '#333' : '#999' }}>
                            {action ? ((isPresent ? presentActionOptions : absentActionOptions).find(a => a.value === action)?.label || 'Choose Action') : 'Choose Action'}
                        </Text>
                        <Icon name="chevron-down" size={20} color="#666" />
                    </TouchableOpacity>
                    {action && (
                        <TouchableOpacity
                            style={styles.submitButton}
                            onPress={() => setShowRemarks(true)}
                        >
                            <Text style={styles.submitButtonText}>Next</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Calendar Icon - Navigate to Staff Attendance Calendar */}
                <TouchableOpacity
                    style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}
                    onPress={() => {
                        navigation.navigate('StaffAttendanceScreen', {
                            staff: {
                                empid: item.emp_id || item.empid,
                                emp_id: item.emp_id,
                                name: item.name || item.empname || 'Staff Member',
                                mobile: item.mobile,
                                designation: item.designation,
                                photo: item.photo,
                                holiday_group: item.holiday_group
                            },
                            action: 'reload'
                        });
                    }}
                >
                    <Icon name="calendar" size={24} color={styleContext.primaryColor || '#5a45d4'} />
                    <Text style={{ marginLeft: 8, fontSize: 14, color: styleContext.primaryColor || '#5a45d4', fontWeight: '600' }}>
                        View Calendar
                    </Text>
                </TouchableOpacity>

                <CustomPickerModal
                    visible={actionPickerVisible}
                    title="Select Action"
                    data={isPresent ? presentActionOptions : absentActionOptions}
                    selectedValue={action}
                    onSelect={(val) => {
                        setAction(val);
                        setActionPickerVisible(false);
                    }}
                    onClose={() => setActionPickerVisible(false)}
                />

                {/* Remarks Input */}
                {showRemarks && action && (
                    <View style={{ marginTop: 10 }}>
                        <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#666', marginBottom: 5 }}>
                            Remarks
                        </Text>
                        <TextInput
                            style={styles.remarksInput}
                            placeholder="Enter remarks (max 100 characters)"
                            placeholderTextColor="#999"
                            multiline
                            numberOfLines={4}
                            maxLength={100}
                            value={remarks}
                            onChangeText={setRemarks}
                        />
                        <TouchableOpacity
                            style={[styles.submitButton, { width: '100%', marginTop: 10 }]}
                            onPress={submitAction}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.submitButtonText}>Submit Action</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        );
    };

    const statsHeader = `Present: ${presentEmps.length} (L: ${lateEmps.length} H: ${halfTimeEmps.length} NMO: ${notMarkedOutEmps.length})  Absent: ${absentEmps.length}`;

    return (
        <SafeAreaView style={styleContext.background} edges={['bottom', 'left', 'right']}>
            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <Icon name="magnify" size={20} color="#666" style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search Staff..."
                    placeholderTextColor="#999"
                    value={search}
                    onChangeText={setSearch}
                />
                {search.length > 0 && (
                    <TouchableOpacity onPress={() => setSearch('')}>
                        <Icon name="close-circle" size={20} color="#666" />
                    </TouchableOpacity>
                )}
            </View>

            {/* Date Header */}
            <View style={[styleContext.card, { margin: 16, marginBottom: 8, padding: 12 }]}>
                <Text style={{ fontSize: 14, fontWeight: 'bold', color: styleContext.titleColor, textAlign: 'center' }}>
                    Date: {date}
                </Text>
            </View>

            {/* Statistics Header */}
            <View style={[styleContext.card, { marginHorizontal: 16, marginBottom: 16, padding: 12, backgroundColor: styleContext.primaryColor || '#6200ea' }]}>
                <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#fff', textAlign: 'center' }}>
                    {statsHeader}
                </Text>
            </View>

            {/* Employee List */}
            <FlatList
                data={filteredEmps}
                keyExtractor={(item, index) => `${item.emp_id || item.empid}-${index}`}
                renderItem={({ item, index }) => <EmployeeItem item={item} index={index} />}
                contentContainerStyle={{ paddingBottom: 20 }}
                refreshing={refreshing}
                onRefresh={refreshEmployeeList}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No employees found</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        margin: 16,
        marginBottom: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#ddd',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#333',
        padding: 0,
    },
    smallButton: {
        backgroundColor: '#6200ea',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
    },
    smallButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    pickerButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
    },
    submitButton: {
        backgroundColor: '#6200ea',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    remarksInput: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
        color: '#333',
        textAlignVertical: 'top',
        minHeight: 100,
    },
});
