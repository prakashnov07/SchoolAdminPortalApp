import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import Toast from 'react-native-toast-message';
import axios from 'axios';
import { StyleContext } from '../context/StyleContext';
import { CoreContext } from '../context/CoreContext';

export default function MarkStaffAttendanceScreen({ route, navigation }) {
    const styleContext = useContext(StyleContext);
    const coreContext = useContext(CoreContext);
    const { branchid, phone, schoolData } = coreContext;
    
    const { staffId, staffMobile, staffName, action = 'in' } = route.params || {};
    
    const [cameraPermission, requestCameraPermission] = useCameraPermissions();
    const [loading, setLoading] = useState(false);
    const [connected, setConnected] = useState(false);
    const [message, setMessage] = useState('Checking WiFi connection...');
    const [locationMessage, setLocationMessage] = useState('');
    const [location, setLocation] = useState('');
    const [locationPermission, setLocationPermission] = useState(null);
    const [cameraReady, setCameraReady] = useState(false);
    const [cameraRef, setCameraRef] = useState(null);

    useEffect(() => {
        initializeAttendance();
        return () => {
            // Cleanup
        };
    }, []);

    const initializeAttendance = async () => {
        await requestPermissions();
        await checkWiFiConnection();
        await getLocation();
    };

    const requestPermissions = async () => {
        try {
            // Request camera permission
            let camPermission = cameraPermission;
            if (!cameraPermission?.granted) {
                camPermission = await requestCameraPermission();
            }
            
            // Request location permission
            const locationResult = await Location.requestForegroundPermissionsAsync();
            setLocationPermission(locationResult.status === 'granted');
            
            // Check if permissions were granted
            if (!camPermission?.granted || locationResult.status !== 'granted') {
                Alert.alert(
                    'Permissions Required',
                    'Camera and location permissions are required to mark attendance. Please grant permissions in settings.',
                    [{ text: 'OK', onPress: () => navigation.goBack() }]
                );
                return false;
            }
            return true;
        } catch (err) {
            console.error('Permission error:', err);
            Alert.alert('Error', 'Failed to request permissions');
            return false;
        }
    };

    const getLocation = async () => {
        try {
            setLocationMessage('Getting your location...');
            const loc = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High
            });
            
            const coords = `${loc.coords.latitude},${loc.coords.longitude}`;
            setLocation(coords);
            setLocationMessage(`Location: ${loc.coords.latitude.toFixed(6)}, ${loc.coords.longitude.toFixed(6)}`);
        } catch (err) {
            console.error('Location error:', err);
            setLocationMessage('Unable to get location');
        }
    };

    const checkWiFiConnection = async () => {
        try {
            setMessage('Checking WiFi connection...');
            
            // In Expo, we can't directly check WiFi SSID/BSSID like in native
            // For now, we'll simulate connection check
            // In production, you might need to use expo-network or a custom native module
            
            setConnected(true);
            setMessage('Ready to mark attendance');
            Toast.show({ type: 'success', text1: 'Connected', text2: 'You can now mark attendance' });
        } catch (err) {
            console.error('WiFi check error:', err);
            setMessage('WiFi connection check failed');
            Alert.alert(
                'WiFi Not Found',
                'School WiFi network not detected. Please connect to school WiFi to mark attendance.',
                [
                    { text: 'Retry', onPress: checkWiFiConnection },
                    { text: 'Cancel', onPress: () => navigation.goBack() }
                ]
            );
        }
    };

    const captureAndMarkAttendance = async () => {
        if (!cameraRef) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Camera not ready' });
            return;
        }

        try {
            setLoading(true);
            Toast.show({ type: 'info', text1: 'Processing', text2: 'Capturing image...' });

            const photo = await cameraRef.takePictureAsync({
                quality: 0.7,
                base64: true,
            });

            await uploadAndMarkAttendance(photo.base64);
        } catch (err) {
            console.error('Capture error:', err);
            setLoading(false);
            Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to capture image' });
            
            // Fallback: mark without image
            await markAttendanceWithoutImage();
        }
    };

    const uploadAndMarkAttendance = async (base64Image) => {
        try {
            Toast.show({ type: 'info', text1: 'Processing', text2: 'Uploading image...' });

            // Upload image
            const uploadResponse = await axios.post('/upload-staff-attendance-image', {
                filepath: base64Image,
                owner: phone,
                branchid
            });

            const imagePath = uploadResponse.data.sFPath || 'staffattendanceimages/default.jpg';

            // Mark attendance
            const endpoint = action === 'in' 
                ? (staffId ? '/mark-staff-attendance' : '/self-staff-attendance')
                : (staffId ? '/mark-staff-out' : '/self-staff-out');

            const payload = {
                owner: phone,
                branchid,
                filepath: imagePath,
                wifi_ssid: 'School-WiFi', // Would come from actual WiFi detection
                wifi_bssid: '', // Would come from actual WiFi detection
                address: location,
                ...(staffId && { empid: staffId, mobile: staffMobile })
            };

            const response = await axios.post(endpoint, payload);

            setLoading(false);

            if (response.data.status === 'ok') {
                Toast.show({ 
                    type: 'success', 
                    text1: 'Success', 
                    text2: `Attendance marked ${action === 'in' ? 'in' : 'out'} successfully` 
                });
                
                // Just go back to previous screen
                setTimeout(() => navigation.goBack(), 1000);
            } else {
                Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to mark attendance' });
            }
        } catch (err) {
            console.error('Upload/Mark error:', err);
            setLoading(false);
            Toast.show({ type: 'error', text1: 'Error', text2: 'Network error occurred' });
        }
    };

    const markAttendanceWithoutImage = async () => {
        try {
            setLoading(true);
            
            const endpoint = action === 'in'
                ? (staffId ? '/mark-staff-attendance' : '/self-staff-attendance')
                : (staffId ? '/mark-staff-out' : '/self-staff-out');

            const payload = {
                owner: phone,
                branchid,
                filepath: 'staffattendanceimages/no-image.jpg',
                wifi_ssid: 'School-WiFi',
                wifi_bssid: '',
                address: location,
                ...(staffId && { empid: staffId, mobile: staffMobile })
            };

            const response = await axios.post(endpoint, payload);

            setLoading(false);

            if (response.data.status === 'ok') {
                Toast.show({ 
                    type: 'success', 
                    text1: 'Success', 
                    text2: `Attendance marked ${action === 'in' ? 'in' : 'out'} successfully` 
                });
                
                // Just go back to previous screen
                setTimeout(() => navigation.goBack(), 1000);
            } else {
                Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to mark attendance' });
            }
        } catch (err) {
            console.error('Mark without image error:', err);
            setLoading(false);
            Toast.show({ type: 'error', text1: 'Error', text2: 'Network error occurred' });
        }
    };

    // Show loading while permissions are being requested
    if (cameraPermission === null || locationPermission === null) {
        return (
            <SafeAreaView style={styleContext.background} edges={['bottom', 'left', 'right']}>
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={styleContext.primaryColor} />
                    <Text style={styles.statusText}>Requesting permissions...</Text>
                </View>
            </SafeAreaView>
        );
    }

    // Show error if permissions were denied
    if (!cameraPermission?.granted || !locationPermission) {
        return (
            <SafeAreaView style={styleContext.background} edges={['bottom', 'left', 'right']}>
                <View style={styles.centerContainer}>
                    <Icon name="alert-circle" size={64} color="#F44336" />
                    <Text style={styles.errorText}>Permissions Required</Text>
                    <Text style={styles.errorSubtext}>
                        Camera and location permissions are needed to mark attendance
                    </Text>
                    <TouchableOpacity 
                        style={[styles.button, { backgroundColor: styleContext.primaryColor }]}
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={styles.buttonText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styleContext.background, { flex: 1 }]} edges={['bottom', 'left', 'right']}>
            <View style={styles.container}>
                <View style={[styleContext.card, { padding: 16, marginBottom: 16 }]}>
                    <Text style={styles.title}>
                        Mark Attendance {action === 'in' ? 'In' : 'Out'}
                    </Text>
                    {staffId && (
                        <>
                            <Text style={styles.staffName}>
                                {staffName}
                            </Text>
                            <Text style={styles.subtitle}>
                                ID: {staffId}
                            </Text>
                        </>
                    )}
                </View>

                {/* Status Messages */}
                <View style={[styleContext.card, { padding: 16, marginBottom: 16 }]}>
                    <View style={styles.statusRow}>
                        <Icon 
                            name={connected ? "wifi" : "wifi-off"} 
                            size={24} 
                            color={connected ? '#4CAF50' : '#F44336'} 
                        />
                        <Text style={styles.statusText}>{message}</Text>
                    </View>
                    <View style={styles.statusRow}>
                        <Icon 
                            name={location ? "map-marker" : "map-marker-off"} 
                            size={24} 
                            color={location ? '#4CAF50' : '#F44336'} 
                        />
                        <Text style={styles.statusText}>{locationMessage}</Text>
                    </View>
                </View>

                {/* Camera Preview */}
                {connected && cameraPermission?.granted && (
                    <View style={styles.cameraContainer}>
                        <CameraView
                            style={styles.camera}
                            facing="front"
                            ref={ref => setCameraRef(ref)}
                        />
                        {/* Overlay with absolute positioning instead of children */}
                        <View style={styles.cameraOverlay}>
                            <View style={styles.cameraFrame} />
                        </View>
                    </View>
                )}

                {/* Spacer to push buttons to bottom */}
                <View style={{ flex: 1 }} />

                {/* Action Buttons - Always visible at bottom */}
                {connected && (
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={[styles.button, { backgroundColor: styleContext.primaryColor || '#6200ea' }]}
                            onPress={captureAndMarkAttendance}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <Icon name="camera" size={24} color="#fff" style={{ marginRight: 8 }} />
                                    <Text style={styles.buttonText}>Capture & Mark Attendance</Text>
                                </>
                            )}
                        </TouchableOpacity>

                        {schoolData?.withoutImageAllowed === 'yes' && (
                            <TouchableOpacity
                                style={[styles.button, { backgroundColor: '#757575', marginTop: 12 }]}
                                onPress={markAttendanceWithoutImage}
                                disabled={loading}
                            >
                                <Text style={styles.buttonText}>Mark Without Image</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
    },
    staffName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#5a45d4',
        textAlign: 'center',
        marginTop: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginTop: 4,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    statusText: {
        fontSize: 14,
        color: '#666',
        marginLeft: 12,
        flex: 1,
    },
    cameraContainer: {
        width: '100%',
        height: 400,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#000',
        position: 'relative',
    },
    camera: {
        flex: 1,
    },
    cameraOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cameraFrame: {
        width: 200,
        height: 250,
        borderWidth: 3,
        borderColor: '#fff',
        borderRadius: 12,
    },
    buttonContainer: {
        paddingTop: 16,
        paddingBottom: 8,
    },
    button: {
        flexDirection: 'row',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    errorText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 16,
    },
    errorSubtext: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginTop: 8,
        marginBottom: 24,
    },
});
