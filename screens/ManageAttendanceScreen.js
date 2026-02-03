import React, { useState, useContext, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Platform,
    ActivityIndicator,
    Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';
import Toast from 'react-native-toast-message';

import { CoreContext } from '../context/CoreContext';
import { StyleContext } from '../context/StyleContext';
import CustomPickerModal from '../components/CustomPickerModal';
import AttendanceMenuModal from '../components/AttendanceMenuModal';

export default function ManageAttendanceScreen({ navigation }) {
    const coreContext = useContext(CoreContext);
    const styleContext = useContext(StyleContext);

    // State
    const [loading, setLoading] = useState(false);
    const [attLoading, setAttLoading] = useState(false);
    
    // Filters
    const [classes, setClasses] = useState([]);
    const [sections, setSections] = useState([]);
    const [selectedClass, setSelectedClass] = useState(null);
    const [selectedSection, setSelectedSection] = useState(null);
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    
    const [sortBy, setSortBy] = useState('roll'); // roll, enroll, name
    const [filterBy, setFilterBy] = useState('all'); // all, present, absent, unmarked

    // Data
    const [students, setStudents] = useState([]);
    const [presentCount, setPresentCount] = useState(0);

    // Modals
    const [pickerVisible, setPickerVisible] = useState(false);
    const [pickerTitle, setPickerTitle] = useState('');
    const [pickerData, setPickerData] = useState([]);
    const [pickerSelectedValue, setPickerSelectedValue] = useState(null);
    const [pickerOnSelect, setPickerOnSelect] = useState(() => () => {});

    const [menuVisible, setMenuVisible] = useState(false);



    // Styles
    const { primary, background, card, text, border } = styleContext;

    useEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <TouchableOpacity onPress={() => setMenuVisible(true)} style={{ marginRight: 15 }}>
                     <Icon name="dots-vertical" size={26} color={'#fff'} />
                </TouchableOpacity>
            ),
        });
        fetchClasses();
        fetchSections();
    }, []);

    const fetchClasses = () => {
        axios.get('/getallclasses', { params: { branchid: coreContext.branchid } })
            .then(res => {
                const data = res.data.rows.map(item => ({ label: item.classname, value: item.classid }));
                setClasses(data);
            });
    };

    const fetchSections = () => {
         axios.get('/getallsections', { params: { branchid: coreContext.branchid } })
            .then(res => {
                const data = res.data.rows.map(item => ({ label: item.sectionname, value: item.sectionid }));
                setSections(data);
            });
    };

    const handleSearch = () => {
        if (!selectedClass || !selectedSection) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Please select Class and Section' });
            return;
        }

        setAttLoading(true);
        const formattedDate = formatDate(date);
        
        axios.get('/manage-student-attendance', {
            params: {
                classid: selectedClass,
                sectionid: selectedSection,
                attendancedate: formattedDate,
                owner: coreContext.phone,
                branchid: coreContext.branchid,
                filter: filterBy,
                sort: sortBy
            }
        })
        .then(res => {
            setStudents(res.data.rows);
            updatePresentCount(res.data.rows);
            setAttLoading(false);
            if (res.data.rows.length === 0) {
                 Toast.show({ type: 'info', text1: 'No Records', text2: 'No students found for this criteria.' });
            }
        })
        .catch(err => {
            setAttLoading(false);
            console.error(err);
            Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to fetch attendance.' });
        });
    };

    const updatePresentCount = (data) => {
        const count = data.filter(s => s.status === 'present').length;
        setPresentCount(count);
    };

    const toggleAttendance = (student, targetStatus = null) => {
        // Determine new status
        let newStatus = targetStatus;
        if (!newStatus) {
             // Logic for 'Toggle' button (Marked records)
             newStatus = student.status === 'present' ? 'absent' : 'present';
        }

        // Optimistic Update
        const updatedStudents = students.map(s => 
            s.enrollment === student.enrollment ? { ...s, status: newStatus } : s
        );
        setStudents(updatedStudents);
        updatePresentCount(updatedStudents);

        axios.post('/togglestudentattendance', {
            stuid: student.enrollment,
            attendancedate: formatDate(date),
            astatus: newStatus,
            owner: coreContext.phone,
            branchid: coreContext.branchid
        })
        .then(() => {
            // Success silently
        })
        .catch(err => {
            // Revert on error
            setStudents(students); 
            updatePresentCount(students);
            Alert.alert('Error', 'Failed to update attendance');
        });
    };

    const formatDate = (d) => {
        let month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

        if (month.length < 2) month = '0' + month;
        if (day.length < 2) day = '0' + day;

        return [day, month, year].join('-');
    };

    const openPicker = (title, data, selected, onSelect) => {
        setPickerTitle(title);
        setPickerData(data);
        setPickerSelectedValue(selected);
        setPickerOnSelect(() => onSelect); 
        setPickerVisible(true);
    };

    const onDateChange = (event, selectedDate) => {
        setShowDatePicker(false);
        if (selectedDate) {
            setDate(selectedDate);
        }
    };

    const renderCard = ({ item }) => {
        const status = item.status || 'unmarked';
        const isUnmarked = status === 'unmarked';
        
        let cardColor = '#fff'; // Unmarked
        let borderColor = '#ddd';
        
        if (status === 'present') {
            cardColor = '#e8f5e9';
            borderColor = '#4caf50';
        } else if (status === 'absent') {
             cardColor = '#ffebee';
             borderColor = '#ef5350';
        }

        return (
            <View 
                style={[
                    styles.studentCard, 
                    { 
                        backgroundColor: cardColor,
                        borderColor: borderColor
                    }
                ]}
            >
                <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 10}}>
                    <View style={[styles.avatar, { backgroundColor: status === 'present' ? '#4caf50' : (status === 'absent' ? '#ef5350' : '#ddd') }]}>
                        <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
                    </View>
                    <View style={{marginLeft: 15, flex: 1}}>
                        <Text style={styles.nameText}>{item.name}</Text>
                        <Text style={styles.subText}>Roll: {item.roll_no} | ID: {item.enrollment}</Text>
                         <Text style={[styles.statusText, { 
                            color: status === 'present' ? '#2e7d32' : (status === 'absent' ? '#c62828' : '#777') 
                        }]}>
                            {status === 'unmarked' ? 'Not Marked' : (status === 'present' ? 'Present' : 'Absent')}
                        </Text>
                    </View>
                    
                    {/* View Attendance Button */}
                    <TouchableOpacity 
                        style={{ padding: 5 }}
                        onPress={() => navigation.navigate('ViewStudentAttendanceScreen', { student: item })}
                    >
                         <Icon name="calendar-month" size={28} color={styleContext.primary?.backgroundColor || '#6200ee'} />
                    </TouchableOpacity>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 5 }}>
                    {isUnmarked ? (
                        <>
                             <TouchableOpacity 
                                style={[styles.actionButton, { backgroundColor: '#4caf50', marginRight: 10 }]} 
                                onPress={() => toggleAttendance(item, 'present')}
                            >
                                <Text style={styles.actionButtonText}>Mark Present</Text>
                            </TouchableOpacity>
                             <TouchableOpacity 
                                style={[styles.actionButton, { backgroundColor: '#ef5350' }]} 
                                onPress={() => toggleAttendance(item, 'absent')}
                            >
                                <Text style={styles.actionButtonText}>Mark Absent</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                         <TouchableOpacity 
                            style={[styles.actionButton, { backgroundColor: styleContext.primary?.backgroundColor || '#6200ee' }]} 
                            onPress={() => toggleAttendance(item)}
                        >
                            <Text style={styles.actionButtonText}>Toggle Attendance</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: styleContext.background?.backgroundColor || '#f4e0ff' }} edges={['bottom', 'left', 'right']}>
            
            <View style={styles.filterContainer}>
                <View style={styles.row}>
                    <TouchableOpacity 
                        style={styles.pickerButton} 
                        onPress={() => openPicker('Select Class', classes, selectedClass, setSelectedClass)}
                    >
                        <Text style={styles.pickerText}>
                            {classes.find(c => c.value === selectedClass)?.label || 'Class'}
                        </Text>
                        <Icon name="chevron-down" size={20} color="#666" />
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[styles.pickerButton, { marginLeft: 10 }]} 
                        onPress={() => openPicker('Select Section', sections, selectedSection, setSelectedSection)}
                    >
                        <Text style={styles.pickerText}>
                            {sections.find(s => s.value === selectedSection)?.label || 'Section'}
                        </Text>
                        <Icon name="chevron-down" size={20} color="#666" />
                    </TouchableOpacity>
                </View>

                <View style={[styles.row, { marginTop: 10 }]}>
                    <TouchableOpacity 
                        style={[styles.pickerButton, { flex: 1.5 }]} 
                        onPress={() => setShowDatePicker(true)}
                    >
                        <Icon name="calendar" size={20} color="#666" style={{ marginRight: 8 }} />
                        <Text style={styles.pickerText}>{formatDate(date)}</Text>
                    </TouchableOpacity>

                     <TouchableOpacity 
                        style={[styles.searchButton, { marginLeft: 10 }]} 
                        onPress={handleSearch}
                    >
                        {attLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.searchText}>Search</Text>}
                    </TouchableOpacity>
                </View>
                
                {/* Advanced Filters (Optional/Collapsible could be better but sticking to simple row) */}
                <View style={[styles.row, { marginTop: 10, justifyContent: 'space-between' }]}>
                     <TouchableOpacity 
                        style={[styles.smallPicker, { flex: 1 }]}
                        onPress={() => openPicker('Sort By', [
                            {label: 'Roll No', value: 'roll'},
                            {label: 'Enrollment', value: 'enroll'},
                            {label: 'Name', value: 'name'}
                        ], sortBy, setSortBy)}
                    >
                         <Text style={{fontSize: 12, color: '#555'}}>Sort: {sortBy.toUpperCase()}</Text>
                         <Icon name="sort" size={16} color="#555" />
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[styles.smallPicker, { flex: 1, marginLeft: 10 }]}
                        onPress={() => openPicker('Filter By', [
                            {label: 'All Students', value: 'all'},
                            {label: 'Present Only', value: 'present'},
                            {label: 'Absent Only', value: 'absent'},
                            {label: 'Unmarked', value: 'unmarked'}
                        ], filterBy, setFilterBy)}
                    >
                         <Text style={{fontSize: 12, color: '#555'}}>Filter: {filterBy.toUpperCase()}</Text>
                         <Icon name="filter-variant" size={16} color="#555" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* List */}
            <View style={{ flex: 1, paddingHorizontal: 15 }}>
                {students.length > 0 && (
                    <View style={styles.statsHeader}>
                         <Text style={styles.statsText}>Present: {presentCount} / {students.length}</Text>
                    </View>
                )}
                
                <FlatList
                    data={students}
                    renderItem={renderCard}
                    keyExtractor={item => item.enrollment.toString()}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    showsVerticalScrollIndicator={false}
                />
            </View>

            {showDatePicker && (
                <DateTimePicker
                    value={date}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onDateChange}
                    maximumDate={new Date()} // Cannot mark future
                />
            )}

            <CustomPickerModal
                visible={pickerVisible}
                title={pickerTitle}
                data={pickerData}
                selectedValue={pickerSelectedValue}
                onSelect={setPickerSelectedValue}
                onClose={() => setPickerVisible(false)}
                onConfirm={() => {
                   if (pickerOnSelect) {
                       pickerOnSelect(pickerSelectedValue);
                   }
                   setPickerVisible(false);
                }}
            />

            <AttendanceMenuModal
                visible={menuVisible}
                onClose={() => setMenuVisible(false)}
            />

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    filterContainer: {
        backgroundColor: 'rgba(255,255,255,0.7)',
        padding: 15,
        margin: 15,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.5)',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    pickerButton: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 10,
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderWidth: 1,
        borderColor: '#ddd',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    pickerText: {
        fontSize: 14,
        color: '#333',
    },
    searchButton: {
        flex: 1,
        backgroundColor: '#6a00ff',
        borderRadius: 10,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    searchText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    smallPicker: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#eee'
    },
    statsContainer: {
        paddingVertical: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 5
    },
    statsHeader: {
    },
    bulkToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 5
    },
    bulkText: {
        marginLeft: 8,
        fontSize: 14,
        fontWeight: '600'
    },
    statsText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    studentCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#eee',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    avatar: {
        width: 45,
        height: 45,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 18,
    },
    nameText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    subText: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    statusText: {
        fontSize: 13,
        fontWeight: 'bold',
        marginTop: 4,
    },
    actionButton: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 12,
    }
});
