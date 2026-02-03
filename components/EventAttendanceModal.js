import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, Modal, TouchableWithoutFeedback, ScrollView, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { StyleContext } from '../context/StyleContext';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

export default function EventAttendanceModal({ 
    visible, 
    student,
    history,
    loading,
    attended, 
    onClose, 
    onMarkPresent,
    onMarkAbsent,
    status
}) {
    const styleContext = useContext(StyleContext);
    const { primary, card, text } = styleContext;

    if (!visible) return null;

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <TouchableWithoutFeedback onPress={onClose}>
                    <View style={styles.backdrop} />
                </TouchableWithoutFeedback>
                
                <View style={styles.modalContent}>
                    {/* Header */}
                    <View style={[styles.header, { backgroundColor: primary?.backgroundColor || '#6200ee' }]}>
                        <Text style={styles.headerTitle}>Event Attendance</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Icon name="close" size={24} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    {loading ? (
                        <View style={styles.loadingContainer}>
                             <ActivityIndicator size="large" color={primary?.backgroundColor || '#6200ee'} />
                             <Text style={{ marginTop: 10, color: '#666' }}>Loading History...</Text>
                        </View>
                    ) : (
                        <ScrollView contentContainerStyle={styles.scrollContent}>
                            
                            {/* Student Info */}
                            {student && (
                                <View style={styles.studentInfo}>
                                    <View style={[styles.avatar, {  backgroundColor: primary?.backgroundColor || '#6200ee' }]}>
                                         <Text style={styles.avatarText}>
                                            {(student.name || student.firstname || '?').charAt(0)}
                                        </Text>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.studentName}>{student.name || `${student.firstname} ${student.lastname}`}</Text>
                                        <Text style={styles.studentDetail}>ID: {student.enrollment} | Class: {student.clas} {student.section}</Text>
                                    </View>
                                </View>
                            )}

                             {/* Status Indicator */}
                             {status && status !== 'unmarked' && (
                                <View style={[styles.statusBanner, { backgroundColor: status === 'present' ? '#e8f5e9' : '#ffebee' }]}>
                                    <Icon name={status === 'present' ? "check-circle" : "close-circle"} size={20} color={status === 'present' ? "green" : "red"} />
                                    <Text style={[styles.statusText, { color: status === 'present' ? "green" : "red" }]}>
                                        Currently Marked: {status.toUpperCase()}
                                    </Text>
                                </View>
                             )}

                            {/* History */}
                            <Text style={styles.sectionTitle}>Attendance History</Text>
                            {history && history.length > 0 ? (
                                history.map((record, index) => (
                                    <View key={index} style={styles.historyItem}>
                                        <View style={styles.historyLeft}>
                                            <Text style={styles.historyEvent}>{record.ename || 'Event'}</Text>
                                            <Text style={styles.historyDate}>{record.dt || 'Unknown Date'}</Text>
                                        </View>
                                        <View style={[styles.historyBadge, { backgroundColor: record.status === 'present' ? '#e8f5e9' : '#ffebee' }]}>
                                            <Text style={{ color: record.status === 'present' ? 'green' : 'red', fontWeight: 'bold', fontSize: 12 }}>
                                                {record.status ? record.status.toUpperCase() : 'UNKNOWN'}
                                            </Text>
                                        </View>
                                    </View>
                                ))
                            ) : (
                                <Text style={styles.emptyHistory}>No previous records found.</Text>
                            )}

                        </ScrollView>
                    )}

                    {/* Actions */}
                    {!loading && (
                        <View style={styles.actionContainer}>
                            {status === 'present' ? (
                                <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#d32f2f' }]} onPress={onMarkAbsent}>
                                    <Text style={styles.actionButtonText}>Mark Absent</Text>
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity style={[styles.actionButton, { backgroundColor: 'green' }]} onPress={onMarkPresent}>
                                    <Text style={styles.actionButtonText}>Mark Present</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    backdrop: {
        flex: 1,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '80%',
        height: '70%',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    headerTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    scrollContent: {
        padding: 15,
        paddingBottom: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    studentInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        padding: 10,
        backgroundColor: '#f9f9f9',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#eee'
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    avatarText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    studentName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    studentDetail: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
        marginTop: 10
    },
    historyItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    historyLeft: {
        flex: 1,
    },
    historyEvent: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    historyDate: {
        fontSize: 12,
        color: '#888',
        marginTop: 2,
    },
    historyBadge: {
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 12,
        marginLeft: 10,
    },
    emptyHistory: {
        fontStyle: 'italic',
        color: '#888',
        textAlign: 'center',
        marginTop: 10,
    },
    actionContainer: {
        padding: 15,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        backgroundColor: '#fff',
    },
    actionButton: {
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    statusBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderRadius: 8,
        marginBottom: 15,
        justifyContent: 'center'
    },
    statusText: {
        fontWeight: 'bold',
        marginLeft: 8
    }
});
