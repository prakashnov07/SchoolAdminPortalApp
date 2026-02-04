import React, { useState, useEffect, useContext } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Image, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import axios from 'axios';
import { CoreContext } from '../context/CoreContext';
import { StyleContext } from '../context/StyleContext';

export default function StaffProfileScreen({ navigation, route }) {
    const coreContext = useContext(CoreContext);
    const styleContext = useContext(StyleContext);
    const { branchid, phone } = coreContext;

    // Params: Expecting 'staff' object or 'phone' to fetch
    const { staff } = route.params || {};
    
    const [empDetails, setEmpDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        if (staff) {
            fetchEmployeeDetails(staff.phone);
        }
    }, [staff]);

    const fetchEmployeeDetails = (empPhone) => {
        setLoading(true);
        // Using route params phone as 'owner' for this specific call as per legacy
        // Legacy: axios.get('/employee-details-phone', { params: { owner, branchid } })
        // where owner was the passed phone.
        axios.get('/employee-details-phone', { params: { owner: empPhone, branchid } })
            .then(response => {
                if (response.data && response.data.employee) {
                    setEmpDetails(response.data.employee);
                } else {
                     Alert.alert('Info', 'Employee details not found');
                }
                setLoading(false);
            })
            .catch(err => {
                console.log(err);
                setLoading(false);
                Alert.alert('Error', 'Failed to fetch details');
            });
    };

    const handleSuspend = () => {
        if (!empDetails) return;
        
        const newStatus = empDetails.status === 'suspended' ? 'active' : 'suspended';
        const actionTitle = empDetails.status === 'suspended' ? 'Activate' : 'Suspend';

        Alert.alert(actionTitle, `Are you sure you want to ${actionTitle.toLowerCase()} this user?`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Yes', onPress: () => {
                // Legacy logic: dispatch(suspendUser(id, status)) which called /suspenduser
                axios.post('/suspenduser', { id: empDetails.id, status: empDetails.status, branchid })
                    .then(() => {
                        Alert.alert('Success', `User ${newStatus === 'active' ? 'Activated' : 'Suspended'} successfully`);
                        fetchEmployeeDetails(staff.phone); // Refresh
                        coreContext.fetchStaffs(); // Refresh main list
                    }) // Note: Legacy endpoint might double check
                    .catch(err => Alert.alert('Error', 'Action failed'));
            }}
        ]);
    };

    const handleDelete = () => {
        if (!empDetails) return;
        
        Alert.alert('Delete', 'Has Employee quit the organization?', [
            { text: 'No', style: 'cancel' },
            { text: 'Yes', onPress: () => {
                // Legacy: dispatch(deleteUser(id)) -> /deleteuser
                axios.post('/deleteuser', { id: empDetails.id, branchid })
                    .then(() => {
                        Alert.alert('Success', 'User deleted');
                        coreContext.fetchStaffs();
                        navigation.navigate('ManageStaffScreen');
                    })
                    .catch(err => Alert.alert('Error', 'Delete failed'));
            }}
        ]);
    };

    if (loading) {
        return (
            <SafeAreaView style={styleContext.background}>
                <ActivityIndicator size="large" color={styleContext.primaryColor} style={{ marginTop: 50 }} />
            </SafeAreaView>
        );
    }

    if (!empDetails) {
        return (
             <SafeAreaView style={styleContext.background}>
                <Text style={{ textAlign: 'center', marginTop: 50 }}>No Details Available</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styleContext.background} edges={['bottom', 'left', 'right']}>


            <ScrollView contentContainerStyle={{ padding: 16 }}>
                
                {/* ID Card Style */}
                <View style={styleContext.card}>
                     <View style={{ alignItems: 'center', marginBottom: 20 }}>
                         <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center', marginBottom: 10, overflow: 'hidden' }}>
                            {empDetails.photo ? (
                                <Image source={{ uri: `https://schoolapi.siddhantait.com/${empDetails.photo}` }} style={{ width: 100, height: 100 }} />
                            ) : (
                                <Icon name="account" size={60} color="#ccc" />
                            )}
                         </View>
                         <Text style={{ fontSize: 22, fontWeight: 'bold', color: styleContext.titleColor }}>
                             {empDetails.fname} {empDetails.lname}
                         </Text>
                         <Text style={{ fontSize: 16, color: '#666', fontWeight: 'bold' }}>{empDetails.empid}</Text>
                     </View>

                     <View style={styles.infoRow}>
                        <Icon name="phone" size={20} color={styleContext.primaryColor} style={{ width: 30 }} />
                        <Text style={styles.infoText}>{empDetails.mobile}</Text>
                     </View>
                     <View style={styles.infoRow}>
                        <Icon name="email" size={20} color={styleContext.primaryColor} style={{ width: 30 }} />
                        <Text style={styles.infoText}>{empDetails.email || 'No Email'}</Text>
                     </View>
                     <View style={styles.infoRow}>
                        <Icon name="map-marker" size={20} color={styleContext.primaryColor} style={{ width: 30 }} />
                        <Text style={styles.infoText}>{empDetails.address || 'No Address'}</Text>
                     </View>

                     <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 }}>
                         <TouchableOpacity 
                            style={[styles.actionBtn, { backgroundColor: empDetails.status === 'suspended' ? '#388e3c' : '#fbc02d' }]}
                            onPress={handleSuspend}
                         >
                             <Text style={styles.btnText}>{empDetails.status === 'suspended' ? 'Activate' : 'Suspend'}</Text>
                         </TouchableOpacity>
                         
                         <TouchableOpacity 
                            style={[styles.actionBtn, { backgroundColor: '#d32f2f' }]}
                            onPress={handleDelete}
                         >
                             <Text style={styles.btnText}>Delete</Text>
                         </TouchableOpacity>
                     </View>
                </View>

                {/* Additional Actions (Stubs) */}
                 <View style={styleContext.card}>
                    <TouchableOpacity style={styles.secondaryBtn} onPress={() => Alert.alert('Salary', 'Salary Details coming soon')}>
                        <Text style={styles.secondaryBtnText}>Salary Details</Text>
                        <Icon name="chevron-right" size={20} color="#666" />
                    </TouchableOpacity>
                    <View style={{ height: 1, backgroundColor: '#eee' }} />
                    <TouchableOpacity style={styles.secondaryBtn} onPress={() => Alert.alert('Attendance', 'Attendance coming soon')}>
                        <Text style={styles.secondaryBtnText}>Attendance</Text>
                        <Icon name="chevron-right" size={20} color="#666" />
                    </TouchableOpacity>
                 </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0'
    },
    infoText: {
        fontSize: 16,
        color: '#444',
        flex: 1,
        marginLeft: 8
    },
    actionBtn: {
        flex: 0.48,
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
    secondaryBtn: {
        paddingVertical: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    secondaryBtnText: {
        fontSize: 16,
        color: '#333'
    }
});
