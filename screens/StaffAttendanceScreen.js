import React, { useState, useEffect, useContext, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Alert, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import axios from 'axios';
import { CoreContext } from '../context/CoreContext';
import { StyleContext } from '../context/StyleContext';

export default function StaffAttendanceScreen({ route, navigation }) {
    const coreContext = useContext(CoreContext);
    const styleContext = useContext(StyleContext);
    const { branchid, holidays } = coreContext;

    // Handle both parameter formats: staff object or staffId/staffMobile
    const { staff: staffParam, staffId, staffMobile, action } = route.params || {};
    const staff = staffParam || (staffId ? { empid: staffId, mobile: staffMobile, name: 'Staff Member' } : null);

    const scrollViewRef = useRef(null);
    const detailsRef = useRef(null);

    const [loading, setLoading] = useState(false);
    const [attendanceDate, setAttendanceDate] = useState(null); // Selected date details
    const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]); // YYYY-MM-DD
    const [markedDates, setMarkedDates] = useState({}); // For Calendar
    const [stats, setStats] = useState({ present: 0, absent: 0, late: 0, half: 0 });
    const [message, setMessage] = useState('Tap a date to see details...');
    const [localHolidays, setLocalHolidays] = useState([]); // Local holidays state
    
    const [leaveRemark, setLeaveRemark] = useState('');
    const [plBalance, setPlBalance] = useState(0); // Actually CL Balance
    const [plBalanceEncash, setPlBalanceEncash] = useState(0); 
    const [attendanceMonth, setAttendanceMonth] = useState(new Date().getMonth() + 1); // Track month for encashment logic
    
    // For applying leave
    const [selectedLeaveDates, setSelectedLeaveDates] = useState([]);
    
    useEffect(() => {
        if (staff) {
            const date = new Date();
            let month = date.getMonth() + 1;
            setAttendanceMonth(month);
            getMarkedDates(month);
            getPLBalance();
            getPLBalanceEncash(month);
            fetchHolidays(); // Fetch holidays on mount
        }
    }, []);

    const getPLBalance = () => {
        axios.get('/pl-balance', { params: { empid: staff.empid, branchid } })
            .then(response => {
                const val = response.data.plBalance !== undefined ? response.data.plBalance : 
                            response.data.balance !== undefined ? response.data.balance :
                            response.data.pl !== undefined ? response.data.pl : 0;
                setPlBalance(val);
            })
            .catch(err => console.log('PL Balance Error', err));
    };

    const getPLBalanceEncash = (mth) => {
        axios.get('/pl-balance-encash', { params: { empid: staff.empid, branchid, month: mth } })
            .then(response => {
                if(response.data) setPlBalanceEncash(response.data.plBalance || 0);
            })
            .catch(err => console.log('PL Encash Error', err));
    };

    const applyForLeaveEncashment = () => {
        setLoading(true);
        axios.post('/leave-encashment-application', { 
            empid: staff.empid, 
            branchid, 
            month: attendanceMonth, 
            count: plBalanceEncash 
        }).then(response => {
            setLoading(false);
            if (response.data.result === 'ok') {
                Toast.show({ type: 'success', text1: 'Success', text2: 'Leave encashment applied successfully' });
                getPLBalanceEncash(attendanceMonth);
            } else if (response.data.result === 'not') {
                Toast.show({ type: 'error', text1: 'Error', text2: 'Salary already processed for this month' });
            } else if (response.data.result === 'nott') {
                Toast.show({ type: 'error', text1: 'Error', text2: 'Cannot process for future months' });
            } else {
                Toast.show({ type: 'error', text1: 'Error', text2: 'Request not processed' });
            }
        }).catch(err => {
            setLoading(false);
            console.log(err);
            Toast.show({ type: 'error', text1: 'Error', text2: 'Network Error' });
        });
    };

    const fetchHolidays = () => {
        axios.get('/fetchholidays', { params: { branchid } })
            .then(res => {
                setLocalHolidays(res.data.holidays || []);
            })
            .catch(err => {
                // Error fetching holidays
            });
    };

    const getMarkedDates = (month) => {
        setLoading(true);
        
        // Fetch both holidays and attendance data
        Promise.all([
            axios.get('/fetchholidays', { params: { branchid } }),
            axios.get('/view-staff-calendar-attendance', { 
                params: { 
                    attendancemonth: month, 
                    empid: staff.empid,    
                    branchid 
                } 
            })
        ])
        .then(([holidaysRes, attendanceRes]) => {
            setLoading(false);
            const holidays = holidaysRes.data.holidays || [];
            const attendanceData = attendanceRes.data.rows || [];
            
            setLocalHolidays(holidays);
            
            // Process attendance with holidays
            processAttendanceData(attendanceData, holidays);
        })
        .catch(err => {
            setLoading(false);
            console.log('Attendance Fetch Error', err);
        });
    };

    const processAttendanceData = (data, holidaysData = localHolidays) => {
        let newMarked = {};
        let p = 0, a = 0, l = 0, h = 0;

        // First, add holidays to marked dates
        if (holidaysData && Array.isArray(holidaysData)) {
            const filteredHolidays = holidaysData.filter(hhdd => {
                const subcatArr = hhdd.subcat ? hhdd.subcat.split(',') : [];
                const holidayGroup = staff.holiday_group || '';
                return (hhdd.category === 'forall' || hhdd.category === 'forstaff') &&
                    (subcatArr.includes(holidayGroup) || hhdd.subcat === '');
            });

            filteredHolidays.forEach(hdet => {
                const dateStr = hdet.dat;
                let selectedColor = 'white';

                if (hdet.category === 'forall') {
                    selectedColor = '#9B63F8'; // Purple for all holidays
                } else if (hdet.category === 'forstaff') {
                    selectedColor = '#808000'; // Olive for staff holidays
                } else if (hdet.category === 'celebration') {
                    selectedColor = '#D33A2C'; // Red for celebrations
                }

                newMarked[dateStr] = {
                    selected: true,
                    selectedColor: selectedColor,
                    data: { date: dateStr, status: hdet.category, holiday: hdet.holidayname }
                };
            });
        }

        // Then, add/override with attendance data
        data.forEach(det => {
            const dateStr = det.date; // "YYYY-MM-DD"
            const status = det.status;
            let color = null;
            
            if (status === 'present') { p++; color = 'green'; }
            else if (status === 'absent') { a++; color = 'red'; }
            else if (status === 'Late') { l++; color = 'brown'; }
            else if (status === 'Half Time') { h++; color = 'pink'; }
            else if (['pl', 'cl', 'sl'].includes(status)) { color = '#FFD700'; } // Yellow

            // Only mark if there's a color (attendance marked)
            if (color) {
                newMarked[dateStr] = { 
                    selected: true,
                    selectedColor: color,
                    data: det // Store full details
                };
            }
        });

        setMarkedDates(newMarked);
        setStats({ present: p, absent: a, late: l, half: h });
    };

    const onMonthChange = (month) => {
        setCurrentDate(month.dateString);
        setAttendanceMonth(month.month);
        getMarkedDates(month.month);
        getPLBalanceEncash(month.month);
    };

    const onDayPress = (day) => {
        // Unselect leave application mode if just tapping
        setSelectedLeaveDates([]);
        
        const dateStr = day.dateString;
        const details = markedDates[dateStr];

        if (details) {
            const d = details.data;
            // Store full attendance data for rich display
            const newData = { ...d, dateStr };
            setAttendanceDate(newData);
            setMessage(''); // Clear message when we have data

            // Scroll to details section after a short delay
            setTimeout(() => {
                detailsRef.current?.measureLayout(
                    scrollViewRef.current,
                    (x, y) => {
                        scrollViewRef.current?.scrollTo({ y: y - 20, animated: true });
                    },
                    () => { }
                );
            }, 100);
        } else {
            setAttendanceDate(null);
            setMessage(`${dateStr}\nNo attendance record`);
        }
    };

    const onDayLongPress = (day) => {
        // Start leave application flow
        const dateStr = day.dateString;
        
        // Check if past date?
        if (day.timestamp < new Date().getTime()) {
             // Legacy check: can't apply for past?
             // "Leave can not applied for past dates ..."
             // Assuming we want strict future only or current day?
             // Let's mimic legacy loosely but allow user to try.
             Toast.show({ type: 'info', text1: 'Note', text2: 'Applying for past dates might differ.' });
        }
        
        // Toggle selection
        let newSelected = [...selectedLeaveDates];
        if (newSelected.includes(dateStr)) {
            newSelected = newSelected.filter(d => d !== dateStr);
        } else {
            newSelected.push(dateStr);
        }
        setSelectedLeaveDates(newSelected);
        
        if (newSelected.length > 0) {
            setMessage(`Applying for: ${newSelected.join(', ')}`);
        } else {
            setMessage('Tap a date to see details...');
        }
    };
    
    const [ltype, setLtype] = useState('cl'); // Default to 'cl' (CL) as per legacy CL Balance display

    const applyForLeave = () => {
        if (selectedLeaveDates.length === 0) return;
        if (!leaveRemark.trim()) {
            Alert.alert('Error', 'Please enter remarks for leave');
            return;
        }
        
        if (ltype === 'pl') {
             // CL Logic (UI says CL, backend uses 'pl')
             if (selectedLeaveDates.length > plBalance) {
                 Alert.alert('Limit Exceeded', `You cannot apply for more than ${plBalance} CLs.`);
                 return;
             }
        }
        
        submitLeave(ltype);
    };
    
    const submitLeave = (type) => {
        setLoading(true);
        axios.post('/staff-leave-application', {
            empid: staff.empid,
            holidaydate: selectedLeaveDates,
            remarks: leaveRemark,
            etype: type,
            pstatus: 'raised',
            branchid
        }).then(response => {
            setLoading(false);
             if (response.data.result === 'ok') {
                Toast.show({ type: 'success', text1: 'Success', text2: 'Leave Applied' });
                setSelectedLeaveDates([]);
                setLeaveRemark('');
                
                axios.post('/log-action-on-app', { action: 'Leave Application', branchid });
                
                // Refresh data
                const date = new Date();
                let month = date.getMonth() + 1;
                getMarkedDates(month);
                getPLBalance();
                
            } else if (response.data.result === 'duplicate') {
                Toast.show({ type: 'error', text1: 'Error', text2: 'Already applied for this date' });
            } else {
                Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to apply' });
            }
        }).catch(err => {
            setLoading(false);
            Toast.show({ type: 'error', text1: 'Error', text2: 'Network error' });
        });
    };
    
    // Merge selected leave dates into markedDates for visual feedback
    const getDisplayMarkedDates = () => {
        const temp = { ...markedDates };
        selectedLeaveDates.forEach(d => {
            temp[d] = {
                ...(temp[d] || {}),
                selected: true,
                selectedColor: '#00adf5', // distinct color for selection
                startingDay: true, 
                endingDay: true
            };
        });
        return temp;
    };

    return (
        <SafeAreaView style={styleContext.background} edges={['bottom', 'left', 'right']}>
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
            >
                <ScrollView ref={scrollViewRef} contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
                 <View style={styleContext.card}>
                     <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: styleContext.titleColor }}>
                         {staff.name}
                     </Text>
                     
                     {selectedLeaveDates.length > 0 ? (
                         <Text style={{ color: '#666', marginBottom: 5, fontWeight: 'bold' }}>
                            CL Balance : {plBalance}
                         </Text>
                     ) : (
                         <View>
                            <Text style={{ color: '#666', marginBottom: 5, fontWeight: 'bold' }}>
                                Encashable CL Balance : {plBalanceEncash}
                            </Text>
                            {plBalanceEncash > 0 && attendanceMonth <= (new Date().getMonth() + 1) && (
                                <TouchableOpacity 
                                    style={[styles.actionBtn, { backgroundColor: styleContext.primaryColor, paddingVertical: 8, alignSelf: 'flex-start', marginBottom: 10 }]}
                                    onPress={applyForLeaveEncashment}
                                    disabled={loading}
                                >
                                    <Text style={[styles.btnText, { fontSize: 14 }]}>Encash Now</Text>
                                </TouchableOpacity>
                            )}
                         </View>
                     )}
                     
                     <Calendar
                        current={currentDate}
                        onMonthChange={onMonthChange}
                        onDayPress={onDayPress}
                        onDayLongPress={onDayLongPress}
                        markedDates={getDisplayMarkedDates()}
                        markingType={'simple'}
                        enableSwipeMonths={true}
                        theme={{
                            arrowColor: styleContext.primaryColor,
                            monthTextColor: styleContext.titleColor,
                            textMonthFontWeight: 'bold',
                            todayTextColor: styleContext.primaryColor,
                            dayTextColor: '#333',
                            textDisabledColor: '#d9e1e8',
                            dotColor: styleContext.primaryColor,
                            selectedDayBackgroundColor: styleContext.primaryColor,
                            selectedDayTextColor: '#ffffff',
                        }}
                     />
                     
                     <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 15, justifyContent: 'space-between', alignItems: 'center' }}>
                         <Text style={[styles.legend, { backgroundColor: 'green' }]}>Present: {stats.present}</Text>
                         <Text style={[styles.legend, { backgroundColor: 'red' }]}>Absent: {stats.absent}</Text>
                         <Text style={[styles.legend, { backgroundColor: 'brown' }]}>Late: {stats.late}</Text>
                         <Text style={[styles.legend, { backgroundColor: 'pink', color: '#333' }]}>Half: {stats.half}</Text>
                         <View style={{ width: '100%', height: 5 }} /> 
                         <Text style={[styles.legend, { backgroundColor: '#9B63F8' }]}>H-All</Text>
                         <Text style={[styles.legend, { backgroundColor: '#D33A2C' }]}>Celebration</Text>
                         <Text style={[styles.legend, { backgroundColor: '#808000' }]}>H-Staff</Text>
                         <Text style={[styles.legend, { backgroundColor: 'yellow', color: 'red' }]}>Leave</Text>
                     </View>
                     
                        <View ref={detailsRef} collapsable={false}>
                            {attendanceDate ? (
                                <View style={{ marginTop: 20, backgroundColor: '#fff', borderRadius: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }}>
                                    <View style={{ backgroundColor: styleContext.primaryColor || '#6a00ff', padding: 12 }}>
                                        <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#fff', textAlign: 'center' }}>
                                            {attendanceDate.dateStr ? attendanceDate.dateStr.split('-').reverse().join('-') : ''}
                                        </Text>
                                    </View>
                                    <View style={{ padding: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                                            <Icon name={attendanceDate.status === 'present' ? 'check-circle' : attendanceDate.status === 'absent' ? 'close-circle' : attendanceDate.status === 'Late' ? 'clock-alert' : attendanceDate.status === 'Half Time' ? 'clock-time-four' : 'information'} size={24} color={attendanceDate.status === 'present' ? '#4CAF50' : attendanceDate.status === 'absent' ? '#F44336' : attendanceDate.status === 'Late' ? '#FF9800' : attendanceDate.status === 'Half Time' ? '#FF69B4' : '#2196F3'} />
                                            <Text style={{ fontSize: 18, fontWeight: 'bold', marginLeft: 10, color: attendanceDate.status === 'present' ? '#4CAF50' : attendanceDate.status === 'absent' ? '#F44336' : attendanceDate.status === 'Late' ? '#FF9800' : attendanceDate.status === 'Half Time' ? '#FF69B4' : '#2196F3' }}>
                                                {attendanceDate.status === 'pl' ? 'CL' : attendanceDate.status === 'cl' ? 'LWP' : attendanceDate.status === 'sl' ? 'SL' : attendanceDate.status === 'hl' ? 'HL' : attendanceDate.status === 'Half Time' ? 'Half Day' : attendanceDate.status.charAt(0).toUpperCase() + attendanceDate.status.slice(1)}
                                            </Text>
                                        </View>
                                    </View>
                                    {(attendanceDate.status === 'present' || attendanceDate.status === 'Late' || attendanceDate.status === 'Half Time') && (
                                        <View style={{ padding: 15 }}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15, backgroundColor: '#E8F5E9', padding: 12, borderRadius: 8 }}>
                                                <View style={{ backgroundColor: '#4CAF50', padding: 8, borderRadius: 8 }}>
                                                    <Icon name="login" size={24} color="#fff" />
                                                </View>
                                                <View style={{ marginLeft: 12, flex: 1 }}>
                                                    <Text style={{ fontSize: 12, color: '#666', marginBottom: 2 }}>In Time</Text>
                                                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#4CAF50' }}>{attendanceDate.atime || '--:--'}</Text>
                                                </View>
                                            </View>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF3E0', padding: 12, borderRadius: 8 }}>
                                                <View style={{ backgroundColor: '#FF9800', padding: 8, borderRadius: 8 }}>
                                                    <Icon name="logout" size={24} color="#fff" />
                                                </View>
                                                <View style={{ marginLeft: 12, flex: 1 }}>
                                                    <Text style={{ fontSize: 12, color: '#666', marginBottom: 2 }}>Out Time</Text>
                                                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#FF9800' }}>{attendanceDate.otime || '--:--'}</Text>
                                                </View>
                                            </View>
                                        </View>
                                    )}
                                </View>
                            ) : message ? (
                                <View style={{ marginTop: 20, padding: 15, backgroundColor: '#f9f9f9', borderRadius: 8, borderLeftWidth: 4, borderLeftColor: styleContext.primaryColor || '#6a00ff' }}>
                                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#444', marginBottom: 8 }}>Details:</Text>
                                    <Text style={{ fontSize: 14, lineHeight: 22, color: '#333' }}>{message}</Text>
                                </View>
                            ) : (
                                <View style={{ marginTop: 20, padding: 15, backgroundColor: '#f9f9f9', borderRadius: 8, alignItems: 'center' }}>
                                    <Icon name="calendar-blank" size={48} color="#ccc" />
                                    <Text style={{ fontSize: 14, color: '#999', marginTop: 10 }}>Tap a date to see details</Text>
                                </View>
                            )}
                        </View>
                 </View>


                {selectedLeaveDates.length > 0 && (
                    <View style={[styleContext.card, { marginTop: 15 }]}>
                        <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>Apply For Leave</Text>
                        

                        
                        <TextInput
                            style={[styleContext.input, { borderWidth: 1, borderColor: '#ccc', borderRadius: 5, padding: 10, color: '#333' }]}
                            placeholder="Enter Remarks"
                            placeholderTextColor="#888"
                            value={leaveRemark}
                            onChangeText={setLeaveRemark}
                        />
                        <TouchableOpacity 
                            style={[styles.actionBtn, { backgroundColor: styleContext.primaryColor || '#6a00ff', marginTop: 10 }]}
                            onPress={applyForLeave}
                        >
                            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Apply Leave</Text>}
                        </TouchableOpacity>
                         <TouchableOpacity 
                            style={[styles.actionBtn, { backgroundColor: '#777', marginTop: 10 }]}
                            onPress={() => setSelectedLeaveDates([])}
                        >
                            <Text style={styles.btnText}>Cancel Selection</Text>
                        </TouchableOpacity>
                    </View>
                )}

             </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    legend: {
        color: '#fff',
        paddingVertical: 6, // Increased slightly
        paddingHorizontal: 8,
        borderRadius: 4,
        marginBottom: 5,
        fontSize: 12,
        overflow: 'hidden',
        textAlign: 'center', // Center text
    },
    actionBtn: {
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center'
    },
    btnText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16
    },
});
