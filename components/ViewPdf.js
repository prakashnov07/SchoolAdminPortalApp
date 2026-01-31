import React, { useState } from 'react';
import { View, StyleSheet, Dimensions, Platform, ActivityIndicator, Text, TouchableOpacity, Linking } from 'react-native';
import * as WebBrowser from 'expo-web-browser'; // Standard in-app browser
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

// Local CardSection reuse
const CardSection = ({ children, justifyContent = 'flex-start' }) => (
  <View style={{ flexDirection: 'row', justifyContent, alignItems: 'center', padding: 5, position: 'relative' }}>{children}</View>
);

const ViewPdf = (props) => {

    const { contentUrl } = props;

    const openInAppBrowser = async () => {
        try {
            if (contentUrl) {
                // Opens in an in-app modal (Chrome Custom Tabs / Safari View Controller)
                // This feels "inline" but is fully capable of rendering PDFs
                await WebBrowser.openBrowserAsync(contentUrl);
            }
        } catch (error) {
            console.warn(error);
            Toast.show({ type: 'error', text1: 'Could not open PDF' });
            // Fallback to external linking if in-app fails
            Linking.openURL(contentUrl);
        }
    };

    if (!contentUrl) return null;

    return (
        <View style={pdfStyles.container}>
            <CardSection justifyContent="center">
                <TouchableOpacity 
                    onPress={openInAppBrowser}
                    style={pdfStyles.button}
                >
                    <Icon name="file-pdf-box" size={30} color="#fff" style={{ marginRight: 10 }} />
                    <Text style={pdfStyles.buttonText}>Click to View PDF</Text>
                    <Icon name="open-in-new" size={20} color="#fff" style={{ marginLeft: 10 }} />
                </TouchableOpacity>
            </CardSection>
        </View>
    );
};

const pdfStyles = StyleSheet.create({
    container: {
        marginTop: 10,
        marginBottom: 10,
    },
    button: {
        flexDirection: 'row',
        backgroundColor: '#D33A2C', // PDF Red color
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    }
});

export default ViewPdf;
