import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Alert, ActivityIndicator, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { Card, Button } from 'react-native-elements';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';

import SectionedMultiSelect from 'react-native-sectioned-multi-select';
import Icon from 'react-native-vector-icons/MaterialIcons';
import axios from 'axios';
import Toast from 'react-native-toast-message';

import { CoreContext } from '../context/CoreContext';
import { StyleContext } from '../context/StyleContext';

import CustomPickerModal from '../components/CustomPickerModal';

export default function HolidaysEventScreen({ navigation }) {
    const coreContext = useContext(CoreContext);
    const styleContext = useContext(StyleContext);
    const { branchid, phone } = coreContext;

    // State
    const [loading, setLoading] = useState(false);
    const [holidayDetails, setHolidayDetails] = useState([]);
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedDates, setSelectedDates] = useState([]); // Array of strings 'YYYY-MM-DD'
    
    // Form State
    const [category, setCategory] = useState('forall');
    const [name, setName] = useState('');
    const [selectedStudentGroups, setSelectedStudentGroups] = useState([]);
    const [selectedStaffGroups, setSelectedStaffGroups] = useState([]);
    
    // Data State
    const [allClasses, setAllClasses] = useState([]);
    const [staffHolidayGroups, setStaffHolidayGroups] = useState([]);

    // Picker State
    const [pickerVisible, setPickerVisible] = useState(false);
    const [pickerTitle, setPickerTitle] = useState('');
    const [pickerData, setPickerData] = useState([]);
    const [pickerValue, setPickerValue] = useState('');
    const [onPickerConfirm, setOnPickerConfirm] = useState(() => {});

    const categoryOptions = [
        { label: 'Holiday for All', value: 'forall' },
        { label: 'Holiday for Students', value: 'forstudents' },
        { label: 'Holiday for Staff', value: 'forstaff' },
        { label: 'Events', value: 'celebration' }
    ];

    const openCategoryPicker = () => {
        setPickerTitle('Select Category');
        setPickerData(categoryOptions);
        setPickerValue(category);
        setOnPickerConfirm(() => (val) => {
            setCategory(val);
            setPickerVisible(false);
        });
        setPickerVisible(true);
    };

    useEffect(() => {
        const today = new Date();
        const d = String(today.getDate()).padStart(2, '0');
        const m = String(today.getMonth() + 1).padStart(2, '0');
        const y = today.getFullYear();
        // Legacy sets initial date in DD-MM-YYYY format for display? 
        // But calendar needs YYYY-MM-DD.
        // Let's keep selectedDate as YYYY-MM-DD for consistency with Calendar logic
        // and format it for display if needed.
        // Actually legacy used `this.setState({ date: now })` where now is DD-MM-YYYY.
        // We will stick to YYYY-MM-DD for internal logic and show formatted.
        
        fetchHolidays();
        fetchStaffGroups();
        fetchAllClasses();
    }, []);

    const fetchHolidays = () => {
        setLoading(true);
        return axios.get('/fetchholidays', { params: { branchid } })
            .then(res => {
                setHolidayDetails(res.data.holidays || []);
                setLoading(false);
            })
            .catch(err => {
                console.log(err);
                setLoading(false);
            });
    };

    const fetchStaffGroups = () => {
        axios.get('/holiday-groups', { params: { branchid } })
            .then(res => {
                setStaffHolidayGroups(res.data.rows || []);
            })
            .catch(err => console.log(err));
    };

    const fetchAllClasses = () => {
        axios.get('/getallclasses', { params: { branchid } })
            .then(res => {
                setAllClasses(res.data.rows || []);
            })
            .catch(err => console.log(err));
    };

    const onDayPress = (day) => {
        const dateStr = day.dateString; // YYYY-MM-DD
        setSelectedDate(dateStr);

        // Reset form
        setName('');
        setCategory('forall');
        setSelectedStudentGroups([]);
        setSelectedStaffGroups([]);

        // Check if holiday exists
        const found = holidayDetails.find(h => h.dat === dateStr);
        if (found) {
            setName(found.name);
            setCategory(found.category);
            if (found.category === 'forstaff') {
                if (found.subcat) {
                   setSelectedStaffGroups(found.subcat.split(','));
                }
            } else {
                if (found.subcat) {
                    setSelectedStudentGroups(found.subcat.split(','));
                }
            }
        }
    };

    const onDayLongPress = (day) => {
        const dateStr = day.dateString;
        let newSelected = [...selectedDates];
        if (newSelected.includes(dateStr)) {
            newSelected = newSelected.filter(d => d !== dateStr);
        } else {
            newSelected.push(dateStr);
        }
        setSelectedDates(newSelected);
    };

    const handleAdd = () => {
        const targetDates = selectedDates.length > 0 ? selectedDates : (selectedDate ? [selectedDate] : []);
        
        if (targetDates.length === 0) {
            Toast.show({ type: 'info', text1: 'Please select a date first' });
            return;
        }

        let grp = [];
        if (category === 'forstaff') {
            grp = selectedStaffGroups;
        } else if (category === 'forstudents' || category === 'celebration') {
            grp = selectedStudentGroups;
        }

        setLoading(true);
        axios.post('/uploadholidays', {
            holidaydate: targetDates,
            category,
            name,
            item: grp,
            owner: phone,
            branchid
        })
        .then(() => {
            return fetchHolidays(); // Chain fetch logic
        })
        .then(() => {
            setLoading(false); // Only stop loading after fetch is done
            Toast.show({ type: 'success', text1: 'Holiday updated successfully' });
            setSelectedDates([]);
            // Re-select logic handled by markedDates update, but let's refresh form view if single date selected
            if(selectedDate && selectedDates.length === 0) {
                 // We need to find the updated detail from the *new* holidayDetails, but setHolidayDetails is async state update.
                 // Actually, we can't easily rely on holidayDetails being updated in this closure. 
                 // But UI will update. 
            }
        })
        .catch(err => {
            console.log(err);
            setLoading(false);
            Toast.show({ type: 'error', text1: 'Failed to update holiday' });
        });
    };

    const handleDelete = () => {
        if (!selectedDate) {
            Toast.show({ type: 'info', text1: 'Please select a date first to delete' });
            return;
        }
        
        Alert.alert('Confirm Delete', 'Are you sure you want to delete this holiday?', [
            { text: 'Cancel', style: 'cancel' },
            { 
                text: 'Delete', 
                style: 'destructive',
                onPress: () => {
                    setLoading(true);
                    // Legacy API expects DD-MM-YYYY for deletion
                    const [y, m, d] = selectedDate.split('-');
                    const formattedDate = `${d}-${m}-${y}`;
                    
                    axios.post('/deleteholiday', { holidaydate: formattedDate, owner: phone, branchid })
                    .then(() => {
                        return fetchHolidays();
                    })
                    .then(() => {
                        setLoading(false);
                        Toast.show({ type: 'success', text1: 'Holiday deleted successfully' });
                        
                        // Reset form and clear selection for immediate visual feedback
                        setName('');
                        setCategory('forall');
                        setSelectedDate(''); // Clear selection so the purple dot disappears
                    })
                    .catch(e => {
                        console.log(e);
                        setLoading(false);
                        Toast.show({ type: 'error', text1: 'Failed to delete' });
                    });
                }
            }
        ]);
    };

    // Prepare marked dates
    const markedDates = {};
    
    // 1. Existing Holidays from DB
    holidayDetails.forEach(det => {
        let color = 'white';
        if (det.category === 'forall') color = '#9B63F8';
        else if (det.category === 'forstudents') color = '#808000';
        else if (det.category === 'forstaff') color = 'tomato';
        else if (det.category === 'celebration') color = '#D33A2C';
        
        markedDates[det.dat] = { selected: true, selectedColor: color };
    });

    // 2. Selected (Long Press) overrides
    selectedDates.forEach(d => {
        // If already exists, maybe mix? Legacy just marks it true.
        // We'll mark it with a distinct indication or color.
        markedDates[d] = { 
            ...markedDates[d], 
            selected: true, 
            marked: true, 
            dotColor: 'black' // Indicator of selection
        };
    });
    
    // 3. Current Single Selection
    if (selectedDate) {
        markedDates[selectedDate] = {
             ...markedDates[selectedDate],
             selected: true,
             // Use a border or different color to indicate "focused" day vs just holiday?
             // Calendar default selected color is usually blue. 
             // We'll keep the holiday color if it exists, otherwise standard blue
             selectedColor: markedDates[selectedDate]?.selectedColor || '#5a45d4' 
        };
    }

    return (
        <SafeAreaView style={[styleContext.background, { flex: 1 }]} edges={['bottom', 'left', 'right']}>
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 150 : 100}
            >
            <ScrollView 
                contentContainerStyle={{ padding: 10, paddingBottom: 100 }} 
                keyboardShouldPersistTaps="handled"
            >
                <Card containerStyle={styles.card}>
                    <Text style={styles.infoText}>
                        Long press a date to select it for marking as a holiday. Multiple dates can be selected.
                    </Text>
                </Card>

                <Calendar
                    style={styles.calendar}
                    markedDates={markedDates}
                    onDayPress={onDayPress}
                    onDayLongPress={onDayLongPress}
                    enableSwipeMonths={true}
                />

                <View style={styles.legendContainer}>
                    <Text style={[styles.legendItem, { backgroundColor: '#9B63F8' }]}>For All</Text>
                    <Text style={[styles.legendItem, { backgroundColor: '#D33A2C' }]}>Events</Text>
                    <Text style={[styles.legendItem, { backgroundColor: '#808000' }]}>For Students</Text>
                    <Text style={[styles.legendItem, { backgroundColor: 'tomato' }]}>For Staff</Text>
                </View>

                <Card containerStyle={styles.card}>
                    <Text style={styles.selectedDateText}>
                        {selectedDate ? `Selected: ${selectedDate}` : 'Select a Date'}
                    </Text>
                    
                    <Text style={{ marginBottom: 5, color: '#666', fontWeight: 'bold' }}>Category</Text>
                    <TouchableOpacity 
                        style={[styleContext.pickerButton, { marginBottom: 15 }]} 
                        onPress={() => openCategoryPicker()}
                    >
                        <Text style={styleContext.pickerButtonText}>
                            {category === 'forall' ? 'Holiday for All' : 
                             category === 'forstudents' ? 'Holiday for Students' : 
                             category === 'forstaff' ? 'Holiday for Staff' : 
                             category === 'celebration' ? 'Events' : 'Select Category'}
                        </Text>
                        <Icon name="arrow-drop-down" size={24} color={styleContext.blackColor} />
                    </TouchableOpacity>

                    {/* Student Groups Selector */}
                    {(category === 'forstudents' || category === 'celebration') && (
                        <View style={{ marginTop: 10 }}>
                            <SectionedMultiSelect
                                items={allClasses.map(c => ({ id: c.classid, name: c.classname }))}
                                uniqueKey="id"
                                subKey="children"
                                selectText="Select Classes"
                                showDropDowns={true}
                                readOnlyHeadings={false}
                                onSelectedItemsChange={setSelectedStudentGroups}
                                selectedItems={selectedStudentGroups}
                                IconRenderer={Icon}
                                styles={{
                                    selectToggle: styles.multiSelectToggle,
                                    selectToggleText: styles.multiSelectText,
                                }}
                            />
                        </View>
                    )}

                    {/* Staff Groups Selector */}
                    {category === 'forstaff' && (
                        <View style={{ marginTop: 10 }}>
                            <SectionedMultiSelect
                                items={staffHolidayGroups} // Assuming structure is correct (id, name)
                                uniqueKey="id"
                                subKey="children"
                                selectText="Select Staff Groups"
                                showDropDowns={true}
                                onSelectedItemsChange={setSelectedStaffGroups}
                                selectedItems={selectedStaffGroups}
                                IconRenderer={Icon}
                                styles={{
                                    selectToggle: styles.multiSelectToggle,
                                    selectToggleText: styles.multiSelectText,
                                }}
                            />
                        </View>
                    )}

                    <TextInput
                        style={styles.input}
                        placeholder="Enter Occasion Name"
                        placeholderTextColor="#999"
                        value={name}
                        onChangeText={setName}
                    />

                    <View style={styles.buttonRow}>
                        <Button
                            title="Add / Update"
                            onPress={handleAdd}
                            loading={loading}
                            buttonStyle={{ backgroundColor: styleContext.primaryColor || '#5a45d4' }}
                            containerStyle={{ flex: 1, marginRight: 5 }}
                        />
                        <Button
                            title="Delete"
                            onPress={handleDelete}
                            type="outline"
                            buttonStyle={{ borderColor: '#d32f2f' }}
                            titleStyle={{ color: '#d32f2f' }}
                            containerStyle={{ flex: 1, marginLeft: 5 }}
                        />
                    </View>
                </Card>
                <View style={{ height: 60 }} />
            </ScrollView>
            </KeyboardAvoidingView>

            <CustomPickerModal 
                visible={pickerVisible}
                title={pickerTitle}
                data={pickerData}
                selectedValue={pickerValue}
                onSelect={setPickerValue}
                onClose={() => setPickerVisible(false)}
                onConfirm={() => onPickerConfirm(pickerValue)}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 10,
        marginBottom: 10,
        padding: 10
    },
    infoText: {
        color: '#555',
        fontSize: 12,
        textAlign: 'center'
    },
    calendar: {
        marginBottom: 10,
        borderRadius: 10,
        elevation: 2
    },
    legendContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        marginBottom: 10,
        paddingHorizontal: 5,
        alignItems: 'center'
    },
    legendItem: {
        color: 'white',
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 4,
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 5,
        textAlign: 'center',
        overflow: 'hidden'
    },
    selectedDateText: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 10,
        color: '#333'
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        marginBottom: 15,
        marginTop: 15,
        fontSize: 16
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    multiSelectToggle: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        marginBottom: 5
    },
    multiSelectText: {
        fontSize: 16,
        color: '#333'
    }
});
