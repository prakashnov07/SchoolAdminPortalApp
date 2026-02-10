import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, ActivityIndicator } from 'react-native';

import Toast from 'react-native-toast-message';
import axios from 'axios';
import { StyleContext } from '../context/StyleContext';
import { CoreContext } from '../context/CoreContext';
import OnlineClassMenu from '../components/OnlineClassMenu';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const DAYS_OF_WEEK = [
    { id: 'Sunday', name: 'Sunday' },
    { id: 'Monday', name: 'Monday' },
    { id: 'Tuesday', name: 'Tuesday' },
    { id: 'Wednesday', name: 'Wednesday' },
    { id: 'Thursday', name: 'Thursday' },
    { id: 'Friday', name: 'Friday' },
    { id: 'Saturday', name: 'Saturday' },
];

import CustomPickerModal from '../components/CustomPickerModal';

const AddOnlineClassScreen = ({ navigation, route }) => {
    const [menuVisible, setMenuVisible] = useState(false);
    const [classPickerVisible, setClassPickerVisible] = useState(false);
    const [sectionPickerVisible, setSectionPickerVisible] = useState(false);
    const [subjectPickerVisible, setSubjectPickerVisible] = useState(false);
    const [allowQueriesVisible, setAllowQueriesVisible] = useState(false);
    const [hourVisible, setHourVisible] = useState(false);
    const [minuteVisible, setMinuteVisible] = useState(false);
    const [ampmVisible, setAmpmVisible] = useState(false);
    const [nomVisible, setNomVisible] = useState(false);
    const { copySchedule } = route.params || {};
    const isEdit = !!copySchedule;
    
    const styleContext = useContext(StyleContext);
    const { 
        phone, branchid,
        allClasses, getAllClasses,
        allSections, getAllSections,
        subjects, fetchSubjects,
        classUrl
    } = useContext(CoreContext);
    
    // Form State
    const [classId, setClassId] = useState(copySchedule?.classid || '');
    const [sectionId, setSectionId] = useState(copySchedule?.sectionid || '');
    const [subject, setSubject] = useState(copySchedule?.sub || ''); // Legacy uses 'sub'
    const [allowQueries, setAllowQueries] = useState(copySchedule?.allow_queries || '');
    const [hour, setHour] = useState('');
    const [minute, setMinute] = useState('');
    const [ampm, setAmpm] = useState('');
    const [link, setLink] = useState(copySchedule?.link || classUrl || '');
    const [duration, setDuration] = useState(copySchedule?.duration_in_min?.toString() || '');
    const [nom, setNom] = useState(copySchedule?.nom ? parseInt(copySchedule.nom).toString() : '');
    const [selectedDays, setSelectedDays] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!allClasses || allClasses.length === 0) getAllClasses();
        if (!allSections || allSections.length === 0) getAllSections();
        if (!subjects || subjects.length === 0) fetchSubjects();
        if (classUrl && !link) setLink(classUrl);
    }, [classUrl]);

    useEffect(() => {
        if (isEdit && copySchedule) {
            // Parse Time: "09:30 AM"
            if (copySchedule.tim) {
                const parts = copySchedule.tim.split(' '); // ["09:30", "AM"]
                if (parts.length === 2) {
                    setAmpm(parts[1]);
                    const timeParts = parts[0].split(':');
                    if (timeParts.length === 2) {
                        setHour(timeParts[0]);
                        setMinute(timeParts[1]);
                    }
                }
            }
            // Parse Days: "Monday,Wednesday,Friday"
            if (copySchedule.days) {
                setSelectedDays(copySchedule.days.split(','));
            }
        }
    }, [copySchedule]);

    const toggleDay = (day) => {
        if (selectedDays.includes(day)) {
            setSelectedDays(selectedDays.filter(d => d !== day));
        } else {
            setSelectedDays([...selectedDays, day]);
        }
    };

    const handleSave = async () => {
        if (!classId) return Toast.show({ type: 'error', text1: 'Please select a class' });
        if (!sectionId) return Toast.show({ type: 'error', text1: 'Please select a section' });
        if (!subject) return Toast.show({ type: 'error', text1: 'Please select a subject' });
        if (!hour || !minute || !ampm) return Toast.show({ type: 'error', text1: 'Please set the time' });
        if (!duration) return Toast.show({ type: 'error', text1: 'Please enter duration' });
        if (selectedDays.length === 0) return Toast.show({ type: 'error', text1: 'Please select at least one day' });
        if (!link) return Toast.show({ type: 'error', text1: 'Please enter meeting link' });
        if (!nom) return Toast.show({ type: 'error', text1: 'Please select Fee Month' });
        if (!allowQueries) return Toast.show({ type: 'error', text1: 'Please select Allow Questions' });

        setLoading(true);
        try {
            const timeString = `${hour}:${minute} ${ampm}`;
            const payload = {
                id: isEdit ? copySchedule.id : undefined,
                classid: classId,
                sectionid: sectionId,
                subject,
                fromtime: timeString,
                link: link.trim(),
                nom,
                days: selectedDays.join(','), // Server expects string? Legacy sends array?
                // Legacy: `days` param in `uploadOnlineClass` is passed as `sDays` (array of values)
                // BUT `axios.post` payload has `days`. Let's check legacy again.
                // Legacy: `uploadOnlineClass(..., sDays, ...)` -> `axios.post(..., { ..., days, ... })`.
                // If legacy sends array, we should send array.
                // Wait, in legacy `OnlineClasseUpdate.js`:
                // `const sDays = selectedDays.map(d => d.value);` -> This is array of strings.
                // `axios.post` receives `days` which is `sDays`.
                // So it sends an Array of strings ["Monday", "Tuesday"].
                // However, the state `selectedDays` in legacy seems to be objects `{label, value}`.
                // My `selectedDays` is array of strings. 
                // I will send array of strings.
                
                comment: allowQueries, // Legacy maps `allowQueries` to `comment` in payload
                owner: phone,
                branchid,
                duration
            };
            
            // Legacy sends `days` as array in JSON? 
            // In `OnlineClasseUpdate.js`: `axios.post(..., { ..., days, ... })` where `days` is `sDays`.
            // `sDays` is `selectedDays.map(d => d.value)`.
            // So yes, it sends an array. 
            // BUT, `selectedDays` state in my code is `['Monday', 'Friday']`.
            // So `payload.days` should be `selectedDays`.
            // Let's verify if backend expects string or array.
            // In `OnlineClassItem.js`, `props.item.days` is displayed as text. If it was array it would crash React Text? 
            // Legacy `copySchedule.days` comes from `item.days` which splits by comma: `const dys = item.days.split(',');`.
            // This implies the database stores it as comma-separated string, OR the fetch converts it?
            // If `item.days` is "Monday,Tuesday", then `item.days` is a string.
            // If I send it as array, maybe backend handles join? Or maybe I should join it?
            // Legacy `OnlineClasseUpdate.js`: `const sDays = selectedDays.map(d => d.value);` -> `uploadOnlineClass(..., sDays, ...)`
            // `axios.post` sends `days` (which is `sDays` array).
            // So frontend sends ARRAY. Backend probably joins it.
            // I will send ARRAY `selectedDays`.

            await axios.post('/upload-online-class', {
                ...payload,
                days: selectedDays // Send as array
            });

            Toast.show({ type: 'success', text1: isEdit ? 'Class updated' : 'Class scheduled' });
            navigation.goBack();
        } catch (error) {
            console.error(error);
            Toast.show({ type: 'error', text1: 'Failed to save class' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={{ flex: 1, backgroundColor: '#fff' }}>
            <OnlineClassMenu visible={menuVisible} onClose={() => setMenuVisible(false)} />

            <View style={styles.formContainer}>
                <Text style={styles.label}>Class</Text>
                <TouchableOpacity 
                    style={styles.pickerTrigger} 
                    onPress={() => setClassPickerVisible(true)}
                >
                    <Text style={styles.pickerText}>
                        {classId ? (allClasses.find(c => c.classid === classId)?.classname || classId) : 'Select Class'}
                    </Text>
                    <MaterialIcons name="arrow-drop-down" size={24} color="#333" />
                </TouchableOpacity>

                <Text style={styles.label}>Section</Text>
                <TouchableOpacity 
                    style={styles.pickerTrigger} 
                    onPress={() => setSectionPickerVisible(true)}
                >
                    <Text style={styles.pickerText}>
                        {sectionId ? (allSections.find(s => s.sectionid === sectionId)?.sectionname || sectionId) : 'Select Section'}
                    </Text>
                    <MaterialIcons name="arrow-drop-down" size={24} color="#333" />
                </TouchableOpacity>

                <Text style={styles.label}>Subject</Text>
                <TouchableOpacity 
                    style={styles.pickerTrigger} 
                    onPress={() => setSubjectPickerVisible(true)}
                >
                    <Text style={styles.pickerText}>
                        {subject ? (subjects.find(s => s.id === subject)?.name || subject) : 'Select Subject'}
                    </Text>
                    <MaterialIcons name="arrow-drop-down" size={24} color="#333" />
                </TouchableOpacity>

                <CustomPickerModal
                    visible={classPickerVisible}
                    title="Select Class"
                    data={[{ label: 'Select Class', value: '' }, ...allClasses.map(c => ({ label: c.classname, value: c.classid }))]}
                    selectedValue={classId}
                    onSelect={setClassId}
                    onClose={() => setClassPickerVisible(false)}
                />

                <CustomPickerModal
                    visible={sectionPickerVisible}
                    title="Select Section"
                    data={[{ label: 'Select Section', value: '' }, ...allSections.map(s => ({ label: s.sectionname, value: s.sectionid }))]}
                    selectedValue={sectionId}
                    onSelect={setSectionId}
                    onClose={() => setSectionPickerVisible(false)}
                />

                <CustomPickerModal
                    visible={subjectPickerVisible}
                    title="Select Subject"
                    data={[{ label: 'Select Subject', value: '' }, ...subjects.map(s => ({ label: s.name, value: s.id }))]}
                    selectedValue={subject}
                    onSelect={setSubject}
                    onClose={() => setSubjectPickerVisible(false)}
                />

                <Text style={styles.label}>Allow Questions?</Text>
                <TouchableOpacity
                    style={styles.pickerTrigger}
                    onPress={() => setAllowQueriesVisible(true)}
                >
                    <Text style={styles.pickerText}>
                        {allowQueries ? (allowQueries === 'yes' ? 'Yes' : 'No') : 'Select'}
                    </Text>
                    <MaterialIcons name="arrow-drop-down" size={24} color="#333" />
                </TouchableOpacity>

                <Text style={styles.label}>Start Time</Text>
                <View style={styles.timeRow}>
                    <TouchableOpacity
                        style={[styles.pickerTrigger, { flex: 1, marginRight: 5, marginBottom: 0 }]}
                        onPress={() => setHourVisible(true)}
                    >
                        <Text style={styles.pickerText}>{hour || 'Hr'}</Text>
                        <MaterialIcons name="arrow-drop-down" size={24} color="#333" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.pickerTrigger, { flex: 1, marginRight: 5, marginBottom: 0 }]}
                        onPress={() => setMinuteVisible(true)}
                    >
                        <Text style={styles.pickerText}>{minute || 'Min'}</Text>
                        <MaterialIcons name="arrow-drop-down" size={24} color="#333" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.pickerTrigger, { flex: 1, marginBottom: 0 }]}
                        onPress={() => setAmpmVisible(true)}
                    >
                        <Text style={styles.pickerText}>{ampm || 'AM/PM'}</Text>
                        <MaterialIcons name="arrow-drop-down" size={24} color="#333" />
                    </TouchableOpacity>
                </View>

                <Text style={styles.label}>Duration (Minutes)</Text>
                <TextInput
                    style={styles.input}
                    value={duration}
                    onChangeText={setDuration}
                    keyboardType="numeric"
                    placeholder="e.g. 45"
                    maxLength={3}
                />

                <Text style={styles.label}>Days</Text>
                <View style={styles.daysContainer}>
                    {DAYS_OF_WEEK.map(day => (
                        <TouchableOpacity
                            key={day.id}
                            style={[
                                styles.dayButton,
                                selectedDays.includes(day.id) && styles.dayButtonSelected
                            ]}
                            onPress={() => toggleDay(day.id)}
                        >
                            <Text style={[
                                styles.dayText,
                                selectedDays.includes(day.id) && styles.dayTextSelected
                            ]}>{day.name.substring(0, 3)}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={styles.label}>Meeting Link</Text>
                <TextInput
                    style={[styles.input, { height: 80, textAlignVertical: 'top', backgroundColor: classUrl ? '#e0e0e0' : '#f9f9f9', color: '#000' }]} // textAlignVertical for Android, grey if disabled
                    value={link}
                    onChangeText={setLink}
                    multiline
                    editable={!classUrl}
                    placeholder="Enter Zoom/Meet link here"
                    placeholderTextColor="#888"
                />

                <Text style={styles.label}>Fee Paid Till Month</Text>
                <TouchableOpacity
                    style={styles.pickerTrigger}
                    onPress={() => setNomVisible(true)}
                >
                    <Text style={styles.pickerText}>
                        {nom ? (
                            nom === '0' ? 'No Restriction' :
                                nom === '10' ? 'January' :
                                    nom === '11' ? 'February' :
                                        nom === '12' ? 'March' :
                                            nom === '1' ? 'April' :
                                                nom === '2' ? 'May' :
                                                    nom === '3' ? 'June' :
                                                        nom === '4' ? 'July' :
                                                            nom === '5' ? 'August' :
                                                                nom === '6' ? 'September' :
                                                                    nom === '7' ? 'October' :
                                                                        nom === '8' ? 'November' :
                                                                            nom === '9' ? 'December' : nom
                        ) : 'Select Month'}
                    </Text>
                    <MaterialIcons name="arrow-drop-down" size={24} color="#333" />
                </TouchableOpacity>

                <CustomPickerModal
                    visible={allowQueriesVisible}
                    title="Allow Questions?"
                    data={[
                        { label: 'Select', value: '' },
                        { label: 'Yes', value: 'yes' },
                        { label: 'No', value: 'no' }
                    ]}
                    selectedValue={allowQueries}
                    onSelect={setAllowQueries}
                    onClose={() => setAllowQueriesVisible(false)}
                />

                <CustomPickerModal
                    visible={hourVisible}
                    title="Select Hour"
                    data={[
                        { label: 'Hr', value: '' },
                        ...Array.from({ length: 12 }, (_, i) => {
                            const val = i + 1 < 10 ? `0${i + 1}` : `${i + 1}`;
                            return { label: val, value: val };
                        })
                    ]}
                    selectedValue={hour}
                    onSelect={setHour}
                    onClose={() => setHourVisible(false)}
                />

                <CustomPickerModal
                    visible={minuteVisible}
                    title="Select Minute"
                    data={[
                        { label: 'Min', value: '' },
                        ...['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'].map(m => ({ label: m, value: m }))
                    ]}
                    selectedValue={minute}
                    onSelect={setMinute}
                    onClose={() => setMinuteVisible(false)}
                />

                <CustomPickerModal
                    visible={ampmVisible}
                    title="Select AM/PM"
                    data={[
                        { label: 'AM/PM', value: '' },
                        { label: 'AM', value: 'AM' },
                        { label: 'PM', value: 'PM' }
                    ]}
                    selectedValue={ampm}
                    onSelect={setAmpm}
                    onClose={() => setAmpmVisible(false)}
                />

                <CustomPickerModal
                    visible={nomVisible}
                    title="Select Fee Month"
                    data={[
                        { label: "No Restriction", value: "0" },
                        { label: "January", value: "10" },
                        { label: "February", value: "11" },
                        { label: "March", value: "12" },
                        { label: "April", value: "1" },
                        { label: "May", value: "2" },
                        { label: "June", value: "3" },
                        { label: "July", value: "4" },
                        { label: "August", value: "5" },
                        { label: "September", value: "6" },
                        { label: "October", value: "7" },
                        { label: "November", value: "8" },
                        { label: "December", value: "9" }
                    ]}
                    selectedValue={nom}
                    onSelect={setNom}
                    onClose={() => setNomVisible(false)}
                />

                <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={loading}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>{isEdit ? 'Update Schedule' : 'Schedule Class'}</Text>}
                </TouchableOpacity>

            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        backgroundColor: '#4a90e2',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    formContainer: {
        padding: 20,
        paddingBottom: 50,
    },
    label: {
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#333',
    },
    pickerTrigger: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 5,
        marginBottom: 15,
        backgroundColor: '#fff',
        padding: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    pickerText: {
        fontSize: 16,
        color: '#333',
    },
    timeRow: {
        flexDirection: 'row',
        marginBottom: 15,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 5,
        padding: 10,
        marginBottom: 15,
        backgroundColor: '#f9f9f9',
        fontSize: 16,
        color: '#000', // Ensure text is black
    },
    daysContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 15,
    },
    dayButton: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#ddd',
        marginRight: 8,
        marginBottom: 8,
        backgroundColor: '#f9f9f9',
    },
    dayButtonSelected: {
        backgroundColor: '#4a90e2',
        borderColor: '#4a90e2',
    },
    dayText: {
        color: '#333',
    },
    dayTextSelected: {
        color: '#fff',
        fontWeight: 'bold',
    },
    saveButton: {
        backgroundColor: '#2ecc71',
        padding: 15,
        borderRadius: 5,
        alignItems: 'center',
        marginTop: 10,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default AddOnlineClassScreen;
