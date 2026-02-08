import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { StyleContext } from '../context/StyleContext';

const FeedbackItem = ({ item, onReply }) => {
    const { card, text, primary } = useContext(StyleContext);

    // Determine status color
    const statusColor = item.fstatus === 'open' ? '#d32f2f' : '#388e3c';

    return (
        <View style={[styles.card, { backgroundColor: card?.backgroundColor || '#fff', borderColor: card?.borderColor || '#ddd' }]}>
            <View style={styles.header}>
                <Text style={[styles.studentName, { color: text?.color || '#000' }]}>{item.student}</Text>
                <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                    <Text style={styles.statusText}>{item.fstatus.toUpperCase()}</Text>
                </View>
            </View>

            <View style={styles.content}>
                <Text style={[styles.message, { color: text?.color || '#555' }]}>{item.message}</Text>
                
                <View style={styles.detailsRow}>
                    <Icon name="account" size={16} color="#777" />
                    <Text style={styles.detailText}>From: {item.askedFromName}</Text>
                </View>
                
                <View style={styles.detailsRow}>
                    <Icon name="calendar-clock" size={16} color="#777" />
                    <Text style={styles.detailText}>{item.ftim}</Text>
                </View>
            </View>

            <TouchableOpacity 
                style={[styles.replyButton, { backgroundColor: primary?.backgroundColor || '#6200ee' }]}
                onPress={() => onReply(item)}
            >
                <Text style={styles.replyButtonText}>View & Reply</Text>
                <Icon name="chevron-right" size={20} color="#fff" />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: 10,
        borderWidth: 1,
        marginBottom: 15,
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        backgroundColor: 'rgba(0,0,0,0.02)',
    },
    studentName: {
        fontSize: 16,
        fontWeight: 'bold',
        flex: 1,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    content: {
        padding: 15,
    },
    message: {
        fontSize: 14,
        marginBottom: 15,
        lineHeight: 20,
    },
    detailsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
    },
    detailText: {
        fontSize: 12,
        color: '#777',
        marginLeft: 5,
    },
    replyButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 12,
        borderBottomLeftRadius: 10,
        borderBottomRightRadius: 10,
    },
    replyButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        marginRight: 5,
    },
});

export default FeedbackItem;
