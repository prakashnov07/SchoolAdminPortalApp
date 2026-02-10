import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { CoreContext } from '../context/CoreContext';
import { StyleContext } from '../context/StyleContext';
import CustomPickerModal from '../components/CustomPickerModal';
import Toast from 'react-native-toast-message';
import axios from 'axios';

export default function StaffAttendanceReportScreen({ navigation, route }) {
    const coreContext = useContext(CoreContext);
    const styleContext = useContext(StyleContext);
    const { branchid, phone } = coreContext;
    const { redirect } = route.params || {};

    const [attendanceDate, setAttendanceDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    
    const [status, setStatus] = useState('all');
    const [statusPickerVisible, setStatusPickerVisible] = useState(false);
    
    const [holidayGroup, setHolidayGroup] = useState('');
    const [holidayGroups, setHolidayGroups] = useState([]);
    const [holidayPickerVisible, setHolidayPickerVisible] = useState(false);
    
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadHolidayGroups();
    }, []);

    const loadHolidayGroups = () => {
        axios.get('holiday-groups', { params: { branchid } }).then(response => {
            if (response.data && response.data.rows) {
                setHolidayGroups(response.data.rows);
            }
        }).catch(err => console.error(err));
    };

    const formatDate = (date) => {
        const d = new Date(date);
        let month = '' + (d.getMonth() + 1);
        let day = '' + d.getDate();
        const year = d.getFullYear();

        if (month.length < 2) month = '0' + month;
        if (day.length < 2) day = '0' + day;

        return [day, month, year].join('-');
    };

    const handleDateChange = (event, selectedDate) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (selectedDate) {
            setAttendanceDate(selectedDate);
        }
    };

    const handleSubmit = () => {
        setLoading(true);
        const formattedDate = formatDate(attendanceDate);
        
        axios.get('staff-attendance-report-v2', { 
            params: { 
                attendancedate: formattedDate, 
                astatus: status, 
                etype: holidayGroup, 
                branchid, 
                owner: phone 
            } 
        }).then((response) => {
            setLoading(false);
            const emps = response.data.employees || [];
            
            if (redirect === 'staffManualAttendance') {
                navigation.navigate('ManualStaffAttendanceScreen', { emps, status, date: formattedDate });
            } else {
                // Navigate to EmployeeAttendanceListScreen
                navigation.navigate('EmployeeAttendanceListScreen', { emps, status, date: formattedDate });
                Toast.show({ type: 'success', text1: 'Success', text2: `Fetched ${emps.length} records` });
            }
        }).catch(err => {
            setLoading(false);
            Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to fetch attendance data' });
            console.error(err);
        });
    };

    const statusOptions = [
        { label: 'All Staff', value: 'all' },
        { label: 'Present Staff', value: 'present' },
        { label: 'Absent Staff', value: 'absent' },
        { label: 'Late Staff', value: 'Late' },
        { label: 'Half Day Staff', value: 'Half Time' },
        { label: 'Not Marked Out Staff', value: 'not_marked_out' }
    ];

    const holidayOptions = [
        { label: 'All Groups', value: '' },
        ...holidayGroups.map(g => ({ label: g.name, value: g.id }))
    ];

    return (
        <SafeAreaView style={styleContext.background} edges={['bottom', 'left', 'right']}>
            <CustomPickerModal
                visible={statusPickerVisible}
                title="Select Status"
                data={statusOptions}
                selectedValue={status}
                onSelect={(val) => {
                    setStatus(val);
                    setStatusPickerVisible(false);
                }}
                onClose={() => setStatusPickerVisible(false)}
            />
            
            <CustomPickerModal
                visible={holidayPickerVisible}
                title="Select Holiday Group"
                data={holidayOptions}
                selectedValue={holidayGroup}
                onSelect={(val) => {
                    setHolidayGroup(val);
                    setHolidayPickerVisible(false);
                }}
                onClose={() => setHolidayPickerVisible(false)}
            />

            {showDatePicker && (
                <DateTimePicker
                    value={attendanceDate}
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                />
            )}

            <ScrollView contentContainerStyle={{ padding: 16 }}>
                <View style={styleContext.glassFilterContainer}>
                    <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 20, color: styleContext.titleColor }}>
                         Staff Attendance Report
                    </Text>

                    {/* Date Picker */}
                    <TouchableOpacity 
                        style={[styleContext.whitePickerButton, { marginBottom: 15 }]}
                        onPress={() => setShowDatePicker(true)}
                    >
                        <Text style={{ fontSize: 16, color: '#333' }}>{formatDate(attendanceDate)}</Text>
                        <Icon name="calendar" size={24} color="#666" />
                    </TouchableOpacity>

                    {/* Holiday Group Picker */}
                    <TouchableOpacity 
                        style={[styleContext.whitePickerButton, { marginBottom: 15 }]}
                        onPress={() => setHolidayPickerVisible(true)}
                    >
                        <Text style={{ fontSize: 16, color: holidayGroup ? '#333' : '#666' }}>
                            {holidayGroup ? holidayOptions.find(h => h.value === holidayGroup)?.label : 'Select Holiday Group'}
                        </Text>
                        <Icon name="chevron-down" size={24} color="#666" />
                    </TouchableOpacity>

                    {/* Status Picker */}
                    <TouchableOpacity 
                        style={[styleContext.whitePickerButton, { marginBottom: 25 }]}
                        onPress={() => setStatusPickerVisible(true)}
                    >
                        <Text style={{ fontSize: 16, color: status ? '#333' : '#666' }}>
                            {status ? statusOptions.find(s => s.value === status)?.label : 'Select Status'}
                        </Text>
                        <Icon name="chevron-down" size={24} color="#666" />
                    </TouchableOpacity>

                    {/* Submit Button */}
                    <TouchableOpacity 
                        style={[{ backgroundColor: styleContext.primaryColor || '#6200ea', padding: 15, borderRadius: 10, alignItems: 'center' }]}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>
                            {loading ? 'Loading...' : 'Submit'}
                        </Text>
                    </TouchableOpacity>

                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
