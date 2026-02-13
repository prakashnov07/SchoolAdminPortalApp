import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

export default function WarningScreen({ navigation }) {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Icon name="alert-circle" size={80} color="#ff4444" />
                <Text style={styles.title}>Warning</Text>
                <Text style={styles.message}>
                    Your session or access rights may have expired or are invalid for this operation.
                </Text>
                <Text style={styles.subMessage}>
                    Please contact support or try logging in again.
                </Text>
                
                <TouchableOpacity 
                    style={styles.button}
                    onPress={() => navigation.navigate('MobileNumberVerification')}
                >
                    <Text style={styles.buttonText}>Go to Login</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        justifyContent: 'center',
        padding: 20
    },
    content: {
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#ff4444',
        marginTop: 20,
        marginBottom: 10
    },
    message: {
        fontSize: 16,
        color: '#333',
        textAlign: 'center',
        marginBottom: 10
    },
    subMessage: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 30
    },
    button: {
        backgroundColor: '#5a45d4',
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 25,
        elevation: 3
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold'
    }
});
