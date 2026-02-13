import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, Platform, PermissionsAndroid, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import WifiManager from "react-native-wifi-reborn";
import { CoreContext } from '../context/CoreContext';
import { StyleContext } from '../context/StyleContext';

export default function WifiSettingsScreen({ navigation }) {
    const coreContext = useContext(CoreContext);
    const styleContext = useContext(StyleContext);
    const { branchid } = coreContext;

    const [mergedList, setMergedList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [scanning, setScanning] = useState(false);

    useEffect(() => {
        initializeWifiData();
    }, []);

    const initializeWifiData = async () => {
        setLoading(true);
        await Promise.all([fetchSavedWifi(), scanWifiList()]);
        setLoading(false);
    };

    const fetchSavedWifi = async () => {
        try {
            const response = await axios.get('/get-multi-wifi-connection', { params: { branchid } });
            return response.data.wifis || [];
        } catch (err) {
            console.error('Fetch Saved Wifi Error:', err);
            return [];
        }
    };

    const requestLocationPermission = async () => {
        if (Platform.OS === 'ios') return true;
        try {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                {
                    title: 'Location Permission',
                    message: 'Noticeboard needs access to your location to scan for Wi-Fi networks.',
                    buttonNeutral: 'Ask Me Later',
                    buttonNegative: 'Cancel',
                    buttonPositive: 'OK',
                },
            );
            return granted === PermissionsAndroid.RESULTS.GRANTED;
        } catch (err) {
            console.warn(err);
            return false;
        }
    };

    const scanWifiList = async () => {
        setScanning(true);
        try {
            const hasPermission = await requestLocationPermission();
            if (!hasPermission) {
                // Toast.show({ type: 'error', text1: 'Permission Denied', text2: 'Location permission required for scanning' });
                return [];
            }

            const isEnabled = await WifiManager.isEnabled();
            if (!isEnabled) {
                Alert.alert('Wi-Fi is Off', 'Please enable Wi-Fi to scan for networks.');
                return [];
            }

            const networks = await WifiManager.reScanAndLoadWifiList();
            
            // Filter duplicates and return
            const uniqueNetworks = networks.filter((v, i, a) => a.findIndex(t => (t.SSID === v.SSID)) === i);
            return uniqueNetworks || [];

        } catch (error) {
            console.warn('Scan Error:', error);
            // Toast.show({ type: 'error', text1: 'Scan Error', text2: 'Failed to scan networks' });
            return [];
        } finally {
            setScanning(false);
        }
    };

    // Merge logic: Combine saved and scanned. 
    // If in saved, mark as checked.
    // If in scanned but not saved, show as unchecked.
    // If in saved but not scanned (e.g. out of range), still show? -> Legacy usually shows available. 
    // User said "all available... and the ones which have been saved... are ticked".
    // So we primarily show SCANNED list, but ensure SAVED ones are marked.
    // What if a saved one is NOT in scanned list? We should probably show it too so they can untick it if needed.
    const mergeLists = (saved, scanned) => {
        const merged = [];
        const processedSSIDs = new Set();

        // 1. Add all scanned networks
        scanned.forEach(net => {
            const isSaved = saved.some(s => s.wifi_ssid === net.SSID);
            merged.push({
                ssid: net.SSID,
                bssid: net.BSSID,
                isSaved: isSaved,
                isAvailable: true
            });
            processedSSIDs.add(net.SSID);
        });

        // 2. Add saved networks that were NOT found in scan (optional, but good UX to allow deletion)
        // User requested to ONLY show available (scanned) networks, matching legacy behavior.
        // saved.forEach(save => {
        //     if (!processedSSIDs.has(save.wifi_ssid)) {
        //         merged.push({
        //             ssid: save.wifi_ssid,
        //             bssid: save.wifi_bssid,
        //             isSaved: true,
        //             isAvailable: false // Not currently in range
        //         });
        //         processedSSIDs.add(save.wifi_ssid);
        //     }
        // });
        
        // Sort: Saved first, then Available
        merged.sort((a, b) => {
            if (a.isSaved === b.isSaved) return 0;
            return a.isSaved ? -1 : 1;
        });

        setMergedList(merged);
    };

    // Modified initialize to use state setters after fetching
    const refreshData = async () => {
        setLoading(true);
        try {
            const saved = await fetchSavedWifi();
            const scanned = await scanWifiList();
            mergeLists(saved, scanned);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    // Initial load
    useEffect(() => {
        refreshData();
    }, []);

    const toggleWifi = async (item, newValue) => {
        // Optimistic update
        const originalList = [...mergedList];
        const updatedList = mergedList.map(net => 
            net.ssid === item.ssid ? { ...net, isSaved: newValue } : net
        );
        setMergedList(updatedList);

        try {
            if (newValue) {
                // Add
                const response = await axios.post('/set-multi-wifi-connection', { 
                    ssid: item.ssid, 
                    bssid: item.bssid || '', 
                    branchid 
                });
                if (response.data.status === 'ok') {
                    Toast.show({ type: 'success', text1: 'Saved', text2: `${item.ssid} added.` });
                } else {
                    throw new Error('Failed to save');
                }
            } else {
                // Delete
                const response = await axios.post('/delete-wifi-connection', { 
                    ssid: item.ssid, 
                    branchid 
                });
                if (response.data.status === 'ok') {
                    Toast.show({ type: 'success', text1: 'Removed', text2: `${item.ssid} removed.` });
                } else {
                    throw new Error('Failed to delete');
                }
            }
        } catch (error) {
            console.error(error);
            Toast.show({ type: 'error', text1: 'Error', text2: 'Operation failed' });
            // Revert on error
            setMergedList(originalList);
        }
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardContent}>
                <View style={styles.iconContainer}>
                    <Icon name={item.isAvailable ? "wifi" : "wifi-off"} size={24} color={item.isAvailable ? (styleContext.primaryColor || '#5a45d4') : '#999'} />
                </View>
                <View style={styles.textContainer}>
                    <Text style={[styles.ssidText, !item.isAvailable && { color: '#999' }]}>{item.ssid}</Text>
                    {item.bssid ? <Text style={styles.bssidText}>{item.bssid}</Text> : null}
                    {!item.isAvailable && <Text style={styles.statusText}>(Out of range)</Text>}
                </View>
                <Switch
                    trackColor={{ false: "#767577", true: "#81b0ff" }}
                    thumbColor={item.isSaved ? (styleContext.primaryColor || "#f5dd4b") : "#f4f3f4"}
                    ios_backgroundColor="#3e3e3e"
                    onValueChange={(val) => toggleWifi(item, val)}
                    value={item.isSaved}
                />
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Wi-Fi Connections</Text>
                <TouchableOpacity 
                    style={[styles.scanButton, { backgroundColor: styleContext.primaryColor || '#5a45d4' }]}
                    onPress={refreshData}
                    disabled={loading || scanning}
                >
                    {scanning ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.scanButtonText}>Re-Scan</Text>}
                </TouchableOpacity>
            </View>

            <View style={styles.infoBanner}>
                <Text style={styles.infoText}>Tick the box to allow attendance from that network.</Text>
            </View>

            {loading && !scanning ? (
                <ActivityIndicator size="large" color={styleContext.primaryColor || '#5a45d4'} style={{ marginTop: 20 }} />
            ) : (
                <FlatList
                    data={mergedList}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.ssid + (item.bssid || '')}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Icon name="wifi-off" size={48} color="#ccc" />
                            <Text style={styles.emptyText}>No Wi-Fi networks found.</Text>
                        </View>
                    }
                    contentContainerStyle={{ paddingBottom: 20 }}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    scanButton: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
    },
    scanButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 12,
    },
    infoBanner: {
        backgroundColor: '#e3f2fd',
        padding: 10,
        alignItems: 'center',
    },
    infoText: {
        color: '#1976d2',
        fontSize: 12,
    },
    card: {
        backgroundColor: '#fff',
        marginHorizontal: 10,
        marginTop: 10,
        borderRadius: 8,
        elevation: 1,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
    },
    iconContainer: {
        marginRight: 15,
    },
    textContainer: {
        flex: 1,
    },
    ssidText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    bssidText: {
        fontSize: 12,
        color: '#888',
        marginTop: 2,
    },
    statusText: {
        fontSize: 10,
        color: '#999',
        fontStyle: 'italic',
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 50,
    },
    emptyText: {
        marginTop: 10,
        color: '#999',
    },
});
