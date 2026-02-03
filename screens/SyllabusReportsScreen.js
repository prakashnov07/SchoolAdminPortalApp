import React, { useState, useContext, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Alert, ActivityIndicator, Image, Linking, TextInput, Platform, Modal, TouchableWithoutFeedback, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import axios from 'axios';
import Toast from 'react-native-toast-message';

import { CoreContext } from '../context/CoreContext';
import { StyleContext } from '../context/StyleContext';
import CustomPickerModal from '../components/CustomPickerModal';

// Helper Component for Individual Report Item
const ReportItem = ({ item, styleContext }) => {
    return (
        <View style={styleContext.card}>
            <View style={{ marginBottom: 8 }}>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: styleContext.titleColor }}>{item.name || 'Unknown Teacher'}</Text>
            </View>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                <Text style={{ fontSize: 14, color: '#333' }}>Subject: <Text style={{ fontWeight: 'bold' }}>{item.subject}</Text></Text>
                <Text style={{ fontSize: 14, color: '#333' }}>Class: <Text style={{ fontWeight: 'bold' }}>{item.className}</Text></Text>
            </View>

             <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                <Text style={{ fontSize: 13, color: '#666' }}>Completed: {item.completion_date}</Text>
            </View>

            <View style={{ marginTop: 5 }}>
                <Text style={{ fontSize: 14, color: '#1976d2', fontWeight: 'bold' }}>Percentage: {item.completion_percentage}%</Text>
            </View>
        </View>
    );
};

