import React, { useState, useEffect, useContext } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// import { Picker } from '@react-native-picker/picker'; // Removed
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import axios from 'axios';
import { CoreContext } from '../context/CoreContext';
import { StyleContext } from '../context/StyleContext';
import CustomPickerModal from '../components/CustomPickerModal';

export default function SalaryDetailsScreen({ route, navigation }) {
    const coreContext = useContext(CoreContext);
    const styleContext = useContext(StyleContext);
    const { branchid } = coreContext;
    const { staff } = route.params || {};

    const [loading, setLoading] = useState(false);
    const [details, setDetails] = useState({});
    const [selectedMonth, setSelectedMonth] = useState('');
    
    // Custom Picker State
    const [pickerVisible, setPickerVisible] = useState(false);
    const [pickerTitle, setPickerTitle] = useState('');
    const [pickerData, setPickerData] = useState([]);
    const [pickerSelectedValue, setPickerSelectedValue] = useState('');
    
    useEffect(() => {
        setSelectedMonth(coreContext.cmo + '');
        getSalaryDetails(coreContext.cmo);
    }, []);

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

    const getSalaryDetails = (mth) => {
        const fetchId = staff.empid;
        // console.log('Staff:', staff, 'FetchId:', fetchId, 'month:', mth);
        if (!staff || !fetchId) {
            Alert.alert('Error', 'Invalid Staff ID');
            return;
        }

        setLoading(true);
        
        axios.get('/month-salary-details', { 
            params: { 
                empid: fetchId, 
                month: parseInt(mth), 
                branchid: coreContext.branchid, 
                owner: coreContext.phone 
            } 
        }).then(response => {
            setLoading(false);
            if(response.data && response.data.array) {
                setDetails(response.data.array);
            } else {
                setDetails({}); 
                Alert.alert('Info', 'No salary details found for this month.'); 
            }
        }).catch(err => {
            setLoading(false);
            Alert.alert('Error', 'Failed to fetch details: ' + (err.message || 'Network Error'));
        });
    };

    const handleMonthSelect = (val) => {
        setSelectedMonth(val);
        setPickerVisible(false);
        getSalaryDetails(val);
    };

    const renderDetailRow = (label, value) => (
        <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: styleContext.textDecorationColor || '#555' }]}>{label}</Text>
            <Text style={[styles.detailValue, { color: styleContext.textColor || '#000' }]}>{value || '--'}</Text>
        </View>
    );

    return (
        <SafeAreaView style={styleContext.background} edges={['bottom', 'left', 'right']}>
             {/* Modal */}
             <CustomPickerModal
                visible={pickerVisible}
                title="Select Month"
                data={months}
                selectedValue={pickerSelectedValue}
                onSelect={setPickerSelectedValue}
                onClose={() => setPickerVisible(false)}
                onConfirm={() => handleMonthSelect(pickerSelectedValue)}
            />

            <ScrollView contentContainerStyle={{ padding: 16 }}>
                
                <View style={[styleContext.card, { padding: 0, overflow: 'hidden' }]}>
                    <View style={{ backgroundColor: styleContext.colors?.primary || '#5a45d4', padding: 15 }}>
                         <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>
                            {staff.name || `${staff.fname || ''} ${staff.lname || ''}`} ({staff.empid})
                         </Text>
                    </View>
                    
                    <View style={{ padding: 15 }}>
                        <Text style={{ fontSize: 16, marginBottom: 8, color: '#666' }}>Select Month:</Text>

                        <TouchableOpacity 
                            style={styleContext.whitePickerButton} 
                            onPress={() => {
                                setPickerSelectedValue(selectedMonth);
                                setPickerVisible(true);
                            }}
                        >
                            <Text style={{ fontSize: 16, color: selectedMonth ? '#333' : '#666' }}>
                                {selectedMonth ? months.find(m => m.value === selectedMonth)?.label : 'Select Month'}
                            </Text>
                            <Icon name="chevron-down" size={24} color="#666" />
                        </TouchableOpacity>
                        
                        {loading && <ActivityIndicator size="large" color={styleContext.primaryColor} style={{ marginVertical: 20 }} />}
                        
                        {!loading && details && (
                            <View style={{ marginTop: 20 }}>
                                {renderDetailRow("Working Days :", details.workingDays)}
                                {renderDetailRow("LWP :", details.lwp)}
                                {renderDetailRow("Gross Salary :", details.total ? `Rs. ${details.total}` : '')}
                                {renderDetailRow("PF :", details.pf ? `Rs. ${details.pf}` : '')}
                                {renderDetailRow("ESI :", details.esi ? `Rs. ${details.esi}` : '')}
                                <View style={{ height: 1, backgroundColor: '#eee', marginVertical: 10 }} />
                                {renderDetailRow("Net Salary :", details.net ? `Rs. ${details.net}` : '')}
                            </View>
                        )}
                    </View>
                </View>

                {!loading && details && (
                    <View style={[styleContext.card, { marginTop: 16 }]}>
                         <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 15, color: styleContext.titleColor }}>
                             Bank Details
                         </Text>
                         {renderDetailRow("Bank Account No :", details.accountNo)}
                         {renderDetailRow("PF Account No :", details.pfNo)}
                         {renderDetailRow("ESIC Account No :", details.esisNo)}
                    </View>
                )}

                <TouchableOpacity 
                    style={[styles.actionBtn, { backgroundColor: '#D33A2C', marginTop: 20 }]}
                    onPress={() => navigation.navigate('AdvancePaymentScreen', { empid: staff.empid })}
                >
                    <Text style={styles.btnText}>Advance Payments</Text>
                </TouchableOpacity>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0'
    },
    detailLabel: {
        fontSize: 16,
        fontWeight: '500'
    },
    detailValue: {
        fontSize: 16,
        fontWeight: 'bold'
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
    },
});
