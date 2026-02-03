import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';
import Toast from 'react-native-toast-message';

import { CoreContext } from '../context/CoreContext';
import { StyleContext } from '../context/StyleContext';
import CustomPickerModal from '../components/CustomPickerModal';
import TransportAttendanceReportItem from '../components/TransportAttendanceReportItem';

export default function TransportAttendanceReportScreen({ navigation }) {
    const coreContext = useContext(CoreContext);
    const styleContext = useContext(StyleContext);
    const { primary, background } = styleContext;

    // Filters
    const [action, setAction] = useState('report'); // 'report' | 'mark-out'
    const [attendanceDate, setAttendanceDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    
    // Pickers Logic
    const [allBuses, setAllBuses] = useState([]);
    const [allRoutes, setAllRoutes] = useState([]);
    
    const [selectedBus, setSelectedBus] = useState(0); // 0 = Select Bus
    const [selectedRoute, setSelectedRoute] = useState(0); // 0 = Select Route

    const [pickerVisible, setPickerVisible] = useState(false);
    const [pickerConfig, setPickerConfig] = useState({ title: '', data: [], selected: null, onSelect: () => {} });

    // Data
    const [records, setRecords] = useState([]);
    const [filteredRecords, setFilteredRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchBuses();
    }, []);

    const fetchBuses = () => {
        axios.get('/all-buses', { params: { branchid: coreContext.branchid } })
            .then(res => {
                const list = res.data.allBuses || [];
                // Format for picker: value=busno, label=busno
                // Ensure busno is used as value if legacy relies on it
                setAllBuses(list.map(b => ({ label: `Bus ${b.busno}`, value: b.busno })));
            })
            .catch(err => console.error(err));
    };

    const fetchRoutes = (busNo) => {
        // Fetch routes based on busNo. Legacy logic passes busNo to filtering if needed, 
        // usually endpoint filters by branchid and busno
        axios.get('/bus-routes', { params: { branchid: coreContext.branchid, busno: busNo } })
            .then(res => {
                 const list = res.data.allRoutes || [];
                 // Format: label=name, value=name
                 setAllRoutes(list.map(r => ({ label: r.name, value: r.name })));
            })
            .catch(err => console.error(err));
    };

    const handleBusChange = (busNo) => {
        setSelectedBus(busNo);
        setSelectedRoute(0); // Reset route
        // If '0' selected (which is initial), might want to clear routes? 
        if (busNo !== 0) {
            fetchRoutes(busNo);
        } else {
            setAllRoutes([]);
        }
    };

    const handleDateChange = (event, selectedDate) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (selectedDate) {
            setAttendanceDate(selectedDate);
            if(Platform.OS === 'android') setShowDatePicker(false);
        } else {
            if(Platform.OS === 'android') setShowDatePicker(false);
        }
    };

    const formatDate = (date) => {
        // Format DD-MM-YYYY for API (Matches Legacy utility.js)
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${d}-${m}-${y}`;
    };

    const handleSubmit = () => {
        setLoading(true);
        setSearchQuery('');
        
        // busNo can be 0, routeName can be 0 or string '0' if initial
        // Legacy: params: { busno, routename, attendancedate, branchid, action }
        
        axios.get('/transport-attendance-report', {
            params: {
                busno: selectedBus,
                routename: selectedRoute,
                attendancedate: formatDate(attendanceDate),
                branchid: coreContext.branchid,
                action: action
            }
        }).then(response => {
            const recs = response.data.records || [];
            setRecords(recs);
            setFilteredRecords(recs);
            setLoading(false);
            if (recs.length === 0) {
                 Toast.show({ type: 'info', text1: 'Info', text2: 'No records found.' });
            }
        }).catch(err => {
            console.error(err);
            setLoading(false);
            Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to fetch report.' });
        });
    };

    const handleSearch = (text) => {
        setSearchQuery(text);
        if (text) {
            const filtered = records.filter(item => 
                (item.name && item.name.toLowerCase().includes(text.toLowerCase())) ||
                (item.stuid && String(item.stuid).includes(text))
            );
            setFilteredRecords(filtered);
        } else {
            setFilteredRecords(records);
        }
    };

    const openPicker = (title, data, selected, onSelect) => {
        setPickerConfig({
            title,
            data: [{ label: title === 'Select Action' ? 'Select Action' : (title.includes('Bus') ? 'Select Bus No.' : 'Select Route'), value: 0 }, ...data],
            selected,
            onSelect
        });
        setPickerVisible(true);
    };

    const handlePickerSelect = (val) => {
        // Update local picker state only
        setPickerConfig(prev => ({ ...prev, selected: val }));
    };

    const handlePickerConfirm = () => {
        // Commit the change
        if (pickerConfig.onSelect) {
            pickerConfig.onSelect(pickerConfig.selected);
        }
        setPickerVisible(false);
    };

    const actionOptions = [
        { label: 'View Report', value: 'report' },
        { label: 'Mark Out', value: 'mark-out' }
    ];

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: background?.backgroundColor || '#f4e0ff' }} edges={['bottom', 'left', 'right']}>
             {/* Controls Container */}
             <View style={styles.controlsContainer}>
                
                {/* Row 1: Action and Date */}
                <View style={styles.row}>
                    <TouchableOpacity 
                        style={[styles.pickerButton, { flex: 1, marginRight: 5 }]}
                        onPress={() => openPicker('Select Action', actionOptions, action, setAction)}
                    >
                        <Text style={styles.pickerText}>
                           {actionOptions.find(a => a.value === action)?.label || 'Select Action'}
                        </Text>
                        <Icon name="chevron-down" size={20} color="#666" />
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[styles.pickerButton, { flex: 1, marginLeft: 5 }]}
                        onPress={() => setShowDatePicker(true)}
                    >
                        <Icon name="calendar" size={20} color="#666" style={{ marginRight: 5 }} />
                        <Text style={styles.pickerText}>{formatDate(attendanceDate)}</Text>
                    </TouchableOpacity>
                </View>

                {showDatePicker && (
                    <DateTimePicker
                        value={attendanceDate}
                        mode="date"
                        display="default"
                        onChange={handleDateChange}
                    />
                )}

                {/* Row 2: Bus Picker */}
                 <TouchableOpacity 
                    style={[styles.pickerButton, { marginTop: 10 }]}
                    onPress={() => openPicker('Select Bus', allBuses, selectedBus, handleBusChange)}
                >
                    <Text style={styles.pickerText}>
                        {selectedBus === 0 ? 'Select Bus No.' : `Bus ${selectedBus}`}
                    </Text>
                    <Icon name="chevron-down" size={20} color="#666" />
                </TouchableOpacity>

                {/* Row 3: Route Picker */}
                <TouchableOpacity 
                    style={[styles.pickerButton, { marginTop: 10 }]}
                    onPress={() => openPicker('Select Route', allRoutes, selectedRoute, setSelectedRoute)}
                >
                    <Text style={styles.pickerText}>
                        {selectedRoute === 0 ? 'Select Route' : selectedRoute}
                    </Text>
                    <Icon name="chevron-down" size={20} color="#666" />
                </TouchableOpacity>

                {/* Submit Button */}
                <TouchableOpacity 
                    style={[styles.submitButton, { backgroundColor: primary?.backgroundColor || '#6200ee' }]}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Submit</Text>}
                </TouchableOpacity>

                {/* Search Bar (Only if records exist) */}
                {records.length > 0 && (
                     <View style={styles.searchContainer}>
                        <Icon name="magnify" size={24} color="#666" />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search by name..."
                            value={searchQuery}
                            onChangeText={handleSearch}
                        />
                    </View>
                )}

             </View>

             <FlatList
                data={filteredRecords}
                renderItem={({ item, index }) => (
                    <TransportAttendanceReportItem 
                        item={item} 
                        index={index + 1} 
                        action={action}
                        branchid={coreContext.branchid}
                        owner={coreContext.phone}
                        schoolData={coreContext.schoolData}
                    />
                )}
                keyExtractor={(item, idx) => item.id?.toString() || idx.toString()}
                contentContainerStyle={{ padding: 10 }}
                ListEmptyComponent={
                    !loading && <Text style={styles.emptyText}>{records.length === 0 ? 'No data to show..' : 'No matching results.'}</Text>
                }
            />

            <CustomPickerModal
                visible={pickerVisible}
                title={pickerConfig.title}
                data={pickerConfig.data}
                selectedValue={pickerConfig.selected}
                onSelect={handlePickerSelect}
                onConfirm={handlePickerConfirm}
                onClose={() => setPickerVisible(false)}
            />

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    controlsContainer: {
        backgroundColor: '#fff',
        padding: 15,
        margin: 10,
        borderRadius: 10,
        elevation: 2,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    pickerButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#f9f9f9',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#eee'
    },
    pickerText: {
        fontSize: 14,
        color: '#333'
    },
    submitButton: {
        marginTop: 15,
        padding: 15,
        borderRadius: 8,
        alignItems: 'center'
    },
    submitText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        marginTop: 15,
        paddingHorizontal: 10,
        borderRadius: 8,
        paddingVertical: 8
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 16,
        color: '#333'
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 30,
        color: '#888',
        fontSize: 16
    }
});
