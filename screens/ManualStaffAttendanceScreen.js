import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { CoreContext } from '../context/CoreContext';
import { StyleContext } from '../context/StyleContext';
import axios from 'axios';

const EmployeeManualAttendanceListItem = ({ item, index, date, styleContext, coreContext }) => {
    const { branchid, phone } = coreContext;
    const [attStatus, setAttStatus] = useState(item.att_status);
    const [attSubStatus, setAttSubStatus] = useState(item.att_substatus);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (attStatus === 'absent') setAttSubStatus('');
    }, [attStatus]);

    const markStaffAttendance = (action) => {
        setLoading(true);
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
                if (action === 'load') action = 'present';
                setAttStatus(action);
                if (action === 'present' || action === 'absent') {
                     setAttSubStatus(action); // Simplified for now, legacy had logic for 'load'
                }
                
                // Specific logic mapping from legacy
                if(action === 'late') { setAttStatus('present'); setAttSubStatus('Late'); }
                if(action === 'half') { setAttStatus('present'); setAttSubStatus('Half Time'); }
                if(action === 'absent') { setAttStatus('absent'); setAttSubStatus(''); }
                if(action === 'present') { setAttStatus('present'); setAttSubStatus(''); }

            } else {
                Alert.alert('Error', 'Attendance could not be marked');
            }
        }).catch(err => {
            setLoading(false);
            console.error(err);
            Alert.alert('Error', 'Network error');
        });
    };

    const StatusBadge = ({ label, color }) => (
        <View style={{ backgroundColor: color, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 }}>
            <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>{label}</Text>
        </View>
    );

    return (
        <View style={[styleContext.card, { marginBottom: 10, padding: 15 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: styleContext.titleColor }}>
                    {item.name} <Text style={{ fontSize: 14, fontWeight: 'normal', color: '#666' }}>({item.empid})</Text>
                </Text>
                {/* Status Indicator */}
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ fontWeight: 'bold', marginRight: 5, color: '#333' }}>
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

export default function ManualStaffAttendanceScreen({ route, navigation }) {
    const coreContext = useContext(CoreContext);
    const styleContext = useContext(StyleContext);
    
    // Params passed from AttendanceReport or similar
    const { emps = [], date, status } = route.params || {};

    const [filteredEmps, setFilteredEmps] = useState([]);
    
    useEffect(() => {
        if (emps.length > 0) {
            setFilteredEmps(emps);
        }
    }, [emps]);

    const getStats = () => {
        const total = filteredEmps.length;
        const present = filteredEmps.filter(e => e.att_status === 'present').length;
        const absent = filteredEmps.filter(e => e.att_status === 'absent').length;
        const late = filteredEmps.filter(e => e.att_substatus === 'Late').length;
        const half = filteredEmps.filter(e => e.att_substatus === 'Half Time').length;
        return { total, present, absent, late, half };
    };

    const stats = getStats();

    return (
        <SafeAreaView style={styleContext.background} edges={['bottom', 'left', 'right']}>
            <View style={{ padding: 15, backgroundColor: styleContext.glassEffect?.backgroundColor || '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' }}>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: styleContext.titleColor }}>Manual Attendance</Text>
                <Text style={{ color: '#666', marginTop: 4 }}>Date: {date}</Text>
                <View style={{ flexDirection: 'row', marginTop: 8, flexWrap: 'wrap' }}>
                    <Text style={{ marginRight: 10, color: 'green', fontWeight: 'bold' }}>P: {stats.present}</Text>
                    <Text style={{ marginRight: 10, color: 'red', fontWeight: 'bold' }}>A: {stats.absent}</Text>
                    <Text style={{ marginRight: 10, color: 'orange', fontWeight: 'bold' }}>L: {stats.late}</Text>
                    <Text style={{ marginRight: 10, color: 'orange', fontWeight: 'bold' }}>H: {stats.half}</Text>
                </View>
            </View>

            <FlatList
                data={filteredEmps}
                keyExtractor={(item) => item.emp_id.toString()}
                renderItem={({ item, index }) => (
                    <EmployeeManualAttendanceListItem 
                        item={item} 
                        index={index} 
                        date={date} 
                        styleContext={styleContext} 
                        coreContext={coreContext} 
                    />
                )}
                contentContainerStyle={{ padding: 16 }}
                ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20, color: '#888' }}>No staff found.</Text>}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    attBtn: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 5,
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 50
    },
    attBtnText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14
    }
});
