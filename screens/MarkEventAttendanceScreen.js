import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import axios from 'axios';
import Toast from 'react-native-toast-message';

import { CoreContext } from '../context/CoreContext';
import { StyleContext } from '../context/StyleContext';
import CustomPickerModal from '../components/CustomPickerModal';
import MarkEventStudentItem from '../components/MarkEventStudentItem';

export default function MarkEventAttendanceScreen({ navigation }) {
    const coreContext = useContext(CoreContext);
    const styleContext = useContext(StyleContext);
    const { primary, background } = styleContext;

    // Selections
    const [selectedEvent, setSelectedEvent] = useState(0);
    const [selectedClass, setSelectedClass] = useState(0);
    const [selectedSection, setSelectedSection] = useState(0);
    const [selectedSort, setSelectedSort] = useState('');
    const [selectedType, setSelectedType] = useState('');

    // Data Lists
    const [events, setEvents] = useState([]);
    const [classes, setClasses] = useState([]);
    const [sections, setSections] = useState([]);
    const [students, setStudents] = useState([]);

    // Logic State
    const [loading, setLoading] = useState(false);
    const [selectedStudents, setSelectedStudents] = useState([]); // Array of IDs
    const [allSelected, setAllSelected] = useState(false);

    // Picker State
    const [pickerVisible, setPickerVisible] = useState(false);
    const [pickerConfig, setPickerConfig] = useState({ title: '', data: [], selected: null, onSelect: () => {} });

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const branchid = coreContext.branchid;
            
            // Fetch Events
            const eventRes = await axios.get('/attendance-events', { params: { branchid } });
            setEvents((eventRes.data.events || []).map(e => ({ label: e.ename, value: e.id })));

            // Fetch Classes (Assuming /getallclasses based on legacy)
            const classRes = await axios.get('/getallclasses', { params: { branchid } });
            setClasses((classRes.data.rows || []).map(c => ({ label: c.classname, value: c.classid })));
            
             // Fetch Sections (assuming /getallsections based on legacy)
            const sectionRes = await axios.get('/getallsections', { params: { branchid } });
            setSections((sectionRes.data.rows || []).map(s => ({ label: s.sectionname, value: s.sectionid })));

        } catch (error) {
            console.error(error);
            Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to load initial data' });
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        if (!selectedEvent || !selectedClass || !selectedSection) {
            Toast.show({ type: 'info', text1: 'Missing Selection', text2: 'Please select Event, Class, and Section.' });
            return;
        }

        setLoading(true);
        setStudents([]);
        setSelectedStudents([]);
        setAllSelected(false);

        axios.get('/search-by-class-event', {
            params: {
                classid: selectedClass,
                sectionid: selectedSection,
                eventid: selectedEvent,
                sortby: selectedSort,
                stype: selectedType,
                branchid: coreContext.branchid,
                owner: coreContext.phone
            }
        }).then(response => {
            const rows = response.data.rows || [];
            setStudents(rows);
            // Auto-select based on legacy logic? Or just start empty?
            // Legacy starts empty typically unless 'defaultAttendanceStatus' is yes.
            // We'll start empty to be safe.
            setLoading(false);
            if (rows.length === 0) Toast.show({ type: 'info', text1: 'Info', text2: 'No students found.' });
        }).catch(err => {
            console.error(err);
            setLoading(false);
            Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to search students.' });
        });
    };

    const toggleStudent = (enrollment) => {
        setSelectedStudents(prev => {
            if (prev.includes(enrollment)) {
                return prev.filter(id => id !== enrollment);
            } else {
                return [...prev, enrollment];
            }
        });
    };

    const toggleSelectAll = () => {
        if (allSelected) {
            setSelectedStudents([]);
            setAllSelected(false);
        } else {
            const allIds = students.map(s => s.enrollment);
            setSelectedStudents(allIds);
            setAllSelected(true);
        }
    };

    const submitAttendance = () => {
        if (selectedStudents.length === 0) {
            Alert.alert(
                'Confirm',
                 'No students selected (All Present). Submit?',
                 [
                     { text: 'Cancel', style: 'cancel' },
                     { text: 'Submit', onPress: () => processSubmission() }
                 ]
            );
            return;
        }

        Alert.alert(
            'Confirm Absent List',
            `Mark ${selectedStudents.length} selected students as ABSENT?`,
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Confirm', onPress: () => processSubmission() }
            ]
        );
    };

    const processSubmission = () => {
        setLoading(true);
        
       const allEnrollments = students.map(s => s.enrollment);
       const absentStudentsList = selectedStudents; // Checked = Absent
       
        axios.post('/mark-student-event-attendance', {
            studentsforattendance: allEnrollments,
            absentstudents: absentStudentsList,
            owner: coreContext.phone,
            branchid: coreContext.branchid,
            astatus: 'absent', // Matching legacy behavior (only absent button is enabled there)
            eventid: selectedEvent
        }).then(res => {
            Toast.show({ type: 'success', text1: 'Success', text2: 'Attendance Marked' });
             handleSearch(); // Reload
        })
        .catch(err => {
            console.error(err);
            setLoading(false);
            Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to mark attendance' });
        });
    };

    // Picker Helpers
    const openPicker = (title, data, selected, onSelect) => {
        setPickerConfig({
            title,
            data: [{ label: title, value: 0 }, ...data],
            selected,
            onSelect
        });
        setPickerVisible(true);
    };

    const handlePickerSelect = (val) => {
         setPickerConfig(prev => ({ ...prev, selected: val }));
    };

    const handlePickerConfirm = () => {
        if (pickerConfig.onSelect) pickerConfig.onSelect(pickerConfig.selected);
        setPickerVisible(false);
    };


    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: background?.backgroundColor || '#f4e0ff' }} edges={['bottom', 'left', 'right']}>
            <View style={styles.controlsContainer}>
                
                {/* Event Picker */}
                <TouchableOpacity style={styles.pickerButton} onPress={() => openPicker('Select Event', events, selectedEvent, setSelectedEvent)}>
                    <Text style={styles.pickerText}>
                         {selectedEvent ? events.find(e => e.value === selectedEvent)?.label : 'Select Event'}
                    </Text>
                    <Icon name="chevron-down" size={20} color="#666" />
                </TouchableOpacity>

                {/* Class Picker */}
                <TouchableOpacity style={[styles.pickerButton, { marginTop: 10 }]} onPress={() => openPicker('Select Class', classes, selectedClass, setSelectedClass)}>
                    <Text style={styles.pickerText}>
                         {selectedClass ? classes.find(c => c.value === selectedClass)?.label : 'Select Class'}
                    </Text>
                    <Icon name="chevron-down" size={20} color="#666" />
                </TouchableOpacity>

                 {/* Section Picker */}
                <TouchableOpacity style={[styles.pickerButton, { marginTop: 10 }]} onPress={() => openPicker('Select Section', sections, selectedSection, setSelectedSection)}>
                    <Text style={styles.pickerText}>
                         {selectedSection ? sections.find(s => s.value === selectedSection)?.label : 'Select Section'}
                    </Text>
                    <Icon name="chevron-down" size={20} color="#666" />
                </TouchableOpacity>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
                    <TouchableOpacity style={[styles.pickerButton, { flex: 1, marginRight: 5 }]} onPress={() => openPicker('Sort By', [
                        { label: 'Sort By Roll', value: 'roll' },
                        { label: 'Sort By Enrollment', value: 'enroll' },
                        { label: 'Sort By Name', value: 'name' }
                    ], selectedSort, setSelectedSort)}>
                        <Text style={styles.pickerText} numberOfLines={1}>
                             {selectedSort ? (selectedSort === 'roll' ? 'Roll' : (selectedSort === 'enroll' ? 'Enroll' : 'Name')) : 'Sort By'}
                        </Text>
                        <Icon name="chevron-down" size={20} color="#666" />
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.pickerButton, { flex: 1, marginLeft: 5 }]} onPress={() => openPicker('Type', [
                        { label: 'Hosteler', value: 'hostel' },
                        { label: 'Day Care', value: 'daycare' },
                        { label: 'Day Scholar', value: 'dayscholar' }
                    ], selectedType, setSelectedType)}>
                       <Text style={styles.pickerText} numberOfLines={1}>
                             {selectedType ? (selectedType === 'hostel' ? 'Hostel' : (selectedType === 'daycare' ? 'DayCare' : 'DayScholar')) : 'All Types'}
                        </Text>
                        <Icon name="chevron-down" size={20} color="#666" />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity 
                    style={[styles.searchButton, { backgroundColor: primary?.backgroundColor || '#6200ee' }]}
                    onPress={handleSearch}
                >
                    <Text style={styles.searchText}>Search Students</Text>
                </TouchableOpacity>
            </View>

            {/* Student List */}
            {students.length > 0 && (
                <View style={{ flex: 1 }}>
                     <View style={styles.listHeader}>
                        <Text style={styles.headerTitle}>Select Absent Students</Text>
                        <TouchableOpacity onPress={toggleSelectAll}>
                            <Text style={{ color: primary?.backgroundColor || 'blue' }}>{allSelected ? 'Unselect All' : 'Select All'}</Text>
                        </TouchableOpacity>
                    </View>

                    <FlatList
                        data={students}
                        renderItem={({ item }) => (
                            <MarkEventStudentItem 
                                student={item}
                                isSelected={selectedStudents.includes(item.enrollment)}
                                onToggle={() => toggleStudent(item.enrollment)}
                                attStatus={item.status} // status from search API
                                color={primary?.backgroundColor}
                            />
                        )}
                        keyExtractor={item => item.enrollment.toString()}
                        contentContainerStyle={{ paddingBottom: 80 }}
                    />
                    
                    {/* Floating Submit Button */}
                    <View style={styles.footer}>
                        <TouchableOpacity 
                            style={[styles.submitButton, { backgroundColor: '#d32f2f' }]}
                            onPress={submitAttendance} 
                        >
                            <Text style={styles.submitText}>Submit Absent List</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {loading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#fff" />
                </View>
            )}

            <CustomPickerModal
                visible={pickerVisible}
                title={pickerConfig.title}
                data={pickerConfig.data}
                selectedValue={pickerConfig.selected}
                onSelect={handlePickerSelect}
                onConfirm={handlePickerConfirm}
                onClose={() => setPickerVisible(false)}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    controlsContainer: {
        backgroundColor: '#fff',
        padding: 15,
        margin: 10,
        borderRadius: 10,
        elevation: 2
    },
    pickerButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#f9f9f9',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#eee'
    },
    pickerText: { color: '#333' },
    searchButton: {
        marginTop: 15,
        padding: 15,
        borderRadius: 8,
        alignItems: 'center'
    },
    searchText: { color: '#fff', fontWeight: 'bold' },
    listHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee'
    },
    headerTitle: { fontWeight: 'bold', fontSize: 16 },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        padding: 15,
        borderTopWidth: 1,
        borderTopColor: '#eee'
    },
    submitButton: {
        padding: 15,
        borderRadius: 8,
        alignItems: 'center'
    },
    submitText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center'
    }
});
