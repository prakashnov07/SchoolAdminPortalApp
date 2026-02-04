import React, { useState, useEffect, useContext } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Image, StyleSheet, TextInput, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import axios from 'axios';
import { CoreContext } from '../context/CoreContext';
import { StyleContext } from '../context/StyleContext';
import DateTimePicker from '@react-native-community/datetimepicker'; 

// Formatting helper
const formatDate = (date) => {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
};

export default function StaffRemarksScreen({ navigation, route }) {
    const coreContext = useContext(CoreContext);
    const styleContext = useContext(StyleContext);
    const { branchid, phone } = coreContext;
    const { staff } = route.params || {};

    const [empDetails, setEmpDetails] = useState(null);
    const [remarks, setRemarks] = useState('');
    const [point, setPoint] = useState(1); // Deduction
    const [otherPoint, setOtherPoint] = useState(1); // Appraisal
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (staff) {
            fetchEmployeeDetails(staff.phone);
        }
    }, [staff]);

    const fetchEmployeeDetails = (empPhone) => {
        setLoading(true);
        axios.get('/employee-details-phone', { params: { owner: empPhone, branchid } })
            .then(response => {
                if (response.data && response.data.employee) {
                    setEmpDetails(response.data.employee);
                }
                setLoading(false);
            })
            .catch(err => {
                Alert.alert('Error', 'Failed to fetch details');
                setLoading(false);
            });
    };

    const handleDateChange = (event, selectedDate) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (selectedDate) {
            setDate(selectedDate);
        }
    };

    // Counters
    const increment = (setter, val) => setter(val + 1);
    const decrement = (setter, val) => setter(val - 1);

    const handleSubmit = () => {
        if (!remarks.trim()) { Alert.alert('Error', 'Please enter remarks'); return; }
        if (!empDetails || !empDetails.emp_id) { Alert.alert('Error', 'Employee ID missing'); return; }

        setSubmitting(true);
        const attendancedate = formatDate(date);
        
        // Payload based on legacy StaffRemarks.js
        const payload = {
            empid: empDetails.emp_id,
            remarks,
            marks: point, // Deduction
            count: otherPoint, // Appraisal
            attendancedate,
            owner: phone,
            branchid
        };

        axios.post('/add-employee-remarks', payload)
            .then(response => {
                setSubmitting(false);
                Alert.alert('Success', 'Remarks submitted successfully');
                setRemarks('');
                setPoint(1);
                setOtherPoint(1);
                
                // Legacy also sent a notification message here, we can implement that if needed or keep it simple
            })
            .catch(err => {
                setSubmitting(false);
                Alert.alert('Error', 'Failed to submit remarks');
                console.log(err);
            });
    };

    if (loading) return <ActivityIndicator size="large" color={styleContext.primaryColor} style={{ marginTop: 50 }} />;

    return (
        <SafeAreaView style={styleContext.background} edges={['bottom', 'left', 'right']}>


            <ScrollView contentContainerStyle={{ padding: 16 }}>
                
                {/* Employee summary */}
                {empDetails && (
                    <View style={[styleContext.card, { paddingVertical: 10 }]}>
                         <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center', marginRight: 16, overflow: 'hidden' }}>
                                {empDetails.photo ? (
                                    <Image source={{ uri: `https://schoolapi.siddhantait.com/${empDetails.photo}` }} style={{ width: 60, height: 60 }} />
                                ) : (
                                    <Icon name="account" size={40} color="#ccc" />
                                )}
                            </View>
                            <View>
                                <Text style={{ fontSize: 18, fontWeight: 'bold' }}>{empDetails.fname} {empDetails.lname}</Text>
                                <Text style={{ color: '#666' }}>ID: {empDetails.empid}</Text>
                            </View>
                         </View>
                    </View>
                )}

                <View style={styleContext.card}>
                     
                     {/* Date Picker */}
                     <View style={{ marginBottom: 16 }}>
                         <Text style={styleContext.label}>Date</Text>
                         <TouchableOpacity 
                            style={[styleContext.input, { justifyContent: 'center' }]}
                            onPress={() => setShowDatePicker(true)}
                         >
                             <Text style={{ fontSize: 16 }}>{formatDate(date)}</Text>
                         </TouchableOpacity>
                         {showDatePicker && (
                            <DateTimePicker
                                value={date}
                                mode="date"
                                display="default"
                                onChange={handleDateChange}
                            />
                         )}
                     </View>

                     {/* Remarks Input */}
                     <View style={{ marginBottom: 16 }}>
                         <Text style={styleContext.label}>Remarks</Text>
                         <View style={[styleContext.input, { height: 100, paddingVertical: 10 }]}>
                             <TextInput
                                multiline
                                numberOfLines={4}
                                value={remarks}
                                onChangeText={setRemarks}
                                placeholder="Enter remarks here..."
                                style={{ fontSize: 16, textAlignVertical: 'top' }}
                             />
                         </View>
                     </View>

                     {/* Appraisal Points */}
                     <View style={{ marginBottom: 20 }}>
                         <Text style={styleContext.label}>Appraisal Points</Text>
                         <View style={styles.counterRow}>
                             <Text style={styles.counterText}>Points: {otherPoint}</Text>
                             <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <TouchableOpacity onPress={() => decrement(setOtherPoint, otherPoint)} style={styles.counterBtn}>
                                    <Icon name="minus" size={20} color="#fff" />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => increment(setOtherPoint, otherPoint)} style={[styles.counterBtn, { backgroundColor: '#388e3c' }]}>
                                    <Icon name="plus" size={20} color="#fff" />
                                </TouchableOpacity>
                             </View>
                         </View>
                     </View>

                     {/* Deduction Points */}
                     <View style={{ marginBottom: 20 }}>
                         <Text style={styleContext.label}>Salary Deduction Points</Text>
                         <View style={styles.counterRow}>
                             <Text style={styles.counterText}>Points: {point}</Text>
                             <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <TouchableOpacity onPress={() => decrement(setPoint, point)} style={styles.counterBtn}>
                                    <Icon name="minus" size={20} color="#fff" />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => increment(setPoint, point)} style={[styles.counterBtn, { backgroundColor: '#388e3c' }]}>
                                    <Icon name="plus" size={20} color="#fff" />
                                </TouchableOpacity>
                             </View>
                         </View>
                     </View>


                    {/* Submit */}
                    <TouchableOpacity 
                        style={[styleContext.button, { backgroundColor: '#000', marginTop: 10 }]}
                        onPress={handleSubmit}
                        disabled={submitting}
                    >
                         {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styleContext.buttonText}>Submit</Text>}
                    </TouchableOpacity>

                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    counterRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#f9f9f9',
        padding: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#eee'
    },
    counterText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333'
    },
    counterBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#d32f2f',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 12
    }
});
