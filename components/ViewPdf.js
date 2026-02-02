import React, { useState } from 'react';
import { View, StyleSheet, Dimensions, Platform, ActivityIndicator, Text, TouchableOpacity, Linking } from 'react-native';
import Pdf from 'react-native-pdf';
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
                await WebBrowser.openBrowserAsync(contentUrl);
            }
        } catch (error) {
            console.warn(error);
            Toast.show({ type: 'error', text1: 'Could not open PDF' });
            Linking.openURL(contentUrl);
        }
    };

    if (!contentUrl) return null;

    const source = { uri: contentUrl, cache: true };

    return (
        <View style={pdfStyles.container}>
            {/* Inline PDF Viewer */}
            <View style={pdfStyles.pdfContainer}>
                <Pdf
                    trustAllCerts={false}
                    source={source}
                    minScale={1.0}
                    maxScale={4.0}
                    fitPolicy={0}
                    spacing={10}
                    horizontal={false}
                    onLoadComplete={(numberOfPages, filePath) => {
                        console.log(`Number of pages: ${numberOfPages}`);
                    }}
                    onPageChanged={(page, numberOfPages) => {
                        console.log(`Current page: ${page}`);
                    }}
                    onError={(error) => {
                        console.log(error);
                    }}
                    onPressLink={(uri) => {
                        console.log(`Link pressed: ${uri}`);
                    }}
                    style={pdfStyles.pdf}
                />
            </View>

            {/* Fallback / Full Screen Button */}
            <CardSection justifyContent="center">
                <TouchableOpacity 
                    onPress={openInAppBrowser}
                    style={pdfStyles.button}
                >
                    <Icon name="open-in-new" size={20} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={pdfStyles.buttonText}>Open Full Screen</Text>
                </TouchableOpacity>
            </CardSection>
        </View>
    );
};

const pdfStyles = StyleSheet.create({
    container: {
        marginTop: 10,
        marginBottom: 10,
        backgroundColor: '#f0f0f0',
        borderRadius: 10,
        overflow: 'hidden',
    },
    pdfContainer: {
        height: 350,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#e0e0e0',
    },
    pdf: {
        flex: 1,
        width: Dimensions.get('window').width - 60, // approximate width minus padding
        height: 350,
        backgroundColor: '#f0f0f0'
    },
    button: {
        flexDirection: 'row',
        backgroundColor: '#555',
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 5
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    }
});

export default ViewPdf;
