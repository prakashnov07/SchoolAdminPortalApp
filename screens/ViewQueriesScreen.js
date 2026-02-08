import React, { useState, useContext, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, TextInput, Modal, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import { CoreContext } from '../context/CoreContext';
import { StyleContext } from '../context/StyleContext';
import FeedbackItem from '../components/FeedbackItem';

export default function ViewQueriesScreen({ navigation }) {
    const { feedbacks, fetchFeedbacks, phone, branchid, role } = useContext(CoreContext);
    const { primary, background, text, card } = useContext(StyleContext);

    const [statusFilter, setStatusFilter] = useState('open'); // 'open' or 'closed'
    const [loading, setLoading] = useState(false);
    const [replyModalVisible, setReplyModalVisible] = useState(false);
    const [selectedFeedback, setSelectedFeedback] = useState(null);
    const [replyMessage, setReplyMessage] = useState('');
    const [sendingReply, setSendingReply] = useState(false);

    const [feedbackDetails, setFeedbackDetails] = useState([]);
    const [loadingDetails, setLoadingDetails] = useState(false);

    useEffect(() => {
        loadFeedbacks();
    }, [statusFilter]);

    const loadFeedbacks = () => {
        setLoading(true);
        fetchFeedbacks(statusFilter); // fetchFeedbacks in CoreContext updates 'feedbacks' state
        setTimeout(() => setLoading(false), 1000); // Allow time for context update
    };

    const fetchDetails = async (id) => {
        setLoadingDetails(true);
        try {
            const response = await axios.get('/fetchfeedbackdetails', { 
                params: { branchid, id, owner: phone } 
            });
            setFeedbackDetails(response.data.feedbackdetails || []);
        } catch (error) {
            console.error("Error fetching details:", error);
            Toast.show({ type: 'error', text1: 'Failed to load conversation' });
        } finally {
            setLoadingDetails(false);
        }
    };

    const handleReplyPress = (item) => {
        setSelectedFeedback(item);
        setReplyMessage('');
        setFeedbackDetails([]); // Clear previous details
        setReplyModalVisible(true);
        fetchDetails(item.id);
    };

    const sendReply = async () => {
        if (!replyMessage.trim()) {
            Toast.show({ type: 'error', text1: 'Please enter a reply' });
            return;
        }

        setSendingReply(true);
        try {
            const response = await axios.post('addfeedbackdetails', {
                id: selectedFeedback.id,
                comment: replyMessage,
                owner: phone,
                branchid,
                role
            });

            console.log("Reply Response:", response.data);
            // Alert.alert("Debug", JSON.stringify(response.data)); // Removed debug alert
            if (response.data && (response.data.result === 'success' || response.data.status === 'success' || response.data.affectedRows > 0)) {
                 Toast.show({ type: 'success', text1: 'Reply sent successfully' });
                 setReplyMessage(''); // Clear input
                 fetchDetails(selectedFeedback.id); // Refresh conversation
                 // setReplyModalVisible(false); // Keep modal open to show new message
                 loadFeedbacks(); // Refresh main list in background
            } else {
                 Toast.show({ type: 'info', text1: 'Server responded, check debug log' });
                 fetchDetails(selectedFeedback.id); // Try refreshing anyway
            }
        } catch (error) {
            console.error("Reply Error:", error);
            console.error("Payload:", {
                id: selectedFeedback.id,
                comment: replyMessage,
                owner: phone,
                branchid,
                role
            });
            Toast.show({ type: 'error', text1: 'Failed to send reply' });
        } finally {
            setSendingReply(false);
        }
    };

    const renderHeader = () => (
        <View style={styles.filterContainer}>
            <TouchableOpacity 
                style={[styles.filterButton, statusFilter === 'open' && { backgroundColor: primary?.backgroundColor || '#6200ee' }]}
                onPress={() => setStatusFilter('open')}
            >
                <Text style={[styles.filterText, statusFilter === 'open' ? { color: '#fff' } : { color: '#555' }]}>Open Queries</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
                style={[styles.filterButton, statusFilter === 'closed' && { backgroundColor: primary?.backgroundColor || '#6200ee' }]}
                onPress={() => setStatusFilter('closed')}
            >
                <Text style={[styles.filterText, statusFilter === 'closed' ? { color: '#fff' } : { color: '#555' }]}>Closed Queries</Text>
            </TouchableOpacity>
        </View>
    );

    const renderMessageItem = ({ item }) => {
        // Logic: Student on Left, Admin/Staff (Me) on Right
        // In this Admin app, we are the Admin/Staff.
        const isStudent = item.role === 'student';
        const align = isStudent ? 'flex-start' : 'flex-end';
        const bgColor = isStudent ? '#e0e0e0' : (primary?.backgroundColor || '#6200ee');
        const textColor = isStudent ? '#000' : '#fff';

        return (
            <View style={[styles.messageBubble, { alignSelf: align, backgroundColor: bgColor }]}>
                <Text style={[styles.messageText, { color: textColor }]}>{item.comment}</Text>
                <Text style={[styles.messageTime, { color: textColor, opacity: 0.7 }]}>
                    {isStudent ? item.name : 'Me'} @ {item.ttim}
                </Text>
            </View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: background?.backgroundColor || '#f5f5f5' }]}>
            {renderHeader()}

            {loading ? (
                <ActivityIndicator size="large" color={primary?.backgroundColor || '#6200ee'} style={{ marginTop: 20 }} />
            ) : (
                <FlatList
                    data={feedbacks}
                    renderItem={({ item }) => <FeedbackItem item={item} onReply={handleReplyPress} />}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={{ padding: 15 }}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Icon name="comment-check-outline" size={64} color="#ccc" />
                            <Text style={{ color: '#999', marginTop: 10 }}>No {statusFilter} queries found</Text>
                        </View>
                    }
                />
            )}

            {/* Reply Modal */}
            <Modal
                visible={replyModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setReplyModalVisible(false)}
            >
                <KeyboardAvoidingView 
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
                    style={styles.modalOverlay}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Query Thread</Text>
                            <TouchableOpacity onPress={() => setReplyModalVisible(false)}>
                                <Icon name="close" size={24} color="#000" />
                            </TouchableOpacity>
                        </View>
                        
                        {loadingDetails ? (
                            <ActivityIndicator size="large" color={primary?.backgroundColor || '#6200ee'} style={{ flex: 1 }} />
                        ) : (
                            <FlatList
                                data={feedbackDetails}
                                renderItem={renderMessageItem}
                                keyExtractor={(item, index) => index.toString()}
                                style={styles.messageList}
                                contentContainerStyle={{ paddingTop: 10, paddingBottom: 10 }}
                                inverted={false} // Should be unnecessary if list is chronological order
                            />
                        )}

                        <TextInput
                            style={styles.replyInput}
                            placeholder="Type your reply here..."
                            multiline
                            numberOfLines={2}
                            textAlignVertical="top"
                            value={replyMessage}
                            onChangeText={setReplyMessage}
                        />

                        <TouchableOpacity 
                            style={[styles.sendButton, { backgroundColor: primary?.backgroundColor || '#6200ee' }]}
                            onPress={sendReply}
                            disabled={sendingReply}
                        >
                            {sendingReply ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.sendButtonText}>Send Reply</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    filterContainer: {
        flexDirection: 'row',
        padding: 10,
        backgroundColor: '#fff',
        elevation: 2,
    },
    filterButton: {
        flex: 1,
        padding: 12,
        alignItems: 'center',
        borderRadius: 25,
        marginHorizontal: 5,
        borderWidth: 1,
        borderColor: '#eee',
    },
    filterText: {
        fontWeight: 'bold',
        fontSize: 14,
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 50,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end', 
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        height: '80%', // Increased height for chat view
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: 10,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    messageList: {
        flex: 1,
        marginBottom: 10,
    },
    messageBubble: {
        maxWidth: '80%',
        padding: 10,
        borderRadius: 10,
        marginBottom: 10,
    },
    messageText: {
        fontSize: 15,
        marginBottom: 5,
    },
    messageTime: {
        fontSize: 10,
        textAlign: 'right',
    },
    replyInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 25,
        paddingHorizontal: 20,
        paddingVertical: 10,
        fontSize: 16,
        backgroundColor: '#fafafa',
        marginBottom: 10,
        maxHeight: 100,
    },
    sendButton: {
        padding: 12,
        borderRadius: 25,
        alignItems: 'center',
    },
    sendButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
