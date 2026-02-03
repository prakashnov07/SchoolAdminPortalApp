import React, { useState, useContext, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, FlatList, StyleSheet, Modal, ScrollView, TouchableWithoutFeedback } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import Toast from 'react-native-toast-message';

import { CoreContext } from '../context/CoreContext';
import { StyleContext } from '../context/StyleContext';

import StudentAttendanceCard from '../components/StudentAttendanceCard';
import AttendanceReviewCard from '../components/AttendanceReviewCard';
import CustomPickerModal from '../components/CustomPickerModal';
import AttendanceMenuModal from '../components/AttendanceMenuModal';

export default function MarkAttendance({ navigation }) {
    const coreContext = useContext(CoreContext);
    const styleContext = useContext(StyleContext);

    // Use CoreContext for global data if available vs fetching locally
    // SendMessagesScreen uses coreContext.getAllClasses() etc.
    const { 
        allClasses, 
        getAllClasses, 
        allSections, 
        getAllSections, 
        branchid, 
        phone, // owner
        schoolData,
        getSchoolData
    } = coreContext;

    const [students, setStudents] = useState([]);
    const [absentStudents, setAbsentStudents] = useState([]); 
    
    // Loading states
    const [searchLoading, setSearchLoading] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    
    // Bulk Selection State
    const [allSelected, setAllSelected] = useState(false);
    
    // Confirmation Mode State
    // null = normal view, 'confirming' = review screen
    const [activeStatus, setActiveStatus] = useState(null); 

    // NOTE: ConfirmStudentItem and StudentItem were refactored into standalone components.
    // See imports above.

    useEffect(() => {
        // Ensure data is loaded
        if (!allClasses || allClasses.length === 0) getAllClasses();
        if (!allSections || allSections.length === 0) getAllSections();
        if (!schoolData || !schoolData.sortstudentsby) getSchoolData();
    }, []);

    useEffect(() => {
        if (schoolData) {
            if (schoolData.sortstudentsby) {
                setSortBy(schoolData.sortstudentsby);
            }
            if (schoolData.defaultAttendanceStatus === 'yes') {
                setAllSelected(true);
            }
        }
    }, [schoolData]);



    const handleSortChange = (val) => {
        setSortBy(val);
        // Trigger server-side fetch immediately with new value
        fetchStudents(val);
    };
    
    const toggleAllStudents = () => {
        if (allSelected) {
            // Currently Present (Checked) -> switch to Absent (Unchecked)
            // Mark ALL students as absent
            const allEnrollments = students.map(s => s.enrollment);
            setAbsentStudents(allEnrollments);
        } else {
             // Currently Absent (Unchecked) -> switch to Present (Checked)
             // Clear absent list
             setAbsentStudents([]);
        }
        setAllSelected(!allSelected);
    };
    
    const getFormattedClassOptions = () => {
        if (!allClasses) return [];
        return allClasses.map(c => ({
            label: c.classname,
            value: c.classid
        }));
    };

    const getFormattedSectionOptions = () => {
        if (allSections && allSections.length > 0) {
            return allSections.map(s => ({
                label: s.sectionname,
                value: s.sectionid
            }));
        }
        // Fallback
        return [
            { label: 'A', value: 'a' },
            { label: 'B', value: 'b' },
            { label: 'C', value: 'c' },
            { label: 'D', value: 'd' },
            { label: 'E', value: 'e' }
        ];
    };

    const handleClassSelect = (val) => {
        setSelectedClass(val);
        const selected = getFormattedClassOptions().find(c => c.value === val);
        setSelectedClassName(selected ? selected.label : 'Select Class');
    };

    const handleSectionSelect = (val) => {
        setSelectedSection(val);
        const selected = getFormattedSectionOptions().find(s => s.value === val);
        setSelectedSectionName(selected ? selected.label : 'Select Section');
    };
    const [selectedClass, setSelectedClass] = useState(null);
    const [selectedSection, setSelectedSection] = useState(null);
    const [selectedClassName, setSelectedClassName] = useState('Select Class');
    const [selectedSectionName, setSelectedSectionName] = useState('Select Section');

    // Sort State
    const [sortBy, setSortBy] = useState('name'); 
    const sortOptions = [
        { label: 'Sort By Name', value: 'name' }, 
        { label: 'Sort By Roll', value: 'roll' },
        { label: 'Sort By Enrollment', value: 'enroll' }
    ];

    // Picker Modal State
    const [pickerVisible, setPickerVisible] = useState(false);
    const [pickerData, setPickerData] = useState([]); 
    const [pickerSelectedValue, setPickerSelectedValue] = useState(null);
    const [pickerOnSelect, setPickerOnSelect] = useState(() => () => {});
    const [pickerTitle, setPickerTitle] = useState('');

    const [menuVisible, setMenuVisible] = useState(false);

    useEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <TouchableOpacity onPress={() => setMenuVisible(true)} style={{ marginRight: 15 }}>
                     <Icon name="dots-vertical" size={26} color={styleContext.blackColor || '#000'} />
                </TouchableOpacity>
            ),
        });
    }, [navigation, styleContext]);

    const openPicker = (data, selectedValue, onSelect, title) => {
        setPickerData(data);
        setPickerSelectedValue(selectedValue);
        setPickerOnSelect(() => onSelect);
        setPickerTitle(title);
        setPickerVisible(true);
    };

    const onConfirmPicker = () => {
        if (pickerOnSelect) {
            pickerOnSelect(pickerSelectedValue);
        }
        setPickerVisible(false);
    };

    const onCancelPicker = () => {
        setPickerVisible(false);
    };

    const fetchStudents = (sortByOverride) => {
        if (!selectedClass || !selectedSection) {
            Alert.alert('Error', 'Please select both class and section');
            return;
        }

        setSearchLoading(true);
        // Clear previous data
        setStudents([]);
        setAbsentStudents([]);

        // Handle override vs event object vs state
        const currentSort = (typeof sortByOverride === 'string') ? sortByOverride : sortBy;

        const params = {
            classid: selectedClass,
            sectionid: selectedSection,
            branchid: branchid,
            action: 'mark-attendance', // Required to fetch attendance status
            filter: currentSort, // Server-side sorting
            // Add timestamp to prevent caching
            _ts: new Date().getTime() 
        };

        axios.get('/search-by-class-v4', { params })
            .then(response => {
                const fetchedStudents = response.data.rows;
                // Server handles sorting now
                setStudents(fetchedStudents);
                
                if (fetchedStudents.length > 0) {
                    const firstStatus = fetchedStudents[0].status || 'unmarked';
                    
                    if (firstStatus !== 'unmarked') {
                        // Class is already marked.
                        // 1. Populate absent list from the fetched data
                        const preFilledAbsent = fetchedStudents
                            .filter(s => s.status === 'absent')
                            .map(s => s.enrollment);
                        
                        setAbsentStudents(preFilledAbsent);

                        // 2. Show Info Toast (existing)
                         Toast.show({ type: 'info', text1: 'Info', text2: 'Attendance already marked for today.' });
                    }
                } else {
                    Toast.show({ type: 'info', text1: 'Info', text2: 'No students found.' });
                }
            })
            .catch(error => {
            })
            .finally(() => setSearchLoading(false));
    };

    const toggleStudentAbsence = (enrollment, forceAbsent) => {
        setAbsentStudents(prev => {
            // If checking 'Absent' (forceAbsent=true), ensure it's in list
            if (forceAbsent === true) {
                if (!prev.includes(enrollment)) return [...prev, enrollment];
                return prev;
            }
            // If checking 'Present' (forceAbsent=false), ensure it's removed from list
            if (forceAbsent === false) {
                return prev.filter(id => id !== enrollment);
            }

            // Fallback toggle
            if (prev.includes(enrollment)) {
                return prev.filter(id => id !== enrollment);
            } else {
                return [...prev, enrollment];
            }
        });
    };

    const submitAttendance = () => {
        if (students.length === 0) return;
        
        // Strict check: if explicitly marked something other than 'unmarked', warn.
        // But lenient check: if empty, treat as unmarked.
        const currentStatus = students[0].status || 'unmarked';
        
        if (currentStatus !== 'unmarked') {
            Alert.alert('Attendance Marked', 'Attendance for this class is already marked.');
            return;
        }

        setActiveStatus('confirming');
    };

    const confirmAndSubmit = async () => {
        setSubmitLoading(true);
        try {
            const studentsForAttendance = students.map(s => s.enrollment);
            
            // API payload
            const payload = {
                absentstudents: absentStudents,
                studentsforattendance: studentsForAttendance,
                owner: phone,
                branchid: branchid,
                astatus: 'absent' // Legacy uses 'absent' to correctly mark the expected status
            };

            await axios.post('/mark-student-attendance', payload);
            
            Toast.show({ type: 'success', text1: 'Success', text2: 'Attendance marked successfully' });
            
            // Refresh data
            fetchStudents();
            setActiveStatus(null);

        } catch (error) {
            console.log('Error marking attendance:', error);
            Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to submit attendance' });
        } finally {
            setSubmitLoading(false);
        }
    };
 


    return (
        <SafeAreaView style={styleContext.background} edges={['bottom', 'left', 'right']}>
            <View style={{ padding: 16 }}>
                 {/* Pickers */}
                <TouchableOpacity 
                    style={styleContext.pickerButton} 
                    onPress={() => openPicker(getFormattedClassOptions(), selectedClass, handleClassSelect, 'Select Class')}
                >
                    <Text style={styleContext.pickerButtonText}>{selectedClassName}</Text>
                    <Icon name="chevron-down" size={24} color={styleContext.blackColor} />
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styleContext.pickerButton, { marginTop: 12 }]} 
                    onPress={() => openPicker(getFormattedSectionOptions(), selectedSection, handleSectionSelect, 'Select Section')}
                >
                    <Text style={styleContext.pickerButtonText}>{selectedSectionName}</Text>
                    <Icon name="chevron-down" size={24} color={styleContext.blackColor} />
                </TouchableOpacity>

                 <TouchableOpacity 
                    style={[styleContext.pickerButton, { marginTop: 12 }]} 
                    onPress={() => openPicker(sortOptions, sortBy, handleSortChange, 'Sort By')}
                >
                    <Text style={styleContext.pickerButtonText}>Sort By: {sortBy}</Text>
                    <Icon name="sort" size={24} color={styleContext.blackColor} />
                </TouchableOpacity>

                {/* Search Button */}
                <TouchableOpacity 
                    style={[styleContext.button, { marginTop: 16, marginBottom: 0 }]} 
                    onPress={fetchStudents}
                    disabled={searchLoading}
                >
                    {searchLoading ? <ActivityIndicator color="#fff" /> : <Text style={styleContext.buttonText}>Search Students</Text>}
                </TouchableOpacity>

                {/* Marked Header or Search/Toggle */}
                {students.length > 0 ? (
                    (students[0].status || 'unmarked') !== 'unmarked' ? (
                        /* MARKED: Show Count Header (Legacy Logic) */
                        (() => {
                            const presentCount = students.filter(s => s.status === 'present').length;
                            const totalCount = students.length;
                            
                            return (
                                <View style={{ marginTop: 20, alignItems: 'center', padding: 10, backgroundColor: '#e8f5e9', borderRadius: 8, borderWidth: 1, borderColor: '#c8e6c9' }}>
                                     <Text style={{fontSize: 18, fontWeight: 'bold', color: '#2e7d32'}}>
                                         Present Student Count : {presentCount} / {totalCount}
                                     </Text>
                                </View>
                            );
                        })()
                    ) : (
                        /* UNMARKED: Show Bulk Toggle */
                        schoolData?.defaultAttendanceStatus === 'yes' && (
                             <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 15, paddingHorizontal: 4 }}>
                                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }} onPress={toggleAllStudents}>
                                     <Icon 
                                        name={allSelected ? "checkbox-marked" : "checkbox-blank-outline"} 
                                        size={24} 
                                        color={allSelected ? "#28a745" : "#777"} 
                                    />
                                    <Text style={{ marginLeft: 8, fontSize: 16, fontWeight: 'bold', color: allSelected ? '#28a745' : '#777' }}>
                                        {allSelected ? 'Present (All)' : 'Absent (All)'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )
                    )
                ) : null}
            </View>

            {/* Students List */}
            {/* Header / Title for Confirmation */}
            {activeStatus === 'confirming' && (
                <View style={{ padding: 10, backgroundColor: '#eee', alignItems: 'center' }}>
                    <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Review Before Submitting</Text>
                </View>
            )}

            <FlatList
                data={students}
                renderItem={({ item }) => {
                    if (activeStatus === 'confirming') {
                         const isAbsent = absentStudents.includes(item.enrollment);
                         return <AttendanceReviewCard item={item} isAbsent={isAbsent} />;
                    }
                    else {
                        const isAbsent = absentStudents.includes(item.enrollment);
                        // Check if marked global
                        const isMarked = students.length > 0 && (students[0].status || 'unmarked') !== 'unmarked';
                        
                        return (
                            <StudentAttendanceCard 
                                item={item} 
                                isAbsent={isAbsent}
                                isMarked={isMarked}
                                onToggleAbsence={toggleStudentAbsence}
                                selectedClass={selectedClass}
                                selectedSection={selectedSection}
                            />
                        );
                    }
                }}
                keyExtractor={(item) => item.enrollment}
                contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
                ListEmptyComponent={
                    !searchLoading && students.length === 0 ? 
                    <Text style={{ textAlign: 'center', marginTop: 20, color: '#fff' }}>No students fetched</Text> 
                    : null
                }
            />

            {/* Footer Buttons */}
            {students.length > 0 && (students[0].status || 'unmarked') === 'unmarked' && (
                <View style={styles.footerContainer}>
                    {activeStatus !== 'confirming' ? (
                        /* MARK ATTENDANCE BUTTON */
                        <TouchableOpacity 
                            style={[styleContext.button, { backgroundColor: '#d32f2f', marginHorizontal: 20, marginBottom: 0 }]} 
                            onPress={submitAttendance}
                            disabled={submitLoading}
                        >
                            {submitLoading ? <ActivityIndicator color="#fff" /> : <Text style={styleContext.buttonText}>Mark Attendance</Text>}
                        </TouchableOpacity>
                    ) : (
                        /* CONFIRMATION BUTTONS */
                        <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                             {/* Cancel */}
                            <TouchableOpacity 
                                style={[styleContext.button, { backgroundColor: '#777', width: '40%', marginBottom: 0 }]} 
                                onPress={() => setActiveStatus(null)}
                            >
                                <Text style={styleContext.buttonText}>Cancel</Text>
                            </TouchableOpacity>

                            {/* Submit */}
                            <TouchableOpacity 
                                style={[styleContext.button, { backgroundColor: '#28a745', width: '40%', marginBottom: 0 }]} 
                                onPress={confirmAndSubmit}
                                disabled={submitLoading}
                            >
                                {submitLoading ? <ActivityIndicator color="#fff" /> : <Text style={styleContext.buttonText}>Submit</Text>}
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            )}

            <CustomPickerModal
                visible={pickerVisible}
                title={pickerTitle}
                data={pickerData}
                selectedValue={pickerSelectedValue}
                onSelect={setPickerSelectedValue}
                onClose={onCancelPicker}
                onConfirm={onConfirmPicker}
                onReload={() => { setPickerVisible(false); getAllClasses(); getAllSections(); }}
            />

            <AttendanceMenuModal
                visible={menuVisible}
                onClose={() => setMenuVisible(false)}
            />

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    studentCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#ddd',
        // Shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    studentName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    studentInfo: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    checkboxContainer: {
        alignItems: 'center',
        marginLeft: 10,
    },
    footerContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: '#eee',
    }
});
