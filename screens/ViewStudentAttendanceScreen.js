import React, { useState, useContext, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import axios from 'axios';
import Toast from 'react-native-toast-message';

import { CoreContext } from '../context/CoreContext';
import { StyleContext } from '../context/StyleContext';
import AttendanceMenuModal from '../components/AttendanceMenuModal';

export default function ViewStudentAttendanceScreen({ navigation, route }) {
    const coreContext = useContext(CoreContext);
    const styleContext = useContext(StyleContext);
    const { primary, background, card, text, border } = styleContext;

    // State
    const [menuVisible, setMenuVisible] = useState(false);
    
    // Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    
    // Selected Student State
    const [selectedStudent, setSelectedStudent] = useState(null);
    
    // Attendance Data
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [markedDates, setMarkedDates] = useState({});
    const [loadingData, setLoadingData] = useState(false);
    const [stats, setStats] = useState({ present: 0, absent: 0 });

    useEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <TouchableOpacity onPress={() => setMenuVisible(true)} style={{ marginRight: 15 }}>
                     <Icon name="dots-vertical" size={26} color={'#fff'} />
                </TouchableOpacity>
            ),
        });
        
        // If passed via params (e.g. from Manage Attendance)
        if (route.params?.student) {
            handleSelectStudent(route.params.student);
        }
        
        // Ensure school data is loaded for labels
        if (!coreContext.schoolData || !coreContext.schoolData.smallEnr) {
            coreContext.getSchoolData();
        }
    }, []);

    // Fetch Attendance when student or month changes
    useEffect(() => {
        if (selectedStudent) {
            fetchAttendanceAndHolidays(currentMonth);
        }
    }, [selectedStudent, currentMonth, currentYear]);

    const handleSearch = (text) => {
        setSearchQuery(text);
        if (text.length > 2) {
            setSearching(true);
            setShowResults(true);
            axios.get('/filter-search-student-2', { 
                params: { filter: text, branchid: coreContext.branchid } 
            })
            .then(res => {
                setSearchResults(res.data.allStudents || []);
                setSearching(false);
            })
            .catch(err => {
                console.error(err);
                setSearching(false);
            });
        } else {
            setSearchResults([]);
            setShowResults(false);
        }
    };

    const handleSelectStudent = (student) => {
        setSelectedStudent(student);
        const name = student.name || `${student.firstname} ${student.lastname}`;
        setSearchQuery(name);
        setShowResults(false);
        // Reset query text to show name
    };

    const fetchAttendanceAndHolidays = async (month) => {
        setLoadingData(true);
        try {
            const [attRes, holRes] = await Promise.all([
                axios.get('/viewcalendarattendance', {
                    params: {
                        attendancemonth: month,
                        enrid: selectedStudent.enrollment,
                        branchid: coreContext.branchid
                    }
                }),
                axios.get('/fetchholidays', {
                    params: { branchid: coreContext.branchid }
                })
            ]);

            processCalendarData(attRes.data.rows || [], holRes.data.holidays || []);
            setLoadingData(false);
        } catch (error) {
            console.error(error);
            Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to fetch attendance data' });
            setLoadingData(false);
        }
    };

    const processCalendarData = (attendanceData, holidays) => {
        const newMarkedDates = {};
        let presentCount = 0;
        let absentCount = 0;

        // Process Holidays first
        holidays.forEach(h => {
             // Basic parsing (Assuming YYYY-MM-DD or similar standard from legacy)
             // Legacy code implies simple date stirngs in 'dat' field
             const dateStr = h.dat; 
             
             // Check if holiday applies to this student (simplified from legacy)
             // Legacy checks h.subcat (CSV classIds) vs student.classid
             let applies = false;
             if (h.category === 'forall') applies = true;
             else if (h.category === 'celebration') applies = true;
             else if (h.category === 'forstudents') {
                 if (!h.subcat || h.subcat === '') applies = true;
                 else {
                     const classIds = h.subcat.split(',');
                     if (classIds.includes(String(selectedStudent.classid))) applies = true;
                 }
             }

             if (applies) {
                 newMarkedDates[dateStr] = {
                     selected: true,
                     selectedColor: h.category === 'celebration' ? '#D33A2C' : (h.category === 'forall' ? '#9B63F8' : '#808000'),
                     type: 'holiday'
                 };
             }
        });

        // Process Attendance (Overwrites holiday if present/absent explicitly marked? Legacy logic suggests attendance takes precedence or merges)
        // Legacy: "if status is present ... else if absent ... if not holiday date then red"
        
        attendanceData.forEach(att => {
            const dateStr = att.date; // Assuming YYYY-MM-DD
            if (att.status === 'present') {
                presentCount++;
                newMarkedDates[dateStr] = { selected: true, selectedColor: 'green' }; // Green
            } else if (att.status === 'absent') {
                // Only mark absent red if NOT a holiday?
                // Legacy: if (!hdetsDates.includes(d)) absent++
                if (!newMarkedDates[dateStr] || newMarkedDates[dateStr].type !== 'holiday') {
                     absentCount++;
                     newMarkedDates[dateStr] = { selected: true, selectedColor: 'red' }; 
                }
            }
        });

        setMarkedDates(newMarkedDates);
        setStats({ present: presentCount, absent: absentCount });
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: styleContext.background?.backgroundColor || '#f4e0ff' }} edges={['bottom', 'left', 'right']}>
            
            <View style={styles.container}>
                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <Icon name="account-search" size={24} color="#666" style={{ marginRight: 10 }} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search Student (Name, ID, Roll)"
                        value={searchQuery}
                        onChangeText={handleSearch}
                    />
                    {searching && <ActivityIndicator size="small" color="#666" />}
                </View>

                {/* Search Results Overlay */}
                {showResults && searchResults.length > 0 && (
                    <View style={styles.resultsList}>
                        <FlatList
                            data={searchResults}
                            keyExtractor={item => item.enrollment.toString()}
                            renderItem={({ item }) => (
                                <TouchableOpacity 
                                    style={styles.resultItem} 
                                    onPress={() => handleSelectStudent(item)}
                                >
                                    <Text style={styles.resultName}>{item.firstname} {item.lastname}</Text>
                                    <Text style={styles.resultInfo}>{item.clas} {item.section} | Roll: {item.roll} | {coreContext.schoolData.smallEnr}: {item.enrollment} | {coreContext.schoolData.smallReg}: {item.scholarno}</Text>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                )}

                {/* Selected Student Info */}
                {selectedStudent && (
                    <View style={styles.studentCard}>
                        <Text style={styles.studentName}>{selectedStudent.name || `${selectedStudent.firstname} ${selectedStudent.lastname}`}</Text>
                        <Text style={styles.studentDetails}>{coreContext.schoolData?.smallEnr || 'ID'}: {selectedStudent.enrollment} | {coreContext.schoolData?.smallReg || 'Reg No'}: {selectedStudent.scholarno}</Text>
                        <Text style={styles.studentDetails}>Class: {selectedStudent.clas} {selectedStudent.section}</Text>
                    </View>
                )}

                {/* Calendar */}
                {selectedStudent ? (
                    <View style={styles.calendarContainer}>
                        <Calendar
                            // Initially visible month
                            current={new Date()} 
                            // Handler which gets executed when visible month changes in calendar. Default = undefined
                            onMonthChange={(month) => {
                                setCurrentMonth(month.month);
                                setCurrentYear(month.year);
                            }}
                            markedDates={markedDates}
                            theme={{
                                arrowColor: '#6200ee',
                                todayTextColor: '#6200ee',
                            }}
                        />

                        {/* Legend / Stats */}
                        <View style={styles.statsContainer}>
                            <View style={styles.statItem}>
                                <View style={[styles.dot, { backgroundColor: 'green' }]} />
                                <Text style={styles.statText}>Present: {stats.present}</Text>
                            </View>
                            <View style={styles.statItem}>
                                <View style={[styles.dot, { backgroundColor: 'red' }]} />
                                <Text style={styles.statText}>Absent: {stats.absent}</Text>
                            </View>
                        </View>
                         <View style={styles.legendContainer}>
                            <View style={styles.legendItem}><View style={[styles.dot, {backgroundColor: '#9B63F8'}]} /><Text style={styles.legendText}>Holiday (All)</Text></View>
                            <View style={styles.legendItem}><View style={[styles.dot, {backgroundColor: '#D33A2C'}]} /><Text style={styles.legendText}>Celebration</Text></View>
                            <View style={styles.legendItem}><View style={[styles.dot, {backgroundColor: '#808000'}]} /><Text style={styles.legendText}>Student Holiday</Text></View>
                        </View>
                    </View>
                ) : (
                    <View style={styles.emptyState}>
                         <Icon name="calendar-search" size={60} color="#ccc" />
                         <Text style={styles.emptyText}>Search and select a student to view attendance</Text>
                    </View>
                )}
            </View>

            <AttendanceMenuModal
                visible={menuVisible}
                onClose={() => setMenuVisible(false)}
            />

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 15,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 10,
        paddingHorizontal: 15,
        height: 50,
        borderWidth: 1,
        borderColor: '#ddd',
        marginBottom: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#333'
    },
    resultsList: {
        position: 'absolute',
        top: 70, // Below search bar
        left: 15,
        right: 15,
        backgroundColor: '#fff',
        borderRadius: 10,
        maxHeight: 200,
        zIndex: 1000,
        borderWidth: 1,
        borderColor: '#ddd',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 5,
    },
    resultItem: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee'
    },
    resultName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333'
    },
    resultInfo: {
        fontSize: 12,
        color: '#666'
    },
    studentCard: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 10,
        marginBottom: 15,
        borderLeftWidth: 5,
        borderLeftColor: '#6200ee',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    studentName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333'
    },
    studentDetails: {
        fontSize: 14,
        color: '#666',
        marginTop: 2
    },
    calendarContainer: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee'
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 8
    },
    statText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333'
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    emptyText: {
        marginTop: 10,
        fontSize: 16,
        color: '#888'
    },
    legendContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        paddingTop: 10
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 8,
        marginVertical: 4
    },
    legendText: {
        fontSize: 12,
        color: '#555'
    }
});
