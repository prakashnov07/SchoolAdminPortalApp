import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Card, Button, Icon } from 'react-native-elements';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import Toast from 'react-native-toast-message';

import { CoreContext } from '../context/CoreContext';
import { StyleContext } from '../context/StyleContext';
import CustomPickerModal from '../components/CustomPickerModal';

// Local CardSection wrapper to simulate legacy component if needed, 
// or simply use View with padding.
const CardSection = ({ children }) => (
    <View style={{ marginBottom: 10 }}>{children}</View>
);

export default function PublishResultScreen({ navigation }) {
    const coreContext = useContext(CoreContext);
    const styleContext = useContext(StyleContext);
    const { branchid, phone } = coreContext;

    const [loading, setLoading] = useState(false);
    const [resultDetails, setResultDetails] = useState([]);
    const [allExams, setAllExams] = useState([]);
    
    // Form State
    const [selectedExam, setSelectedExam] = useState('');
    const [selectedExamLabel, setSelectedExamLabel] = useState('Select an Exam');
    
    const [selectedMonth, setSelectedMonth] = useState('');
    const [selectedMonthLabel, setSelectedMonthLabel] = useState('Fee Paid Till Month');
    
    const [ignoreAmount, setIgnoreAmount] = useState('');
    const [publishing, setPublishing] = useState(false);

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
        fetchResultDetails();
        fetchAllExams();
    }, []);

    const fetchResultDetails = () => {
        setLoading(true);
        axios.get('/getallresultdetails', { params: { branchid } })
            .then(res => {
                setResultDetails(res.data.rows || []);
                setLoading(false);
            })
            .catch(err => {
                console.log(err);
                setLoading(false);
                // Toast.show({ type: 'error', text1: 'Failed to fetch result details' });
            });
    };

    const fetchAllExams = () => {
        axios.get('/getallexams', { params: { branchid } })
            .then(res => {
                setAllExams(res.data.rows || []);
            })
            .catch(err => console.log(err));
    };

    const handlePublish = () => {
        if (!selectedExam) {
            Toast.show({ type: 'error', text1: 'Please select an Exam' });
            return;
        }

        setPublishing(true);
        // Legacy: publish-result(name, nom, amount)
        axios.post('/publishresult', {
            name: selectedExam,
            nom: selectedMonth,
            amount: ignoreAmount || 0,
            branchid,
            owner: phone
        })
        .then(() => {
            setPublishing(false);
            Toast.show({ type: 'success', text1: 'Result Published Successfully' });
            fetchResultDetails();
            // Reset Form (Optional)
            setSelectedExam('');
            setSelectedExamLabel('Select an Exam');
            setSelectedMonth('');
            setSelectedMonthLabel('Fee Paid Till Month');
            setIgnoreAmount('');
        })
        .catch(err => {
            console.log(err);
            setPublishing(false);
            Toast.show({ type: 'error', text1: 'Failed to publish result' });
        });
    };

    const handleUnpublish = (id) => {
        Alert.alert(
            'Confirm',
            'Are you sure you want to unpublish this result?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Unpublish',
                    style: 'destructive',
                    onPress: () => {
                        axios.post('/unpublishresult', { id, branchid })
                            .then(() => {
                                Toast.show({ type: 'success', text1: 'Result Unpublished' });
                                fetchResultDetails();
                            })
                            .catch(err => {
                                console.log(err);
                                Toast.show({ type: 'error', text1: 'Failed to unpublish' });
                            });
                    }
                }
            ]
        );
    };

    const openExamPicker = () => {
        setPickerTitle('Select Exam');
        const examList = allExams.map(e => ({ label: e.examname, value: e.id }));
        const staticExams = [
            { label: 'Half Yearly Exam', value: 'hly' },
            { label: 'Yearly Exam', value: 'yly' }
        ];
        // Combine dynamic and static choices. Note: static might duplicate if they exist in DB?
        // Legacy code merges them.
        setPickerData([...examList, ...staticExams]);
        setPickerValue(selectedExam);
        setOnPickerConfirm(() => (val) => {
            setSelectedExam(val);
            const found = [...examList, ...staticExams].find(e => e.value == val);
            setSelectedExamLabel(found ? found.label : 'Select an Exam');
            setPickerVisible(false);
        });
        setPickerVisible(true);
    };

    const openMonthPicker = () => {
        setPickerTitle('Fee Paid Till Month');
        const data = months.map(m => ({ label: m.name, value: m.id }));
        setPickerData(data);
        setPickerValue(selectedMonth);
        setOnPickerConfirm(() => (val) => {
            setSelectedMonth(val);
            const found = months.find(m => m.id == val);
            setSelectedMonthLabel(found ? found.name : 'Fee Paid Till Month');
            setPickerVisible(false);
        });
        setPickerVisible(true);
    };

    const renderPublishedItem = (item) => {
        // Legacy logic: details.nom ? this.state.months[details.nom - 1].name : '--'
        // Assuming item.nom is 1-based index string or number
        const monthIndex = parseInt(item.nom) - 1;
        const monthName = (monthIndex >= 0 && monthIndex < months.length) ? months[monthIndex].name : '--';
        
        const description = `${item.examname} result has been published on ${item.dat}. Students having paid their fees till the month of ${monthName} with ignore amount Rs. ${item.amount} can access their marksheet.`;

        return (
            <Card containerStyle={styles.card}>
                <CardSection>
                     <Text style={styles.descriptionText}>{description}</Text>
                </CardSection>
                <CardSection>
                    <Button
                        title="UnPublish"
                        type="outline"
                        onPress={() => handleUnpublish(item.id)}
                        buttonStyle={{ marginTop: 10, borderColor: '#d32f2f' }}
                        titleStyle={{ color: '#d32f2f' }}
                    />
                </CardSection>
            </Card>
        );
    };

    return (
        <SafeAreaView style={[styleContext.background, { flex: 1 }]} edges={['bottom', 'left', 'right']}>
             <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
                style={{ flex: 1 }}
             >
                <ScrollView 
                    contentContainerStyle={{ padding: 10, paddingBottom: 100 }} 
                    keyboardShouldPersistTaps="handled"
                >
                    {loading && <ActivityIndicator size="large" color={styleContext.primaryColor} />}
                    
                    {/* Published Results List */}
                    {resultDetails.map(item => (
                        <View key={item.id}>
                            {renderPublishedItem(item)}
                        </View>
                    ))}

                    <Card containerStyle={styles.card}>
                        <Card.Title>Publish New Result</Card.Title>
                        <Card.Divider />
                        
                        <TouchableOpacity onPress={openExamPicker} style={styles.pickerButton}>
                            <Text style={{ fontSize: 16 }}>{selectedExamLabel}</Text>
                            <Icon name="arrow-drop-down" type="material" color="#666" />
                        </TouchableOpacity>

                        <TouchableOpacity onPress={openMonthPicker} style={styles.pickerButton}>
                            <Text style={{ fontSize: 16 }}>{selectedMonthLabel}</Text>
                            <Icon name="arrow-drop-down" type="material" color="#666" />
                        </TouchableOpacity>

                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="Ignore Amount in Rs."
                                placeholderTextColor="#999"
                                keyboardType="number-pad"
                                value={ignoreAmount}
                                onChangeText={setIgnoreAmount}
                            />
                        </View>

                        <Button
                            title="Publish"
                            onPress={handlePublish}
                            loading={publishing}
                            buttonStyle={{ backgroundColor: styleContext.primaryColor || '#5a45d4', marginTop: 10, borderRadius: 8 }}
                        />
                    </Card>
                </ScrollView>
             </KeyboardAvoidingView>

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
    card: {
        borderRadius: 10,
        marginBottom: 10,
        padding: 15
    },
    descriptionText: {
        fontSize: 14,
        color: '#555',
        lineHeight: 20
    },
    pickerButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        backgroundColor: '#f9f9f9',
        marginBottom: 15
    },
    inputContainer: {
        marginBottom: 15
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        backgroundColor: '#fff',
        fontSize: 16
    }
});
