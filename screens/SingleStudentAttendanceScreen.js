import React, { useState, useContext, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    ScrollView,
    Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import axios from 'axios';
import Toast from 'react-native-toast-message';

import { CoreContext } from '../context/CoreContext';
import { StyleContext } from '../context/StyleContext';
import AttendanceMenuModal from '../components/AttendanceMenuModal';
import CustomPickerModal from '../components/CustomPickerModal';
import EventAttendanceModal from '../components/EventAttendanceModal';

export default function SingleStudentAttendanceScreen({ navigation }) {
    const coreContext = useContext(CoreContext);
    const styleContext = useContext(StyleContext);
    const { primary, background } = styleContext;

    // Modes: 'transport' | 'event'
    const [mode, setMode] = useState('transport');

    // Data State
    const [buses, setBuses] = useState([]);
    const [routes, setRoutes] = useState([]);
    const [events, setEvents] = useState([]);

    // Selection State
    const [selectedBus, setSelectedBus] = useState(null); // busno
    const [selectedRoute, setSelectedRoute] = useState(null); // routename
    const [selectedEvent, setSelectedEvent] = useState(null); // eventid

    // Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);

    // Picker State
    const [pickerVisible, setPickerVisible] = useState(false);
    const [pickerTitle, setPickerTitle] = useState('');
    const [pickerData, setPickerData] = useState([]);
    const [pickerSelectedValue, setPickerSelectedValue] = useState(null);
    const [pickerOnSelect, setPickerOnSelect] = useState(() => () => {});

    const [submitting, setSubmitting] = useState(false);
    const [menuVisible, setMenuVisible] = useState(false);

    // Event Modal State
    const [eventModalVisible, setEventModalVisible] = useState(false);
    const [eventLoading, setEventLoading] = useState(false);
    const [eventHistory, setEventHistory] = useState([]);
    const [eventStatus, setEventStatus] = useState(null);

    useEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <TouchableOpacity onPress={() => setMenuVisible(true)} style={{ marginRight: 15 }}>
                    <Icon name="dots-vertical" size={26} color={'#fff'} />
                </TouchableOpacity>
            ),
        });
        
        // Initial Fetch based on mode
        if (mode === 'transport') fetchBuses();
        if (mode === 'event') fetchEvents();

    }, [mode]);

    const fetchBuses = () => {
        axios.get('/all-buses', { params: { branchid: coreContext.branchid } })
            .then(res => {
                const busList = res.data.allBuses || [];
                // map to label/value for picker: busno is used as ID in legacy
                setBuses(busList.map(b => ({ label: `Bus ${b.busno}`, value: b.busno })));
            })
            .catch(err => console.error('Error fetching buses', err));
    };

    const fetchRoutes = (busNo) => {
        axios.get('/bus-routes', { params: { branchid: coreContext.branchid, busno: busNo } })
            .then(res => {
                const routeList = res.data.allRoutes || [];
                // route name is used as value
                setRoutes(routeList.map(r => ({ label: r.name, value: r.name }))); 
            })
            .catch(err => console.error('Error fetching routes', err));
    };

    const fetchEvents = () => {
        axios.get('/attendance-events', { params: { branchid: coreContext.branchid } })
            .then(res => {
                const eventList = res.data.events || [];
                setEvents(eventList.map(e => ({ label: e.ename, value: e.id })));
            })
            .catch(err => console.error('Error fetching events', err));
    };

    const handleSearch = (text) => {
        setSearchQuery(text);
        if (text.length > 0) {
            setSearchLoading(true);
            setShowResults(true);

            // Check if input is numeric (assuming ID search)
            if (!isNaN(text) && text.trim() !== '') {
                axios.get('/fetchstudentdetails', {
                    params: {
                        branchid: coreContext.branchid,
                        regnos: [text] // Legacy expects array
                    }
                })
                .then(res => {
                    setSearchResults(res.data.students || []);
                    setSearchLoading(false);
                })
                .catch(err => {
                    console.error('ID Search Error', err);
                    // Fallback or just stop? Let's try name search if ID fails or just stop.
                    // If ID search fails, it might just be a number in a name? Unlikely.
                    setSearchLoading(false);
                });
            } else {
                // Name Search
                axios.get('/filter-search-student-2', {
                    params: {
                        branchid: coreContext.branchid,
                        filter: text
                    }
                })
                .then(res => {
                    setSearchResults(res.data.allStudents || []);
                    setSearchLoading(false);
                })
                .catch(err => {
                    console.error('Name Search Error', err);
                    setSearchLoading(false);
                });
            }
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
    };

    const openPicker = (title, data, selected, onSelect) => {
        setPickerTitle(title);
        setPickerData(data);
        setPickerSelectedValue(selected);
        setPickerOnSelect(() => onSelect);
        setPickerVisible(true);
    };

    const handleBusSelect = (busNo) => {
        setSelectedBus(busNo);
        setSelectedRoute(null); // Reset route
        fetchRoutes(busNo);
    };

    const handleSubmit = () => {
        if (!selectedStudent) {
            Toast.show({ type: 'error', text1: 'Validation Error', text2: 'Please select a student' });
            return;
        }

        if (mode === 'transport') {
            if (!selectedBus) {
                Toast.show({ type: 'error', text1: 'Validation Error', text2: 'Please select a Bus' });
                return;
            }
            if (!selectedRoute) {
                Toast.show({ type: 'error', text1: 'Validation Error', text2: 'Please select a Route' });
                return;
            }
            markTransportAttendance();
        } else if (mode === 'event') {
            if (!selectedEvent) {
                Toast.show({ type: 'error', text1: 'Validation Error', text2: 'Please select an Event' });
                return;
            }
            markEventAttendance();
        }
    };

    const markTransportAttendance = () => {
        setSubmitting(true);
        axios.post('/mark-transport-attendance', {
            regno: selectedStudent.enrollment,
            busno: selectedBus,
            routename: selectedRoute,
            owner: coreContext.phone,
            branchid: coreContext.branchid
        })
        .then(response => {
            setSubmitting(false);
            const result = response.data.result;
            if (result === 'ok') {
                Toast.show({ type: 'success', text1: 'Success', text2: 'Attendance marked successfully.' });
            } else if (result === 'out') {
                Toast.show({ type: 'success', text1: 'Success', text2: 'Marked OUT successfully.' });
            } else if (result === 'already') {
                Toast.show({ type: 'info', text1: 'Info', text2: 'Attendance already marked.' });
            } else if (result === 'wrong') {
                Toast.show({ type: 'error', text1: 'Error', text2: 'Wrong bus or route.' });
            } else {
                Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to mark attendance.' });
            }
        })
        .catch(err => {
            setSubmitting(false);
            console.error(err);
            Toast.show({ type: 'error', text1: 'Error', text2: 'Network request failed.' });
        });
    };

    const markEventAttendance = () => {
        // setSubmitting(true); // managed by modal loading state now
        const regno = selectedStudent.enrollment;
        const branchid = coreContext.branchid;
        const owner = coreContext.phone;

        setEventModalVisible(true);
        setEventLoading(true);
        setEventHistory([]);
        setEventStatus(null);

        // 1. Fetch Status
        axios.get('/student-event-attendance-today-status', { 
            params: { regno, branchid, owner, eventid: selectedEvent } 
        }).then(response => {
             setEventStatus(response.data.astatus);
        }).catch(err => console.error(err));

        // 2. Fetch History records 
        axios.get('/student-event-attendance-today-records', { 
            params: { regno, branchid, owner, eventid: selectedEvent } 
        }).then(response => {
            setEventHistory(response.data.records || []);
            setEventLoading(false);
            if (response.data.emessage) {
                // Show "Complaint" / Alert
                Toast.show({ type: 'info', text1: 'Notice', text2: response.data.emessage, visibilityTime: 5000 });
            }
        }).catch(err => {
            console.error(err);
            setEventLoading(false);
            Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to fetch attendance records.' });
        });
    };

    const submitEventAttendance = (bgStatus) => {
        // setSubmitting(true);
        const branchid = coreContext.branchid;
        const owner = coreContext.phone;
        const regno = selectedStudent.enrollment;

        axios.post('/mark-single-student-event-attendance', {
            regno,
            eventid: selectedEvent,
            owner,
            branchid,
            astatus: bgStatus // 'present' or 'absent'
        })
        .then(response => {
            // setSubmitting(false);
            console.log('Mark Event Response:', response.data);
            if (response.data.aresult === 'ok') {
                Toast.show({ type: 'success', text1: 'Success', text2: `Event Attendance marked: ${bgStatus.toUpperCase()}` });
                setEventModalVisible(false);
                // Optionally reset selection or keep it
            } else {
                 Toast.show({ type: 'error', text1: 'Error', text2: 'Failed: ' + (response.data.aresult || 'Unknown Error') });
            }
        })
        .catch(err => {
            // setSubmitting(false);
            console.error(err);
            Toast.show({ type: 'error', text1: 'Error', text2: 'Network request failed.' });
        });
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: background?.backgroundColor || '#f4e0ff' }} edges={['bottom', 'left', 'right']}>
            <ScrollView contentContainerStyle={{ padding: 15 }}>
                
                {/* Mode Selector */}
                <View style={[styles.card, { backgroundColor: '#fff', flexDirection: 'row', padding: 5, marginBottom: 15 }]}>
                    <TouchableOpacity 
                        style={[styles.modeButton, mode === 'transport' && styles.modeActive]} 
                        onPress={() => setMode('transport')}
                    >
                        <Icon name="bus" size={20} color={mode === 'transport' ? '#fff' : '#666'} />
                        <Text style={[styles.modeText, mode === 'transport' && styles.modeTextActive]}>Transport</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.modeButton, mode === 'event' && styles.modeActive]} 
                        onPress={() => setMode('event')}
                    >
                        <Icon name="calendar-star" size={20} color={mode === 'event' ? '#fff' : '#666'} />
                        <Text style={[styles.modeText, mode === 'event' && styles.modeTextActive]}>Event</Text>
                    </TouchableOpacity>
                </View>

                {/* Transport Options */}
                {mode === 'transport' && (
                    <View style={[styles.card, { backgroundColor: '#fff', marginBottom: 15 }]}>
                        <Text style={styles.label}>Transport Details</Text>
                        
                        <TouchableOpacity 
                            style={styles.dropdown}
                            onPress={() => openPicker('Select Bus', buses, selectedBus, handleBusSelect)}
                        >
                            <Text style={styles.dropdownText}>
                                {buses.find(b => b.value === selectedBus)?.label || 'Select Bus No.'}
                            </Text>
                            <Icon name="chevron-down" size={20} color="#666" />
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={[styles.dropdown, { marginTop: 15 }]}
                            onPress={() => openPicker('Select Route', routes, selectedRoute, setSelectedRoute)}
                            disabled={!selectedBus}
                        >
                            <Text style={[styles.dropdownText, !selectedBus && { color: '#ccc' }]}>
                                {routes.find(r => r.value === selectedRoute)?.label || 'Select Route'}
                            </Text>
                            <Icon name="chevron-down" size={20} color={!selectedBus ? '#ccc' : "#666"} />
                        </TouchableOpacity>
                    </View>
                )}

                {/* Event Options */}
                {mode === 'event' && (
                    <View style={[styles.card, { backgroundColor: '#fff', marginBottom: 15 }]}>
                        <Text style={styles.label}>Event Details</Text>
                        
                        <TouchableOpacity 
                            style={styles.dropdown}
                            onPress={() => openPicker('Select Event', events, selectedEvent, setSelectedEvent)}
                        >
                            <Text style={styles.dropdownText}>
                                {events.find(e => e.value === selectedEvent)?.label || 'Select Event'}
                            </Text>
                            <Icon name="chevron-down" size={20} color="#666" />
                        </TouchableOpacity>
                    </View>
                )}

                {/* Student Search (Shared) */}
                <View style={[styles.card, { backgroundColor: '#fff', zIndex: 1000 }]}>
                    <Text style={styles.label}>Select Student</Text>
                    <View style={styles.searchContainer}>
                        <Icon name="magnify" size={24} color="#666" style={{ marginRight: 10 }} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder={`Search by Name or ${coreContext.schoolData?.smallEnr || 'ID'}`}
                            placeholderTextColor="#666"
                            value={searchQuery}
                            onChangeText={handleSearch}
                        />
                        {searchLoading && <ActivityIndicator size="small" color={primary?.backgroundColor || '#6200ee'} />}
                    </View>

                    {showResults && searchResults.length > 0 && (
                        <View style={styles.resultsList}>
                            {searchResults.map((item) => (
                                <TouchableOpacity 
                                    key={item.enrollment} 
                                    style={styles.resultItem}
                                    onPress={() => handleSelectStudent(item)}
                                >
                                    <View>
                                        <Text style={styles.resultName}>{item.name || `${item.firstname} ${item.lastname}`}</Text>
                                        <Text style={styles.resultInfo}>{coreContext.schoolData?.smallEnr || 'ID'}: {item.enrollment} | Class: {item.clas} {item.section}</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                     {selectedStudent && (
                        <View style={styles.selectedStudent}>
                            <View style={styles.avatar}>
                                <Text style={styles.avatarText}>
                                    {(selectedStudent.name || selectedStudent.firstname || '?').charAt(0)}
                                </Text>
                            </View>
                            <View>
                                <Text style={styles.studentName}>{selectedStudent.name || `${selectedStudent.firstname} ${selectedStudent.lastname}`}</Text>
                                <Text style={styles.studentDetails}>
                                    {coreContext.schoolData?.smallEnr || 'ID'}: {selectedStudent.enrollment} | {coreContext.schoolData?.smallReg || 'Reg'}: {selectedStudent.scholarno}
                                </Text>
                                <Text style={styles.studentDetails}>
                                    Class: {selectedStudent.clas} {selectedStudent.section} | Roll: {selectedStudent.roll}
                                </Text>
                            </View>
                        </View>
                    )}
                </View>

                {/* Submit Button */}
                <TouchableOpacity 
                    style={[styles.submitButton, { backgroundColor: primary?.backgroundColor || '#6200ee' }]}
                    onPress={handleSubmit}
                    disabled={submitting}
                >
                    {submitting ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.submitButtonText}>
                            {mode === 'transport' ? 'Mark Transport Attendance' : 'Mark Event Attendance'}
                        </Text>
                    )}
                </TouchableOpacity>

            </ScrollView>

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

            <EventAttendanceModal
                visible={eventModalVisible}
                student={selectedStudent}
                history={eventHistory}
                loading={eventLoading}
                status={eventStatus}
                onClose={() => setEventModalVisible(false)}
                onMarkPresent={() => submitEventAttendance('present')}
                onMarkAbsent={() => submitEventAttendance('absent')}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    card: {
        padding: 15,
        borderRadius: 12,
        marginBottom: 5,
        borderWidth: 1,
        borderColor: '#eee',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
    },
    modeButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 8,
    },
    modeActive: {
        backgroundColor: '#6200ee', // Fallback or dynamic
        shadowColor: "#6200ee",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 3,
    },
    modeText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
        marginLeft: 8
    },
    modeTextActive: {
        color: '#fff'
    },
    dropdown: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#f9f9f9',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd'
    },
    dropdownText: {
        fontSize: 14,
        color: '#333'
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: '#ddd'
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#333',
    },
    resultsList: {
        maxHeight: 200,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#eee',
        marginTop: 5,
        borderRadius: 8,
    },
    resultItem: {
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    resultName: {
        fontWeight: 'bold',
        fontSize: 14,
        color: '#333'
    },
    resultInfo: {
        fontSize: 12,
        color: '#666'
    },
    selectedStudent: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 15,
        backgroundColor: '#fcfcfc',
        padding: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#eee'
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#6200ee',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 15,
    },
    avatarText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 20,
    },
    studentName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    studentDetails: {
        fontSize: 12,
        color: '#666',
        marginTop: 2
    },
    submitButton: {
        marginTop: 25,
        paddingVertical: 15,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center'
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold'
    }
});
