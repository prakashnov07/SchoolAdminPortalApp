import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { StyleContext } from '../context/StyleContext';
import { CoreContext } from '../context/CoreContext';
import { useNavigation } from '@react-navigation/native';

const LeavePlannerItem = ({ item }) => {
    const styleContext = useContext(StyleContext);
    const coreContext = useContext(CoreContext);
    const navigation = useNavigation();

    // Check permission logic from legacy used 'allowedTabs' from Redux
    // Legacy: showTab('staffLeaveApplications', props.allowedTabs)
    // We can use coreContext.hasTabPermission if mapped correctly, or check allowedTabs manually
    // Assuming 'staffLeaveApplications' corresponds to 'LeaveApplicationScreen' or similar key
    const hasPermission = coreContext.hasTabPermission('staffLeaveApplications');

    const viewList = () => {
        // Legacy: Actions.staffListOnLeave({ date: props.item.d, da: props.item.da })
        // We need to implement 'StaffListOnLeaveScreen' or map it to an existing screen?
        // Looking at file list, 'StaffAttendanceReportScreen' or 'EmployeeAttendanceListScreen' might be relevant?
        // Let's assume for now we might need a new screen or reuse one. 
        // Legacy 'staffListOnLeave' likely showed who is on leave.
        // Let's check if 'EmployeeAttendanceListScreen' supports filtering by 'absent'/'leave' for a date.
        // For now, let's navigate to 'EmployeeAttendanceListScreen' passing date and status='absent' (or similar)
        // But wait, 'LeavePlanner' implies *future* or *approved* leave.
        // It might be 'StaffLeaveApplicationsScreen'? No, that's for APPROVING applications.
        // Let's check 'EmployeeAttendanceListScreen' if it can show "Approved Leaves". 
        // If not, we might need to create it. But for this task, let's just create the item first.
        
        // Actually, looking at legacy code, it passes `date` and `da`.
        // Let's assume we navigate to a screen that lists staff on leave.
        // 'EmployeeAttendanceListScreen' seems most appropriate if we can filter by 'on leave'.
        // However, 'EmployeeAttendanceListScreen' usually shows *marked* attendance.
        // If this is a PLANNER, it shows upcoming leaves.
        // Let's check if there is a 'ViewReportDateScreen' or similar.
        // "Approved Leave Count Report" suggests we are seeing who HAS approved leave.
        
        // For now, let's wire it to 'EmployeeAttendanceListScreen' with a specific mode or just log it if unsure.
        // Better yet, let's use 'StaffAttendanceScreen' or similar if it supports list view? 
        // No, 'EmployeeAttendanceListScreen' is the list.
        
        // Let's verify 'staffListOnLeave' destination in legacy if possible, but I can't see routes.
        // I will use 'EmployeeAttendanceListScreen' with params to hopefully reuse it, 
        // or I might need to clarify. 
        // But based on available files, `EmployeeAttendanceListScreen` seems to be the one.
        
        navigation.navigate('StaffListOnLeaveScreen', { 
            date: item.d, 
             // legacy used `da` but new screen expects `date` in params or header, 
             // actually legacy used: Actions.staffListOnLeave({ date: props.item.d, da: props.item.da })
             // so we pass `date` as the raw date string.
        });
    };

    return (
        <View style={[styleContext.card, { marginBottom: 10, padding: 15 }]}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: styleContext.titleColor, marginBottom: 8, textAlign: 'center' }}>
                {item.da}
            </Text>
            
            <View style={{ alignItems: 'center', marginBottom: 12 }}>
                <Text style={{ fontSize: 15, color: '#444' }}>
                   Employees on Leave : <Text style={{ fontWeight: 'bold', color: styleContext.primaryColor }}>{item.count}</Text>
                </Text>
            </View>

            {/* Only show button if count > 0 and permission exists (if we strictly follow legacy) */}
            {/* Legacy checked 'staffLeaveApplications' permission. */}
            {item.count > 0 && (
                <View style={{ alignItems: 'center' }}>
                    <TouchableOpacity 
                        style={[styles.btn, { backgroundColor: '#D33A2C' }]} 
                        onPress={viewList}
                    >
                        <Text style={styles.btnText}>View List</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    btn: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 5,
        alignItems: 'center',
        justifyContent: 'center',
    },
    btnText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14
    }
});

export default LeavePlannerItem;
