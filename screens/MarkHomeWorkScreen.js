import React, { useState, useContext, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import DateTimePicker from '@react-native-community/datetimepicker';

import { CoreContext } from '../context/CoreContext';
import { StyleContext } from '../context/StyleContext';

import CustomPickerModal from '../components/CustomPickerModal';
import HomeWorkMenuModal from '../components/HomeWorkMenuModal';

// Student Item for Homework (Negative Marking: Select if Homework NOT done)
const StudentHomeworkItem = ({ item, isMarked, onToggle, styleContext }) => {
    // Logic similar to UploadReportScreen/HomeWorkListItem
    const bgColor = isMarked ? '#ffebee' : '#fff'; // Red tint for "Not Done" (Absent from homework)
    const borderColor = isMarked ? '#d32f2f' : '#ddd';

    // Name Fallback
    const name = item.firstname ? `${item.firstname} ${item.lastname || ''}` : (item.name || item.studentname || 'No Name');
    const roll = item.roll || item.roll_no || item.rollno || 'N/A';
    const reg = item.scholarno || '-';
    // Use robust ID
    const studentId = item.enrollment || item.id;
    const enr = studentId || '-';
    const qname = `${name} (Roll: ${roll})`;

    return (
        <TouchableOpacity 
            style={[
                styleContext.card, 
                { 
                    padding: 16, 
                    marginBottom: 10,
                    borderWidth: 1,
                    borderColor: borderColor,
                    backgroundColor: bgColor,
                    elevation: 2
                }
            ]} 
            onPress={() => onToggle(studentId)}
        >
            {/* Title */}
            <View style={{ alignItems: 'center', marginBottom: 10 }}>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: styleContext.titleColor || '#333', textAlign: 'center' }}>
                    {qname}
                </Text>
            </View>

            {/* Reg No Row */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text style={{ fontSize: 14, color: '#666' }}>
                    Reg No : {reg}
                </Text>
                <Icon 
                    name={isMarked ? "close-circle" : "checkbox-blank-circle-outline"} 
                    size={24} 
                    color={isMarked ? "#d32f2f" : "#bdbdbd"} 
                />
            </View>

            {/* Enr No Row */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 14, color: '#666' }}>
                    Enr No : {enr}
                </Text>
                <Text style={{ fontSize: 14, fontWeight: 'bold', color: isMarked ? '#d32f2f' : '#4caf50' }}>
                    {isMarked ? 'Not Done' : 'Done'}
                </Text>
            </View>
        </TouchableOpacity>
    );
};

