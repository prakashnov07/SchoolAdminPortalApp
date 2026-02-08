import React, { useState, useEffect, useContext } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Alert, TextInput, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import axios from 'axios';
import { CoreContext } from '../context/CoreContext';
import { StyleContext } from '../context/StyleContext';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

import CustomPickerModal from '../components/CustomPickerModal';

export default function AdvancePaymentScreen({ route, navigation }) {
    const coreContext = useContext(CoreContext);
    const styleContext = useContext(StyleContext);
    const { branchid, phone } = coreContext;
    const { empid } = route.params || {};

    const [loading, setLoading] = useState(false);
    const [amount, setAmount] = useState('');
    const [startMonth, setStartMonth] = useState(''); // Stores Month ID
    const [nom, setNom] = useState(''); // Stores Number of Installments
    const [records, setRecords] = useState([]);
    
    const [pickerVisible, setPickerVisible] = useState(false);
    
    const months = [
        { label: 'April', value: '1' },
        { label: 'May', value: '2' },
        { label: 'June', value: '3' },
        { label: 'July', value: '4' },
        { label: 'August', value: '5' },
        { label: 'September', value: '6' },
        { label: 'October', value: '7' },
        { label: 'November', value: '8' },
        { label: 'December', value: '9' },
        { label: 'January', value: '10' },
        { label: 'February', value: '11' },
        { label: 'March', value: '12' },
    ];

    useEffect(() => {
        fetchRecords();
    }, []);

    const fetchRecords = () => {
        setLoading(true);
        axios.get('/advance-salary-records', { 
            params: { branchid, owner: phone, empid } 
        }).then(response => {
            setLoading(false);
            setRecords(response.data.records || []);
        }).catch(err => {
            setLoading(false);
            console.log(err);
        });
    };

    const apply = () => {
        if (!amount) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Please enter loan amount' }); 
            return;
        }
        if (!startMonth) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Please select Start Month' }); 
            return;
        }
        if (!nom) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Please enter no. of installments' }); 
            return;
        }
        setLoading(true);

        axios.post('/advance-salary', { 
            branchid, 
            owner: phone, 
            amount, 
            nom, 
            month: startMonth,
            empid 
        }).then(response => {
            setLoading(false);
            if (response.data.status === 'ok') {
                Toast.show({ type: 'success', text1: 'Success', text2: 'Request submitted successfully' });
                setAmount('');
                setStartMonth('');
                setNom('');
                fetchRecords();
            } else {
                Toast.show({ type: 'error', text1: 'Error', text2: 'Request could not be submitted' });
            }
        }).catch(err => {
            setLoading(false);
            Toast.show({ type: 'error', text1: 'Error', text2: 'Network Error' });
        });
    };

    const deleteRequest = (id) => {
        setLoading(true);
        axios.post('/delete-advance-payment-request', { 
            branchid, 
            owner: phone, 
            id 
        }).then(response => {
            setLoading(false);
            if (response.data.status === 'ok') {
                Toast.show({ type: 'success', text1: 'Success', text2: 'Request deleted successfully' });
                fetchRecords();
            }
        }).catch(err => {
            setLoading(false);
            Toast.show({ type: 'error', text1: 'Error', text2: 'Network Error' });
        });
    };

    const renderItem = ({ item }) => (
        <View style={[styleContext.card, { marginTop: 10 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                 <Text style={{ fontSize: 18, fontWeight: 'bold', color: styleContext.primaryColor }}>Rs. {item.amount}</Text>
                 <Text style={{ fontSize: 12, color: '#666' }}>{item.date}</Text>
            </View>
            
            <View style={styles.detailRow}>
                <Text style={styles.label}>Repayment Start:</Text>
                <Text style={styles.value}>{item.month}</Text>
            </View>
            <View style={styles.detailRow}>
                <Text style={styles.label}>Installments:</Text>
                <Text style={styles.value}>{item.noi}</Text>
            </View>
             <View style={styles.detailRow}>
                <Text style={styles.label}>Status:</Text>
                <Text style={[styles.value, { color: item.is_settled === 'applied' ? 'orange' : 'green' }]}>
                    {item.is_settled}
                </Text>
            </View>
            
            {item.is_settled === 'applied' && (
                <TouchableOpacity 
                    style={[styles.actionBtn, { backgroundColor: '#D33A2C', marginTop: 10 }]}
                    onPress={() => deleteRequest(item.id)}
                >
                     <Text style={styles.btnText}>Cancel Request</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    return (
        <SafeAreaView style={styleContext.background} edges={['bottom', 'left', 'right']}>
             <ScrollView contentContainerStyle={{ padding: 16 }}>
                 <View style={styleContext.card}>
                     <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 15, color: styleContext.titleColor }}>Apply for Advance Payment</Text>
                     
                     <Text style={styles.inputLabel}>Advance Amount</Text>
                     <TextInput
                        style={[styleContext.input, { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, marginBottom: 15, color: '#333' }]}
                        placeholder="Enter Amount"
                        placeholderTextColor="#999"
                        keyboardType="number-pad"
                        value={amount}
                        onChangeText={setAmount}
                     />
                     
                     <Text style={styles.inputLabel}>Repayment Start Month</Text>
                     <TouchableOpacity 
                        style={[styleContext.input, { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, marginBottom: 15, justifyContent: 'center' }]}
                        onPress={() => setPickerVisible(true)}
                     >
                         <Text style={{ color: startMonth ? '#333' : '#888' }}>
                             {startMonth ? months.find(m => m.value == startMonth)?.label : 'Select Month'}
                         </Text>
                     </TouchableOpacity>

                     <CustomPickerModal
                        visible={pickerVisible}
                        title="Select Start Month"
                        data={months}
                        selectedValue={startMonth}
                        onSelect={setStartMonth}
                        onClose={() => setPickerVisible(false)}
                        onConfirm={() => setPickerVisible(false)}
                     />

                     <Text style={styles.inputLabel}>No. of Installments</Text>
                     <TextInput
                        style={[styleContext.input, { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, marginBottom: 15, color: '#333' }]}
                        placeholder="Enter no. of repayment installments"
                        placeholderTextColor="#999"
                        keyboardType="number-pad"
                        value={nom}
                        onChangeText={setNom}
                     />
                     
                    <TouchableOpacity 
                        style={[styles.actionBtn, { backgroundColor: '#D33A2C' }]}
                        onPress={apply}
                        disabled={loading}
                    >
                         {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Apply</Text>}
                    </TouchableOpacity>
                 </View>
                 
                 <Text style={{ fontSize: 16, fontWeight: 'bold', marginVertical: 15, color: '#666' }}>Past Requests</Text>
                 
                 <FlatList
                    data={records}
                    renderItem={renderItem}
                    keyExtractor={item => item.id.toString()}
                    scrollEnabled={false} // Since we are inside ScrollView
                    ListEmptyComponent={<Text style={{ textAlign: 'center', color: '#999', marginTop: 20 }}>No advance payments to show...</Text>}
                 />
             
             </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    inputLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 5,
        fontWeight: 'bold'
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8
    },
    label: {
        fontSize: 14,
        color: '#666'
    },
    value: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333'
    },
    actionBtn: {
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center'
    },
    btnText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16
    }
});
