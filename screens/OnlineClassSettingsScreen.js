import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, TextInput, Switch, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import { CoreContext } from '../context/CoreContext';
import { StyleContext } from '../context/StyleContext';
import OnlineClassMenu from '../components/OnlineClassMenu';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

const OnlineClassSettingsScreen = ({ navigation }) => {
    const { phone, branchid, updateClassUrl, classUrl } = useContext(CoreContext);
    const styleContext = useContext(StyleContext);
    
    const [link, setLink] = useState(classUrl || '');
    const [updateAll, setUpdateAll] = useState(false);
    const [loading, setLoading] = useState(false);
    const [verified, setVerified] = useState(false);
    const [menuVisible, setMenuVisible] = useState(false);

    useEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <TouchableOpacity onPress={() => setMenuVisible(true)} style={{ marginRight: 15 }}>
                     <Icon name="dots-vertical" size={26} color="#fff" />
                </TouchableOpacity>
            ),
        });
        if (classUrl) setLink(classUrl);
    }, [classUrl]);

    const detectURLs = (message) => {
        if (!message) return '';
        const words = message.split(/\s+/);
        for (let word of words) {
            if (word.startsWith('http://') || word.startsWith('https://') || word.startsWith('www.') || word.startsWith('meet.')) {
                return word;
            }
        }
        return '';
    };

    const handleVerify = () => {
        const detected = detectURLs(link);
        if (detected) {
            setLink(detected);
            setVerified(true);
            Toast.show({ type: 'success', text1: 'Link valid & extracted' });
        } else {
            setVerified(false);
            Toast.show({ type: 'error', text1: 'No valid link found' });
        }
    };

    const handleUpdate = async () => {
        if (!link) return Toast.show({ type: 'error', text1: 'Link cannot be empty' });
        
        setLoading(true);
        try {
            const action = updateAll ? 'update-all' : 'not-class-links';
            await axios.post('/set-class-url', {
                link,
                action,
                phone,
                branchid
            });
            Toast.show({ type: 'success', text1: 'Settings updated successfully' });
        } catch (error) {
            console.error(error);
            Toast.show({ type: 'error', text1: 'Failed to update settings' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <OnlineClassMenu visible={menuVisible} onClose={() => setMenuVisible(false)} />
            
            <View style={styles.card}>
                <Text style={styles.label}>Default Meeting Link</Text>
                <TextInput
                    style={styles.input}
                    value={link}
                    onChangeText={(text) => {
                        setLink(text);
                        setVerified(false);
                    }}
                    placeholder="Enter Zoom/Meet link here"
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                />
                
                <View style={styles.row}>
                    <Text style={styles.switchLabel}>Update this link in all my classes</Text>
                    <Switch value={updateAll} onValueChange={setUpdateAll} />
                </View>

                {verified ? (
                    <TouchableOpacity 
                        style={[styles.btn, { backgroundColor: styleContext.primary?.backgroundColor || '#6200ee' }]} 
                        onPress={handleUpdate}
                        disabled={loading}
                    >
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Update Settings</Text>}
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity 
                        style={[styles.btn, { backgroundColor: '#d32f2f' }]} 
                        onPress={handleVerify}
                    >
                        <Text style={styles.btnText}>Verify Link</Text>
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.infoCard}>
                <Text style={styles.infoText}>
                    Note: Setting a default link here allows you to quickly schedule classes without re-entering the link every time. 
                    Checking "Update all" will replace links in all your existing future schedules.
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#f5f5f5',
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 20,
        elevation: 3,
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 5,
        padding: 10,
        backgroundColor: '#fafafa',
        fontSize: 16,
        marginBottom: 20,
        minHeight: 80,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    switchLabel: {
        flex: 1,
        fontSize: 14,
        color: '#555',
        marginRight: 10,
    },
    btn: {
        padding: 15,
        borderRadius: 5,
        alignItems: 'center',
    },
    btnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    infoCard: {
        backgroundColor: '#e3f2fd',
        padding: 15,
        borderRadius: 5,
    },
    infoText: {
        color: '#0d47a1',
        fontSize: 13,
        lineHeight: 20,
    },
});

export default OnlineClassSettingsScreen;
