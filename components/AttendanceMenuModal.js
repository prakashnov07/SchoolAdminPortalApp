import React, { useContext } from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    TouchableWithoutFeedback,
    ScrollView
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StyleContext } from '../context/StyleContext';

const AttendanceMenuModal = ({ visible, onClose }) => {
    const styleContext = useContext(StyleContext);
    const navigation = useNavigation();

    if (!styleContext) return null;

    const {
        pickerModalOverlay,
        pickerModalContent,
        pickerModalItem,
        pickerModalItemText,
        pickerModalButton,
        pickerModalButtonText,
        primary // Assuming primary color is available, else fallback
    } = styleContext;

    const menuItems = [
        { label: 'Mark Attendance', icon: 'check-circle-outline', action: () => navigation.navigate('MarkAttendance') },
        { label: 'Manage Attendance', icon: 'clipboard-edit-outline', action: () => navigation.navigate('ManageAttendanceScreen') },
        { label: 'Attendance Count', icon: 'chart-bar', action: () => navigation.navigate('AttendanceCountScreen') },
        { label: 'View Attendance', icon: 'eye-outline', action: () => navigation.navigate('ViewStudentAttendanceScreen') },
        { label: 'Back Attendance', icon: 'history', action: () => alert('Coming Soon: Back Attendance') },
        { label: 'Scan Bar/QR Code', icon: 'qrcode-scan', action: () => navigation.navigate('ScanStudentScreen') },
        { label: 'Single Student Attendance', icon: 'account-check-outline', action: () => navigation.navigate('SingleStudentAttendanceScreen') },
        { label: 'Transport Attendance Count', icon: 'bus-clock', action: () => navigation.navigate('TransportAttendanceCountScreen') },
        { label: 'Transport Attendance Report', icon: 'bus-alert', action: () => navigation.navigate('TransportAttendanceReportScreen') },
        { label: 'Mark Event Attendance', icon: 'calendar-star', action: () => navigation.navigate('MarkEventAttendanceScreen') },
        { label: 'Back Attendance', icon: 'history', action: () => navigation.navigate('BackAttendanceScreen') },
        { label: 'Admin Panel', icon: 'view-grid-outline', action: () => navigation.navigate('AdminPanel') },
    ];

    const alert = (msg) => {
        // Simple alert for now
        const { Alert } = require('react-native');
        Alert.alert('Feature', msg);
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={pickerModalOverlay}>
                    {/* Positioned slightly differently? Or center? 
                        Legacy SendMessages used center. Let's stick to center for consistency 
                        or maybe top-right if we could calculate it, but center is safer used in other modals. 
                        Actually, let's use the standard centered modal look from the new theme.
                    */}
                    <View style={[pickerModalContent, { maxHeight: '80%' }]}>
                        <View style={{ padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee', backgroundColor: '#f8f9fa' }}>
                            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#333' }}>Attendance Actions</Text>
                        </View>
                        
                        <ScrollView contentContainerStyle={{ paddingVertical: 5 }}>
                            {menuItems.map((item, index) => (
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
                            ))}
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

export default AttendanceMenuModal;
