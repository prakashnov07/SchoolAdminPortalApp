
import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TouchableOpacity, FlatList, Alert, Linking, StyleSheet, Modal, TextInput, ActivityIndicator, Platform } from 'react-native';
import { Card, Button, Icon, FAB } from 'react-native-elements';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import DateTimePicker from '@react-native-community/datetimepicker';
// Use legacy import to avoid deprecation warnings for downloadAsync/createDownloadResumable
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

import { CoreContext } from '../context/CoreContext';
import { StyleContext } from '../context/StyleContext';
import CustomPickerModal from '../components/CustomPickerModal';

export default function DefaulterListScreen({ navigation }) {
    const coreContext = useContext(CoreContext);
    const styleContext = useContext(StyleContext);
    const { branchid, phone } = coreContext;

    const [loading, setLoading] = useState(false);
    const [searching, setSearching] = useState(false);
    const [downloading, setDownloading] = useState(false);

    // Filter State
    const [classId, setClassId] = useState('');
    const [classLabel, setClassLabel] = useState('Select Class');
    const [classes, setClasses] = useState([]);

    const [sectionId, setSectionId] = useState('');
    const [sectionLabel, setSectionLabel] = useState('Select Section');
    const [sections, setSections] = useState([]);

    const [sortBy, setSortBy] = useState('');

    const [students, setStudents] = useState([]);
    
    // Picker State
    const [pickerVisible, setPickerVisible] = useState(false);
    const [pickerTitle, setPickerTitle] = useState('');
    const [pickerData, setPickerData] = useState([]);
    const [pickerValue, setPickerValue] = useState('');
    const [onPickerConfirm, setOnPickerConfirm] = useState(() => {});

    // Call Details Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [epd, setEpd] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [remarks, setRemarks] = useState('');
    const [submittingComment, setSubmittingComment] = useState(false);

    useEffect(() => {
        fetchClasses();
        fetchSections();
    }, []);

    const fetchClasses = () => {
        axios.get('/getallclasses', { params: { branchid } })
            .then(res => {
                const data = res.data.rows.map(c => ({ label: c.classname, value: c.classid }));
                setClasses(data);
            })
            .catch(err => console.log(err));
    };

    const fetchSections = () => {
        axios.get('/getallsections', { params: { branchid } })
            .then(res => {
                 const data = res.data.rows.map(s => ({ label: s.sectionname, value: s.sectionid }));
                 setSections(data);
            })
            .catch(err => {
                console.log(err);
                const fallback = [
                    { label: 'A', value: 'a' }, { label: 'B', value: 'b' },
                    { label: 'C', value: 'c' }, { label: 'D', value: 'd' }
                ];
                setSections(fallback);
            });
    };

    const openClassPicker = () => {
        setPickerTitle('Select Class');
        setPickerData(classes);
        setPickerValue(classId);
        setOnPickerConfirm(() => (val) => {
            setClassId(val);
            const selected = classes.find(c => c.value === val);
            setClassLabel(selected ? selected.label : 'Select Class');
            setPickerVisible(false);
            setStudents([]); 
        });
        setPickerVisible(true);
    };

    const openSectionPicker = () => {
        setPickerTitle('Select Section');
        setPickerData(sections);
        setPickerValue(sectionId);
        setOnPickerConfirm(() => (val) => {
            setSectionId(val);
            const selected = sections.find(s => s.value === val);
            setSectionLabel(selected ? selected.label : 'Select Section');
            setPickerVisible(false);
            setStudents([]);
        });
        setPickerVisible(true);
    };

    useEffect(() => {
        // Debug: Check if schoolData is available
        console.log('DefaulterListScreen: schoolData', coreContext.schoolData);
    }, [coreContext.schoolData]);

    const fetchDefaulters = (sortOverride) => {
        if (!classId || !sectionId) {
            Toast.show({ type: 'error', text1: 'Please select Class and Section' });
            return;
        }

        setSearching(true);
        // Legacy uses action='fee-defaulters' on /search-by-class-v2
        // params: classid, sectionid, filter, action, owner, branchid
        const currentSort = sortOverride || sortBy;
        
        axios.get('/search-by-class-v2', { 
            params: { 
                classid: classId, 
                sectionid: sectionId, 
                action: 'fee-defaulters',
                sort: currentSort, // Legacy might expect this param or handle it in filter
                branchid,
                owner: phone
            } 
        })
        .then(res => {
            setSearching(false);
            if (res.data.rows && res.data.rows.length > 0) {
                setStudents(res.data.rows);
            } else {
                setStudents([]);
                Toast.show({ type: 'info', text1: 'No defaulters found' });
            }
        })
        .catch(err => {
            console.log(err);
            setSearching(false);
            Toast.show({ type: 'error', text1: 'Failed to fetch defaulter list' });
        });
    };

    const handleCall = (phoneNumber) => {
        if (phoneNumber) {
            Linking.openURL(`tel:${phoneNumber}`);
        } else {
            Toast.show({ type: 'info', text1: 'Phone number not available' });
        }
    };

    // --- Report Download Logic ---
    const downloadReport = async () => {
        if (!classId || !sectionId) {
            Toast.show({ type: 'error', text1: 'Please select Class and Section' });
            return;
        }

        setDownloading(true);
        try {
            // Legacy Logic Replication:
            // 1. Script URL Base: state.advanceReducer.schooldata.studentimgpath
            // 2. File URL Base: 'https://school.siddhantait.com/dompdf_docs/'

            // Fallback for script base if studentimgpath is missing/empty
            // Legacy typically caches this. If missing, we might default to root or specific URL.
            // Observing legacy behavior, 'studentimgpath' often points to the root where PHP scripts live.
            const scriptBase = coreContext.schoolData?.studentimgpath || 'https://school.siddhantait.com/';
            
            // Ensure scriptBase ends with '/' if it doesn't, to avoid malformed URLs
            const safeScriptBase = scriptBase.endsWith('/') ? scriptBase : `${scriptBase}/`;

            const scriptUrl = `${safeScriptBase}DownloadDefaulterlistFromApp.php?appcode=tk558ygnp0099x23&branchid=${branchid}&classid=${classId}&sectionid=${sectionId}`;
             
            console.log('Generating report at:', scriptUrl);

            const response = await axios.get(scriptUrl);

            console.log('Report generation response:', response.data);

            if (response.data.status === 'success') {
                const fileName = response.data.fileName;
                
                // FIXED: Use the exact hardcoded domain from legacy DefaulterList.js
                const fileUrl = `https://school.siddhantait.com/dompdf_docs/${fileName}`;
                
                console.log('Downloading file from:', fileUrl);

                const fileUri = FileSystem.documentDirectory + fileName;

                // FIX: Use createDownloadResumable instead of deprecated static downloadAsync
                // This creates a resumable download object
                const downloadResumable = FileSystem.createDownloadResumable(
                    fileUrl,
                    fileUri,
                    {},
                    (downloadProgress) => {
                        const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
                        // console.log(`Download progress: ${progress}`);
                    }
                );

                // Perform the download
                const downloadRes = await downloadResumable.downloadAsync();
                
                if (downloadRes && downloadRes.uri) {
                     if (await Sharing.isAvailableAsync()) {
                        await Sharing.shareAsync(downloadRes.uri);
                    } else {
                        Alert.alert('Success', 'File downloaded to ' + downloadRes.uri);
                    }
                } else {
                    throw new Error('Download yielded no URI');
                }

            } else {
                // Determine if it's a "No Data" case or other error
                const msg = response.data.message || 'No data found for report';
                Toast.show({ type: 'error', text1: msg });
                console.log('Gen script returned success=false:', response.data);
            }
        } catch (error) {
            console.log('Download Error Object:', error);
            // safe inspection of error
            const errMsg = error.message || 'Unknown error';
            Toast.show({ type: 'error', text1: 'Download failed', text2: errMsg });
        } finally {
            setDownloading(false);
        }
    };

    const formatDate = (dateObj) => {
        const d = new Date(dateObj);
        let month = '' + (d.getMonth() + 1);
        let day = '' + d.getDate();
        const year = d.getFullYear();

        if (month.length < 2) month = '0' + month;
        if (day.length < 2) day = '0' + day;

        return [day, month, year].join('-');
    };
    // --- Call Details Modal Logic ---
    const openCallDetails = (student) => {
        setSelectedStudent(student);
        setEpd(new Date());
        setRemarks('');
        setModalVisible(true);
    };

    const submitCallDetails = () => {
        if (!remarks.trim()) {
            Toast.show({ type: 'error', text1: 'Please enter remarks' });
            return;
        }
        
        setSubmittingComment(true);
        // Legacy: submit-epd-comment
        // payload: branchid, comment, regno (enrollment), amount, attendancedate (epd), owner
        axios.post('/submit-epd-comment', {
            branchid,
            comment: remarks,
            regno: selectedStudent.enrollment,
            amount: selectedStudent.pendingAmount,
            attendancedate: epd.toISOString().split('T')[0], // YYYY-MM-DD
            owner: phone
        })
        .then(() => {
            setSubmittingComment(false);
            setModalVisible(false);
            Toast.show({ type: 'success', text1: 'Call details updated' });
            // Optionally update local state to reflect change?
        })
        .catch(err => {
            console.log(err);
            setSubmittingComment(false);
            Toast.show({ type: 'error', text1: 'Failed to update details' });
        });
    };

    const renderItem = ({ item }) => (
        <Card containerStyle={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.studentName}>{item.firstname} {item.lastname}</Text>
                <Text style={styles.pendingAmount}>₹{item.pendingAmount}</Text>
            </View>
            <Card.Divider />
            
            <View style={styles.row}>
                <Text style={styles.label}>Roll No:</Text>
                <Text style={styles.value}>{item.roll}</Text>
            </View>
            <View style={styles.row}>
                <Text style={styles.label}>Enrollment:</Text>
                <Text style={styles.value}>{item.enrollment}</Text>
            </View>
             <View style={styles.row}>
                <Text style={styles.label}>Father:</Text>
                <Text style={styles.value}>{item.father}</Text>
            </View>

            <View style={styles.contactRow}>
                <Text style={[styles.value, { flex: 1 }]}>
                    {item.contact1 || 'No Contact'}
                </Text>
                {item.contact1 && coreContext.schoolData?.defaulterCallThreshold < item.pendingAmount ? (
                    <TouchableOpacity onPress={() => handleCall(item.contact1)} style={styles.callButton}>
                        <Icon name="phone" type="font-awesome" color="#fff" size={16} />
                        <Text style={{color: '#fff', marginLeft: 5, fontWeight: 'bold'}}>Call</Text>
                    </TouchableOpacity>
                ) : null}
            </View>
            
            <Button
                title="Enter Call Details"
                type="outline"
                onPress={() => openCallDetails(item)}
                buttonStyle={{ marginTop: 10, borderColor: styleContext.primaryColor || '#5a45d4' }}
                titleStyle={{ color: styleContext.primaryColor || '#5a45d4', fontSize: 13 }}
            />
        </Card>
    );

    return (
        <SafeAreaView style={[styleContext.background, { flex: 1 }]} edges={['bottom', 'left', 'right']}>
            <View style={styles.filterContainer}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                     <TouchableOpacity onPress={openClassPicker} style={[styles.pickerButton, { flex: 0.48 }]}>
                        <Text numberOfLines={1}>{classLabel}</Text>
                        <Icon name="arrow-drop-down" type="material" color="#666" />
                    </TouchableOpacity>
                    
                    <TouchableOpacity onPress={openSectionPicker} style={[styles.pickerButton, { flex: 0.48 }]}>
                        <Text numberOfLines={1}>{sectionLabel}</Text>
                        <Icon name="arrow-drop-down" type="material" color="#666" />
                    </TouchableOpacity>
                </View>
                
                <Button 
                    title="Search"
                    onPress={() => fetchDefaulters()}
                    loading={searching}
                    loadingProps={{ size: 'small', color: 'white' }}
                    buttonStyle={{ backgroundColor: styleContext.primaryColor || '#5a45d4', borderRadius: 8 }}
                />
            </View>

            <FlatList
                data={students}
                renderItem={renderItem}
                keyExtractor={(item) => item.enrollment.toString()}
                contentContainerStyle={{ paddingBottom: 80 }} // Extra padding for FAB
                ListEmptyComponent={
                    !searching && (
                        <View style={{ padding: 20, alignItems: 'center' }}>
                            <Text style={{ color: '#888' }}>Select Class and Section to view defaulters.</Text>
                        </View>
                    )
                }
            />

            {/* Download FAB */}
            {students.length > 0 && (
                <FAB
                    placement="right"
                    color={styleContext.primaryColor || '#5a45d4'}
                    icon={{ name: 'download', color: 'white' }}
                    loading={downloading}
                    onPress={downloadReport}
                />
            )}

            {/* Custom Modal for Call Details */}
            <Modal
                visible={modalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Enter Call Details</Text>
                        <Text style={styles.modalSubtitle}>{selectedStudent?.firstname} {selectedStudent?.lastname}</Text>
                        
                        {/* Legacy Fields Section */}
                        <View style={{ marginBottom: 15, backgroundColor: '#f9f9f9', padding: 10, borderRadius: 8 }}>
                            <View style={styles.legacyRow}>
                                <Text style={styles.legacyLabel}>Last Pyt Date:</Text>
                                <Text style={styles.legacyValue}>{selectedStudent?.lastPaymentDate || 'N/A'}</Text>
                            </View>
                            <View style={styles.legacyRow}>
                                <Text style={styles.legacyLabel}>Last Call Date:</Text>
                                <Text style={styles.legacyValue}>{selectedStudent?.lastCallDate || 'N/A'}</Text>
                            </View>
                            <View style={styles.legacyRow}>
                                <Text style={styles.legacyLabel}>Last EPD:</Text>
                                <Text style={styles.legacyValue}>{selectedStudent?.lastEpd || 'N/A'}</Text>
                            </View>
                            <View style={styles.legacyRow}>
                                <Text style={styles.legacyLabel}>Last Remarks:</Text>
                                <Text style={styles.legacyValue}>{selectedStudent?.lastEpdComment || 'N/A'}</Text>
                            </View>
                        </View>

                        {/* EPD Selection - Label above picker */}
                        <Text style={[styles.label, { width: 'auto' }]}>Expected Payment Date</Text>
                        <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styleContext.pickerButton}>
                            <Text style={styleContext.pickerButtonText}>{epd ? formatDate(epd) : 'Select Date'}</Text>
                            <Icon name="calendar-today" type="material" size={20} color={styleContext.blackColor || '#666'} />
                        </TouchableOpacity>

                        {showDatePicker && (
                            <DateTimePicker
                                value={epd}
                                mode="date"
                                display="default"
                                minimumDate={new Date()}
                                onChange={(event, selectedDate) => {
                                    setShowDatePicker(false);
                                    if (selectedDate) setEpd(selectedDate);
                                }}
                            />
                        )}

                        <Text style={styles.label}>Remarks</Text>
                        <TextInput
                            style={styles.textArea}
                            placeholder="Enter remarks..."
                            placeholderTextColor="#999"
                            multiline
                            numberOfLines={3}
                            value={remarks}
                            onChangeText={setRemarks}
                        />

                        <View style={styles.modalButtons}>
                            <Button 
                                title="Cancel" 
                                type="clear" 
                                onPress={() => setModalVisible(false)} 
                                containerStyle={{ flex: 1, marginRight: 5 }}
                            />
                            <Button 
                                title="Submit" 
                                onPress={submitCallDetails}
                                loading={submittingComment}
                                containerStyle={{ flex: 1, marginLeft: 5 }}
                                buttonStyle={{ backgroundColor: styleContext.primaryColor || '#5a45d4' }}
                            />
                        </View>
                    </View>
                </View>
            </Modal>

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
    filterContainer: {
        padding: 10,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    pickerButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 10,
        backgroundColor: '#f9f9f9',
    },
    card: {
        borderRadius: 10,
        padding: 10,
        marginBottom: 5
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 5
    },
    studentName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333'
    },
    pendingAmount: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#d32f2f'
    },
    row: {
        flexDirection: 'row',
        marginBottom: 4
    },
    label: {
        width: 100,
        fontWeight: '600',
        color: '#666'
    },
    value: {
        flex: 1,
         color: '#333'
    },
    contactRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 5,
        backgroundColor: '#f0f4ff',
        padding: 8,
        borderRadius: 5
    },
    callButton: {
        flexDirection: 'row',
        backgroundColor: '#4caf50',
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 5,
        alignItems: 'center'
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 20,
        elevation: 5
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 5,
        textAlign: 'center'
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 15,
        textAlign: 'center'
    },

    dateButtonInline: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        backgroundColor: '#fff'
    },
    inlineRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15
    },
    legacyRow: {
        flexDirection: 'row',
        marginBottom: 5
    },
    legacyLabel: {
        fontWeight: '600',
        width: 120,
        color: '#666',
        fontSize: 12
    },
    legacyValue: {
        flex: 1,
        color: '#333',
        fontSize: 12
    },
    textArea: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 10,
        minHeight: 80,
        marginBottom: 20,
        textAlignVertical: 'top',
         backgroundColor: '#f9f9f9'
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between'
    }
});
