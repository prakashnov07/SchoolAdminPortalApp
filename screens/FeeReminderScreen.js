
import React, { useState, useEffect, useContext } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput, StyleSheet } from 'react-native';
import { Card, Button, CheckBox } from 'react-native-elements';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import Toast from 'react-native-toast-message';

import { CoreContext } from '../context/CoreContext';
import { StyleContext } from '../context/StyleContext';
import CustomPickerModal from '../components/CustomPickerModal';

export default function FeeReminderScreen({ navigation }) {
    const coreContext = useContext(CoreContext);
    const styleContext = useContext(StyleContext);
    const { branchid, phone } = coreContext;

    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [deleting, setDeleting] = useState(false);
    
    // Form State
    const [classId, setClassId] = useState('');
    const [classLabel, setClassLabel] = useState('All Class');
    const [classes, setClasses] = useState([]);

    const [month, setMonth] = useState(coreContext.cmo || '');
    const [monthLabel, setMonthLabel] = useState('Till Month');

    const [comment, setComment] = useState('');

    // Picker State
    const [pickerVisible, setPickerVisible] = useState(false);
    const [pickerTitle, setPickerTitle] = useState('');
    const [pickerData, setPickerData] = useState([]);
    const [pickerValue, setPickerValue] = useState('');
    const [onPickerConfirm, setOnPickerConfirm] = useState(() => {});

    const months = [
        { id: '1', name: 'April' },
        { id: '2', name: 'May' },
        { id: '3', name: 'June' },
        { id: '4', name: 'July' },
        { id: '5', name: 'August' },
        { id: '6', name: 'September' },
        { id: '7', name: 'October' },
        { id: '8', name: 'November' },
        { id: '9', name: 'December' },
        { id: '10', name: 'January' },
        { id: '11', name: 'February' },
        { id: '12', name: 'March' },
    ];

    useEffect(() => {
        fetchClasses();
        if (coreContext.cmo) {
            const m = months.find(item => item.id == coreContext.cmo);
            if (m) {
                setMonth(m.id);
                setMonthLabel(m.name);
            }
        }
    }, []);

    const fetchClasses = () => {
        setLoading(true);
        axios.get('/getallclasses', { params: { branchid } })
            .then(res => {
                const fetchedClasses = res.data.rows.map(c => ({
                    label: c.classname,
                    value: c.classid
                }));
                setClasses(fetchedClasses);
                setLoading(false);
            })
            .catch(err => {
                console.log(err);
                setLoading(false);
                Toast.show({ type: 'error', text1: 'Failed to fetch classes' });
            });
    };

    const openClassPicker = () => {
        setPickerTitle('Select Class');
        const data = [{ label: 'All Class', value: '' }, ...classes];
        setPickerData(data);
        setPickerValue(classId);
        setOnPickerConfirm(() => (val) => {
            setClassId(val);
            const selected = data.find(d => d.value === val);
            setClassLabel(selected ? selected.label : 'Select Class');
            setPickerVisible(false);
        });
        setPickerVisible(true);
    };

    const openMonthPicker = () => {
        setPickerTitle('Select Month');
        const data = months.map(m => ({ label: m.name, value: m.id }));
        setPickerData(data);
        setPickerValue(month);
        setOnPickerConfirm(() => (val) => {
            setMonth(val);
            const selected = data.find(m => m.value === val);
            setMonthLabel(selected ? selected.label : 'Select Month');
            setPickerVisible(false);
        });
        setPickerVisible(true);
    };

    const sendFeeReminder = (dataoffset = 0) => {
        if (dataoffset === 0) setSending(true);

        axios.post('/sendfeereminder', {
            comment,
            owner: phone,
            month,
            classid: classId,
            branchid,
            dataoffset
        })
        .then(response => {
             const { end, endReached } = response.data;
             if (endReached === 'no') {
                 Toast.show({ type: 'info', text1: `Sent to ${end} students. Continuing...` });
                 sendFeeReminder(end);
             } else {
                 setSending(false);
                 Toast.show({ type: 'success', text1: 'Reminders sent successfully!' });
             }
        })
        .catch(err => {
            console.log(err);
            setSending(false);
            Toast.show({ type: 'error', text1: 'Failed to send reminders' });
        });
    };

    const handleSendPress = () => {
        Alert.alert(
            'Confirm',
            'Messages for Pending fees will be sent to all the concerned students. Are you sure?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'OK', onPress: () => sendFeeReminder(0) }
            ]
        );
    };

    const handleDeletePress = () => {
        Alert.alert(
            'Confirm',
            'Are you sure you want to delete all fee reminders?',
            [
                 { text: 'Cancel', style: 'cancel' },
                 { text: 'Delete', style: 'destructive', onPress: performDelete }
            ]
        );
    };

    const performDelete = () => {
        setDeleting(true);
        axios.post('/deletefeereminders', { branchid, owner: phone })
        .then(() => {
            setDeleting(false);
            Alert.alert('Success', 'Messages successfully deleted.');
        })
        .catch(err => {
             console.log(err);
             setDeleting(false);
             Toast.show({ type: 'error', text1: 'Failed to delete reminders' });
        });
    };

    return (
        <SafeAreaView style={[styleContext.background, { flex: 1 }]} edges={['bottom', 'left', 'right']}>
            <ScrollView contentContainerStyle={{ padding: 10 }}>
                <Card containerStyle={{ borderRadius: 10, padding: 15 }}>
                    <Card.Title>Send Fee Reminders</Card.Title>
                    <Card.Divider />

                    <Text style={styles.label}>Class</Text>
                    <TouchableOpacity onPress={openClassPicker} style={styles.pickerButton}>
                        <Text style={{ fontSize: 16 }}>{classLabel}</Text>
                    </TouchableOpacity>

                    <Text style={styles.label}>Till Month</Text>
                    <TouchableOpacity onPress={openMonthPicker} style={styles.pickerButton}>
                         <Text style={{ fontSize: 16 }}>{monthLabel}</Text>
                    </TouchableOpacity>

                    <Text style={styles.label}>Message (Optional)</Text>
                    <TextInput
                        multiline
                        numberOfLines={4}
                        style={styles.input}
                        placeholder="Enter Message"
                        placeholderTextColor="#999"
                        value={comment}
                        onChangeText={setComment}
                        textAlignVertical="top"
                    />

                    <Button
                        title="Send Fee Reminders"
                        onPress={handleSendPress}
                        loading={sending}
                        loadingProps={{ size: 'small', color: 'white' }}
                        disabled={sending}
                        buttonStyle={{ backgroundColor: styleContext.primaryColor || '#5a45d4', marginTop: 15, borderRadius: 8 }}
                        disabledStyle={{ backgroundColor: '#aaa' }}
                    />

                    <View style={{ marginTop: 30 }}>
                        <Button
                            title="Delete All Fee Reminders"
                            onPress={handleDeletePress}
                            loading={deleting}
                            loadingProps={{ size: 'small', color: 'white' }}
                            disabled={deleting}
                            buttonStyle={{ backgroundColor: '#d32f2f', borderRadius: 8 }}
                             disabledStyle={{ backgroundColor: '#faa' }}
                        />
                    </View>
                </Card>
            </ScrollView>

            <CustomPickerModal 
                visible={pickerVisible}
                title={pickerTitle}
                data={pickerData}
                selectedValue={pickerValue}
                onSelect={setPickerValue}
                onClose={() => setPickerVisible(false)}
                onConfirm={() => onPickerConfirm(pickerValue)}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    label: {
        fontWeight: 'bold',
        color: '#555',
        marginBottom: 5,
        marginTop: 10,
    },
    pickerButton: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        backgroundColor: '#f9f9f9',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 10,
        backgroundColor: '#fff',
        minHeight: 100
    }
});
