import React, { useContext } from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    ScrollView
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StyleContext } from '../context/StyleContext';
import { CoreContext } from '../context/CoreContext';

const StaffMenu = ({ visible, onClose }) => {
    const navigation = useNavigation();
    const styleContext = useContext(StyleContext);
    const coreContext = useContext(CoreContext);

    if (!styleContext) return null;

    const {
        pickerModalOverlay,
        pickerModalContent,
        pickerModalItem,
        pickerModalItemText,
        pickerModalButton,
        pickerModalButtonText
    } = styleContext;

    const showTab = (tabName, allowedTabs) => {
        if (!allowedTabs) return false;
        return allowedTabs.some(tab => tab.tab_name === tabName);
    };

    const menuItems = [];

    // Attendance Report Permission Check
    if (coreContext.hasTabPermission('attendanceReport')) {
        menuItems.push({ 
            label: 'Attendance Report', 
            icon: 'file-chart', 
            action: () => navigation.navigate('StaffAttendanceReportScreen', { redirect: 'employeeAttendanceList' }) 
        });
    }

    // Leave Applications Permission Check
    if (showTab('staffLeaveApplications', coreContext.allowedTabs)) {
        menuItems.push({ 
            label: 'Leave Applications', 
            icon: 'file-document-edit', 
            action: () => navigation.navigate('LeaveApplicationScreen') 
        });
    }

    // Manual Attendance Permission Check
    if (showTab('staffManualAttendance', coreContext.allowedTabs) && coreContext.schoolData?.manualAttendance === 'yes') {
        menuItems.push({ 
            label: 'Manual Attendance', 
            icon: 'account-check', 
            action: () => navigation.navigate('ManualStaffAttendanceScreen', { redirect: 'staffManualAttendance' }) 
        });
    }

    // Admin Panel - Always show at the end
    menuItems.push({ 
        label: 'Admin Panel', 
        icon: 'view-grid-outline', 
        action: () => navigation.navigate('AdminPanel') 
    });

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={pickerModalOverlay}>
                    <View style={[pickerModalContent, { maxHeight: '50%' }]}>
                        <View style={{ padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee', backgroundColor: '#f8f9fa' }}>
                            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#333' }}>Staff Actions</Text>
                        </View>
                        
                        <ScrollView contentContainerStyle={{ paddingVertical: 5 }}>
                            {menuItems.length > 0 ? (
                                menuItems.map((item, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={[pickerModalItem, { paddingVertical: 12, paddingHorizontal: 20 }]}
                                        onPress={() => {
                                            onClose();
                                            setTimeout(() => item.action(), 100);
                                        }}
                                    >
                                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                            <Icon name={item.icon} size={22} color={styleContext.blackColor || '#333'} style={{ marginRight: 15, width: 24 }} />
                                            <Text style={[pickerModalItemText, { fontSize: 16, flex: 1, flexWrap: 'wrap' }]}>{item.label}</Text>
                                        </View>
                                    </TouchableOpacity>
                                ))
                            ) : (
                                <View style={{ padding: 20, alignItems: 'center' }}>
                                    <Text style={{ color: '#666' }}>No actions available.</Text>
                                </View>
                            )}
                        </ScrollView>

                        <View style={{ padding: 10, borderTopWidth: 1, borderTopColor: '#eee' }}>
                            <TouchableOpacity 
                                style={[pickerModalButton, { backgroundColor: '#eee', borderRadius: 8 }]} 
                                onPress={onClose}
                            >
                                <Text style={[pickerModalButtonText, { color: '#333' }]}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

export default StaffMenu;
