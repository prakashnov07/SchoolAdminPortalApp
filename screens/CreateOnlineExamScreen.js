import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Switch, ActivityIndicator, Alert, Platform } from 'react-native';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import DateTimePicker from '@react-native-community/datetimepicker';
import { CoreContext } from '../context/CoreContext';
import { StyleContext } from '../context/StyleContext';
import CustomPickerModal from '../components/CustomPickerModal';
import OnlineExamMenu from '../components/OnlineExamMenu';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

const CreateOnlineExamScreen = ({ navigation, route }) => {
    const { branchid, phone, role, allowedTabs } = useContext(CoreContext);
    const { primary, background, textColor, secondary } = useContext(StyleContext);
    
    const examData = route.params?.examData || null;
    const isEdit = !!examData;

    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Data Sources
    const [examDefinitions, setExamDefinitions] = useState([]);
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);

    // Form State
    const [selectedExam, setSelectedExam] = useState(examData?.examid?.toString() || examData?.exam_id?.toString() || ''); 
    const [selectedClass, setSelectedClass] = useState(examData?.classid?.toString() || '');
    const [selectedSubject, setSelectedSubject] = useState(examData?.subjectid?.toString() || '');
    const [examType, setExamType] = useState(examData?.etype || 'PT');
    
    // Date/Time
    const [date, setDate] = useState(examData?.start_time ? new Date(examData.start_time) : new Date());
    const [time, setTime] = useState(examData?.start_time ? new Date(examData.start_time) : new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);

    const [duration, setDuration] = useState(examData?.duration?.toString() || '60');
    const [maxMarks, setMaxMarks] = useState(examData?.max_marks?.toString() || '100');
    const [negativeMarking, setNegativeMarking] = useState(examData?.negative_marking?.toString() || '0');
    const [instructions, setInstructions] = useState(examData?.instruction || '');
    const [isActive, setIsActive] = useState(examData?.qstatus === 'active');
    const [showResult, setShowResult] = useState(examData?.show_result === 'Yes'); 
    const [allowedLateStart, setAllowedLateStart] = useState(examData?.expire_after_minutes?.toString() || '0');
    
    // Menu State
    const [menuVisible, setMenuVisible] = useState(false);

    useEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <TouchableOpacity onPress={() => setMenuVisible(true)} style={{ marginRight: 15 }}>
                     <Icon name="dots-vertical" size={26} color="#fff" />
                </TouchableOpacity>
            ),
        });
    }, [navigation, textColor]);

    // Picker State
    const [pickerVisible, setPickerVisible] = useState(false);
    const [pickerData, setPickerData] = useState([]);
    const [pickerTitle, setPickerTitle] = useState('');
    const [pickerValue, setPickerValue] = useState(null);
    const [pickerOnSelect, setPickerOnSelect] = useState(() => {});

    const openPicker = (title, data, value, onSelect) => {
        setPickerTitle(title);
        setPickerData(data);
        setPickerValue(value);
        setPickerOnSelect(() => (val) => {
            onSelect(val);
            setPickerVisible(false);
        });
        setPickerVisible(true);
    };

    // Load Initial Data
    useEffect(() => {
        fetchInitialData();
    }, []);

    // Load subjects when class changes
    useEffect(() => {
        if (selectedClass) {
            fetchSubjects(selectedClass);
        }
    }, [selectedClass]);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [examsRes, classesRes] = await Promise.all([
                axios.get('/getallexams', { params: { branchid } }),
                axios.get('/getallclasses', { params: { branchid } })
            ]);

            setExamDefinitions(examsRes.data.rows || []);
            setClasses(classesRes.data.rows || []);

            // If editing, fetching subjects is triggered by useEffect on selectedClass
        } catch (error) {
            console.error(error);
            Toast.show({ type: 'error', text1: 'Failed to load form data' });
        } finally {
            setLoading(false);
        }
    };

    const fetchSubjects = async (classId) => {
        try {
            // Using class-wise-subjects as referenced in legacy
            const response = await axios.get('/class-wise-subjects', { params: { branchid, classid: classId } });
            setSubjects(response.data.subjects || []);
        } catch (error) {
            console.error(error);
            Toast.show({ type: 'error', text1: 'Failed to load subjects' });
        }
    };



    const onDateChange = (event, selectedDate) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (selectedDate) setDate(selectedDate);
    };

    const onTimeChange = (event, selectedTime) => {
        setShowTimePicker(Platform.OS === 'ios');
        if (selectedTime) setTime(selectedTime);
    };

    const formatTime = (dateObj) => {
        let hours = dateObj.getHours();
        let minutes = dateObj.getMinutes();
        
        if (hours < 10) hours = '0' + hours;
        if (minutes < 10) minutes = '0' + minutes;
        
        return hours + ':' + minutes;
    };

    const formatDate = (dateObj) => {
        const year = dateObj.getFullYear();
        let month = dateObj.getMonth() + 1;
        let day = dateObj.getDate();
        
        if (month < 10) month = '0' + month;
        if (day < 10) day = '0' + day;
        
        return `${day}-${month}-${year}`;
    };

    const handleSave = async () => {
        if (!selectedExam || !selectedClass || !selectedSubject) {
            Toast.show({ type: 'error', text1: 'Please fill all required fields' });
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                id: isEdit ? examData.id : '',
                classid: selectedClass,
                subject: selectedSubject,
                exam: selectedExam,
                etype: examType,
                duration,
                attendancedate: formatDate(date),
                examtime: formatTime(time),
                max: maxMarks,
                per: negativeMarking,
                instruction: instructions,
                astatus: isActive ? 'active' : 'inactive',
                nom: 0, 
                comment: showResult ? 'Yes' : 'No', 
                owner: phone,
                branchid,
                late_time: allowedLateStart
            };

            console.log('Payload:', payload); // Debugging

            await axios.post('/upload-online-exam-paper', payload);
            Toast.show({ type: 'success', text1: isEdit ? 'Exam updated successfully' : 'Exam created successfully' });
            navigation.goBack();
        } catch (error) {
            console.error('Save Exam Error:', error);
            console.log('Error details:', error.response?.data);
            const errorMsg = error.response?.data?.message || (typeof error.response?.data === 'string' ? error.response?.data : '') || error.message || 'Failed to save exam';
            Toast.show({ type: 'error', text1: 'Failed to save exam', text2: errorMsg.substring(0, 100) });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.centered, { backgroundColor: background?.backgroundColor }]}>
                <ActivityIndicator size="large" color={primary?.backgroundColor} />
            </View>
        );
    }

    const checkAllowedTabs = (url) => {
        if (role === 'super') return true;
        if (!allowedTabs) return false;
        return Array.isArray(allowedTabs) && allowedTabs.some(tab => tab.tab_name === url);
    };

    const handleExamChange = () => {
        if (checkAllowedTabs('onlineExamSettings')) {
            openPicker(
                'Select Exam Name', 
                examDefinitions.map(e => ({ label: e.examname, value: e.id || e.examname })), 
                selectedExam, 
                setSelectedExam
            );
        } else {
            Toast.show({ type: 'error', text1: 'Permission Denied', text2: 'You do not have permission to change the exam.' });
        }
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: background?.backgroundColor }]}>
            <View style={styles.formContent}>
                
                <Text style={styles.label}>Online Exam Name (e.g. Mid-Term)</Text>
                <TouchableOpacity 
                    style={styles.pickerTrigger} 
                    onPress={handleExamChange}
                >
                    <Text style={styles.pickerText}>
                        {examDefinitions.find(e => (e.id || e.examname).toString() == selectedExam.toString())?.examname || selectedExam || 'Select Exam Name'}
                    </Text>
                    <Text style={{ fontSize: 18, color: '#666' }}>▼</Text>
                </TouchableOpacity>

                <Text style={styles.label}>Class</Text>
                <TouchableOpacity 
                    style={styles.pickerTrigger} 
                    onPress={() => openPicker(
                        'Select Class', 
                        classes.map(c => ({ label: c.classname, value: c.classid })), 
                        selectedClass, 
                        setSelectedClass
                    )}
                >
                    <Text style={styles.pickerText}>
                        {classes.find(c => c.classid.toString() == selectedClass.toString())?.classname || 'Select Class'}
                    </Text>
                    <Text style={{ fontSize: 18, color: '#666' }}>▼</Text>
                </TouchableOpacity>

                <Text style={styles.label}>Subject</Text>
                <TouchableOpacity 
                    style={styles.pickerTrigger} 
                    onPress={() => openPicker(
                        'Select Subject', 
                        subjects.map(s => ({ label: s.subname || s.subject, value: s.id?.toString() || s.subject })), 
                        selectedSubject, 
                        setSelectedSubject
                    )}
                >
                    <Text style={styles.pickerText}>
                        {subjects.find(s => (s.id?.toString() || s.subject) == selectedSubject)?.subname || subjects.find(s => (s.id?.toString() || s.subject) == selectedSubject)?.subject || selectedSubject || 'Select Subject'}
                    </Text>
                    <Text style={{ fontSize: 18, color: '#666' }}>▼</Text>
                </TouchableOpacity>

                <Text style={styles.label}>Exam Type</Text>
                <TouchableOpacity 
                    style={styles.pickerTrigger} 
                    onPress={() => openPicker(
                        'Select Type', 
                        [
                            { label: 'PT', value: 'PT' },
                            { label: 'Main', value: 'Main' }
                        ], 
                        examType, 
                        setExamType
                    )}
                >
                    <Text style={styles.pickerText}>
                        {examType || 'Select Type'}
                    </Text>
                    <Text style={{ fontSize: 18, color: '#666' }}>▼</Text>
                </TouchableOpacity>

                <View style={styles.row}>
                    <View style={styles.halfInput}>
                        <Text style={styles.label}>Date</Text>
                        <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateBtn}>
                            <Text>{date.toDateString()}</Text>
                        </TouchableOpacity>
                        {showDatePicker && (
                            <DateTimePicker
                                value={date}
                                mode="date"
                                display="default"
                                onChange={onDateChange}
                            />
                        )}
                    </View>
                    <View style={styles.halfInput}>
                        <Text style={styles.label}>Time</Text>
                        <TouchableOpacity onPress={() => setShowTimePicker(true)} style={styles.dateBtn}>
                            <Text>{formatTime(time)}</Text>
                        </TouchableOpacity>
                        {showTimePicker && (
                            <DateTimePicker
                                value={time}
                                mode="time"
                                display="default"
                                onChange={onTimeChange}
                            />
                        )}
                    </View>
                </View>

                <View style={styles.row}>
                    <View style={styles.halfInput}>
                        <Text style={styles.label}>Duration (mins)</Text>
                        <TextInput
                            style={styles.input}
                            value={duration}
                            onChangeText={setDuration}
                            keyboardType="numeric"
                        />
                    </View>
                    <View style={styles.halfInput}>
                        <Text style={styles.label}>Max Marks</Text>
                        <TextInput
                            style={styles.input}
                            value={maxMarks}
                            onChangeText={setMaxMarks}
                            keyboardType="numeric"
                        />
                    </View>
                </View>
                
                <View style={styles.row}>
                    <View style={styles.halfInput}>
                        <Text style={styles.label}>Negative Marking</Text>
                        <TextInput
                            style={styles.input}
                            value={negativeMarking}
                            onChangeText={setNegativeMarking}
                            keyboardType="numeric"
                            placeholder="e.g. 0.25"
                        />
                    </View>
                    <View style={styles.halfInput}>
                        <Text style={styles.label}>Allowed Late Start (mins)</Text>
                        <TextInput
                            style={styles.input}
                            value={allowedLateStart}
                            onChangeText={setAllowedLateStart}
                            keyboardType="numeric"
                        />
                    </View>
                </View>

                <Text style={styles.label}>Instructions</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    value={instructions}
                    onChangeText={setInstructions}
                    multiline
                    numberOfLines={4}
                    placeholder="Enter exam instructions..."
                />

                <View style={styles.switchRow}>
                    <Text style={styles.label}>Show Result to Students Immediately?</Text>
                    <Switch
                        trackColor={{ false: "#767577", true: primary?.backgroundColor }}
                        thumbColor={showResult ? "#f4f3f4" : "#f4f3f4"}
                        onValueChange={setShowResult}
                        value={showResult}
                    />
                </View>

                <View style={styles.switchRow}>
                    <Text style={styles.label}>Active Status</Text>
                        <Switch
                        trackColor={{ false: "#767577", true: "green" }}
                        thumbColor={isActive ? "#f4f3f4" : "#f4f3f4"}
                        onValueChange={setIsActive}
                        value={isActive}
                    />
                </View>

                <TouchableOpacity 
                    style={[styles.saveBtn, { backgroundColor: primary?.backgroundColor || '#6200ee' }]} 
                    onPress={handleSave}
                    disabled={submitting}
                >
                    {submitting ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.saveBtnText}>{isEdit ? 'Update Exam' : 'Create Exam'}</Text>
                    )}
                </TouchableOpacity>

            </View>
            <CustomPickerModal
                visible={pickerVisible}
                title={pickerTitle}
                data={pickerData}
                selectedValue={pickerValue}
                onSelect={pickerOnSelect}
                onClose={() => setPickerVisible(false)}
            />
            <OnlineExamMenu visible={menuVisible} onClose={() => setMenuVisible(false)} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    formContent: {
        padding: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 5,
        color: '#444',
        marginTop: 10,
    },
    input: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    halfInput: {
        width: '48%',
    },
    dateBtn: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        alignItems: 'center',
    },
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginVertical: 15,
        backgroundColor: '#fff',
        padding: 10,
        borderRadius: 8,
        elevation: 1,
    },
    saveBtn: {
        marginTop: 30,
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginBottom: 50,
    },
    saveBtnText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    pickerTrigger: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    pickerText: {
        fontSize: 16,
        color: '#333',
    },
});

export default CreateOnlineExamScreen;
