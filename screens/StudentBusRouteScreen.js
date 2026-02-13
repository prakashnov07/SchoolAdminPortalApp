import React, { useState, useEffect, useRef, useContext } from 'react';
import { View, Text, StyleSheet, Dimensions, Platform, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import axios from 'axios';
import { CoreContext } from '../context/CoreContext';
import { StyleContext } from '../context/StyleContext';

// Haversine formula to calculate distance
const haversine = (start, end) => {
    const toRad = x => (x * Math.PI) / 180;
    const R = 6371; // Earth radius in km

    const dLat = toRad(end.latitude - start.latitude);
    const dLon = toRad(end.longitude - start.longitude);
    const lat1 = toRad(start.latitude);
    const lat2 = toRad(end.latitude);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c * 1000; // Distance in meters
};

const screen = Dimensions.get('window');
const ASPECT_RATIO = screen.width / screen.height;
const LATITUDE_DELTA = 0.0057625;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

export default function StudentBusRouteScreen({ navigation, route }) {
    const coreContext = useContext(CoreContext);
    const styleContext = useContext(StyleContext);
    const { branchid } = coreContext;
    const { busId, busNo } = route.params;

    const [location, setLocation] = useState(null);
    const [busLocation, setBusLocation] = useState(null);
    const [headerText, setHeaderText] = useState('Fetching data...');
    const [distanceDisplay, setDistanceDisplay] = useState('');
    const [speed, setSpeed] = useState(0);
    const [eta, setEta] = useState('--');

    const mapRef = useRef(null);
    const distanceRef = useRef(null);
    const timeRef = useRef(null);
    const watchIdRef = useRef(null);

    useEffect(() => {
        (async () => {
             // Request Permissions
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission to access location was denied');
                return;
            }

            // Get Current Location
            let currentLocation = await Location.getCurrentPositionAsync({});
            setLocation(currentLocation.coords);

            // Start Tracking Bus
            startBusTracking(currentLocation.coords);
        })();

        return () => {
            if (watchIdRef.current) {
                clearInterval(watchIdRef.current);
            }
        };
    }, []);


    const startBusTracking = (userCoords) => {
        const intervalId = setInterval(() => {
            axios.get('/bus-current-location', { params: { id: busId, branchid } })
                .then(response => {
                    const { status, latitude, longitude } = response.data;

                    if (latitude && longitude) {
                        const busLat = parseFloat(latitude);
                        const busLong = parseFloat(longitude);
                        const newBusLocation = { latitude: busLat, longitude: busLong };
                        
                        setBusLocation(newBusLocation);
                        calculateMetrics(userCoords, newBusLocation);

                        // Animate Map
                        if (mapRef.current) {
                            mapRef.current.animateToRegion({
                                latitude: busLat,
                                longitude: busLong,
                                latitudeDelta: LATITUDE_DELTA,
                                longitudeDelta: LONGITUDE_DELTA,
                            }, 1000);
                        }

                    } else if (status === 'not-running') {
                         Alert.alert('Info', 'Bus has stopped running.', [
                             { text: 'OK', onPress: () => navigation.goBack() }
                         ]);
                         clearInterval(intervalId);
                    }
                })
                .catch(err => console.error('Bus Location Error:', err));
        }, 2000);
        watchIdRef.current = intervalId;
    };

    const calculateMetrics = (userCoords, busCoords) => {
        if (!userCoords || !busCoords) return;

        const start = { latitude: userCoords.latitude, longitude: userCoords.longitude };
        const end = { latitude: busCoords.latitude, longitude: busCoords.longitude };
        
        const dist = Math.round(haversine(start, end));
        const currTime = new Date().getTime() / 1000;

        let calculatedSpeed = 0;
        let calculatedEta = '--';
        let distStr = '';

        if (distanceRef.current && timeRef.current) {
             const distCovered = distanceRef.current - dist;
             const timeSpent = currTime - timeRef.current;
             
             if (timeSpent > 0) {
                 const speedMPS = distCovered / timeSpent; // meters per second
                 calculatedSpeed = Math.round(speedMPS * 3.6); // convert to km/h
             }

             if (calculatedSpeed > 0) {
                 const etaMinutes = Math.round((dist / (calculatedSpeed * 1000 / 60)));
                 calculatedEta = Math.abs(etaMinutes);
             }
        }

        if (dist > 0) distStr = `${dist} meters`;
        if (dist > 1000) distStr = `${(dist / 1000).toFixed(1)} km`;

        setDistanceDisplay(distStr);
        setSpeed(calculatedSpeed > 0 ? calculatedSpeed : 0);
        setEta(calculatedEta);
        
        setHeaderText(`Dist: ${distStr} | Speed: ${calculatedSpeed > 0 ? calculatedSpeed : 0} km/h | ETA: ${calculatedEta} min`);

        // Update Refs
        distanceRef.current = dist;
        timeRef.current = currTime;
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['bottom', 'left', 'right']}>
            <View style={{ padding: 10, backgroundColor: styleContext.colors?.primary || '#5a45d4', alignItems: 'center' }}>
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Bus No. {busNo}</Text>
                 <Text style={{ color: '#eee', fontSize: 12, marginTop: 4 }}>{headerText}</Text>
            </View>

            {location && busLocation ? (
                 <MapView
                    ref={mapRef}
                    style={styles.map}
                    provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
                    initialRegion={{
                        latitude: location.latitude,
                        longitude: location.longitude,
                        latitudeDelta: LATITUDE_DELTA,
                        longitudeDelta: LONGITUDE_DELTA,
                    }}
                >
                    {/* User Marker */}
                    <Marker 
                        coordinate={{ latitude: location.latitude, longitude: location.longitude }}
                        title="You are here"
                        pinColor="blue"
                    />

                    {/* Bus Marker */}
                    <Marker 
                        coordinate={busLocation}
                        title={`Bus ${busNo}`}
                        description={`Speed: ${speed} km/h`}
                    >
                         <View style={{ backgroundColor: 'white', padding: 5, borderRadius: 20, borderWidth: 2, borderColor: '#D33A2C' }}>
                            <Icon name="bus" size={24} color="#D33A2C" />
                        </View>
                    </Marker>
                </MapView>
            ) : (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={styleContext.colors?.primary || '#5a45d4'} />
                    <Text style={{ marginTop: 10, color: '#666' }}>Locating Bus...</Text>
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    map: {
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height,
    },
});
