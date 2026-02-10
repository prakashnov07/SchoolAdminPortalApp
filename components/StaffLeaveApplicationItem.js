
import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import { CoreContext } from '../context/CoreContext';
import { StyleContext } from '../context/StyleContext';
import CustomPickerModal from './CustomPickerModal';

export default function StaffLeaveApplicationItem({ item, status, refresh, branchid, owner, navigation }) {
    if (!item) return null;
    // console.log('StaffLeaveApplicationItem - item:', item);
    
    // Safety check for empDetails
    const empName = item.empDetails 
        ? (item.empDetails.name || `${item.empDetails.fname || ''} ${item.empDetails.lname || ''}`.trim())
        : 'Unknown';
    const empId = item.empDetails ? item.empDetails.empid : 'N/A';
    const empMobile = item.empDetails ? item.empDetails.mobile : '';

    const styleContext = useContext(StyleContext);
    const coreContext = useContext(CoreContext);
    
    const [loading, setLoading] = useState(false);
    const [remarks, setRemarks] = useState(item.approver_comment || '');
    const [plBalance, setPlBalance] = useState(0);
    const [approvedDates, setApprovedDates] = useState([]);
    
    // Pickers
    const [pickerVisible, setPickerVisible] = useState(false);
    const [pickerTitle, setPickerTitle] = useState('');
    const [pickerData, setPickerData] = useState([]);
    const [currentPickerValue, setCurrentPickerValue] = useState('');
    const [onPickerSelect, setOnPickerSelect] = useState(() => {});

    useEffect(() => {
        getPLBalance();
        
        // Initialize approved dates from applied dates
        const aDates = item.applied_dates ? item.applied_dates.split(',') : [];
        // Default leave type based on application type
        const defaultType = item.leave_type === 'half' ? 'half' : 'cl';
        const initialDates = aDates.map(d => ({ d: d.trim(), l: defaultType }));
        setApprovedDates(initialDates);
    }, []);

    const getPLBalance = () => {
        // Use safe access to emp id
        if (!item.empDetails) return;
        
        axios.get('/pl-balance', { params: { empid: item.empDetails.emp_id, branchid } })
            .then(response => {
                const val = response.data.plBalance !== undefined ? response.data.plBalance : 
                            response.data.balance !== undefined ? response.data.balance : 0;
                setPlBalance(val);
            })
            .catch(err => console.log('PL Balance Error', err));
    };

    const handleApprove = () => {
        if (approvedDates.length === 0) {
            Toast.show({ type: 'info', text1: 'No dates selected for approval' });
            return;
        }

        setLoading(true);
        const appliedCount = item.applied_dates.split(',').length;
        const approvedCount = approvedDates.length;
        
        const approvalMsg = appliedCount === approvedCount 
            ? 'Your leave application has been approved : Approver comments - ' + remarks 
            : 'Your leave application has been approved with some modifications : Approver comments - ' + remarks;

        axios.post('/process-staff-leave-application-2', { 
            id: item.id, 
            branchid, 
            holidaydate: approvedDates, 
            remarks, 
            owner, 
            pstatus: 'approved' 
        }).then(() => {
            setLoading(false);
            Toast.show({ type: 'success', text1: 'Application Approved' });
            refresh();
            
            // Notify staff
            if (empMobile) {
                axios.post('/send-staff-message', { owner: empMobile, remarks: approvalMsg, action: 'Leave Application' });
            }
        }).catch(err => {
            console.log(err);
            setLoading(false);
            Toast.show({ type: 'error', text1: 'Failed to approve' });
        });
    };

    const handleDecline = () => {
        if (!remarks) {
            Toast.show({ type: 'info', text1: 'Please enter remarks for rejection' });
            return;
        }

        setLoading(true);
        const declineMsg = 'Your leave application has been declined : Approver comments - ' + remarks;
        
        axios.post('/process-staff-leave-application-2', { 
            id: item.id, 
            branchid, 
            holidaydate: approvedDates, 
            remarks, 
            owner, 
            pstatus: 'declined' 
        }).then(() => {
            setLoading(false);
            Toast.show({ type: 'success', text1: 'Application Declined' });
            refresh();
            
            // Notify staff
            if (empMobile) {
                axios.post('/send-staff-message', { owner: empMobile, remarks: declineMsg, action: 'Leave Application' });
            }
        }).catch(err => {
            console.log(err);
            setLoading(false);
            Toast.show({ type: 'error', text1: 'Failed to decline' });
        });
    };

    const handleCancel = () => {
        if (!remarks) {
            Toast.show({ type: 'info', text1: 'Please enter remarks for cancellation' });
            return;
        }

        setLoading(true);
        const cancelMsg = 'Your leave has been cancelled : ' + remarks;

        axios.post('/cancel-staff-leave', { 
            id: item.id, 
            branchid, 
            remarks, 
            owner 
        }).then(() => {
            setLoading(false);
            Toast.show({ type: 'success', text1: 'Leave Cancelled' });
            refresh();
            
            // Notify staff
            if (empMobile) {
                axios.post('/send-staff-message', { owner: empMobile, remarks: cancelMsg, action: 'Leave Application' });
            }
        }).catch(err => {
            console.log(err);
            setLoading(false);
            Toast.show({ type: 'error', text1: 'Failed to cancel' });
        });
    };

    const removeDate = (dateToRemove) => {
        setApprovedDates(approvedDates.filter(apd => apd.d !== dateToRemove));
    };

    const updateLeaveType = (date, newType) => {
        setApprovedDates(approvedDates.map(apd => 
            apd.d === date ? { ...apd, l: newType } : apd
        ));
    };

    const leaveTypeOptions = item.leave_type === 'half' 
        ? [
            { label: 'Half Day CL', value: 'half-cl' },
            { label: 'Paid Half Day Leave', value: 'half' }
        ]
        : [
            { label: 'CL (Paid Leave)', value: 'pl' },
            { label: 'LWP (Unpaid)', value: 'cl' },
            { label: 'On Duty', value: 'ol' },
            { label: 'Special Leave', value: 'sl' }
        ];

    const openTypePicker = (date, currentType) => {
        setPickerTitle(`Select Leave Type for ${date}`);
        setPickerData(leaveTypeOptions);
        setCurrentPickerValue(currentType);
        setOnPickerSelect(() => (val) => {
             updateLeaveType(date, val);
        });
        setPickerVisible(true);
    };

    return (
        <View style={styles.card}>
            <CustomPickerModal
                visible={pickerVisible}
                title={pickerTitle}
                data={pickerData}
                selectedValue={currentPickerValue}
                onSelect={(val) => {
                    onPickerSelect(val);
                    setPickerVisible(false);
                }}
                onClose={() => setPickerVisible(false)}
            />

            {/* Header Info */}
            <View style={styles.header}>
                <View>
                    <Text style={[styles.name, { color: '#333' }]}>{empName}</Text>
                    <Text style={styles.empId}>{empId}</Text>
                </View>
                <View style={styles.dateContainer}>
                    <Text style={[styles.date, { color: '#5a45d4' }]}>{item.doa}</Text>
                    <Text style={styles.balance}>CL Bal: {plBalance}</Text>
                    
                    {/* Status Badge */}
                    <View style={{ 
                        backgroundColor: item.app_status === 'approved' ? '#e8f5e9' : item.app_status === 'declined' ? '#ffebee' : '#fff3e0',
                        paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginTop: 4, alignSelf: 'flex-end'
                    }}>
                        <Text style={{ 
                            fontSize: 10, fontWeight: 'bold', 
                            color: item.app_status === 'approved' ? '#2e7d32' : item.app_status === 'declined' ? '#c62828' : '#ef6c00',
                            textTransform: 'uppercase'
                        }}>
                            {item.app_status || 'Unknown'}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Application Details */}
            <View style={styles.details}>
                <Text style={styles.commentLabel}>Reason:</Text>
                <Text style={styles.comment}>{item.applicant_comment}</Text>
            </View>

            {/* Applied Dates Management (Only for Pending) */}
            {status === 'raised' && (
                <View style={styles.datesSection}>
                    <Text style={styles.sectionTitle}>Manage Dates</Text>
                    {approvedDates.map((ad, index) => (
                        <View key={index} style={styles.dateRow}>
                            <Text style={styles.dateText}>{ad.d}</Text>
                            
                            <TouchableOpacity 
                                style={styles.typeSelector}
                                onPress={() => openTypePicker(ad.d, ad.l)}
                            >
                                <Text style={styles.typeText}>
                                    {leaveTypeOptions.find(o => o.value === ad.l)?.label || 'Select Type'}
                                </Text>
                                <Icon name="chevron-down" size={16} color="#666" />
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => removeDate(ad.d)} style={styles.removeBtn}>
                                <Icon name="close-circle" size={24} color="#d32f2f" />
                            </TouchableOpacity>
                        </View>
                    ))}
                    {approvedDates.length === 0 && (
                        <Text style={styles.warningText}>No dates selected (Application will be rejected)</Text>
                    )}
                </View>
            )}

            {/* Status Display (For processed) */}
            {status !== 'raised' && (
                <View style={styles.details}>
                    <Text style={styles.commentLabel}>Applied Dates:</Text>
                    <Text style={styles.comment}>{item.applied_dates}</Text>
                    
                    <Text style={[styles.commentLabel, { marginTop: 10 }]}>Approver Remarks:</Text>
                    <Text style={[styles.comment, { fontStyle: 'italic' }]}>{item.approver_comment || 'No remarks'}</Text>
                </View>
            )}

            {/* Remarks Input */}
            <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Remarks / Comments</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Enter remarks..."
                    value={remarks}
                    onChangeText={setRemarks}
                    multiline
                />
            </View>

            {/* Actions */}
            <View style={styles.actions}>
                <TouchableOpacity 
                    style={[styles.actionBtn, { backgroundColor: '#555' }]}
                    onPress={() => navigation.navigate('StaffAttendanceScreen', { staff: item.empDetails })}
                >
                    <Text style={styles.btnText}>Calendar</Text>
                </TouchableOpacity>

                {status === 'raised' && (
                    <>
                        <TouchableOpacity 
                            style={[styles.actionBtn, { backgroundColor: '#d32f2f' }]}
                            onPress={handleDecline}
                        >
                            {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.btnText}>Decline</Text>}
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            style={[styles.actionBtn, { backgroundColor: styleContext.primaryColor || '#4CAF50' }]}
                            onPress={handleApprove}
                            disabled={approvedDates.length === 0}
                        >
                            {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.btnText}>Approve</Text>}
                        </TouchableOpacity>
                    </>
                )}

                {status === 'approved' && (
                    <TouchableOpacity 
                        style={[styles.actionBtn, { backgroundColor: '#d32f2f' }]}
                        onPress={handleCancel}
                    >
                         {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.btnText}>Cancel Leave</Text>}
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: 8
    },
    name: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333'
    },
    empId: {
        fontSize: 12,
        color: '#666'
    },
    dateContainer: {
        alignItems: 'flex-end'
    },
    date: {
        fontSize: 12,
        fontWeight: 'bold'
    },
    balance: {
        fontSize: 12,
        color: '#666',
        marginTop: 2
    },
    details: {
        marginBottom: 12
    },
    commentLabel: {
        fontSize: 12,
        color: '#888',
        marginBottom: 2
    },
    comment: {
        fontSize: 14,
        color: '#333',
        lineHeight: 20
    },
    datesSection: {
        backgroundColor: '#f9f9f9',
        padding: 10,
        borderRadius: 8,
        marginBottom: 12
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#666',
        marginBottom: 8
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        justifyContent: 'space-between'
    },
    dateText: {
        fontSize: 14,
        fontWeight: 'bold',
        width: 80
    },
    typeSelector: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 6,
        padding: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginHorizontal: 8,
        backgroundColor: '#fff'
    },
    typeText: {
        fontSize: 12,
        color: '#333'
    },
    removeBtn: {
        padding: 4
    },
    inputContainer: {
        marginBottom: 15
    },
    inputLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 10,
        height: 60,
        textAlignVertical: 'top',
        fontSize: 14,
        color: '#333'
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 8
    },
    actionBtn: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 6,
        minWidth: 80,
        alignItems: 'center',
        justifyContent: 'center'
    },
    btnText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold'
    },
    warningText: {
        color: '#d32f2f',
        fontSize: 12,
        fontStyle: 'italic',
        marginTop: 5,
        textAlign: 'center'
    }
});
