import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Linking } from 'react-native';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import DateTimePicker from '@react-native-community/datetimepicker';
import { CoreContext } from '../context/CoreContext';
import { StyleContext } from '../context/StyleContext';
import CustomPickerModal from '../components/CustomPickerModal';
import OnlineClassMenu from '../components/OnlineClassMenu';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const OnlineClassReportScreen = ({ navigation }) => {
    const { 
        role, branchid, phone, 
        allClasses, getAllClasses,
        allSections, getAllSections,
        staffs, getAllStaffs,
        subjects, fetchSubjects
    } = useContext(CoreContext);
    const styleContext = useContext(StyleContext);

    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState([]);
    
    // Filters
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [subject, setSubject] = useState('all');
    const [staff, setStaff] = useState('all');
    const [cls, setCls] = useState('all');
    const [sectionid, setSectionid] = useState('all');

    // Picker Visibilities
    const [subjectPickerVisible, setSubjectPickerVisible] = useState(false);
    const [staffPickerVisible, setStaffPickerVisible] = useState(false);
    const [clsPickerVisible, setClsPickerVisible] = useState(false);
    const [sectionPickerVisible, setSectionPickerVisible] = useState(false);
    const [menuVisible, setMenuVisible] = useState(false);

    useEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <TouchableOpacity onPress={() => setMenuVisible(true)} style={{ marginRight: 15 }}>
                     <Icon name="dots-vertical" size={26} color="#fff" />
                </TouchableOpacity>
            ),
        });
        
        getAllClasses();
        getAllSections();
        getAllStaffs();
        if (!subjects || subjects.length === 0) fetchSubjects();
        fetchReport(); 
    }, []);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const formattedDate = `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()}`;
            
            const listStaff = (role === 'admin' || role === 'super' || role === 'tech' || role === 'principal') ? (staff || 'all') : phone;

            const params = {
                reportdate: formattedDate,
                subject: subject || 'all',
                phone: listStaff,
                classid: cls || 'all',
                sectionid: sectionid || 'all',
                branchid,
                role,
                owner: phone
            };

            const response = await axios.get('/online-classes-report-improved', { params });
            // Legacy reducer: onlineClassReport -> response.data.allClasses
            setReportData(response.data.allClasses || []);
        } catch (error) {
            console.error(error);
            Toast.show({ type: 'error', text1: 'Failed to fetch report' });
        } finally {
            setLoading(false);
        }
    };

    const handleDateChange = (event, selectedDate) => {
        setShowDatePicker(false);
        if (selectedDate) {
            setDate(selectedDate);
            // fetchReport(); // optional auto-fetch
        }
    };

    const renderItem = ({ item }) => {
        const className = 'Class : ' + item.cls + ' ' + item.section;
        const subjectName = 'Subject : ' + item.subject;
        
        return (
            <View style={[styles.card, { backgroundColor: styleContext.card?.backgroundColor || '#fff' }]}>
                <View style={styles.cardHeader}>
                    <Text style={[styles.cardTitle, { color: styleContext.textTextStyle?.color }]}>{className}</Text>
                    <Text style={[styles.cardTitle, { color: styleContext.textTextStyle?.color }]}>{subjectName}</Text>
                </View>

                <View style={styles.cardSection}>
                    <Text style={[styles.cardText, { fontWeight: 'bold' }]}>
                        Time: {item.tim}
                    </Text>
                     {item.treportstatus === 'present' ? (
                        <Text style={[styles.cardText, { fontWeight: 'bold' }]}>
                            {item.treport}
                        </Text>
                    ) : (
                        <Text style={[styles.cardText, { fontWeight: 'bold', color: 'red' }]}>
                            Class not Started
                        </Text>
                    )}
                </View>

                <View style={styles.cardSection}>
                    <Text style={[styles.cardText, { fontWeight: 'bold' }]}>
                        By {item.teacher}
                    </Text>
                </View>

                 <View style={styles.cardSection}>
                    {item.treportstatus === 'present' ? (
                        <Text style={[styles.cardText, { fontWeight: 'bold' }]}>
                            Present Student count : {item.stucount}
                        </Text>
                    ) : (
                        <Text style={[styles.cardText, { fontWeight: 'bold', color: 'red' }]}>
                            Student count tried to join : {item.stucount}
                        </Text>
                    )}
                </View>

                <View style={styles.buttonContainer}>
                    {item.stucount > 0 ? (
                        <TouchableOpacity 
                            style={[styles.actionBtn, { backgroundColor: styleContext.buttonStyle?.backgroundColor || '#6200ee' }]} 
                            onPress={() => handleShowStudents(item)}
                        >
                            <Text style={[styles.btnText, { fontSize: 13 }]}>Present Students</Text>
                        </TouchableOpacity>
                    ) : (
                         <View style={{ flex: 0.48 }} /> 
                    )}
                    
                    <TouchableOpacity 
                        style={[styles.actionBtn, { backgroundColor: '#D33A2C' }]} // Removed marginTop: 10
                        onPress={() => handleShowAbsentStudents(item)}
                    >
                        <Text style={[styles.btnText, { fontSize: 13 }]}>Absent Students</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    const handleShowStudents = (item) => {
        // Navigate or show modal for present students
        // Legacy dispatch(showOnlineClassStudents(...))
        // We probably need a new screen or modal for this. 
        // For now, let's just log or alert. 
        // "Actions.showOnlinePresentStudents" suggests a navigation. 
        navigation.navigate('OnlineClassStudentsScreen', { 
            classid: item.classid, 
            sectionid: item.sectionid, 
            date: item.date, 
            id: item.id,
            type: 'present'
        });
    };

    const handleShowAbsentStudents = (item) => {
         navigation.navigate('OnlineClassStudentsScreen', { 
            classid: item.classid, 
            sectionid: item.sectionid, 
            date: item.date, 
            id: item.id,
             type: 'absent'
        });
    };

    return (
        <View style={styles.container}>
            <OnlineClassMenu visible={menuVisible} onClose={() => setMenuVisible(false)} />
            
            <View style={styles.filters}>
                <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateInput}>
                    <Text>{date.toDateString()}</Text>
                    <Icon name="calendar" size={20} color="#666" />
                </TouchableOpacity>
                {/* ... DatePicker ... */}
                 {showDatePicker && (
                    <DateTimePicker
                        value={date}
                        mode="date"
                        display="default"
                        onChange={handleDateChange}
                    />
                )}

                <View style={styles.row}>
                     <TouchableOpacity style={styles.pickerTrigger} onPress={() => setClsPickerVisible(true)}>
                        <Text style={styles.pickerText}>{cls && cls !== 'all' ? allClasses.find(c => c.classid === cls)?.classname : 'All Classes'}</Text>
                        <MaterialIcons name="arrow-drop-down" size={24} color="#333" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.pickerTrigger} onPress={() => setSectionPickerVisible(true)}>
                        <Text style={styles.pickerText}>{sectionid && sectionid !== 'all' ? allSections.find(s => s.sectionid === sectionid)?.sectionname : 'Section'}</Text>
                        <MaterialIcons name="arrow-drop-down" size={24} color="#333" />
                    </TouchableOpacity>
                </View>

                <View style={styles.row}>
                    <TouchableOpacity style={styles.pickerTrigger} onPress={() => setSubjectPickerVisible(true)}>
                        <Text style={styles.pickerText}>{subject && subject !== 'all' ? subjects.find(s => s.id === subject)?.name : 'Subject'}</Text>
                        <MaterialIcons name="arrow-drop-down" size={24} color="#333" />
                    </TouchableOpacity>

                    {(role === 'admin' || role === 'super' || role === 'tech' || role === 'principal') && (
                        <TouchableOpacity style={styles.pickerTrigger} onPress={() => setStaffPickerVisible(true)}>
                             <Text style={styles.pickerText}>{staff && staff !== 'all' ? staffs.find(s => s.phone === staff)?.name : 'All Staffs'}</Text>
                             <MaterialIcons name="arrow-drop-down" size={24} color="#333" />
                        </TouchableOpacity>
                    )}
                </View>

                <TouchableOpacity style={[styles.searchBtn, { backgroundColor: styleContext.primary?.backgroundColor || '#6200ee' }]} onPress={fetchReport}>
                    <Text style={styles.btnText}>Search</Text>
                </TouchableOpacity>
            </View>

            {/* Pickers */}
            <CustomPickerModal
                visible={clsPickerVisible}
                title="Select Class"
                data={[{ label: 'All Classes', value: 'all' }, ...allClasses.map(c => ({ label: c.classname, value: c.classid }))]}
                selectedValue={cls}
                onSelect={setCls}
                onClose={() => setClsPickerVisible(false)}
            />
             <CustomPickerModal
                visible={sectionPickerVisible}
                title="Select Section"
                data={[{ label: 'Section', value: 'all' }, ...allSections.map(s => ({ label: s.sectionname, value: s.sectionid }))]}
                selectedValue={sectionid}
                onSelect={setSectionid}
                onClose={() => setSectionPickerVisible(false)}
            />
            <CustomPickerModal
                visible={subjectPickerVisible}
                title="Select Subject"
                data={[{ label: 'Subject', value: 'all' }, ...subjects.map(s => ({ label: s.name, value: s.id }))]}
                selectedValue={subject}
                onSelect={setSubject}
                onClose={() => setSubjectPickerVisible(false)}
            />
            <CustomPickerModal
                visible={staffPickerVisible}
                title="Select Staff"
                data={[{ label: 'All Staffs', value: 'all' }, ...staffs.map(s => ({ label: s.name, value: s.phone }))]}
                selectedValue={staff}
                onSelect={setStaff}
                onClose={() => setStaffPickerVisible(false)}
            />

            {loading ? (
                <ActivityIndicator size="large" color="#6200ee" style={{marginTop: 20}} />
            ) : (
                <FlatList
                    data={reportData}
                    renderItem={renderItem}
                    keyExtractor={(item, index) => index.toString()}
                    ListEmptyComponent={<Text style={styles.emptyText}>No schedules to show ....</Text>}
                    contentContainerStyle={{ padding: 10 }}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    filters: {
        backgroundColor: '#fff',
        padding: 10,
        marginBottom: 10,
        elevation: 2,
    },
    dateInput: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 10,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 5,
        marginBottom: 10,
        backgroundColor: '#fff',
        marginHorizontal: 5,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    pickerTrigger: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 10,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 5,
        marginHorizontal: 5,
        backgroundColor: '#fff',
    },
    pickerText: {
        fontSize: 14,
        color: '#333',
    },
    searchBtn: {
        padding: 12,
        borderRadius: 5,
        alignItems: 'center',
        marginTop: 5,
        marginHorizontal: 5,
    },
    btnText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    card: {
        padding: 15,
        borderRadius: 8,
        marginBottom: 10,
        marginHorizontal: 10,
        backgroundColor: '#fff',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: 5,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    cardSection: {
        marginBottom: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cardText: {
        fontSize: 14,
        color: '#555',
        fontWeight: '500',
    },
    buttonContainer: {
        marginTop: 15,
        flexDirection: 'row',
        justifyContent: 'space-between', 
    },
    actionBtn: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 4,
        alignItems: 'center',
        flex: 0.48, 
        justifyContent: 'center',
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 30,
        color: '#777',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default OnlineClassReportScreen;
