import React, { useState, useContext, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Platform,
    ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';
import Toast from 'react-native-toast-message';

import { CoreContext } from '../context/CoreContext';
import { StyleContext } from '../context/StyleContext';
import AttendanceMenuModal from '../components/AttendanceMenuModal';
import AttendanceCountItem from '../components/AttendanceCountItem';

export default function AttendanceCountScreen({ navigation }) {
    const coreContext = useContext(CoreContext);
    const styleContext = useContext(StyleContext);
    const { primary, background, card, text, border } = styleContext;

    // State
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [menuVisible, setMenuVisible] = useState(false);
    
    // Data
    const [classes, setClasses] = useState([]);
    const [schoolReport, setSchoolReport] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <TouchableOpacity onPress={() => setMenuVisible(true)} style={{ marginRight: 15 }}>
                     <Icon name="dots-vertical" size={26} color={'#fff'} />
                </TouchableOpacity>
            ),
        });
        fetchClasses();
    }, []);

    useEffect(() => {
        fetchSchoolReport();
    }, [date]);

    const fetchClasses = () => {
        axios.get('/getallclasses', { params: { branchid: coreContext.branchid } })
            .then(res => {
                const data = res.data.rows.map(item => ({ 
                    classname: item.classname, 
                    classid: item.classid 
                }));
                setClasses(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    };

    const fetchSchoolReport = () => {
        axios.get('/all-school-attendance-report', { 
            params: { 
                attendancedate: formatDate(date), 
                branchid: coreContext.branchid 
            } 
        }).then(res => {
            setSchoolReport(res.data.row || {});
        }).catch(console.error);
    };

    const formatDate = (d) => {
        let month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

        if (month.length < 2) month = '0' + month;
        if (day.length < 2) day = '0' + day;

        return [day, month, year].join('-');
    };

    const onDateChange = (event, selectedDate) => {
        setShowDatePicker(false);
        if (selectedDate) {
            setDate(selectedDate);
        }
    };

    const renderHeader = () => {
        return (
            <View>
                 {/* Filters */}
                <View style={styles.filterContainer}>
                    <TouchableOpacity 
                        style={styles.pickerButton} 
                        onPress={() => setShowDatePicker(true)}
                    >
                        <Icon name="calendar" size={24} color="#666" style={{ marginRight: 10 }} />
                        <View>
                            <Text style={styles.label}>Attendance Date</Text>
                            <Text style={styles.pickerText}>{formatDate(date)}</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Summary Card */}
                <View style={[styles.summaryCard, { backgroundColor: '#fff', borderColor: '#ddd' }]}>
                    <Text style={styles.summaryTitle}>School Attendance Count</Text>
                    {schoolReport.stu_count ? (
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryText}>Total Present:</Text>
                            <Text style={styles.summaryCount}>
                                {schoolReport.present_count} <Text style={{fontSize: 14, color: '#999'}}>/ {schoolReport.stu_count}</Text>
                            </Text>
                        </View>
                    ) : (
                        <Text style={{textAlign: 'center', color: '#999', marginTop: 5}}>Loading summary...</Text>
                    )}
                </View>

                <Text style={styles.listHeader}>Class Wise Report</Text>
            </View>
        );
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: styleContext.background?.backgroundColor || '#f4e0ff' }} edges={['bottom', 'left', 'right']}>
             
            <FlatList
                data={classes}
                renderItem={({ item }) => <AttendanceCountItem item={item} date={date} />}
                keyExtractor={item => item.classid.toString()}
                contentContainerStyle={{ padding: 15, paddingBottom: 30 }}
                ListHeaderComponent={renderHeader}
                showsVerticalScrollIndicator={false}
            />

            {showDatePicker && (
                <DateTimePicker
                    value={date}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onDateChange}
                    maximumDate={new Date()}
                />
            )}

            <AttendanceMenuModal
                visible={menuVisible}
                onClose={() => setMenuVisible(false)}
            />

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    filterContainer: {
        marginBottom: 15,
    },
    pickerButton: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        borderWidth: 1,
        borderColor: '#ddd',
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    label: {
        fontSize: 12,
        color: '#888',
        marginBottom: 2
    },
    pickerText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    summaryCard: {
        padding: 20,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 20,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    summaryTitle: {
        fontSize: 16,
        color: '#555',
        marginBottom: 10,
        textTransform: 'uppercase',
        letterSpacing: 1
    },
    summaryRow: {
        flexDirection: 'row',
        alignItems: 'baseline'
    },
    summaryText: {
        fontSize: 18,
        color: '#333',
        marginRight: 10,
    },
    summaryCount: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#4caf50'
    },
    listHeader: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    }
});
