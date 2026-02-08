import { useFocusEffect } from '@react-navigation/native';
import React, { useState, useEffect, useContext, useCallback } from 'react';

import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, TextInput, Platform, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import axios from 'axios';
import { CoreContext } from '../context/CoreContext';
import { StyleContext } from '../context/StyleContext';
import CustomPickerModal from '../components/CustomPickerModal';
import DateTimePicker from '@react-native-community/datetimepicker';
import Toast from 'react-native-toast-message';
import { Card } from 'react-native-elements';

const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    if(isNaN(d.getTime())) return '';
    
    let month = d.getMonth() + 1;
    let day = d.getDate();
    if (month < 10) month = `0${month}`;
    if (day < 10) day = `0${day}`;
    return `${day}-${month}-${d.getFullYear()}`;
};

const formatTime = (date) => {
    if (!date) return '';
    const d = new Date(date);
    if(isNaN(d.getTime())) return '';
    
    let hour = d.getHours();
    let time = d.getMinutes();
    if (hour < 10) hour = `0${hour}`;
    if (time < 10) time = `0${time}`;
    return `${hour}:${time}`;
};

export default function EnquiryListScreen({ navigation }) {
    const coreContext = useContext(CoreContext);
    const styleContext = useContext(StyleContext);
    const { branchid, phone } = coreContext;

    const [enquiries, setEnquiries] = useState([]);
    const [filteredEnquiries, setFilteredEnquiries] = useState([]);
    const [loading, setLoading] = useState(false);
    const [type, setType] = useState('pending'); // pending or all
    const [search, setSearch] = useState('');

    // Exam Schedule Modal
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedEnquiry, setSelectedEnquiry] = useState(null);
    const [examDate, setExamDate] = useState(new Date());
    const [examTime, setExamTime] = useState(new Date());
    const [examVenue, setExamVenue] = useState('');
    
    // For DateTimePickers
    const [showExamDatePicker, setShowExamDatePicker] = useState(false);
    const [showExamTimePicker, setShowExamTimePicker] = useState(false);

    useFocusEffect(
        useCallback(() => {
            fetchEnquiries(type);
        }, [type, branchid, phone])
    );

    const fetchEnquiries = (astatus) => {
        setLoading(true);
        axios.get('fetch-enquiry', { params: { astatus, branchid, owner: phone } }).then(response => {
            setEnquiries(response.data.enquiries);
            setFilteredEnquiries(response.data.enquiries);
            setLoading(false);
        }).catch(err => {
            console.log(err);
            setLoading(false);
        });
    };

    const handleSearch = (text) => {
        setSearch(text);
        if (text) {
            const filtered = enquiries.filter(item => 
                item.firstname.toLowerCase().includes(text.toLowerCase()) || 
                item.lastname.toLowerCase().includes(text.toLowerCase())
            );
            setFilteredEnquiries(filtered);
        } else {
            setFilteredEnquiries(enquiries);
        }
    };

    const openScheduleModal = (item) => {
        setSelectedEnquiry(item);
        
        // Default to now
        let newDate = new Date();
        let newTime = new Date();
        let newVenue = '';

        if (item.examdate) {
            // Parse examdate (Expected: DD-MM-YYYY or YYYY-MM-DD)
            const parts = item.examdate.split('-');
            if (parts.length === 3) {
                if (parts[0].length === 4) {
                    // YYYY-MM-DD
                    newDate = new Date(parts[0], parts[1] - 1, parts[2]);
                } else {
                    // DD-MM-YYYY
                    newDate = new Date(parts[2], parts[1] - 1, parts[0]);
                }
            }
        }

        if (item.examtime) {
            // Parse examtime (Expected: HH:MM or HH:MM:SS)
            const timeParts = item.examtime.split(':');
            if (timeParts.length >= 2) {
                newTime = new Date();
                newTime.setHours(parseInt(timeParts[0]), parseInt(timeParts[1]), 0);
            }
        }

        if (item.venue) {
            newVenue = item.venue;
        }

        if (!isNaN(newDate.getTime())) setExamDate(newDate);
        if (!isNaN(newTime.getTime())) setExamTime(newTime);
        setExamVenue(newVenue);

        setModalVisible(true);
    };

    const scheduleExam = () => {
         if (!selectedEnquiry) return;
         
         const formattedDate = examDate.toISOString().split('T')[0]; // YYYY-MM-DD
         const formattedTime = examTime.toLocaleTimeString([], { hour12: false }); // HH:MM:SS or similar
         
         // Legacy sends 'examtime' and 'examdate' text/date objects? 
         // Legacy: axios.post('schedule-entrance-test', { ..., examtime: examTime, examdate: examDate, venue: examVenue })
         // Note: legacy uses utility formatTime/Date. We should send formats backend expects.
         // Usually safest to send ISO or string matching backend format. 
         // Let's stick to simple strings visible in UI or standard ISO. 
         // Based on legacy state initialization: formatDate(new Date(props.examTime))
         
         axios.post('schedule-entrance-test', { 
             branchid, 
             owner: phone, 
             regno: selectedEnquiry.enrollment, 
             examtime: formatTime(examTime), 
             examdate: formatDate(examDate), 
             venue: examVenue 
         }).then((response) => {
            setModalVisible(false);
            Toast.show({ type: 'success', text1: 'Entrance Test scheduled successfully' });
            fetchEnquiries(type); // Refresh list
        }).catch(err => {
             console.log(err);
             Toast.show({ type: 'error', text1: 'Failed to schedule test' });
        });
    };
    
    const handleExamDateChange = (event, selectedDate) => {
        const currentDate = selectedDate || examDate;
        setShowExamDatePicker(Platform.OS === 'ios');
        setExamDate(currentDate);
        if(Platform.OS !== 'ios') {
            setShowExamDatePicker(false);
        }
    };

    const handleExamTimeChange = (event, selectedDate) => {
        const currentDate = selectedDate || examTime;
        setShowExamTimePicker(Platform.OS === 'ios');
        setExamTime(currentDate);
         if(Platform.OS !== 'ios') {
            setShowExamTimePicker(false);
        }
    };

    const renderItem = ({ item }) => (
        <Card containerStyle={{ borderRadius: 10, marginHorizontal: 0, marginBottom: 10, padding: 10, elevation: 3 }}>
            <Card.Title style={{ textAlign: 'left', fontSize: 16 }}>{item.firstname} {item.lastname}</Card.Title>
            <Card.Divider />
            
            <View style={{ marginBottom: 5, flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontWeight: 'bold', color: '#555' }}>Class:</Text>
                <Text style={{ color: '#333' }}>{item.className || item.class_name || item.classname}</Text>
            </View>
            
            <View style={{ marginBottom: 5, flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontWeight: 'bold', color: '#555' }}>Father's Name:</Text>
                <Text style={{ color: '#333' }}>{item.father}</Text>
            </View>

            <View style={{ marginBottom: 5, flexDirection: 'row', justifyContent: 'space-between' }}>
                 <Text style={{ fontWeight: 'bold', color: '#555' }}>Contact:</Text>
                 <Text style={{ color: '#333' }}>{item.contact1} {item.contact2}</Text>
            </View>
            <View style={{ marginBottom: 5, flexDirection: 'row', justifyContent: 'space-between' }}>
                 <Text style={{ fontWeight: 'bold', color: '#555' }}>Email:</Text>
                 <Text style={{ color: '#333' }}>{item.emailid}</Text>
            </View>
            
            <View style={{ marginBottom: 10 }}>
                 <Text style={{ fontWeight: 'bold', color: '#555', marginBottom: 2 }}>Remarks:</Text>
                 <Text style={{ color: '#666', fontStyle: 'italic' }}>{item.remarks}</Text>
            </View>
            
            <View style={{ marginBottom: 10 }}>
                 <Text style={{ fontWeight: 'bold', color: '#555', marginBottom: 2 }}>Exam Details:</Text>
                 <Text style={{ color: '#333' }}>{item.examdate ? `${item.examdate} ${item.examtime || ''}` : 'Not Scheduled'}</Text>
            </View>
            
             <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 10, borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 10 }}>
                 <TouchableOpacity 
                    onPress={() => navigation.navigate('AddEnquiryScreen', { enquiry: item })}
                    style={{ backgroundColor: '#2196F3', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, marginRight: 10 }}
                 >
                     <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>Edit</Text>
                 </TouchableOpacity>

                 {item.showExamButton !== 'no' && (
                     <TouchableOpacity 
                        onPress={() => openScheduleModal(item)}
                        style={{ backgroundColor: styleContext.primaryColor || '#5a45d4', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 }}
                    >
                         <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>{item.examdate ? 'Reschedule' : 'Schedule Test'}</Text>
                     </TouchableOpacity>
                 )}
            </View>
        </Card>
    );

    // Filter Picker State
    const [filterPickerVisible, setFilterPickerVisible] = useState(false);
    const [filterSelectedValue, setFilterSelectedValue] = useState(type); // Temp state

    const filterOptions = [
        { label: 'Pending Enquiries', value: 'pending' },
        { label: 'All Enquiries', value: 'all' }
    ];

    const openFilterPicker = () => {
        setFilterSelectedValue(type); // Reset to current actual value
        setFilterPickerVisible(true);
    };

    const handleFilterConfirm = () => {
        setType(filterSelectedValue);
        setFilterPickerVisible(false);
    };

    return (
        <SafeAreaView style={[styleContext.background, { flex: 1 }]} edges={['bottom', 'left', 'right']}>
             <CustomPickerModal
                visible={filterPickerVisible}
                title="Select Enquiry Status"
                data={filterOptions}
                selectedValue={filterSelectedValue}
                onSelect={setFilterSelectedValue}
                onClose={() => setFilterPickerVisible(false)}
                onConfirm={handleFilterConfirm}
            />

             <View style={{ paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#fff', elevation: 2 }}>
                 {/* Type Picker Trigger */}
                 <TouchableOpacity 
                    style={[styleContext.pickerButton, { marginBottom: 10, height: 50 }]}
                    onPress={openFilterPicker}
                 >
                     <Text style={styleContext.pickerButtonText}>
                        {filterOptions.find(o => o.value === type)?.label}
                     </Text>
                     <Icon name="chevron-down" size={24} color={styleContext.blackColor} />
                 </TouchableOpacity>

                 {/* Search Bar */}
                 <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f0f0', borderRadius: 8, paddingHorizontal: 10, height: 45 }}>
                      <Icon name="magnify" size={24} color="#666" style={{ marginRight: 8 }} />
                      <TextInput 
                          value={search}
                          onChangeText={handleSearch}
                          placeholder="Search by name..."
                          placeholderTextColor="#888"
                          style={{ flex: 1, fontSize: 16, color: '#333' }}
                      />
                 </View>
             </View>

             <FlatList
                data={filteredEnquiries}
                renderItem={renderItem}
                keyExtractor={item => item.enrollment || item.id} // ensuring key
                contentContainerStyle={{ padding: 16 }}
                ListEmptyComponent={
                    !loading && (
                        <View style={{ alignItems: 'center', marginTop: 50 }}>
                            <Text style={{ color: '#888', fontSize: 16 }}>No enquiries found.</Text>
                        </View>
                    )
                }
             />
             
             {loading && (
                 <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.5)' }}>
                     <ActivityIndicator size="large" color={styleContext.primaryColor || '#5a45d4'} />
                 </View>
             )}


             {/* Schedule Modal */}
             <Modal
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
                animationType="slide"
             >
                 <View style={{ flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 20 }}>
                     <View style={{ backgroundColor: '#fff', borderRadius: 15, padding: 20, elevation: 5 }}>
                         <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' }}>
                             Schedule Entrance Test
                         </Text>
                         {selectedEnquiry && (
                             <Text style={{ textAlign: 'center', marginBottom: 20, color: '#666' }}>for {selectedEnquiry.firstname} {selectedEnquiry.lastname}</Text>
                         )}
                         
                         <Text style={{ fontSize: 14, color: '#333', marginBottom: 5 }}>Exam Date</Text>
                         <TouchableOpacity onPress={() => setShowExamDatePicker(true)} style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 15, flexDirection: 'row', justifyContent: 'space-between' }}>
                             <Text style={{ color: '#333' }}>{formatDate(examDate)}</Text>
                             <Icon name="calendar" size={20} color="#666" />
                         </TouchableOpacity>
                         {showExamDatePicker && (
                            <DateTimePicker value={examDate} mode="date" display="default" onChange={handleExamDateChange} />
                         )}

                         <Text style={{ fontSize: 14, color: '#333', marginBottom: 5 }}>Exam Time</Text>
                         <TouchableOpacity onPress={() => setShowExamTimePicker(true)} style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 15, flexDirection: 'row', justifyContent: 'space-between' }}>
                             <Text style={{ color: '#333' }}>{formatTime(examTime)}</Text>
                             <Icon name="clock-outline" size={20} color="#666" />
                         </TouchableOpacity>
                         {showExamTimePicker && (
                            <DateTimePicker value={examTime} mode="time" display="default" onChange={handleExamTimeChange} />
                         )}

                         <Text style={{ fontSize: 14, color: '#333', marginBottom: 5 }}>Venue</Text>
                         <TextInput 
                            value={examVenue} 
                            onChangeText={setExamVenue}
                            placeholder="Enter Exam Venue"
                            placeholderTextColor="#888"
                            style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 25, color: '#333' }}
                         />

                         <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                             <TouchableOpacity onPress={() => setModalVisible(false)} style={{ flex: 1, marginRight: 10, padding: 12, borderRadius: 8, backgroundColor: '#eee', alignItems: 'center' }}>
                                 <Text style={{ color: '#333' }}>Cancel</Text>
                             </TouchableOpacity>
                             <TouchableOpacity onPress={scheduleExam} style={{ flex: 1, marginLeft: 10, padding: 12, borderRadius: 8, backgroundColor: styleContext.primaryColor || '#5a45d4', alignItems: 'center' }}>
                                 <Text style={{ color: '#fff', fontWeight: 'bold' }}>Schedule</Text>
                             </TouchableOpacity>
                         </View>
                     </View>
                 </View>
             </Modal>

        </SafeAreaView>
    );
}
