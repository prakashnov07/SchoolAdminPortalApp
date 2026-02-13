import React, { useState, useEffect, useContext } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, ActivityIndicator, StyleSheet, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import axios from 'axios';
import { CoreContext } from '../context/CoreContext';
import { StyleContext } from '../context/StyleContext';

export default function DriverBusesScreen({ navigation }) {
    const coreContext = useContext(CoreContext);
    const styleContext = useContext(StyleContext);
    const { branchid, phone, role } = coreContext;

    const [buses, setBuses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDriverBuses();
    }, []);

    const fetchDriverBuses = () => {
        setLoading(true);
        axios.get('/driver-buses', { params: { branchid, owner: phone, role } })
            .then(response => {
                if (response.data && response.data.buses) {
                    setBuses(response.data.buses);
                } else {
                    setBuses([]);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error('Fetch Buses Error:', err);
                setLoading(false);
                // Alert.alert('Error', 'Failed to fetch buses');
            });
    };

    const handleStartStop = (item, action) => {
        // Placeholder for future implementation
        Alert.alert(
            action === 'start' ? 'Start Tracking' : 'Stop Tracking',
            `This feature is coming soon.\nBus Info: ${item.busno} (${item.id})`
        );
        
        // Legacy Action: Actions.busRoute({ busid: item.id, busno: item.busno, action: action });
    };

    const handleViewMap = (item) => {
        if (item.location_link) {
            // If direct link exists
            Linking.openURL(item.location_link).catch(err => 
                Alert.alert('Error', 'Could not open map link')
            );
        } else {
            // Check status first logic from legacy
             axios.get('/bus-running-status', { params: { id: item.id, branchid } })
                .then(response => {
                    if (response.data.status === 'no') {
                        Alert.alert('Info', 'Bus is currently not running...');
                    } else {
                         // Go to Map Screen
                         navigation.navigate('StudentBusRouteScreen', { busId: item.id, busNo: item.busno });
                    }
                })
                .catch(err => {
                    console.error(err);
                    Alert.alert('Error', 'Could not check bus status');
                });
        }
    };

    const renderItem = ({ item }) => {
        const isRunning = item.is_running === 'yes';
        const isDriver = item.is_driver === 'yes';

        return (
            <View style={styleContext.card}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Icon name="bus" size={24} color={styleContext.colors?.primary || '#5a45d4'} />
                        <Text style={{ fontSize: 18, fontWeight: 'bold', marginLeft: 10, color: styleContext.blackColor }}>
                            Bus No. {item.busno}
                        </Text>
                    </View>
                    {isRunning && (
                        <View style={{ backgroundColor: '#e8f5e9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 }}>
                            <Text style={{ color: '#2e7d32', fontSize: 12, fontWeight: 'bold' }}>RUNNING</Text>
                        </View>
                    )}
                </View>
                
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
                    <TouchableOpacity 
                        style={[styles.actionBtn, { backgroundColor: '#28a745', flex: isDriver ? 0.48 : 1 }]}
                        onPress={() => handleViewMap(item)}
                    >
                         <Icon name="map-marker" size={18} color="#fff" style={{ marginRight: 5 }} />
                        <Text style={styles.btnText}>View on Map</Text>
                    </TouchableOpacity>

                    {isDriver && (
                        <TouchableOpacity 
                            style={[styles.actionBtn, { backgroundColor: isRunning ? '#d32f2f' : '#D33A2C', flex: 0.48 }]}
                            onPress={() => handleStartStop(item, isRunning ? 'stop' : 'start')}
                        >
                            <Icon name={isRunning ? "stop" : "play"} size={18} color="#fff" style={{ marginRight: 5 }} />
                            <Text style={styles.btnText}>{isRunning ? 'Stop' : 'Start'}</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styleContext.background} edges={['bottom', 'left', 'right']}>
             {loading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={styleContext.colors?.primary || '#5a45d4'} />
                </View>
            ) : (
                <FlatList
                    data={buses}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={{ padding: 16, paddingBottom: 30 }}
                    ListEmptyComponent={
                        <View style={{ alignItems: 'center', marginTop: 50 }}>
                            <Icon name="bus-alert" size={50} color="#ccc" />
                            <Text style={{ marginTop: 10, color: '#666', fontSize: 16 }}>No buses found</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    actionBtn: {
        flexDirection: 'row',
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        height: 45
    },
    btnText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14
    }
});
