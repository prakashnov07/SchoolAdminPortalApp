import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';

import { CoreContext } from '../context/CoreContext';
import { StyleContext } from '../context/StyleContext';
import TransportAttendanceCountItem from '../components/TransportAttendanceCountItem';

export default function TransportAttendanceCountScreen({ navigation }) {
    const coreContext = useContext(CoreContext);
    const styleContext = useContext(StyleContext);
    const { primary, background } = styleContext;

    const [attendanceDate, setAttendanceDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    
    const [allRoutes, setAllRoutes] = useState([]);
    const [report, setReport] = useState({});
    const [loadingRoutes, setLoadingRoutes] = useState(true);

    useEffect(() => {
        fetchTransportRoutes();
        getSchoolAttendanceReport(attendanceDate);
    }, []);

    const fetchTransportRoutes = () => {
        // legacy: fetchTransportRoutes(0) -> busno: 0 gets all routes? Or logic in legacy component seemed to fetch for busno 0 initially.
        // Legacy: axios.get('bus-routes', { params: { branchid, busno: bNo } })
        axios.get('/bus-routes', { params: { branchid: coreContext.branchid, busno: 0 } })
            .then((response) => {
                setAllRoutes(response.data.allRoutes || []);
                setLoadingRoutes(false);
            })
            .catch(err => {
                console.error(err);
                setLoadingRoutes(false);
            });
    };

    const getSchoolAttendanceReport = (date) => {
        // Format date if needed, usually backend handles ISO date string or similar if legacy passes Date obj
        // Legacy code passes `da` (Date object or string) directly.
        axios.get('/all-routes-transport-attendance-report', { 
            params: { 
                attendancedate: date, 
                branchid: coreContext.branchid 
            } 
        }).then((response) => {
            console.log('pp', response.data);
            setReport(response.data.row || {});
        }).catch(err => console.error(err));
    };

    const handleDateChange = (event, selectedDate) => {
        setShowDatePicker(Platform.OS === 'ios'); // Keep open on iOS if needed, close on Android
        if (selectedDate) {
            setAttendanceDate(selectedDate);
            getSchoolAttendanceReport(selectedDate);
            if(Platform.OS === 'android') setShowDatePicker(false);
        } else {
            if(Platform.OS === 'android') setShowDatePicker(false);
        }
    };

    const formatDate = (date) => {
        return date.toLocaleDateString();
    };

    const renderHeader = () => {
        // Legacy: if (report?.stu_count > 0) ...
        // Legacy: headerText={'Present : ' + report.present_count + ' / ' + report.stu_count}
        
        let headerText = 'School Attendance Count';
        if (report && report.stu_count) {
            headerText = `Present : ${report.present_count} / ${report.stu_count}`;
        }
        
        return (
            <View style={[styles.headerContainer, { backgroundColor: primary?.backgroundColor || '#6200ee' }]}>
                <Text style={styles.headerText}>{headerText}</Text>
            </View>
        );
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: background?.backgroundColor || '#f4e0ff' }} edges={['bottom', 'left', 'right']}>
            {/* Header / Date Selection */}
            <View style={styles.dateSection}>
                <Text style={styles.label}>Attendance Date</Text>
                <TouchableOpacity 
                    style={styles.dateButton} 
                    onPress={() => setShowDatePicker(true)}
                >
                    <Icon name="calendar" size={20} color="#666" />
                    <Text style={styles.dateText}>{formatDate(attendanceDate)}</Text>
                </TouchableOpacity>

                {showDatePicker && (
                    <DateTimePicker
                        value={attendanceDate}
                        mode="date"
                        display="default"
                        onChange={handleDateChange}
                    />
                )}
            </View>

            {/* Total Count Header */}
            {renderHeader()}

            {/* List of Routes */}
            <FlatList
                data={allRoutes}
                renderItem={({ item, index }) => (
                    <TransportAttendanceCountItem 
                        item={item} 
                        attendanceDate={attendanceDate} 
                    />
                )}
                keyExtractor={item => item.id?.toString() || Math.random().toString()}
                contentContainerStyle={{ paddingBottom: 20 }}
                ListEmptyComponent={
                    !loadingRoutes ? <Text style={styles.emptyText}>No routes found.</Text> : <Text style={styles.emptyText}>Loading routes...</Text>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    dateSection: {
        padding: 15,
        backgroundColor: '#fff',
        margin: 10,
        borderRadius: 10,
        elevation: 2,
    },
    label: {
        fontSize: 12,
        color: '#666',
        fontWeight: 'bold',
        marginBottom: 5,
        textTransform: 'uppercase'
    },
    dateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#eee'
    },
    dateText: {
        marginLeft: 10,
        fontSize: 16,
        color: '#333'
    },
    headerContainer: {
        padding: 15,
        marginHorizontal: 10,
        marginBottom: 10,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center'
    },
    headerText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold'
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 20,
        color: '#888',
        fontSize: 16
    }
});
