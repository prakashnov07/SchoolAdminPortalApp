import React, { useState, useContext, useEffect, useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import axios from 'axios';
import { CoreContext } from '../context/CoreContext';
import { StyleContext } from '../context/StyleContext';
import CustomPickerModal from '../components/CustomPickerModal';

export default function SearchStudentScreen({ navigation }) {
    const { branchid, phone, allClasses, getAllClasses, allSections, getAllSections, schoolData } = useContext(CoreContext);
    const { primary, background, text } = useContext(StyleContext);

    const [loading, setLoading] = useState(false);
    const [students, setStudents] = useState([]);

    // Filters
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSection, setSelectedSection] = useState('');

    // Advanced Filters
    const [studentType, setStudentType] = useState('');
    const [selectedBus, setSelectedBus] = useState(0);
    const [selectedRoute, setSelectedRoute] = useState(0);
    const [allBuses, setAllBuses] = useState([]);
    const [allRoutes, setAllRoutes] = useState([]);

    // Picker State
    const [pickerVisible, setPickerVisible] = useState(false);
    const [pickerConfig, setPickerConfig] = useState({ title: '', data: [] });
    const [pickerSelectedValue, setPickerSelectedValue] = useState(null);
    const [pickerType, setPickerType] = useState(null); // 'class'|'section'|'stype'|'bus'|'route'

    // Check if we have successfully searched at least once to enable auto-refresh
    const hasSearchedRef = useRef(false);

    useEffect(() => {
        if (!allClasses || allClasses.length === 0) getAllClasses();
        if (!allSections || allSections.length === 0) getAllSections();
        fetchBuses();
    }, []);


    useFocusEffect(
        useCallback(() => {
            // Only auto-refresh if we have previously performed a successful search
            if (hasSearchedRef.current) {
                handleSearch(true);
            }
        }, [handleSearch])
    );

    const fetchBuses = () => {
        axios.get('/all-buses', { params: { branchid } })
            .then(res => {
                const list = res.data.allBuses || [];
                setAllBuses(list.map(b => ({ label: `Bus ${b.busno}`, value: b.busno })));
            })
            .catch(err => console.error(err));
    };

    const fetchRoutes = useCallback((busNo) => {
        axios.get('/bus-routes', { params: { branchid, busno: busNo } })
            .then(res => {
                const list = res.data.allRoutes || [];
                setAllRoutes(list.map(r => ({ label: r.name, value: r.name })));
            })
            .catch(err => console.error(err));
    }, [branchid]);

    const handleClassSelect = () => {
        const data = allClasses.map(c => ({ label: c.classname, value: c.classid }));
        openPicker('Select Class', data, selectedClass, 'class');
    };

    const handleSectionSelect = () => {
        const data = allSections.map(s => ({ label: s.sectionname, value: s.sectionid }));
        openPicker('Select Section', data, selectedSection, 'section');
    };

    const handleStudentTypeSelect = () => {
        const data = [
            { label: 'All Students', value: '' },
            { label: 'Day Scholar', value: 'ds' },
            { label: 'Day Care', value: 'dc' },
            { label: 'Hosteler', value: 'ho' }
        ];
        openPicker('Select Student Type', data, studentType, 'stype');
    };

    const handleBusSelect = () => {
        openPicker('Select Bus', [{ label: 'All Buses', value: 0 }, ...allBuses], selectedBus, 'bus');
    };

    const handleRouteSelect = () => {
        openPicker('Select Route', [{ label: 'All Routes', value: 0 }, ...allRoutes], selectedRoute, 'route');
    };

    const openPicker = (title, data, selectedValue, type) => {
        setPickerConfig({ title, data });
        setPickerSelectedValue(selectedValue);
        setPickerType(type);
        setPickerVisible(true);
    };

    const onPickerConfirm = () => {
        if (pickerType === 'class') {
            setSelectedClass(pickerSelectedValue);
            setSelectedSection(''); // Reset section when class changes
        } else if (pickerType === 'section') {
            setSelectedSection(pickerSelectedValue);
        } else if (pickerType === 'stype') {
            setStudentType(pickerSelectedValue);
        } else if (pickerType === 'bus') {
            setSelectedBus(pickerSelectedValue);
            setSelectedRoute(0); // Reset route
            if (pickerSelectedValue !== 0) fetchRoutes(pickerSelectedValue);
            else setAllRoutes([]);
        } else if (pickerType === 'route') {
            setSelectedRoute(pickerSelectedValue);
        }

        setPickerVisible(false);
    };

    const handleSearch = useCallback((isAutoRefresh = false) => {
        // Validation: At least one filter should be selected to avoid fetching entire DB?
        // Or if class/section mandatory?
        if (!selectedClass && !selectedBus) {
            // Relaxed validation: Allow searching by Bus without Class
        }

        // If Class is selected, Section is mandatory? Legacy usually triggers section 'A', 'B' etc.
        if (selectedClass && !selectedSection) {
            alert('Please select a section');
            return;
        }


        if (!isAutoRefresh) setLoading(true); // Don't show loading on auto-refresh to keep it smooth? Or show it?
        // User prefers loading indicator usually.
        setLoading(true);

        axios.get('/search-by-class-v2', {
            params: {
                classid: selectedClass,
                sectionid: selectedSection,

                // Advanced Filters
                stype: studentType,
                busno: selectedBus,
                routename: selectedRoute,

                owner: phone,
                branchid: branchid,
                filter: '',
                action: ''
            }
        })
            .then(res => {
                setStudents(res.data.rows || []);
                setLoading(false);
                hasSearchedRef.current = true; // Mark as searched
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [selectedClass, selectedSection, studentType, selectedBus, selectedRoute, phone, branchid]);

    const handleStudentPress = (student) => {
        navigation.navigate('StudentProfileScreen', { student });
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity style={styles.item} onPress={() => handleStudentPress(item)}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={[styles.avatar, { backgroundColor: primary?.backgroundColor || '#6200ee', overflow: 'hidden' }]}>
                    {item.photo ? (
                        <Image
                            source={{ uri: `${schoolData.studentimgpath}${item.photo}` }}
                            style={{ width: 40, height: 40 }}
                        />
                    ) : (
                        <Text style={{ color: '#fff', fontWeight: 'bold' }}>
                            {item.firstname ? item.firstname[0] : '?'}
                        </Text>
                    )}
                </View>
                <View style={{ marginLeft: 10, flex: 1 }}>
                    <Text style={[styles.name, { color: text?.color || '#000' }]}>
                        {item.firstname} {item.lastname}
                    </Text>

                    {/* Dues */}
                    {Number(item.pendingAmount) > 0 && (
                        <Text style={{ color: 'red', fontSize: 12, fontWeight: 'bold' }}>
                            Current Dues: Rs.{item.pendingAmount}
                        </Text>
                    )}

                    <Text style={styles.subtext}>
                        {schoolData?.smallEnr || 'Enr'}: {item.enrollment} | {schoolData?.smallReg || 'Reg'}: {item.scholarno}
                    </Text>
                    <Text style={styles.subtext}>
                        Roll: {item.roll} | Class: {item.clas} {item.section}
                    </Text>
                    <Text style={styles.subtext}>
                        Father: {item.father} | Contact: {item.contact1}
                    </Text>
                </View>
                <Icon name="chevron-right" size={24} color="#ccc" />
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: background?.backgroundColor || '#f5f5f5' }]}>
            <View style={{ backgroundColor: '#fff', elevation: 2, marginBottom: 5 }}>
                {/* Row 1: Class & Section */}
                <View style={styles.filterRow}>
                    <TouchableOpacity style={styles.pickerButton} onPress={handleClassSelect}>
                        <Text style={styles.pickerText}>
                            {selectedClass ? allClasses.find(c => c.classid === selectedClass)?.classname : 'Select Class'}
                        </Text>
                        <Icon name="chevron-down" size={20} color="#666" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.pickerButton} onPress={handleSectionSelect}>
                        <Text style={styles.pickerText}>
                            {selectedSection ? allSections.find(s => s.sectionid === selectedSection)?.sectionname : 'Select Section'}
                        </Text>
                        <Icon name="chevron-down" size={20} color="#666" />
                    </TouchableOpacity>
                </View>

                {/* Row 2: Student Type */}
                <View style={styles.filterRow}>
                    <TouchableOpacity style={styles.pickerButton} onPress={handleStudentTypeSelect}>
                        <Text style={styles.pickerText}>
                            {studentType ? (studentType === 'ds' ? 'Day Scholar' : studentType === 'dc' ? 'Day Care' : 'Hosteler') : 'All Student Types'}
                        </Text>
                        <Icon name="chevron-down" size={20} color="#666" />
                    </TouchableOpacity>
                </View>

                {/* Row 3: Bus & Route */}
                <View style={styles.filterRow}>
                    <TouchableOpacity style={styles.pickerButton} onPress={handleBusSelect}>
                        <Text style={styles.pickerText}>
                            {selectedBus === 0 ? 'All Buses' : `Bus ${selectedBus}`}
                        </Text>
                        <Icon name="chevron-down" size={20} color="#666" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.pickerButton} onPress={handleRouteSelect}>
                        <Text style={styles.pickerText}>
                            {selectedRoute === 0 ? 'All Routes' : selectedRoute}
                        </Text>
                        <Icon name="chevron-down" size={20} color="#666" />
                    </TouchableOpacity>
                </View>

                {/* Search Button */}
                {/* Search & Message Buttons */}
                <View style={{ padding: 10, flexDirection: 'row' }}>
                    <TouchableOpacity
                        style={[styles.searchButton, { backgroundColor: primary?.backgroundColor || '#6200ee', flex: 1, marginRight: 5 }]}
                        onPress={handleSearch}
                    >
                        <Text style={{ color: '#fff', fontWeight: 'bold', marginRight: 5 }}>Search</Text>
                        <Icon name="magnify" size={24} color="#fff" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.searchButton, { backgroundColor: '#2e7d32', flex: 1, marginLeft: 5 }]}
                        onPress={() => {
                            navigation.navigate('SendMessages', {
                                fromSearch: true,
                                classid: selectedClass,
                                sectionid: selectedSection,
                                stype: studentType,
                                busno: selectedBus,
                                routename: selectedRoute
                            });
                        }}
                    >
                        <Text style={{ color: '#fff', fontWeight: 'bold', marginRight: 5 }}>Message</Text>
                        <Icon name="message-text-outline" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color={primary?.backgroundColor || '#6200ee'} style={{ marginTop: 20 }} />
            ) : (
                <FlatList
                    data={students}
                    renderItem={renderItem}
                    keyExtractor={item => item.enrollment.toString()}
                    contentContainerStyle={{ padding: 10 }}
                    ListEmptyComponent={
                        <View style={{ alignItems: 'center', marginTop: 50 }}>
                            <Text style={{ color: '#999' }}>No students found</Text>
                        </View>
                    }
                />
            )}

            <CustomPickerModal
                visible={pickerVisible}
                title={pickerConfig.title}
                data={pickerConfig.data}
                selectedValue={pickerSelectedValue}
                onSelect={(val) => setPickerSelectedValue(val)}
                onConfirm={onPickerConfirm}
                onClose={() => setPickerVisible(false)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    filterRow: {
        flexDirection: 'row',
        padding: 5,
        paddingHorizontal: 10,
    },
    pickerButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 5,
        padding: 10,
        margin: 5,
        backgroundColor: '#fafafa',
    },
    pickerText: {
        color: '#333',
    },
    searchButton: {
        flexDirection: 'row',
        padding: 12,
        borderRadius: 5,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 5,
        minWidth: 50,
    },
    item: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 8,
        marginBottom: 10,
        elevation: 1,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    name: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    subtext: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
});
