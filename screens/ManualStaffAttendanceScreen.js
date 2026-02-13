import React, { useState, useEffect, useContext, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SearchBar } from 'react-native-elements';
import { CoreContext } from '../context/CoreContext';
import { StyleContext } from '../context/StyleContext';
import axios from 'axios';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import EmployeeManualAttendanceItem from '../components/EmployeeManualAttendanceItem';

export default function ManualStaffAttendanceScreen({ route, navigation }) {
    const coreContext = useContext(CoreContext);
    const styleContext = useContext(StyleContext);

    // Params passed from AttendanceReport or similar
    const { emps: initialEmps, date: initialDate, status } = route.params || {};

    const [emps, setEmps] = useState(initialEmps || []); // State to hold emps
    const [date, setDate] = useState(initialDate || formatDate(new Date())); // State for date
    const [loading, setLoading] = useState(false);

    const [search, setSearch] = useState('');
    const [filteredEmps, setFilteredEmps] = useState([]);

    function formatDate(d) {
        let month = '' + (d.getMonth() + 1);
        let day = '' + d.getDate();
        const year = d.getFullYear();

        if (month.length < 2) month = '0' + month;
        if (day.length < 2) day = '0' + day;

        return [day, month, year].join('-');
    }

    useEffect(() => {
        // If no emps passed, fetch them
        if (!initialEmps || initialEmps.length === 0) {
            fetchStaffAttendance();
        } else {
            setEmps(initialEmps);
        }
    }, [initialEmps]);

    const fetchStaffAttendance = () => {
        setLoading(true);
        // Use current date if not passed
        const d = new Date();
        const formattedDate = initialDate || formatDate(d);
        setDate(formattedDate);

        axios.get('staff-attendance-report-v2', {
            params: {
                attendancedate: formattedDate,
                astatus: 'all',
                branchid: coreContext.branchid,
                owner: coreContext.phone
            } 
        }).then(response => {
            setLoading(false);
            if (response.data && response.data.employees) {
                setEmps(response.data.employees);
            }
        }).catch(err => {
            setLoading(false);
            console.error(err);
        });
    };

    useEffect(() => {
        let updatedEmps = [...emps];

        // Status Filtering
        if (status === 'absent')
            updatedEmps = updatedEmps.filter(emp => emp.att_status === 'absent');
        if (status === 'present')
            updatedEmps = updatedEmps.filter(emp => emp.att_status === 'present');
        if (status === 'Late')
            updatedEmps = updatedEmps.filter(emp => emp.att_substatus === 'Late');
        if (status === 'Half Time')
            updatedEmps = updatedEmps.filter(emp => emp.att_substatus === 'Half Time');

        // Search Filtering
        if (search) {
            updatedEmps = updatedEmps.filter(staff =>
                staff.name.toLowerCase().includes(search.toLowerCase())
            );
        }

        // Configuration Filtering
        if (coreContext.schoolData?.manualAttendanceStaff === 'selected') {
            updatedEmps = updatedEmps.filter(staff => staff.allow_manual_attendance === 'yes');
        }

        setFilteredEmps(updatedEmps);
    }, [emps, search, status, coreContext.schoolData]);

    const stats = useMemo(() => {
        const total = filteredEmps.length;
        // See comments in previous revision about stats calculation
        const allEmps = emps;
        const present = allEmps.filter(e => e.att_status === 'present').length;
        const absent = allEmps.filter(e => e.att_status === 'absent').length;
        const late = allEmps.filter(e => e.att_substatus === 'Late').length;
        const half = allEmps.filter(e => e.att_substatus === 'Half Time').length;

        return { total, present, absent, late, half };
    }, [emps, filteredEmps]); // Added filteredEmps dependency though seemingly unused for P/A/L/H counts, good for re-render consistency if logic changes

    const updateSearch = (text) => {
        setSearch(text);
    };

    return (
        <SafeAreaView style={styleContext.background} edges={['bottom', 'left', 'right']}>
            <View style={{ backgroundColor: styleContext.glassEffect?.backgroundColor || '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' }}>
                <SearchBar
                    placeholder="Search Staff..."
                    onChangeText={updateSearch}
                    value={search}
                    lightTheme
                    round
                    containerStyle={{ backgroundColor: 'transparent', borderBottomColor: 'transparent', borderTopColor: 'transparent' }}
                    inputContainerStyle={{ backgroundColor: '#f0f0f0' }}
                />

                <View style={{ padding: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: styleContext.titleColor }}>Date: {date}</Text>
                    {loading && <ActivityIndicator size="small" color={styleContext.primaryColor} />}
                </View>

                <View style={{ flexDirection: 'row', padding: 10, flexWrap: 'wrap', backgroundColor: '#f9f9f9', borderTopWidth: 1, borderColor: '#eee' }}>
                    <Text style={{ marginRight: 15, color: 'green', fontWeight: 'bold' }}>P: {stats.present}</Text>
                    <Text style={{ marginRight: 15, color: 'red', fontWeight: 'bold' }}>A: {stats.absent}</Text>
                    <Text style={{ marginRight: 15, color: '#e67300', fontWeight: 'bold' }}>L: {stats.late}</Text>
                    <Text style={{ marginRight: 15, color: '#ffcc00', fontWeight: 'bold' }}>H: {stats.half}</Text>
                </View>
            </View>

            <FlatList
                data={filteredEmps}
                keyExtractor={(item) => item.emp_id ? item.emp_id.toString() : Math.random().toString()}
                renderItem={({ item, index }) => (
                    <EmployeeManualAttendanceItem 
                        item={item} 
                        index={index} 
                        date={date} 
                        styleContext={styleContext} 
                        coreContext={coreContext} 
                    />
                )}
                contentContainerStyle={{ padding: 16 }}
                ListEmptyComponent={
                    !loading ? (
                        <View style={{ alignItems: 'center', marginTop: 50, padding: 20 }}>
                            <Icon name="account-search-outline" size={60} color="#ccc" />
                            <Text style={{ textAlign: 'center', marginTop: 10, color: '#888', fontSize: 16 }}>
                                No staff found
                            </Text>
                        </View>
                    ) : null
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    // Styles moved to component or context
});

