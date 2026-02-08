import React, { useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';
import { CoreContext } from '../context/CoreContext';
import { StyleContext } from '../context/StyleContext';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

export default function MarksEntryScreen({ navigation }) {
    const { schoolData, branchid, owner } = useContext(CoreContext);
    const { background, primary, text } = useContext(StyleContext);
    const [isLoading, setIsLoading] = useState(true);

    const constructUrl = () => {
        if (schoolData && schoolData.studentimgpath) {
            // Remove '#' from color for URL param
            const color = primary?.backgroundColor ? primary.backgroundColor.replace('#', '') : '5a45d4';
            return schoolData.studentimgpath + 'marks_entry_app.php?branchid=' + branchid + '&appcode=tk558ygnp0099x23' + '&mobile=' + owner + '&bgcolor=' + color;
        }
        return null;
    };

    const url = constructUrl();

    if (!url) {
         return (
             <View style={[styles.container, { backgroundColor: background?.backgroundColor || '#fff', justifyContent: 'center', alignItems: 'center' }]}>
                 <Text style={{ color: text?.color || '#000' }}>Error: Invalid School Data</Text>
             </View>
         );
    }

    const injectedJavaScript = `
        (function() {
            function enforceNumeric() {
                var inputs = document.getElementsByTagName('input');
                for (var i = 0; i < inputs.length; i++) {
                    // Check if type is text and inputmode is not yet set
                    if (inputs[i].type === 'text') {
                        inputs[i].setAttribute('inputmode', 'decimal');
                        inputs[i].setAttribute('keyboardType', 'numeric'); // Helper for some browsers
                    }
                }
            }
            // Run immediately
            enforceNumeric();
            // Run periodically to handle dynamic content loading
            setInterval(enforceNumeric, 1000);
        })();
        true;
    `;

    return (
        <View style={[styles.container, { backgroundColor: background?.backgroundColor || '#fff' }]}>
            <WebView
                source={{ uri: url }}
                style={{ flex: 1 }}
                onLoadStart={() => setIsLoading(true)}
                onLoadEnd={() => setIsLoading(false)}
                injectedJavaScript={injectedJavaScript}
            />
            {isLoading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color={primary?.backgroundColor || "#1976d2"} />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        zIndex: 1,
    }
});
