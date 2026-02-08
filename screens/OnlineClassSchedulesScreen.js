import React, { useState, useEffect, useContext, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Alert, Linking, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { Picker } from '@react-native-picker/picker';
import { StyleContext } from '../context/StyleContext';
import { CoreContext } from '../context/CoreContext';
import CustomPickerModal from '../components/CustomPickerModal';
import OnlineClassMenu from '../components/OnlineClassMenu';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import axios from 'axios';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const OnlineClassSchedulesScreen = ({ navigation }) => {
    const styleContext = useContext(StyleContext);
    const { 
        role, branchid, phone, appUrl,
        allClasses, getAllClasses,
        allSections, getAllSections,
        staffs, getAllStaffs
    } = useContext(CoreContext);

    const [loading, setLoading] = useState(false);
    const [classes, setClasses] = useState([]);
    const [day, setDay] = useState(DAYS[new Date().getDay()] || 'Monday');
    const [staff, setStaff] = useState('');
    const [cls, setCls] = useState('');
    const [sectionid, setSectionid] = useState('');
    const [menuVisible, setMenuVisible] = useState(false);
    const [dayPickerVisible, setDayPickerVisible] = useState(false);
    const [staffPickerVisible, setStaffPickerVisible] = useState(false);
    const [clsPickerVisible, setClsPickerVisible] = useState(false);
    const [sectionPickerVisible, setSectionPickerVisible] = useState(false);

    useEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <TouchableOpacity onPress={() => setMenuVisible(true)} style={{ marginRight: 15 }}>
                     <MaterialCommunityIcons name="dots-vertical" size={26} color="#fff" />
                </TouchableOpacity>
            ),
        });
    }, [navigation]);
    
    useEffect(() => {
        if (!allClasses || allClasses.length === 0) getAllClasses();
        if (!allSections || allSections.length === 0) getAllSections();
        if (!staffs || staffs.length === 0) getAllStaffs();
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchClasses();
        }, [day, staff, cls, sectionid])
    );
    
    const fetchClasses = async () => {
        setLoading(true);
        try {
            console.log('DEBUG: Context Values:', { role, branchid, phone });
            const listStaff = (role === 'admin' || role === 'super' || role === 'tech' || role === 'principal') ? (staff || '') : phone;
            console.log('DEBUG: Fetching classes with params:', { day, staff: listStaff, classid: cls, sectionid, branchid, role });
            
            const params = {
                day, 
                owner: phone, // Logged in user (Authentication/Context)
                phone: listStaff, // Filter Target (Empty for All, or specific staff phone)
                classid: cls || '', 
                sectionid: sectionid || '', 
                branchid,
                role 
            };

            const response = await axios.get('/online-classes-staff', { params });
            console.log('Classes Response URL:', response.config.url);
            console.log('Classes Response:', response.data);
            const fetchedClasses = response.data.classes || [];
            if (fetchedClasses.length === 0) {
                 Toast.show({ type: 'info', text1: 'No schedules found' });
            }
            setClasses(fetchedClasses);
        } catch (error) {
            console.error('Fetch error:', error);
            Toast.show({ type: 'error', text1: 'Failed to fetch schedules' });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (id) => {
        Alert.alert(
            "Delete Schedule",
            "Are you sure you want to delete this schedule?",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Delete", 
                    style: "destructive", 
                    onPress: async () => {
                        try {
                            await axios.post('/delete-online-class', { id, branchid, role });
                            Toast.show({ type: 'success', text1: 'Schedule deleted' });
                            fetchClasses();
                        } catch (error) {
                            console.error(error);
                            Toast.show({ type: 'error', text1: 'Failed to delete schedule' });
                        }
                    } 
                }
            ]
        );
    };

    const handleHide = async (id, currentStatus) => {
        try {
            await axios.post('/hide-online-class', { id, isactive: currentStatus, branchid, role });
            Toast.show({ type: 'success', text1: currentStatus === 'yes' ? 'Class Hidden' : 'Class Unhidden' });
            fetchClasses();
        } catch (error) {
            console.error(error);
            Toast.show({ type: 'error', text1: 'Failed to update status' });
        }
    };

    const handleJoin = (link) => {
        if (link) {
            const url = link.includes('http') ? link : `http://${link}`;
            Linking.openURL(url).catch(err => Toast.show({ type: 'error', text1: 'Could not open link' }));
        } else {
            Toast.show({ type: 'error', text1: 'No link provided' });
        }
    };

    const renderItem = ({ item }) => (
        <View style={[styles.card, { backgroundColor: item.isactive === 'yes' ? styleContext.cardContainerStyle.backgroundColor : '#e0e0e0' }]}>
            <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Class: {item.cls} {item.section}</Text>
                <View style={styles.statusBadge}>
                     <Text style={styles.statusText}>{item.isactive === 'yes' ? 'Active' : 'Hidden'}</Text>
                </View>
            </View>
            
            <Text style={styles.cardText}>Subject: {item.subject}</Text>
            <Text style={styles.cardText}>Time: {item.tim}</Text>
            <Text style={styles.cardText}>Teacher: {item.teacher}</Text>
            <Text style={styles.cardText}>Days: {item.days}</Text>

            <View style={styles.actionRow}>
                <TouchableOpacity onPress={() => handleJoin(item.link)} style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}>
                    <Text style={styles.actionButtonText}>Join</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => navigation.navigate('AddOnlineClassScreen', { copySchedule: item })} style={[styles.actionButton, { backgroundColor: '#2196F3' }]}>
                    <Text style={styles.actionButtonText}>Edit</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => handleHide(item.id, item.isactive)} style={[styles.actionButton, { backgroundColor: '#FF9800' }]}>
                    <Text style={styles.actionButtonText}>{item.isactive === 'yes' ? 'Hide' : 'Unhide'}</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => handleDelete(item.id)} style={[styles.actionButton, { backgroundColor: '#F44336' }]}>
                    <Text style={styles.actionButtonText}>Delete</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={{ flex: 1, backgroundColor: '#fff' }}>
            <OnlineClassMenu visible={menuVisible} onClose={() => setMenuVisible(false)} />

            <View style={styles.filterContainer}>
                <View style={styles.filterRow}>
                    <TouchableOpacity 
                        style={styles.pickerTrigger} 
                        onPress={() => setDayPickerVisible(true)}
                    >
                        <Text style={styles.pickerText}>{day}</Text>
                        <MaterialIcons name="arrow-drop-down" size={24} color="#333" />
                    </TouchableOpacity>

                    {(role === 'admin' || role === 'super' || role === 'principal' || role === 'tech') && (
                        <TouchableOpacity 
                            style={styles.pickerTrigger} 
                            onPress={() => setStaffPickerVisible(true)}
                        >
                            <Text style={styles.pickerText}>
                                {(!staff || staff === '') ? 'All Staff' : staffs.find(s => s.phone === staff)?.name || staff}
                            </Text>
                            <MaterialIcons name="arrow-drop-down" size={24} color="#333" />
                        </TouchableOpacity>
                    )}
                </View>

                <View style={styles.filterRow}>
                     <TouchableOpacity 
                        style={styles.pickerTrigger} 
                        onPress={() => setClsPickerVisible(true)}
                    >
                        <Text style={styles.pickerText}>
                            {(!cls || cls === '') ? 'All Classes' : allClasses.find(c => c.classid === cls)?.classname || cls}
                        </Text>
                        <MaterialIcons name="arrow-drop-down" size={24} color="#333" />
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={styles.pickerTrigger} 
                        onPress={() => setSectionPickerVisible(true)}
                    >
                        <Text style={styles.pickerText}>
                            {(!sectionid || sectionid === '') ? 'All Sections' : allSections.find(s => s.sectionid === sectionid)?.sectionname || sectionid}
                        </Text>
                        <MaterialIcons name="arrow-drop-down" size={24} color="#333" />
                    </TouchableOpacity>
                </View>
            </View>

            <CustomPickerModal
                visible={dayPickerVisible}
                title="Select Day"
                data={DAYS.map(d => ({ label: d, value: d }))}
                selectedValue={day}
                onSelect={setDay}
                onClose={() => setDayPickerVisible(false)}
            />

            <CustomPickerModal
                visible={staffPickerVisible}
                title="Select Staff"
                data={[{ label: 'All Staff', value: '' }, ...staffs.map(s => ({ label: s.name, value: s.phone }))]}
                selectedValue={staff}
                onSelect={setStaff}
                onClose={() => setStaffPickerVisible(false)}
            />

            <CustomPickerModal
                visible={clsPickerVisible}
                title="Select Class"
                data={[{ label: 'All Classes', value: '' }, ...allClasses.map(c => ({ label: c.classname, value: c.classid }))]}
                selectedValue={cls}
                onSelect={setCls}
                onClose={() => setClsPickerVisible(false)}
            />

            <CustomPickerModal
                visible={sectionPickerVisible}
                title="Select Section"
                data={[{ label: 'All Sections', value: '' }, ...allSections.map(s => ({ label: s.sectionname, value: s.sectionid }))]}
                selectedValue={sectionid}
                onSelect={setSectionid}
                onClose={() => setSectionPickerVisible(false)}
            />

            {loading ? (
                <ActivityIndicator size="large" color={styleContext.primaryColor} style={{ marginTop: 20 }} />
            ) : (
                <FlatList
                    data={classes}
                    renderItem={renderItem}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={{ padding: 10, paddingBottom: 100 }}
                    ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20 }}>No schedules found</Text>}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 10,
        backgroundColor: '#4a90e2', 
    },
    filterContainer: {
        backgroundColor: '#f5f5f5',
        padding: 10,
    },
    filterRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    pickerTrigger: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'white',
        padding: 10,
        borderRadius: 5,
        borderWidth: 1,
        borderColor: '#ddd',
        marginHorizontal: 5,
    },
    pickerText: {
        fontSize: 14,
        color: '#333',
    },
    card: {
        padding: 15,
        borderRadius: 8,
        marginBottom: 10,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        backgroundColor: '#eee',
    },
    statusText: {
        fontSize: 12,
    },
    cardText: {
        fontSize: 14,
        marginBottom: 4,
        color: '#555',
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 10,
        flexWrap: 'wrap',
    },
    actionButton: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 4,
        marginLeft: 8,
        marginBottom: 5,
    },
    actionButtonText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
});

export default OnlineClassSchedulesScreen;
