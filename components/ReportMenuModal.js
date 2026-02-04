import React, { useContext } from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    TouchableWithoutFeedback,
    ScrollView,
    Alert
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StyleContext } from '../context/StyleContext';

const ReportMenuModal = ({ visible, onClose }) => {
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
    } = styleContext;

    const menuItems = [
        { 
            label: 'Upload Report', 
            icon: 'upload', 
            action: () => {
                navigation.navigate('UploadReportScreen');
            } 
        },
        {
            label: 'View Report',
            icon: 'file-document-outline',
            action: () => {
                navigation.navigate('ViewReportScreen'); 
            }
        },
        {
            label: 'View Date Wise Report',
            icon: 'calendar-text-outline',
            action: () => {
                navigation.navigate('ViewReportDateScreen');
            }
        },
        { 
            label: 'Discipline Profile', 
            icon: 'alert-circle-outline', 
            action: () => {
                navigation.navigate('DisciplineProfileScreen');
            } 
        },
        { 
            label: 'Categories', 
            icon: 'shape-outline', 
            action: () => {
                navigation.navigate('CategoriesScreen');
            }
        },
        { 
            label: 'Admin Panel', 
            icon: 'view-grid-outline', 
            action: () => navigation.navigate('AdminPanel') 
        },
    ];

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={pickerModalOverlay}>
                    <View style={[pickerModalContent, { maxHeight: '80%' }]}>
                        <View style={{ padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee', backgroundColor: '#f8f9fa' }}>
                            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#333' }}>Report Actions</Text>
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

export default ReportMenuModal;
