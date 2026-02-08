import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import axios from 'axios';
import { CoreContext } from '../context/CoreContext';
import { StyleContext } from '../context/StyleContext';
import { Card } from 'react-native-elements';
import Toast from 'react-native-toast-message';
import CustomPickerModal from '../components/CustomPickerModal';

export default function ManageCounterScreen({ navigation }) {
    const coreContext = useContext(CoreContext);
    const styleContext = useContext(StyleContext);
    const { branchid } = coreContext;

    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Schedule State
    const [ohour, setOhour] = useState('');
    const [ominute, setOminute] = useState('');
    const [oampm, setOAmpm] = useState('');

    const [hour, setHour] = useState('');
    const [minute, setMinute] = useState('');
    const [ampm, setAmpm] = useState(''); // Close AM/PM

    useEffect(() => {
        fetchSchedule();
    }, []);

    const fetchSchedule = () => {
        setLoading(true);
        axios.get('/getcountercloseshedule', { params: { branchid } })
            .then(response => {
                const schedule = response.data.schedule;
                if (schedule) {
                    setOhour(schedule.ohour || '');
                    setOminute(schedule.ominute || '');
                    setOAmpm(schedule.oampm || '');
                    setHour(schedule.hour || '');
                    setMinute(schedule.minute || '');
                    setAmpm(schedule.ampm || '');
                }
                setLoading(false);
            })
            .catch(err => {
                console.log(err);
                setLoading(false);
                Toast.show({ type: 'error', text1: 'Failed to fetch schedule' });
            });
    };

    const handleSubmit = () => {
        if (!ohour || !ominute || !oampm || !hour || !minute || !ampm) {
            Alert.alert('Error', 'All fields are mandatory!');
            return;
        }

        setSubmitting(true);
        axios.post('/setcountercloseshedule', {
            hour,
            minute,
            ampm, // Close AM/PM
            ohour,
            ominute,
            oampm,
            branchid
        }).then(() => {
            setSubmitting(false);
            Toast.show({ type: 'success', text1: 'Schedule updated successfully' });
        }).catch(err => {
            console.log(err);
            setSubmitting(false);
            Toast.show({ type: 'error', text1: 'Failed to update schedule' });
        });
    };

    const handleClear = () => {
        setSubmitting(true);
        // Legacy sends empty strings to clear
        axios.post('/setcountercloseshedule', {
            hour: '',
            minute: '',
            ampm: '',
            branchid
        }).then(() => {
            setSubmitting(false);
            setOhour('');
            setOminute('');
            setOAmpm('');
            setHour('');
            setMinute('');
            setAmpm('');
            Toast.show({ type: 'success', text1: 'Schedule cleared successfully' });
        }).catch(err => {
            console.log(err);
            setSubmitting(false);
            Toast.show({ type: 'error', text1: 'Failed to clear schedule' });
        });
    };


    // Picker Modal State
    const [pickerVisible, setPickerVisible] = useState(false);
    const [pickerTitle, setPickerTitle] = useState('');
    const [pickerData, setPickerData] = useState([]);
    const [pickerValue, setPickerValue] = useState('');
    const [onPickerSelect, setOnPickerSelect] = useState(() => { });

    const openPicker = (title, items, currentValue, onSelect) => {
        setPickerTitle(title);
        // Transform items to object array if they are strings
        const data = items.map(item => ({ label: item, value: item }));
        setPickerData(data);
        setPickerValue(currentValue);
        
        // This will be called when user taps "Confirm"
        setOnPickerSelect(() => (val) => {
             onSelect(val);
             setPickerVisible(false);
        });
        
        setPickerVisible(true);
    };

    const renderPicker = (selectedValue, onValueChange, items, label) => (
        <View style={{ flex: 1, marginHorizontal: 2 }}>
            <TouchableOpacity
                onPress={() => openPicker(label, items, selectedValue, onValueChange)}
                style={{
                    backgroundColor: '#fff',
                    borderWidth: 1,
                    borderColor: '#ddd',
                    borderRadius: 8,
                    paddingHorizontal: 10,
                    paddingVertical: 12,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}
            >
                <Text style={{ fontSize: 14, color: selectedValue ? '#000' : '#999' }}>
                    {selectedValue ? selectedValue : label}
                </Text>
                <Icon name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>
        </View>
    );

    const hours = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
    const minutes = ['00', '10', '20', '30', '40', '50'];
    const ampms = ['AM', 'PM'];

    if (loading) {
        return (
            <SafeAreaView style={[styleContext.background, { flex: 1, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={styleContext.primaryColor || '#5a45d4'} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styleContext.background, { flex: 1 }]} edges={['bottom', 'left', 'right']}>
             <ScrollView contentContainerStyle={{ padding: 10 }}>
                
                {/* Scheduled Open Card */}
                <Card containerStyle={{ borderRadius: 10, padding: 15 }}>
                    <Card.Title>Scheduled Open</Card.Title>
                    <Card.Divider />
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        {renderPicker(ohour, setOhour, hours, 'Hr')}
                        {renderPicker(ominute, setOminute, minutes, 'Min')}
                        {renderPicker(oampm, setOAmpm, ampms, 'AM/PM')}
                    </View>
                </Card>

                {/* Scheduled Close Card */}
                <Card containerStyle={{ borderRadius: 10, padding: 15, marginTop: 15 }}>
                    <Card.Title>Scheduled Close</Card.Title>
                    <Card.Divider />
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        {renderPicker(hour, setHour, hours, 'Hr')}
                        {renderPicker(minute, setMinute, minutes, 'Min')}
                        {renderPicker(ampm, setAmpm, ampms, 'AM/PM')}
                    </View>
                </Card>

                <View style={{ marginTop: 30, paddingHorizontal: 10 }}>
                    <TouchableOpacity
                        onPress={handleSubmit}
                        disabled={submitting}
                        style={{
                            backgroundColor: styleContext.primaryColor || '#5a45d4',
                            padding: 15,
                            borderRadius: 10,
                            alignItems: 'center',
                            marginBottom: 15
                        }}
                    >
                         {submitting ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>Submit</Text>
                        )}
                    </TouchableOpacity>

                     <TouchableOpacity
                        onPress={handleClear}
                         disabled={submitting}
                        style={{
                            backgroundColor: '#d32f2f', // Red for clear
                            padding: 15,
                            borderRadius: 10,
                            alignItems: 'center'
                        }}
                    >
                         <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>Clear Schedule</Text>
                    </TouchableOpacity>
                </View>

             </ScrollView>
            <CustomPickerModal
                visible={pickerVisible}
                title={pickerTitle}
                data={pickerData}
                selectedValue={pickerValue}
                onSelect={(val) => setPickerValue(val)}
                onClose={() => setPickerVisible(false)}
                onConfirm={() => onPickerSelect(pickerValue)}
            />
        </SafeAreaView>
    );
}
