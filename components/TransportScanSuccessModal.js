import React from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const TransportScanSuccessModal = ({ visible, student, status, message, onClose }) => {
    if (!visible || !student) return null;

    const isSuccess = status === 'success' || status === 'already' || status === 'out';
    // You might want specific icons for 'out' or 'already' if desired, but check/close is a good binary for now.
    // User asked for "appropriate icon". 
    // Let's keep it simple: Success/Out/Already -> Green Check (or maybe info for already?), Wrong -> Red Cross.
    
    let iconName = "check-circle";
    let iconColor = "#28a745";

    if (status === 'wrong' || status === 'error') {
        iconName = "close-circle";
        iconColor = "#d32f2f";
    } else if (status === 'already') {
        iconName = "information";
        iconColor = "#ff9800"; // Orange for already marked
    }

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.centeredView}>
                <View style={styles.modalView}>
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Icon name="close" size={24} color="#000" />
                    </TouchableOpacity>

                    <Text style={styles.studentName}>{student.name || 'Student Name'}</Text>

                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Class</Text>
                        <Text style={styles.value}>{student.class || student.clas} {student.section}</Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Roll No</Text>
                        <Text style={styles.value}>{student.roll_no || student.roll}</Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Enr No</Text>
                        <Text style={styles.value}>{student.enrollment || student.id}</Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Adm No</Text>
                        <Text style={styles.value}>{student.admission_no || student.adm_no}</Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Bus No</Text>
                        <Icon name={iconName} size={30} color={iconColor} />
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Bus Route</Text>
                        <Icon name={iconName} size={30} color={iconColor} />
                    </View>

                    {message && (
                        <Text style={{ marginTop: 10, fontSize: 18, fontWeight: 'bold', color: iconColor }}>
                            {message}
                        </Text>
                    )}

                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalView: {
        width: width * 0.85,
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 25,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    closeButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        padding: 5,
    },
    studentName: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 25,
        textAlign: 'center',
        color: '#333',
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        marginBottom: 15,
    },
    label: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#d32f2f', // Reddish color for labels
    },
    value: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
});

export default TransportScanSuccessModal;
