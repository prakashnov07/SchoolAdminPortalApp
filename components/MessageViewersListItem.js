import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { Card } from 'react-native-elements';

const MessageViewersListItem = ({ item, index }) => {
    const { name, roll, contact, clas, rtime } = item;
    const qname = `${name} (Roll: ${roll})`;

    return (
        <Card containerStyle={styles.cardContainer}>
            <View style={styles.row}>
                <Text style={styles.text}>{qname}</Text>
                <Text style={styles.text}>{clas}</Text>
                <Text style={styles.text}>{contact}</Text>
            </View>
            <View style={styles.row}>
                <Text style={styles.subText}>Viewed at {rtime}</Text>
            </View>
        </Card>
    );
};

const styles = StyleSheet.create({
    cardContainer: {
        borderRadius: 10,
        padding: 10,
        margin: 5,
        elevation: 2,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5,
    },
    text: {
        fontSize: 12,
        color: '#333',
        fontWeight: 'bold',
    },
    subText: {
        fontSize: 10,
        color: '#666',
    },
});

export default React.memo(MessageViewersListItem);
