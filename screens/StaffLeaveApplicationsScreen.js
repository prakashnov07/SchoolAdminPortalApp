import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, FlatList, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { CoreContext } from '../context/CoreContext';
import { StyleContext } from '../context/StyleContext';
import CustomPickerModal from '../components/CustomPickerModal';
import axios from 'axios';

const LeaveItem = ({ item, styleContext }) => (
    <View style={[styleContext.card, { marginBottom: 10, padding: 15 }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
            <Text style={{ fontWeight: 'bold', fontSize: 16, color: styleContext.titleColor }}>{item.leave_type}</Text>
             <Text style={{ color: item.status === 'approved' ? 'green' : item.status === 'rejected' ? 'red' : 'orange', fontWeight: 'bold' }}>
                {item.status.toUpperCase()}
            </Text>
        </View>
        <Text style={{ color: '#666', marginBottom: 5 }}>From: {item.from_date} To: {item.to_date}</Text>
        <Text style={{ color: '#444' }}>Reason: {item.reason}</Text>
        {item.remarks ? <Text style={{ color: '#666', marginTop: 5, fontStyle: 'italic' }}>Admin Remarks: {item.remarks}</Text> : null}
    </View>
);

export default function StaffLeaveApplicationsScreen({ navigation }) {
    const coreContext = useContext(CoreContext);
    const styleContext = useContext(StyleContext);
    const { branchid, phone } = coreContext;

    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // Form State
    const [fromDate, setFromDate] = useState(new Date());
    const [toDate, setToDate] = useState(new Date());
    const [reason, setReason] = useState('');
    const [leaveType, setLeaveType] = useState('Casual Leave');
    
    const [showFromPicker, setShowFromPicker] = useState(false);
    const [showToPicker, setShowToPicker] = useState(false);
    const [leaveTypePickerVisible, setLeaveTypePickerVisible] = useState(false);
    const [isApplying, setIsApplying] = useState(false);

    useEffect(() => {
        fetchLeaves();
    }, []);

    const fetchLeaves = () => {
        setLoading(true);
        axios.get('staff-leave-applications', { params: { branchid, owner: phone } })
            .then(response => {
                setLoading(false);
                if (response.data && response.data.leaves) {
                    setLeaves(response.data.leaves);
                }
            })
            .catch(err => {
                setLoading(false);
                console.error(err);
            });
    };

    const applyLeave = () => {
        if (!reason.trim()) {
            Alert.alert('Error', 'Please enter a reason for leave');
            return;
        }

        setIsApplying(true);
        axios.post('apply-staff-leave', {
            branchid,
            owner: phone,
            leave_type: leaveType,
            from_date: formatDate(fromDate),
            to_date: formatDate(toDate),
            reason: reason
        }).then(response => {
            setIsApplying(false);
            if (response.data.status === 'success') {
                Alert.alert('Success', 'Leave application submitted successfully');
                setReason('');
                fetchLeaves();
            } else {
                Alert.alert('Error', response.data.message || 'Failed to apply leave');
            }
        }).catch(err => {
            setIsApplying(false);
            Alert.alert('Error', 'Network error occurred');
            console.error(err);
        });
    };

    const formatDate = (date) => {
        const d = new Date(date);
        let month = '' + (d.getMonth() + 1);
        let day = '' + d.getDate();
        const year = d.getFullYear();

        if (month.length < 2) month = '0' + month;
        if (day.length < 2) day = '0' + day;

        return [year, month, day].join('-');
    };

    const leaveTypes = [
        { label: 'Casual Leave', value: 'Casual Leave' },
        { label: 'Sick Leave', value: 'Sick Leave' },
        { label: 'Earned Leave', value: 'Earned Leave' },
        { label: 'Unpaid Leave', value: 'Unpaid Leave' }
    ];

    return (
        <SafeAreaView style={styleContext.background} edges={['bottom', 'left', 'right']}>
             <CustomPickerModal
                visible={leaveTypePickerVisible}
                title="Select Leave Type"
                data={leaveTypes}
                selectedValue={leaveType}
                onSelect={(val) => {
                    setLeaveType(val);
                    setLeaveTypePickerVisible(false);
                }}
                onClose={() => setLeaveTypePickerVisible(false)}
            />

            {(showFromPicker || showToPicker) && (
                <DateTimePicker
                    value={showFromPicker ? fromDate : toDate}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                        if (showFromPicker) {
                            setShowFromPicker(false);
                            if (selectedDate) setFromDate(selectedDate);
                        } else {
                            setShowToPicker(false);
                            if (selectedDate) setToDate(selectedDate);
                        }
                    }}
                />
            )}

            <ScrollView contentContainerStyle={{ padding: 16 }}>
                 <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: styleContext.titleColor }}>
                    Apply for Leave
                </Text>

                <View style={styleContext.glassFilterContainer}>
                    {/* Leave Type */}
                    <TouchableOpacity 
                        style={[styleContext.whitePickerButton, { marginBottom: 10 }]}
                        onPress={() => setLeaveTypePickerVisible(true)}
                    >
                        <Text style={{ fontSize: 16, color: '#333' }}>{leaveType}</Text>
                        <Icon name="chevron-down" size={24} color="#666" />
                    </TouchableOpacity>

                    {/* Dates Row */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                        <TouchableOpacity 
                            style={[styleContext.whitePickerButton, { flex: 0.48, marginBottom: 0 }]}
                            onPress={() => setShowFromPicker(true)}
                        >
                            <Text style={{ color: '#666', fontSize: 12 }}>From</Text>
                            <Text style={{ fontSize: 14, color: '#333', fontWeight: 'bold' }}>{formatDate(fromDate)}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={[styleContext.whitePickerButton, { flex: 0.48, marginBottom: 0 }]}
                            onPress={() => setShowToPicker(true)}
                        >
                             <Text style={{ color: '#666', fontSize: 12 }}>To</Text>
                            <Text style={{ fontSize: 14, color: '#333', fontWeight: 'bold' }}>{formatDate(toDate)}</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Reason Input */}
                    <View style={[styleContext.whitePickerButton, { padding: 0, marginBottom: 15 }]}>
                        <TextInput
                            placeholder="Reason for leave"
                            placeholderTextColor="#999"
                            style={{ padding: 12, fontSize: 16, color: '#333', minHeight: 80 }}
                            multiline
                            textAlignVertical="top"
                            value={reason}
                            onChangeText={setReason}
                        />
                    </View>

                    {/* Apply Button */}
                    <TouchableOpacity 
                        style={[{ backgroundColor: styleContext.primaryColor || '#6200ea', padding: 15, borderRadius: 10, alignItems: 'center' }]}
                        onPress={applyLeave}
                        disabled={isApplying}
                    >
                        <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>
                            {isApplying ? 'Applying...' : 'Apply Leave'}
                        </Text>
                    </TouchableOpacity>
                </View>

                <Text style={{ fontSize: 18, fontWeight: 'bold', marginVertical: 15, color: styleContext.titleColor }}>
                    My Leave History
                </Text>

                {loading ? (
                    <Text style={{ textAlign: 'center', marginTop: 20 }}>Loading history...</Text>
                ) : (
                    leaves.length > 0 ? (
                        leaves.map((leave, index) => <LeaveItem key={index} item={leave} styleContext={styleContext} />)
                    ) : (
                         <Text style={{ textAlign: 'center', marginTop: 20, color: '#888' }}>No leave history found.</Text>
                    )
                )}
            </ScrollView>
        </SafeAreaView>
    );
}
