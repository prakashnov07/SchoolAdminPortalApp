import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

const EmployeeManualAttendanceItem = ({ item, index, date, styleContext, coreContext }) => {
    const { branchid, phone } = coreContext;
    const [attStatus, setAttStatus] = useState(item.att_status);
    const [attSubStatus, setAttSubStatus] = useState(item.att_substatus);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (item.att_status) setAttStatus(item.att_status);
        if (item.att_substatus) setAttSubStatus(item.att_substatus);
    }, [item]);

    // Cleanup substatus if absent
    useEffect(() => {
        if (attStatus === 'absent') setAttSubStatus('');
    }, [attStatus]);

    const markStaffAttendance = (action) => {
        setLoading(true);
        // Map 'late' and 'half' to 'present' with substatus for the API call if needed, 
        // but looking at legacy, it sends 'action' as 'late'/'half' too.
        // Legacy: axios.post('/manual-staff-attendance-app', { ... , astatus: action, action })
        // where action can be 'present', 'late', 'half', 'absent'.
        
        axios.post('/manual-staff-attendance-app', { 
            owner: phone, 
            branchid, 
            empid: item.emp_id, 
            mobile: item.mobile, 
            attendancedate: date, 
            astatus: action, 
            action 
        }).then(response => {
            setLoading(false);
            if (response.data.status === 'ok') {
                if (action === 'load') action = 'present'; // Legacy logic??
                
                // Update local state based on action
                if(action === 'late') { 
                    setAttStatus('present'); 
                    setAttSubStatus('Late'); 
                } else if(action === 'half') { 
                    setAttStatus('present'); 
                    setAttSubStatus('Half Time'); 
                } else if(action === 'absent') { 
                    setAttStatus('absent'); 
                    setAttSubStatus(''); 
                } else { // present
                    setAttStatus('present'); 
                    setAttSubStatus(''); 
                }

                Toast.show({
                    type: 'success',
                    text1: 'Attendance Marked',
                    text2: `${item.name} marked as ${action}`,
                    visibilityTime: 2000,
                });

            } else {
                 Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: 'Attendance could not be marked',
                });
            }
        }).catch(err => {
            setLoading(false);
            console.error(err);
             Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: 'Network error occurred',
                });
        });
    };

    return (
        <View style={[styleContext.card, { marginBottom: 10, padding: 15 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <View style={{ flex: 1, marginRight: 10 }}>
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: styleContext.titleColor }}>
                        {index + 1}. {item.name} 
                    </Text>
                    <Text style={{ fontSize: 14, fontWeight: 'normal', color: '#666', marginTop: 2 }}>({item.empid})</Text>
                </View>
                
                {/* Status Indicator */}
                <View style={{ flexDirection: 'column', alignItems: 'flex-end', minWidth: 60 }}>
                    <Text style={{ fontWeight: 'bold', color: styleContext.labelColor || '#333' }}>
                        {attStatus ? (attStatus === 'pl' ? 'CL' : attStatus.toUpperCase()) : 'N/A'}
                    </Text>
                    {attSubStatus ? <Text style={{ fontSize: 12, color: '#666' }}>({attSubStatus})</Text> : null}
                </View>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <TouchableOpacity 
                    style={[styles.attBtn, { backgroundColor: '#006600' }]}
                    onPress={() => markStaffAttendance('present')}
                    disabled={loading}
                >
                    <Text style={styles.attBtnText}>P</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.attBtn, { backgroundColor: '#00cc66' }]}
                    onPress={() => markStaffAttendance('late')}
                    disabled={loading}
                >
                    <Text style={styles.attBtnText}>L</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.attBtn, { backgroundColor: 'orange' }]}
                    onPress={() => markStaffAttendance('half')}
                    disabled={loading}
                >
                    <Text style={styles.attBtnText}>H</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.attBtn, { backgroundColor: '#D33A2C' }]}
                    onPress={() => markStaffAttendance('absent')}
                    disabled={loading}
                >
                    <Text style={styles.attBtnText}>Ab</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    attBtn: {
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 5,
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 60,
        elevation: 2,
    },
    attBtnText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16
    }
});

export default EmployeeManualAttendanceItem;
