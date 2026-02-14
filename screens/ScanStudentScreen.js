import React, { useState, useEffect, useContext } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, Dimensions, ScrollView } from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { StyleContext } from '../context/StyleContext';
import axios from 'axios';
import { CoreContext } from '../context/CoreContext';
import CustomPickerModal from '../components/CustomPickerModal';
import EventAttendanceModal from '../components/EventAttendanceModal';
import TransportScanSuccessModal from '../components/TransportScanSuccessModal';
import Toast from 'react-native-toast-message';

const { width, height } = Dimensions.get('window');

export default function ScanStudentScreen({ navigation }) {
    const styleContext = useContext(StyleContext);
    const coreContext = useContext(CoreContext);

    const [hasPermission, setHasPermission] = useState(null);
    const [scanned, setScanned] = useState(false);

    // Modes & Data
    const [mode, setMode] = useState('transport'); // 'transport' or 'event'
    const [allBuses, setAllBuses] = useState([]);
    const [busOptions, setBusOptions] = useState([]);
    const [selectedBus, setSelectedBus] = useState('');

    const [allRoutes, setAllRoutes] = useState([]);
    const [routeOptions, setRouteOptions] = useState([]);
    const [selectedRoute, setSelectedRoute] = useState('');

    const [events, setEvents] = useState([]);
    const [eventOptions, setEventOptions] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState('');

    const [facing, setFacing] = useState('back');

    // Picker State
    const [pickerVisible, setPickerVisible] = useState(false);
    const [pickerTitle, setPickerTitle] = useState('');
    const [pickerData, setPickerData] = useState([]);
    const [pickerSelectedValue, setPickerSelectedValue] = useState(null);
    const [pickerOnSelect, setPickerOnSelect] = useState(() => () => { });

    // Event Modal State
    const [eventModalVisible, setEventModalVisible] = useState(false);
    const [eventLoading, setEventLoading] = useState(false);
    const [eventHistory, setEventHistory] = useState([]);
    const [eventStatus, setEventStatus] = useState(null);
    const [scannedStudent, setScannedStudent] = useState(null);

    // Transport Success Modal State
    const [transportSuccessVisible, setTransportSuccessVisible] = useState(false);
    const [transportSuccessStudent, setTransportSuccessStudent] = useState(null);
    const [transportSuccessStatus, setTransportSuccessStatus] = useState(null);
    const [transportSuccessMessage, setTransportSuccessMessage] = useState('');

    useEffect(() => {
        const getPermissions = async () => {
            const { status } = await Camera.requestCameraPermissionsAsync();
            setHasPermission(status === 'granted');
        };
        getPermissions();
    }, []);

    useEffect(() => {
        if (coreContext.branchid) {
            console.log('Fetching initial data for branch:', coreContext.branchid);
            fetchInitialData();
        }
    }, [coreContext.branchid]);

    const fetchInitialData = () => {
        fetchBuses();
        fetchEvents();
    };

    const fetchBuses = () => {
        if (!coreContext.branchid) return;
        axios.get('/all-buses', { params: { branchid: coreContext.branchid } })
            .then(res => {
                const buses = res.data.allBuses || [];
                setAllBuses(buses);
                setBusOptions(buses.map(b => ({ label: `Bus ${b.busno}`, value: String(b.busno) })));
            })
            .catch(err => console.error(err));
    };

    const fetchRoutes = (busNo) => {
        if (!busNo) {
            setRouteOptions([]);
            return;
        }
        axios.get('/bus-routes', { params: { branchid: coreContext.branchid, busno: busNo } })
            .then(res => {
                const routes = res.data.allRoutes || [];
                setAllRoutes(routes);
                setRouteOptions(routes.map(r => ({ label: r.name, value: String(r.name) })));
            })
            .catch(err => console.error(err));
    };

    const fetchEvents = () => {
        if (!coreContext.branchid) return;
        axios.get('/attendance-events', { params: { branchid: coreContext.branchid } })
            .then(res => {
                const evts = res.data.events || [];
                setEvents(evts);
                setEventOptions(evts.map(e => ({ label: e.ename, value: String(e.id) })));
            })
            .catch(err => console.error(err));
    };

    const openPicker = (title, data, selected, onSelect) => {
        setPickerTitle(title);
        setPickerData(data);
        setPickerSelectedValue(selected);
        setPickerOnSelect(() => onSelect);
        setPickerVisible(true);
    };

    const handleBusChange = (busNo) => {
        setSelectedBus(busNo);
        setSelectedRoute('');
        fetchRoutes(busNo);
    };

    const handleBarCodeScanned = ({ type, data }) => {
        if (scanned) return;
        setScanned(true);

        // Validation
        if (mode === 'transport') {
            if (!selectedBus) {
                Alert.alert('Selection Required', 'Please select a Bus first.', [{ text: 'OK', onPress: () => setScanned(false) }]);
                return;
            }
            if (!selectedRoute) {
                Alert.alert('Selection Required', 'Please select a Route first.', [{ text: 'OK', onPress: () => setScanned(false) }]);
                return;
            }
            markTransportAttendance(data);
        } else if (mode === 'event') {
            if (!selectedEvent) {
                Alert.alert('Selection Required', 'Please select an Event first.', [{ text: 'OK', onPress: () => setScanned(false) }]);
                return;
            }
            markEventAttendance(data);
        }
    };

    const markTransportAttendance = (regno) => {
        const branchid = coreContext.branchid;
        const owner = coreContext.phone;

        axios.post('/mark-transport-attendance', {
            regno,
            busno: selectedBus,
            routename: selectedRoute,
            owner,
            branchid
        })
            .then(response => {
                const result = response.data.result;

                const showModal = (status, msg) => {
                    // Fetch student details for modal
                    axios.get('/fetchstudentdetails', { params: { regnos: [regno], branchid } })
                        .then(res => {
                            if (res.data.students && res.data.students.length > 0) {
                                setTransportSuccessStudent(res.data.students[0]);
                                setTransportSuccessStatus(status);
                                setTransportSuccessMessage(msg);
                                setTransportSuccessVisible(true);
                            } else {
                                // Fallback
                                Toast.show({ type: status === 'error' || status === 'wrong' ? 'error' : 'success', text1: msg, text2: `Student ID: ${regno}` });
                            }
                        })
                        .catch(err => {
                            console.error("Student fetch error", err);
                            Toast.show({ type: status === 'error' || status === 'wrong' ? 'error' : 'success', text1: msg, text2: `Student ID: ${regno}` });
                        });
                };

                if (result === 'ok') {
                    showModal('success', 'Attendance Marked');
                } else if (result === 'out') {
                    showModal('out', 'Marked OUT');
                } else if (result === 'already') {
                    showModal('already', 'Already Marked');
                } else if (result === 'wrong') {
                    showModal('wrong', 'Wrong Bus/Route');
                } else {
                    showModal('error', 'Error Marking Attendance');
                }
            })
            .catch(err => {
                console.error(err);
                Toast.show({ type: 'error', text1: 'Network Error', text2: 'Failed to mark attendance.' });
                setTimeout(() => setScanned(false), 2000);
            });
    };

    const markEventAttendance = (regno) => {
        const branchid = coreContext.branchid;
        const owner = coreContext.phone;
        
        // Fetch Student Details first (quick shim since we only have ID)
        // Ideally we should have better student data, but for now we'll pass ID and let modal handle loading text
        setScannedStudent({ enrollment: regno, name: 'Loading...' }); 

        setEventModalVisible(true);
        setEventLoading(true);
        setEventHistory([]);
        setEventStatus(null);
        
        // 1. Fetch Student Basic Info (Optional, improving UX)
        axios.get('/fetchstudentdetails', { params: { regnos: [regno], branchid } })
            .then(res => {
                if (res.data.students && res.data.students.length > 0) {
                    setScannedStudent(res.data.students[0]);
                }
            })
            .catch(err => console.error("Student fetch error", err));

        // 2. Fetch Status
        axios.get('/student-event-attendance-today-status', { 
            params: { regno, branchid, owner, eventid: selectedEvent } 
        }).then(response => {
             setEventStatus(response.data.astatus);
        }).catch(err => console.error(err));

        // 3. Fetch History records 
        axios.get('/student-event-attendance-today-records', { 
            params: { regno, branchid, owner, eventid: selectedEvent } 
        }).then(response => {
            setEventHistory(response.data.records || []);
            setEventLoading(false);
            if (response.data.emessage) {
                // Show "Complaint" / Alert
                Toast.show({ type: 'info', text1: 'Notice', text2: response.data.emessage, visibilityTime: 5000 });
                // Also could use Alert.alert if it needs to be blocking
                // Alert.alert('Notice', response.data.emessage);
            }
        }).catch(err => {
            console.error(err);
            setEventLoading(false);
            Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to fetch attendance records.' });
        });
    };

    const submitEventAttendance = (bgStatus) => {
        const branchid = coreContext.branchid;
        const owner = coreContext.phone;
        const regno = scannedStudent?.enrollment;

        axios.post('/mark-single-student-event-attendance', {
            regno,
            eventid: selectedEvent,
            owner,
            branchid,
            astatus: bgStatus // 'present' or 'absent'
        })
            .then(response => {
                if (response.data.aresult === 'ok') {
                    Toast.show({ type: 'success', text1: 'Success', text2: `Marked ${bgStatus.toUpperCase()}` });
                    setEventModalVisible(false);
                    setTimeout(() => setScanned(false), 1000); // Allow scanning again
                } else {
                    Toast.show({ type: 'error', text1: 'Error', text2: 'Could not mark attendance.' });
                }
            })
            .catch(err => {
                console.error(err);
                 Toast.show({ type: 'error', text1: 'Network Error', text2: 'Failed to mark attendance.' });
            });
    };

    const toggleCameraFacing = () => {
        setFacing(current => (current === 'back' ? 'front' : 'back'));
    };

    if (hasPermission === null) {
        return <View style={styles.container}><Text>Requesting permission...</Text></View>;
    }
    if (hasPermission === false) {
        return <View style={styles.container}><Text>No camera access</Text></View>;
    }

    const changeMode = (mode) => {
        setMode(mode);
        setScanned(false);
    };

    return (
        <View style={styles.container}>
            {/* Top Section: Filters */}
            <View style={styles.filterContainer}>

                {/* Mode Selector */}
                <View style={styles.row}>
                    <TouchableOpacity
                        style={[styles.modeButton, mode === 'transport' && styles.activeMode]}
                        onPress={() => changeMode('transport')}
                    >
                        <Icon name="bus" size={20} color={mode === 'transport' ? '#fff' : '#666'} />
                        <Text style={[styles.modeText, mode === 'transport' && styles.activeModeText]}>Transport</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.modeButton, mode === 'event' && styles.activeMode]}
                        onPress={() => changeMode('event')}
                    >
                        <Icon name="calendar-check" size={20} color={mode === 'event' ? '#fff' : '#666'} />
                        <Text style={[styles.modeText, mode === 'event' && styles.activeModeText]}>Event</Text>
                    </TouchableOpacity>
                </View>

                {/* Transport Filters */}
                {mode === 'transport' && (
                    <View>
                        <Text style={styles.label}>Select Bus</Text>
                        <TouchableOpacity
                            style={styles.dropdown}
                            onPress={() => openPicker('Select Bus', busOptions, selectedBus, handleBusChange)}
                        >
                            <Text style={styles.dropdownText}>
                                {busOptions.find(b => b.value === selectedBus)?.label || 'Select Bus'}
                            </Text>
                            <Icon name="chevron-down" size={20} color="#666" />
                        </TouchableOpacity>

                        <Text style={styles.label}>Select Route</Text>
                        <TouchableOpacity
                            style={[styles.dropdown, !selectedBus && styles.disabledDropdown]}
                            onPress={() => {
                                if (selectedBus) openPicker('Select Route', routeOptions, selectedRoute, setSelectedRoute)
                            }}
                            disabled={!selectedBus}
                        >
                            <Text style={styles.dropdownText}>
                                {routeOptions.find(r => r.value === selectedRoute)?.label || 'Select Route'}
                            </Text>
                            <Icon name="chevron-down" size={20} color="#666" />
                        </TouchableOpacity>
                    </View>
                )}

                {/* Event Filters */}
                {mode === 'event' && (
                    <View>
                        <Text style={styles.label}>Select Event</Text>
                        <TouchableOpacity
                            style={styles.dropdown}
                            onPress={() => openPicker('Select Event', eventOptions, selectedEvent, setSelectedEvent)}
                        >
                            <Text style={styles.dropdownText}>
                                {eventOptions.find(e => e.value === selectedEvent)?.label || 'Select Event'}
                            </Text>
                            <Icon name="chevron-down" size={20} color="#666" />
                        </TouchableOpacity>
                    </View>
                )}

                <View style={styles.instructionData}>
                    <Text style={styles.instructionText}>
                        {scanned ? 'Processing...' : 'Ready to Scan'}
                    </Text>
                </View>
            </View>

            {/* Bottom Section: Camera */}
            <View style={styles.cameraContainer}>
                <CameraView
                    style={styles.camera}
                    facing={facing}
                    onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                    barcodeScannerSettings={{
                        barcodeTypes: ["qr", "ean13", "code128"],
                    }}
                >
                    <View style={styles.overlay}>
                        <View style={styles.frame} />
                    </View>

                    <TouchableOpacity style={styles.flipButton} onPress={toggleCameraFacing}>
                        <Icon name="camera-flip" size={28} color="#fff" />
                    </TouchableOpacity>
                </CameraView>
            </View>

            {/* Picker Modal */}
            <CustomPickerModal
                visible={pickerVisible}
                title={pickerTitle}
                data={pickerData}
                selectedValue={pickerSelectedValue}
                onSelect={setPickerSelectedValue}
                onClose={() => setPickerVisible(false)}
                onConfirm={() => {
                    if (pickerOnSelect) {
                        pickerOnSelect(pickerSelectedValue);
                    }
                    setPickerVisible(false);
                }}
            />

            {/* Event Attendance Modal */}
            <EventAttendanceModal
                visible={eventModalVisible}
                student={scannedStudent}
                history={eventHistory}
                loading={eventLoading}
                status={eventStatus}
                onClose={() => setEventModalVisible(false)}
                onMarkPresent={() => submitEventAttendance('present')}
                onMarkAbsent={() => submitEventAttendance('absent')}
            />

            {/* Transport Success Modal */}
            <TransportScanSuccessModal
                visible={transportSuccessVisible}
                student={transportSuccessStudent}
                status={transportSuccessStatus}
                message={transportSuccessMessage}
                onClose={() => {
                    setTransportSuccessVisible(false);
                    setScanned(false);
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f4e0ff',
    },
    filterContainer: {
        padding: 15,
        backgroundColor: '#fff',
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        elevation: 4,
        zIndex: 10,
    },
    row: {
        flexDirection: 'row',
        marginBottom: 10,
        justifyContent: 'space-between'
    },
    modeButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
        marginHorizontal: 5
    },
    activeMode: {
        backgroundColor: '#5a45d4',
    },
    modeText: {
        marginLeft: 8,
        fontWeight: 'bold',
        color: '#666'
    },
    activeModeText: {
        color: '#fff'
    },
    cameraContainer: {
        flex: 1,
        marginTop: 10,
        marginHorizontal: 10,
        marginBottom: 10,
        borderRadius: 15,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: '#ddd'
    },
    camera: {
        flex: 1,
    },
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent'
    },
    frame: {
        width: 250,
        height: 250,
        borderWidth: 2,
        borderColor: '#00ff00',
        backgroundColor: 'transparent',
        borderRadius: 10
    },
    flipButton: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        backgroundColor: 'rgba(0,0,0,0.6)',
        padding: 10,
        borderRadius: 30
    },
    instructionData: {
        alignItems: 'center',
        marginTop: 10
    },
    instructionText: {
        fontWeight: 'bold',
        color: '#5a45d4'
    },
    label: {
        fontSize: 14,
        fontWeight: "600",
        color: "#666",
        marginTop: 5,
        marginBottom: 5,
        marginLeft: 2,
    },
    dropdown: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "#f9f9f9",
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#ddd",
        marginBottom: 5,
    },
    disabledDropdown: {
        backgroundColor: '#f0f0f0',
        opacity: 0.6
    },
    dropdownText: {
        fontSize: 16,
        color: "#333",
    },
});
