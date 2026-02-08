import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import { CoreContext } from '../context/CoreContext';
import { StyleContext } from '../context/StyleContext';
import CustomPickerModal from '../components/CustomPickerModal';
import { useNavigation } from '@react-navigation/native';
import OnlineExamMenu from '../components/OnlineExamMenu';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

const OnlineExamSettingsScreen = () => {
    const navigation = useNavigation();
    const { branchid, phone, schoolData, getSchoolData } = useContext(CoreContext);
    const { primary, background, textColor, secondary } = useContext(StyleContext);

    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    
    // Data Sources
    const [examDefinitions, setExamDefinitions] = useState([]);
    
    // Form State
    const [selectedExam, setSelectedExam] = useState(schoolData?.examid || '');
    const [examType, setExamType] = useState(schoolData?.examtype || '');
    const [feeMonth, setFeeMonth] = useState(schoolData?.nom ? Number.parseInt(schoolData.nom) : '');

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

    const months = [
        { id: 0, name: 'No Restriction' },
        { id: 1, name: 'April' },
        { id: 2, name: 'May' },
        { id: 3, name: 'June' },
        { id: 4, name: 'July' },
        { id: 5, name: 'August' },
        { id: 6, name: 'September' },
        { id: 7, name: 'October' },
        { id: 8, name: 'November' },
        { id: 9, name: 'December' },
        { id: 10, name: 'January' },
        { id: 11, name: 'February' },
        { id: 12, name: 'March' },
    ];

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

    useEffect(() => {
        fetchExams();
    }, []);

    // Effect to update local state if context updates (though less likely to be realtime)
    useEffect(() => {
         if(schoolData) {
             setSelectedExam(schoolData.examid || '');
             setExamType(schoolData.examtype || '');
             setFeeMonth(schoolData.nom ? Number.parseInt(schoolData.nom) : '');
         }
    }, [schoolData]);


    const fetchExams = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/getallexams', { params: { branchid } });
            setExamDefinitions(response.data.rows || []);
        } catch (error) {
            console.error(error);
            Toast.show({ type: 'error', text1: 'Failed to load exams' });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async () => {
        if (!selectedExam) {
            Toast.show({ type: 'error', text1: 'Please select an Exam' });
            return;
        }
        
        // Find selected exam object to check type
        const examObj = examDefinitions.find(e => e.id === selectedExam);
        if (examObj && examObj.type1 !== 'self' && !examType) {
             Toast.show({ type: 'error', text1: 'Please select an Exam Type' });
             return;
        }

        setSubmitting(true);
        try {
            const payload = {
                exam: selectedExam,
                etype: examType,
                nom: feeMonth,
                branchid
            };

            await axios.post('/set-current-exam', payload);
            await getSchoolData(); // Refresh context
            Toast.show({ type: 'success', text1: 'Exam settings updated successfully' });
            navigation.goBack();
        } catch (error) {
            console.error(error);
            Toast.show({ type: 'error', text1: 'Failed to update settings' });
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

    return (
        <ScrollView style={[styles.container, { backgroundColor: background?.backgroundColor }]}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Online Exam Settings</Text>
            </View>

            <View style={styles.content}>
                <Text style={styles.sectionTitle}>Question Paper Settings</Text>
                
                <Text style={styles.label}>Select Exam</Text>
                <TouchableOpacity 
                    style={styles.pickerTrigger} 
                    onPress={() => openPicker(
                        'Select Exam', 
                        examDefinitions.map(e => ({ label: e.examname, value: e.id })), 
                        selectedExam, 
                        setSelectedExam
                    )}
                >
                    <Text style={styles.pickerText}>
                        {examDefinitions.find(e => e.id === selectedExam)?.examname || 'Select Exam'}
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

                <Text style={styles.label}>Fee Paid Till Month</Text>
                 <TouchableOpacity 
                    style={styles.pickerTrigger} 
                    onPress={() => openPicker(
                        'Select Month', 
                        months.map(m => ({ label: m.name, value: m.id })), 
                        feeMonth, 
                        setFeeMonth
                    )}
                >
                    <Text style={styles.pickerText}>
                        {months.find(m => m.id === feeMonth)?.name || 'Select Month'}
                    </Text>
                    <Text style={{ fontSize: 18, color: '#666' }}>▼</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.saveBtn, { backgroundColor: primary?.backgroundColor || '#6200ee' }]} 
                    onPress={handleUpdate}
                    disabled={submitting}
                >
                    {submitting ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.saveBtnText}>Update Settings</Text>
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
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        backgroundColor: '#fff', 
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    content: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        color: '#444',
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 5,
        color: '#444',
        marginTop: 10,
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
    saveBtn: {
        marginTop: 30,
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
    },
    saveBtnText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default OnlineExamSettingsScreen;