export default function SyllabusReportsScreen({ navigation }) {
    const coreContext = useContext(CoreContext);
    const styleContext = useContext(StyleContext);
    const { 
        allClasses, getAllClasses, 
        allSections, getAllSections, 
        branchid, phone 
    } = coreContext;

    // Filters
    const [selectedClass, setSelectedClass] = useState(null);
    const [selectedSection, setSelectedSection] = useState(null);
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [selectedMonth, setSelectedMonth] = useState(null);
    const [selectedTeacher, setSelectedTeacher] = useState(''); // Empty for 'All'
    const [selectedStatus, setSelectedStatus] = useState('complete');

    // Display Names for Pickers
    const [selectedClassName, setSelectedClassName] = useState('Select Class');
    const [selectedSectionName, setSelectedSectionName] = useState('Select Section');
    
    // Data
    const [subjects, setSubjects] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(false);

    // Modals
    const [pickerVisible, setPickerVisible] = useState(false);
    const [pickerConfig, setPickerConfig] = useState({ title: '', data: [], selected: null, onSelect: () => {} });

    // Constants
    const months = [
        { id: '1', name: 'April' }, { id: '2', name: 'May' }, { id: '3', name: 'June' },
        { id: '4', name: 'July' }, { id: '5', name: 'August' }, { id: '6', name: 'September' },
        { id: '7', name: 'October' }, { id: '8', name: 'November' }, { id: '9', name: 'December' },
        { id: '10', name: 'January' }, { id: '11', name: 'February' }, { id: '12', name: 'March' },
    ];

    const statusOptions = [
        { label: 'Complete', value: 'complete' },
        { label: 'Incomplete', value: 'incomplete' },
        { label: 'All', value: 'all' },
    ];

    useEffect(() => {
        if (!allClasses || allClasses.length === 0) getAllClasses();
        if (!allSections || allSections.length === 0) getAllSections();
        if (coreContext.subjects && coreContext.subjects.length > 0) {
            setSubjects(coreContext.subjects.map(s => ({ label: s.name, value: s.name })));
        } else {
             coreContext.fetchSubjects();
        }
        fetchTeachers();
    }, []);

    useEffect(() => {
         if (coreContext.subjects && coreContext.subjects.length > 0) {
            setSubjects(coreContext.subjects.map(s => ({ label: s.name, value: s.name })));
        }
    }, [coreContext.subjects]);

    const fetchTeachers = () => {
        axios.get('/all-teachers', { params: { branchid } })
            .then(response => {
                const teacherData = response.data.teachers || [];
                setTeachers(teacherData.map(t => ({ label: t.name, value: t.emp_id })));
            })
            .catch(err => console.error("Failed to fetch teachers", err));
    };

    const fetchReports = () => {
        if (!selectedClass || !selectedSection) {
            return Alert.alert("Error", "Please select Class and Section");
        }
        if (!selectedSubject) {
             return Alert.alert("Error", "Please select a Subject");
        }
        if (!selectedMonth) {
             return Alert.alert("Error", "Please select a Month");
        }

        setLoading(true);
        const params = {
            classid: selectedClass,
            sectionid: selectedSection,
            branchid: branchid,
            subject: selectedSubject,
            week: selectedMonth, // nom/week logic from legacy
            nom: '', // Legacy passed 'currentWeek' here usually, but viewed week is prioritized
            owner: phone,
            empid: selectedTeacher,
            astatus: selectedStatus
        };

        axios.get('/syllabus-report', { params })
            .then(response => {
                const rows = response.data.rows || [];
                setReports(rows);
                if (rows.length === 0) {
                    Toast.show({ type: 'info', text1: 'Info', text2: 'No reports found.' });
                }
            })
            .catch(error => {
                console.error(error);
                Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to fetch reports' });
            })
            .finally(() => setLoading(false));
    };

    // Picker Logic
    const openPicker = (title, data, selected, onSelect) => {
        setPickerConfig({
            title,
            data,
            selected,
            onSelect: (val) => {
                onSelect(val);
                if (title === 'Class') setSelectedClassName(data.find(d => d.value === val)?.label);
                if (title === 'Section') setSelectedSectionName(data.find(d => d.value === val)?.label);
            }
        });
        setPickerVisible(true);
    };

    const getFormattedClassOptions = () => (allClasses || []).map(c => ({ label: c.classname, value: c.classid }));
    const getFormattedSectionOptions = () => (allSections || []).map(s => ({ label: s.sectionname, value: s.sectionid }));
    const getMonthOptions = () => months.map(m => ({ label: m.name, value: m.id }));
    
    // Add 'All' option to teachers
    const getTeacherOptions = () => [{ label: 'All Staffs', value: '' }, ...teachers];

    return (
        <SafeAreaView style={styleContext.background} edges={['bottom', 'left', 'right']}>
            <View style={{ padding: 16 }}>
                
                {/* Row 1: Class & Section */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
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

                {/* Row 2: Subject & Month */}
                <View style={{ flexDirection: 'row', marginBottom: 10 }}>
                    <TouchableOpacity 
                         style={[styleContext.pickerButton, { flex: 1, marginRight: 5 }]}
                         onPress={() => openPicker('Subject', subjects, selectedSubject, setSelectedSubject)}
                    >
                         <Text style={styleContext.pickerButtonText}>{selectedSubject || 'Select Subject'}</Text>
                         <Icon name="book-open-variant" size={24} color={styleContext.blackColor} />
                    </TouchableOpacity>

                    <TouchableOpacity 
                         style={[styleContext.pickerButton, { flex: 1, marginLeft: 5 }]}
                         onPress={() => openPicker('Month', getMonthOptions(), selectedMonth, setSelectedMonth)}
                    >
                         <Text style={styleContext.pickerButtonText}>{selectedMonth ? months.find(m => m.id === selectedMonth)?.name : 'Select Month'}</Text>
                         <Icon name="calendar-month" size={24} color={styleContext.blackColor} />
                    </TouchableOpacity>
                </View>

                {/* Row 3: Teacher & Status */}
                <View style={{ flexDirection: 'row', marginBottom: 10 }}>
                    <TouchableOpacity 
                         style={[styleContext.pickerButton, { flex: 1, marginRight: 5 }]}
                         onPress={() => openPicker('Teacher', getTeacherOptions(), selectedTeacher, setSelectedTeacher)}
                    >
                         <Text numberOfLines={1} style={styleContext.pickerButtonText}>
                             {selectedTeacher ? teachers.find(t => t.value === selectedTeacher)?.label : 'All Staffs'}
                         </Text>
                         <Icon name="account-tie" size={24} color={styleContext.blackColor} />
                    </TouchableOpacity>

                    <TouchableOpacity 
                         style={[styleContext.pickerButton, { flex: 1, marginLeft: 5 }]}
                         onPress={() => openPicker('Status', statusOptions, selectedStatus, setSelectedStatus)}
                    >
                         <Text style={styleContext.pickerButtonText}>{statusOptions.find(s => s.value === selectedStatus)?.label}</Text>
                         <Icon name="list-status" size={24} color={styleContext.blackColor} />
                    </TouchableOpacity>
                </View>


                {/* Get Report Button */}
                <TouchableOpacity 
                    style={[styleContext.button, { marginTop: 5 }]} 
                    onPress={fetchReports}
                    disabled={loading}
                >
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styleContext.buttonText}>Get Report</Text>}
                </TouchableOpacity>

            </View>

            {/* Report List */}
            <FlatList
                data={reports}
                renderItem={({ item }) => (
                    <ReportItem item={item} styleContext={styleContext} />
                )}
                keyExtractor={(item) => item.id ? item.id.toString() : Math.random().toString()}
                contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
                ListEmptyComponent={
                    !loading ? 
                    <Text style={{ textAlign: 'center', marginTop: 30, color: '#888' }}>
                        No reports found.
                    </Text> : null
                }
            />

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

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({});
