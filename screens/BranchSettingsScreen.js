import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import { CoreContext } from '../context/CoreContext';
import { StyleContext } from '../context/StyleContext';
import CustomPickerModal from '../components/CustomPickerModal';

export default function BranchSettingsScreen({ navigation }) {
    const coreContext = useContext(CoreContext);
    const styleContext = useContext(StyleContext);
    const { branchid, phone, role, schoolData, grpBranches, setBranchid } = coreContext;

    const [loading, setLoading] = useState(false);
    
    // State for settings
    const [sortstudentsby, setSortstudentsby] = useState('');
    const [defaultAttendanceStatus, setDefaultAttendanceStatus] = useState('yes');
    const [manualAttendance, setManualAttendance] = useState('no');
    const [wifiAttendance, setWifiAttendance] = useState('no');
    const [manualAttendanceStaff, setManualAttendanceStaff] = useState('all');
    const [salaryInApp, setSalaryInApp] = useState('no');
    const [classTeacherInApp, setClassTeacherInApp] = useState('no');
    const [tAmount, setTAmount] = useState('');
    const [nom, setNom] = useState('');
    const [studentRecordEditable, setStudentRecordEditable] = useState('no');
    const [studentPhotoEditable, setStudentPhotoEditable] = useState('no');

    // Picker State
    const [pickerVisible, setPickerVisible] = useState(false);
    const [pickerConfig, setPickerConfig] = useState({ title: '', data: [] });
    const [pickerSelectedValue, setPickerSelectedValue] = useState(null);
    const [pickerTarget, setPickerTarget] = useState(null); // 'branch'|'sort'|'defaultAtt'|'wifi'|'manual'|'manualStaff'|'salary'|'classTeacher'|'feeMonth'|'studentRec'|'studentPhoto'

    const months = [
        { id: 1, name: 'April' }, { id: 2, name: 'May' }, { id: 3, name: 'June' },
        { id: 4, name: 'July' }, { id: 5, name: 'August' }, { id: 6, name: 'September' },
        { id: 7, name: 'October' }, { id: 8, name: 'November' }, { id: 9, name: 'December' },
        { id: 10, name: 'January' }, { id: 11, name: 'February' }, { id: 12, name: 'March' },
    ];

    useEffect(() => {
        if (!['super', 'tech', 'admin'].includes(role)) {
            Alert.alert('Access Denied', 'You do not have permission to view this page.', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
            return;
        }
        
        const loadAuth = async () => {
            try {
                const storedAppId = await AsyncStorage.getItem('branchAppId');
                if (storedAppId) {
                    const appId = JSON.parse(storedAppId);
                    axios.defaults.headers.common.Authorization = appId;
                }
            } catch (e) {
                console.error('Failed to load auth header', e);
            }
        };
        loadAuth();
        
        initializeSettings();
    }, []);

    const initializeSettings = () => {
        // Initialize state from schoolData if available, otherwise defaulting or waiting for fetch
        if (schoolData) {
            setSortstudentsby(schoolData.sortstudentsby || '');
            setDefaultAttendanceStatus(String(schoolData.defaultAttendanceStatus || 'yes'));
            setManualAttendance(String(schoolData.manualAttendance || 'no'));
            setWifiAttendance(String(schoolData.wifiAttendance || 'no'));
            setManualAttendanceStaff(schoolData.manualAttendanceStaff || 'all');
            setSalaryInApp(String(schoolData.salaryInApp || 'no'));
            setClassTeacherInApp(String(schoolData.classTeacherInApp || 'no'));
            setTAmount(String(schoolData.defaulterCallThreshold || ''));
            // Ensure dcmo is handled correctly as value (number)
            setNom(parseInt(schoolData.dcmo || 0));

            // Student Editable Settings
            setStudentRecordEditable(schoolData.studentRecordEditable ? 'yes' : 'no');
            setStudentPhotoEditable(schoolData.studentPhotoEditable ? 'yes' : 'no');
        }
    };

    const updateSetting = (name, value, label) => {
        if (!branchid || !phone) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Missing Branch ID or Phone number' });
            return;
        }

        console.log(`Updating ${name} to ${value} for branch ${branchid} owner ${phone}`);
        console.log('Headers:', axios.defaults.headers.common);

        setLoading(true);
        axios.post('/set-other-details', { branchid, per: value, name, owner: phone })
            .then(() => {
                Toast.show({
                    type: 'success',
                    text1: 'Success',
                    text2: `${label} updated successfully.`
                });
            })
            .catch(err => {
                console.error('Update Setting Error:', err);
                const errMsg = err.response?.data?.message || err.message || `Failed to update ${label}.`;
                Toast.show({
                    type: 'error',
                    text1: `Error ${err.response?.status || ''}`,
                    text2: errMsg.substring(0, 60)
                });
            })
            .finally(() => setLoading(false));
    };

    // Specific handlers
    const handleSortChange = (val) => {
        if (!branchid) {
             Toast.show({ type: 'error', text1: 'Error', text2: 'Missing Branch ID' });
             return;
        }

        console.log(`Setting sort student by: ${val} for branch ${branchid}`);
        setSortstudentsby(val);
        setLoading(true);
        axios.post('/setstudentssortby', { id: val, branchid })
            .then(() => {
                Toast.show({
                    type: 'success',
                    text1: 'Success',
                    text2: 'Sort order updated successfully.'
                });
            })
            .catch(err => {
                console.error('Sort Error:', err);
                const errMsg = err.response?.data?.message || err.message || 'Failed to update sort order.';
                Toast.show({
                    type: 'error',
                    text1: `Error ${err.response?.status || ''}`,
                    text2: errMsg.substring(0, 60)
                });
            })
            .finally(() => setLoading(false));
    };

    const handleDefaultAttendance = (val) => {
        setDefaultAttendanceStatus(val);
        updateSetting('default_attendance_status', val, 'Default Attendance Status');
    };

    const handleWifiAttendance = (val) => {
        setWifiAttendance(val);
        updateSetting('app_wifi_attendance', val, 'Wifi Attendance');
    };

    const handleManualAttendance = (val) => {
        setManualAttendance(val);
        updateSetting('app_manual_attendance', val, 'Manual Attendance');
    };

    const handleManualAttendanceStaff = (val) => {
        setManualAttendanceStaff(val);
        updateSetting('app_manual_attendance_staff', val, 'Manual Attendance Staff');
    };

    const handleSalaryInApp = (val) => {
        setSalaryInApp(val);
        updateSetting('show_salary_in_app', val, 'Salary in App');
    };

    const handleClassTeacherInApp = (val) => {
        setClassTeacherInApp(val);
        updateSetting('show_class_teacher_in_app', val, 'Class Teacher in App');
    };

    const saveThreshold = () => {
        updateSetting('defaulter_call_threshold', tAmount, 'Threshold Amount');
    };

    const handleFeeMonth = (val) => {
        setNom(val);
        updateSetting('app-fee-defaulter-month', val, 'Fee Defaulter Month');
    };

    const handleStudentRecordEditable = (val) => {
        setStudentRecordEditable(val);
        updateSetting('app_student_record_editable', val, 'Student Record Editable');
        // Refresh school data to reflect changes globally if needed
        if (coreContext.getSchoolData) coreContext.getSchoolData();
    };

    const handleStudentPhotoEditable = (val) => {
        setStudentPhotoEditable(val);
        updateSetting('app_student_photo_editable', val, 'Student Photo Editable');
        if (coreContext.getSchoolData) coreContext.getSchoolData();
    };

    const changeBranch = async (newBranchId) => {
        if (newBranchId !== branchid) {
            setLoading(true);
            
            const selectedBranch = grpBranches.find(b => b.branchid === newBranchId);
            if (selectedBranch) {
                // Set Authorization header like legacy code
                if (selectedBranch.appid) {
                    axios.defaults.headers.common.Authorization = selectedBranch.appid;

                    try {
                        await AsyncStorage.setItem('branchAppId', JSON.stringify(selectedBranch.appid));
                    } catch (e) {
                        console.error('Failed to save branchAppId', e);
                    }
                }
            }


            const result = await coreContext.switchBranch(newBranchId, navigation, '', selectedBranch);
            if (result) {
                // Success handled by context toast or we can do more here
                // coreContext.setBranch already updates state and shows toast
            } else {
                // Failure handled by context toast
            }
            // setBranchid(newBranchId); // Handled by context

            setLoading(false);

        }
    };


    const openPicker = (label, data, selectedValue, target) => {
        setPickerConfig({ title: label, data });
        setPickerSelectedValue(selectedValue);
        setPickerTarget(target);
        setPickerVisible(true);
    };

    const onPickerConfirm = (val) => {
        setPickerSelectedValue(val);
        
        switch (pickerTarget) {
            case 'branch':
                changeBranch(val);
                break;
            case 'sort':
                handleSortChange(val);
                break;
            case 'defaultAtt':
                handleDefaultAttendance(val);
                break;
            case 'wifi':
                handleWifiAttendance(val);
                break;
            case 'manual':
                handleManualAttendance(val);
                break;
            case 'manualStaff':
                handleManualAttendanceStaff(val);
                break;
            case 'salary':
                handleSalaryInApp(val);
                break;
            case 'classTeacher':
                handleClassTeacherInApp(val);
                break;
            case 'feeMonth':
                handleFeeMonth(val);
                break;
            case 'studentRec':
                handleStudentRecordEditable(val);
                break;
            case 'studentPhoto':
                handleStudentPhotoEditable(val);
                break;
            default:
                break;
        }
        setPickerVisible(false);
    };

    const renderCard = (title, children) => (
        <View style={styles.card}>
            <View style={[styles.header, { backgroundColor: styleContext.colors?.primary || '#5a45d4' }]}>
                <Text style={styles.headerText}>{title}</Text>
            </View>
            <View style={styles.cardContent}>
                {children}
            </View>
        </View>
    );

    const renderPicker = (label, selectedValue, items, targetType) => {
        // Ensure values are comparable
        const currentItem = items.find(i => String(i.value) === String(selectedValue));
        const displayLabel = currentItem ? currentItem.label : 'Select';

        return (
            <TouchableOpacity 
                style={styles.pickerButton} 
                onPress={() => openPicker(label, items, selectedValue, targetType)}
            >
                <Text style={styles.pickerText}>{displayLabel}</Text>
                <Icon name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                
                {/* Branch Selection - Only for super/tech/admin users who have access to multiple branches */}
                {(role === 'super' || role === 'tech' || role === 'admin') && grpBranches && grpBranches.length > 0 && (
                    <View>
                        {renderCard('Select a Branch', 
                            renderPicker('Select Branch', branchid, grpBranches.map(b => ({ label: b.branchname, value: b.branchid })), 'branch')
                        )}
                        {/* Refresh Branch Data - Tech Role Only */}
                        {role === 'tech' && (
                            <TouchableOpacity 
                                style={[styles.actionBtn, { backgroundColor: styleContext.colors?.primary || '#5a45d4', marginBottom: 15 }]} 
                                onPress={() => {
                                    if (coreContext.fetchAllBranches) {
                                        setLoading(true);
                                        // Wrap in try/catch or promise if possible, but fetchAllBranches is void in context currently.
                                        // We'll just call it. It has its own toast.
                                        coreContext.fetchAllBranches();
                                        setTimeout(() => setLoading(false), 2000); // Fake loading for UX as context function is void
                                    } else {
                                        Toast.show({ type: 'error', text1: 'Error', text2: 'Function not available' });
                                    }
                                }}
                            >
                                <Text style={styles.actionBtnText}>Refresh Branch Data</Text>
                                <Icon name="refresh" size={24} color="#fff" style={{ marginLeft: 10 }} />
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                {/* Student Record Editable */}
                {renderCard('Student Record Editable',
                    renderPicker('Student Record Editable', studentRecordEditable, [
                        { label: 'Yes', value: 'yes' },
                        { label: 'No', value: 'no' }
                    ], 'studentRec')
                )}

                {/* Student Photo Editable */}
                {renderCard('Student Photo Editable',
                    renderPicker('Student Photo Editable', studentPhotoEditable, [
                        { label: 'Yes', value: 'yes' },
                        { label: 'No', value: 'no' }
                    ], 'studentPhoto')
                )}

                {/* Sort Students */}
                {renderCard('Sort Students By', 
                    renderPicker('Sort Students By', sortstudentsby, [
                        { label: 'Sort By', value: '' },
                        { label: 'Roll', value: 'roll' },
                        { label: 'Enrollment', value: 'enroll' },
                        { label: 'Name', value: 'name' }
                    ], 'sort')
                )}

                {/* Default Attendance Status */}
                {renderCard('Allow default status (Present) in Mark Attendance', 
                    renderPicker('Default Attendance Status', defaultAttendanceStatus, [
                        { label: 'Yes', value: 'yes' },
                        { label: 'No', value: 'no' }
                    ], 'defaultAtt')
                )}

                {/* Deny Wifi Attendance */}
                {renderCard('Deny Wifi Attendance', 
                    renderPicker('Wifi Attendance', wifiAttendance, [
                        { label: 'Yes', value: 'yes' },
                        { label: 'No', value: 'no' }
                    ], 'wifi')
                )}

                {/* Manual Attendance */}
                {renderCard('Allow Manual Attendance', 
                    <View>
                        {renderPicker('Manual Attendance', manualAttendance, [
                            { label: 'Yes', value: 'yes' },
                            { label: 'No', value: 'no' }
                        ], 'manual')}
                        {manualAttendance === 'yes' && (
                            <View style={{ marginTop: 10 }}>
                                <Text style={styles.subLabel}>For Staff:</Text>
                                {renderPicker('Manual Attendance Staff', manualAttendanceStaff, [
                                    { label: 'All Staffs', value: 'all' },
                                    { label: 'Selected Staffs', value: 'selected' }
                                ], 'manualStaff')}
                            </View>
                        )}
                    </View>
                )}

                {/* Show Salary in App */}
                {renderCard('Show Salary in App', 
                    renderPicker('Salary in App', salaryInApp, [
                        { label: 'Yes', value: 'yes' },
                        { label: 'No', value: 'no' }
                    ], 'salary')
                )}

                {/* Show Class Teacher in App */}
                {renderCard('Show Class Teacher in App', 
                    renderPicker('Class Teacher in App', classTeacherInApp, [
                        { label: 'Yes', value: 'yes' },
                        { label: 'No', value: 'no' }
                    ], 'classTeacher')
                )}

                {/* Defaulter Call Threshold */}
                {renderCard("Defaulter's Phone Call Threshold Amount (Rs.)", 
                    <View style={styles.inputRow}>
                        <TextInput 
                            style={styles.input}
                            placeholder="Enter Amount"
                            value={tAmount}
                            onChangeText={setTAmount}
                            keyboardType="numeric"
                        />
                        <TouchableOpacity style={styles.saveBtn} onPress={saveThreshold}>
                            <Text style={styles.saveBtnText}>Save</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Defaulter Call Month */}
                {renderCard("Defaulter's Phone Call Month", 
                    renderPicker('Fee Defaulter Month', nom, [
                        { label: 'Till Month', value: '' },
                        ...months.map(m => ({ label: m.name, value: m.id }))
                    ], 'feeMonth')
                )}

                {/* Manage Admin Tabs Button */}
                {(role === 'super' || role === 'tech' || role === 'admin') && (
                <TouchableOpacity 
                    style={[styles.actionBtn, { backgroundColor: styleContext.colors?.primary || '#5a45d4' }]}
                    onPress={() => navigation.navigate('ManageAdminTabsScreen')}
                >
                    <Text style={styles.actionBtnText}>Manage Admin Tabs</Text>
                    <Icon name="tab" size={24} color="#fff" style={{ marginLeft: 10 }} />
                </TouchableOpacity>
                )}

                {/* Wi-Fi Settings Button */}
                {(role === 'super' || role === 'tech') && (
                <TouchableOpacity 
                    style={[styles.actionBtn, { backgroundColor: styleContext.colors?.primary || '#5a45d4', marginTop: 10 }]}
                    onPress={() => navigation.navigate('WifiSettingsScreen')}
                >
                    <Text style={styles.actionBtnText}>Wi-Fi Settings</Text>
                    <Icon name="wifi" size={24} color="#fff" style={{ marginLeft: 10 }} />
                </TouchableOpacity>
                )}

                <View style={{ height: 20 }} />
            </ScrollView>
            
            <CustomPickerModal
                visible={pickerVisible}
                title={pickerConfig.title}
                data={pickerConfig.data}
                selectedValue={pickerSelectedValue}
                onSelect={(val) => setPickerSelectedValue(val)}
                onConfirm={onPickerConfirm}
                onClose={() => setPickerVisible(false)}
            />

            {loading && (
                <View style={styles.loader}>
                    <ActivityIndicator size="large" color={styleContext.colors?.primary || '#5a45d4'} />
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    scrollContent: {
        padding: 10,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 8,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#ddd',
        overflow: 'hidden',
        elevation: 2,
    },
    header: {
        padding: 10,
        justifyContent: 'center',
    },
    headerText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    cardContent: {
        padding: 15,
    },
    pickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 12,
        backgroundColor: '#f9f9f9',
    },
    pickerText: {
        color: '#333',
        fontSize: 16,
    },
    subLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 5,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 10,
        height: 50,
        backgroundColor: '#f9f9f9',
    },
    saveBtn: {
        marginLeft: 10,
        backgroundColor: '#28a745',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 5,
    },
    saveBtnText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    loader: {
        position: 'absolute',
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0,
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: 'rgba(255,255,255,0.7)'
    },
    actionBtn: {
        padding: 15,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 2,
    },
    actionBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    }
});