export default function MarkHomeWorkScreen({ navigation }) {
    const coreContext = useContext(CoreContext);
    const styleContext = useContext(StyleContext);

    const { 
        allClasses, 
        getAllClasses, 
        allSections, 
        getAllSections, 
        branchid, 
        phone 
    } = coreContext;

    // Selections
    const [selectedClass, setSelectedClass] = useState(null);
    const [selectedSection, setSelectedSection] = useState(null);
    const [selectedSubject, setSelectedSubject] = useState('');
    
    // UI selections
    const [selectedClassName, setSelectedClassName] = useState('Select Class');
    const [selectedSectionName, setSelectedSectionName] = useState('Select Section');
    
    // Date
    const [homeworkDate, setHomeworkDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Data
    const [subjects, setSubjects] = useState([]);
    const [students, setStudents] = useState([]);
    
    // "Absent" list - storing enrollments of students who DID NOT do homework
    const [absentStudents, setAbsentStudents] = useState([]); 

    // Loading
    const [searchLoading, setSearchLoading] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    
    // Modals
    const [pickerVisible, setPickerVisible] = useState(false);
    const [pickerConfig, setPickerConfig] = useState({ title: '', data: [], selected: null, onSelect: () => {} });
    const [menuVisible, setMenuVisible] = useState(false);

    useEffect(() => {
        if (!allClasses || allClasses.length === 0) getAllClasses();
        if (!allSections || allSections.length === 0) getAllSections();
        
        // Load subjects
        if (coreContext.subjects && coreContext.subjects.length > 0) {
            setSubjects(coreContext.subjects.map(s => ({ label: s.name, value: s.name })));
        } else {
             coreContext.fetchSubjects();
        }
    }, []);

    useEffect(() => {
         if (coreContext.subjects && coreContext.subjects.length > 0) {
            setSubjects(coreContext.subjects.map(s => ({ label: s.name, value: s.name })));
        }
    }, [coreContext.subjects]);

    useEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <TouchableOpacity onPress={() => setMenuVisible(true)} style={{ marginRight: 15 }}>
                     <Icon name="dots-vertical" size={26} color="#fff" />
                </TouchableOpacity>
            ),
        });
    }, [navigation]);

    const formatDate = (dateObj) => {
        const d = new Date(dateObj);
        let month = '' + (d.getMonth() + 1);
        let day = '' + d.getDate();
        const year = d.getFullYear();
        if (month.length < 2) month = '0' + month;
        if (day.length < 2) day = '0' + day;
        return [day, month, year].join('-');
    };

    const fetchStudents = () => {
        if (!selectedClass || !selectedSection) {
            Alert.alert('Error', 'Please select both class and section');
            return;
        }

        setSearchLoading(true);
        setStudents([]);
        setAbsentStudents([]);

        const params = {
            classid: selectedClass,
            sectionid: selectedSection,
            branchid: branchid,
            action: 'mark-home-work', // Legacy action
            _ts: new Date().getTime(),
            subject: selectedSubject, // Legacy includes subject in search if available
            attendancedate: formatDate(homeworkDate),
            owner: phone
        };
        
        // Using generic search endpoint as per legacy 'searchStudentsByClassDate' action which calls '/searchbyclassdate' or similar
        // Legacy file `advance.js` calls `/searchbyclassdate`. 
        // Let's check if `/searchbyclassdate` works or if we should use `/search-by-class-v4`.
        // `MarkAttendance.js` uses `/search-by-class-v4`.
        // `HomeWork.js` legacy uses `searchStudentsByClassDate` action.
        // Let's stick to `/search-by-class-v4` for now as it's modern, but use 'mark-home-work' action.
        
        // Actually, let's use `/searchbyclassdate` since legacy `HomeWork.js` uses it specifically.
        // But invalid endpoint might fail. Let's try `/search-by-class-v4` first which is proven constant.
        
        // Switching to v2 as v4 might be failing or returning empty for this action
        axios.get('/search-by-class-v2', { params })
            .then(response => {
                const fetchedStudents = response.data.rows || [];
                setStudents(fetchedStudents);
                
                if (fetchedStudents.length === 0) {
                    Toast.show({ type: 'info', text1: 'Info', text2: 'No students found.' });
                }
            })
            .catch(error => {
                console.error('MarkHomeWorkScreen Fetch Error:', error);
                Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to fetch students' });
            })
            .finally(() => setSearchLoading(false));
    };

    const toggleStudentAbsence = (enrollment) => {
        setAbsentStudents(prev => {
            if (prev.includes(enrollment)) {
                return prev.filter(id => id !== enrollment);
            } else {
                return [...prev, enrollment];
            }
        });
    };

    const submitMarking = async () => {
        if (students.length === 0) return;
        if (!selectedSubject) return Alert.alert("Error", "Please select a Subject");

        if (absentStudents.length === 0) {
             Alert.alert(
                 "Confirm", 
                 "No students selected as 'Not Done'. Are you sure everyone completed homework?",
                 [
                     { text: "Cancel", style: "cancel" },
                     { text: "Yes", onPress: () => processSubmission() }
                 ]
             );
             return;
        }
        processSubmission();
    };

    const processSubmission = async () => {
        setSubmitLoading(true);
        try {
            // Ensure we have valid IDs
            const studentsForAttendance = students.map(s => s.enrollment || s.id);
            
            const payload = {
                absentstudents: absentStudents,
                studentsforattendance: studentsForAttendance, // Legacy: sends all students
                attendancedate: formatDate(homeworkDate),
                subject: selectedSubject,
                category: 'Home Work',
                owner: phone,
                branchid: branchid
            };

            // Legacy Endpoint
            await axios.post('/makereport', payload);
            
            Toast.show({ type: 'success', text1: 'Success', text2: 'Report submitted successfully' });
            
            // Go back or reset?
            setAbsentStudents([]);
            setStudents([]); 
            
        } catch (error) {
            console.error('Error marking homework:', error);
            Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to submit report.' });
        } finally {
            setSubmitLoading(false);
        }
    }

    // Helper for Pickers
    const openPicker = (title, data, selected, onSelect) => {
        setPickerConfig({
            title,
            data,
            selected,
            onSelect: (val) => {
                onSelect(val);
                // Update label state if needed
                if (title === 'Class') setSelectedClassName(data.find(d => d.value === val)?.label);
                if (title === 'Section') setSelectedSectionName(data.find(d => d.value === val)?.label);
            }
        });
        setPickerVisible(true);
    };

    const getFormattedClassOptions = () => (allClasses || []).map(c => ({ label: c.classname, value: c.classid }));
    const getFormattedSectionOptions = () => (allSections || []).map(s => ({ label: s.sectionname, value: s.sectionid }));

    return (
        <SafeAreaView style={[styleContext.background, { flex: 1 }]} edges={['bottom', 'left', 'right']}>
            <View style={{ padding: 16 }}>
                
                {/* Date Picker */}
                <TouchableOpacity style={styleContext.pickerButton} onPress={() => setShowDatePicker(true)}>
                    <Text style={styleContext.pickerButtonText}>Date: {formatDate(homeworkDate)}</Text>
                    <Icon name="calendar" size={24} color={styleContext.blackColor} />
                </TouchableOpacity>
                 {showDatePicker && (
                    <DateTimePicker
                        value={homeworkDate}
                        mode="date"
                        display="default"
                        onChange={(e, d) => { setShowDatePicker(false); if(d) setHomeworkDate(d); }}
                    />
                )}

                {/* Class & Section */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <TouchableOpacity 
                        style={[styleContext.pickerButton, { flex: 1, marginRight: 5 }]} 
                        onPress={() => openPicker('Class', getFormattedClassOptions(), selectedClass, setSelectedClass)}
                    >
                        <Text style={styleContext.pickerButtonText}>{selectedClassName}</Text>
                        <Icon name="chevron-down" size={24} color={styleContext.blackColor} />
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[styleContext.pickerButton, { flex: 1, marginLeft: 5 }]} 
                        onPress={() => openPicker('Section', getFormattedSectionOptions(), selectedSection, setSelectedSection)}
                    >
                        <Text style={styleContext.pickerButtonText}>{selectedSectionName}</Text>
                        <Icon name="chevron-down" size={24} color={styleContext.blackColor} />
                    </TouchableOpacity>
                </View>

                {/* Subject */}
                 <TouchableOpacity 
                    style={[styleContext.pickerButton, { marginTop: 10 }]} 
                    onPress={() => openPicker('Subject', subjects, selectedSubject, setSelectedSubject)}
                >
                    <Text style={styleContext.pickerButtonText}>{selectedSubject ? selectedSubject : 'Select Subject'}</Text>
                    <Icon name="book-open-variant" size={24} color={styleContext.blackColor} />
                </TouchableOpacity>

                {/* Search Button */}
                <TouchableOpacity 
                    style={[styleContext.button, { marginTop: 10, backgroundColor: '#5a45d4' }]} 
                    onPress={fetchStudents}
                    disabled={searchLoading}
                >
                    {searchLoading ? <ActivityIndicator color="#fff" /> : <Text style={styleContext.buttonText}>Fetch Students</Text>}
                </TouchableOpacity>

            </View>

            {/* Student List */}
            <FlatList
                data={students}
                renderItem={({ item }) => (
                    <StudentHomeworkItem 
                        item={item} 
                        isMarked={absentStudents.includes(item.enrollment)}
                        onToggle={toggleStudentAbsence}
                        styleContext={styleContext}
                    />
                )}
                keyExtractor={(item) => item.enrollment}
                contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
                ListEmptyComponent={
                    !searchLoading && students.length === 0 ? 
                    <Text style={{ textAlign: 'center', marginTop: 20, color: '#888' }}>No students fetched</Text> 
                    : null
                }
            />

            {/* Footer Submit */}
            {students.length > 0 && (
                <View style={styles.footerContainer}>
                    <TouchableOpacity 
                        style={[styleContext.button, { backgroundColor: '#d32f2f', marginHorizontal: 20, marginBottom: 0 }]} 
                        onPress={submitMarking}
                        disabled={submitLoading}
                    >
                        {submitLoading ? <ActivityIndicator color="#fff" /> : 
                            <Text style={styleContext.buttonText}>
                                Mark As Not Done ({absentStudents.length})
                            </Text>
                        }
                    </TouchableOpacity>
                </View>
            )}

            <CustomPickerModal
                visible={pickerVisible}
                title={pickerConfig.title}
                data={pickerConfig.data}
                selectedValue={pickerConfig.selected}
                onSelect={(val) => {
                    pickerConfig.onSelect(val); 
                    setPickerConfig(prev => ({...prev, selected: val }));
                }}
                onConfirm={() => setPickerVisible(false)}
                onClose={() => setPickerVisible(false)}
            />

            <HomeWorkMenuModal 
                visible={menuVisible} 
                onClose={() => setMenuVisible(false)} 
                setMode={() => {}} 
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    inputContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 8,
        marginVertical: 5,
        borderWidth: 1,
        borderColor: '#eee'
    },
    label: { color: '#333', fontSize: 16 },
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
