import React, { useState, useEffect, useContext } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Image, StyleSheet, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import axios from 'axios';
import ImagePicker from 'react-native-image-crop-picker';
import Toast from 'react-native-toast-message';
import DateTimePicker from '@react-native-community/datetimepicker';
import { CoreContext } from '../context/CoreContext';
import { StyleContext } from '../context/StyleContext';

export default function StaffProfileScreen({ navigation, route }) {
    const coreContext = useContext(CoreContext);
    const styleContext = useContext(StyleContext);
    const { branchid, phone } = coreContext;

    // Params: Expecting 'staff' object or 'phone' to fetch
    const { staff } = route.params || {};
    
    const [empDetails, setEmpDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    // Photo Picker State
    const [pickerVisible, setPickerVisible] = useState(false);
    const [pickerConfig, setPickerConfig] = useState({ title: '', data: [], selected: null, onSelect: () => { } });
    const [imageOptionsVisible, setImageOptionsVisible] = useState(false);

    // Resignation/Delete Modal State
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [leavingReason, setLeavingReason] = useState('');
    const [leavingDate, setLeavingDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    
    useEffect(() => {
        if (staff) {
            fetchEmployeeDetails(staff.phone);
        }
    }, [staff]);

    const fetchEmployeeDetails = (empPhone) => {
        setLoading(true);
        // Using route params phone as 'owner' for this specific call as per legacy
        // Legacy: axios.get('/employee-details-phone', { params: { owner, branchid } })
        // where owner was the passed phone.
        axios.get('/employee-details-phone', { params: { owner: empPhone, branchid } })
            .then(response => {
                if (response.data && response.data.employee) {
                    setEmpDetails(response.data.employee);



                } else {
                     Alert.alert('Info', 'Employee details not found');
                }
                setLoading(false);
            })
            .catch(err => {
                console.log(err);
                setLoading(false);
                Alert.alert('Error', 'Failed to fetch details');
            });
    };

    const handleSuspend = () => {
        const targetId = staff?.id;
        const currentStatus = staff?.status;


        if (!targetId || !currentStatus) {
            Alert.alert('Error', 'Missing employee ID or status');
            return;
        }

        const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
        const actionTitle = currentStatus === 'suspended' ? 'Activate' : 'Suspend';

        Alert.alert(actionTitle, `Are you sure you want to ${actionTitle.toLowerCase()} this user?`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Yes', onPress: () => {
                // Payload: { id, astatus: status, owner, branchid }
                const payload = {
                    id: targetId,
                    astatus: currentStatus,
                    owner: coreContext.phone,
                    branchid
                };


                axios.post('/suspenduser', payload)
                    .then(() => {
                        Alert.alert('Success', `User ${newStatus === 'active' ? 'Activated' : 'Suspended'} successfully`);

                        // Manually update local state to reflect change immediately
                        setEmpDetails(prev => ({
                            ...prev,
                            status: newStatus
                        }));

                        fetchEmployeeDetails(staff.phone || empDetails.mobile);
                        coreContext.fetchStaffs();
                        navigation.replace('ManageStaffScreen');
                    })
                    .catch(err => {
                        console.error('Suspend API Error:', err);
                        if (err.response) console.error('Response Data:', err.response.data);
                        Alert.alert('Error', 'Action failed: ' + (err.response?.data?.message || err.message));
                    });
            }}
        ]);
    };

    const handleDelete = () => {
        if (!empDetails && !staff) return;
        
        Alert.alert(
            'Message',
            'Has Employee quit the organization?',
            [
                {
                    text: 'No',
                    onPress: () => deletePermanent(),
                    style: 'cancel'
                },
                {
                    text: 'Yes',
                    onPress: () => setDeleteModalVisible(true)
                }
            ]
        );
    };

    const deletePermanent = () => {
        const targetId = staff?.id;
        if (!targetId) {
            Alert.alert('Error', 'Missing Employee ID');
            return;
        }

        const payload = {
            id: targetId,
            owner: coreContext.phone,
            branchid
        };


        axios.post('/deleteuser', payload)
            .then(() => {
                Alert.alert('Success', 'User deleted');
                coreContext.fetchStaffs();
                navigation.replace('ManageStaffScreen');
            })
            .catch(err => {
                console.error('Delete API Error:', err);
                Alert.alert('Error', 'Delete failed: ' + (err.response?.data?.message || err.message));
            });
    };

    const handleResignationSubmit = () => {
        if (!leavingReason.trim()) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Please enter reason for leaving' });
            return;
        }

        // Legacy DeleteEmpProfile.js uses empDetails.emp_id for this specific endpoint
        const targetId = empDetails?.emp_id;

        if (!targetId) {
            Alert.alert('Error', 'Missing Employee Details (emp_id)');
            return;
        }

        const formattedDate = formatDate(leavingDate);
        setLoading(true);

        const payload = {
            owner: coreContext.phone,
            branchid,
            id: targetId, // This must be emp_id, not the standard id
            attendancedate: formattedDate,
            remarks: leavingReason
        };
        // Console log for debugging if needed, but keeping it clean as requested, 
        // relying on improved error message in Alert.

        axios.post('/delete-employee-from-app', payload)
            .then(response => {
                setLoading(false);
                setDeleteModalVisible(false);
                Toast.show({ type: 'success', text1: 'Success', text2: 'Employee deleted successfully' });
                coreContext.fetchStaffs();
                navigation.replace('ManageStaffScreen');
            })
            .catch(err => {
                setLoading(false);
                console.log(err);
                const errMsg = err.response?.data?.message || err.message || 'Unknown error';
                Alert.alert('Error', 'Failed to process resignation: ' + errMsg);
            });
    };

    const formatDate = (d) => {
        // defined locally or reuse utility? Defining locally for safety
        let month = '' + (d.getMonth() + 1),
            day = '' + d.getDate(),
            year = d.getFullYear();

        if (month.length < 2) month = '0' + month;
        if (day.length < 2) day = '0' + day;

        return [day, month, year].join('-');
    };

    const onDateChange = (event, selectedDate) => {
        setShowDatePicker(false);
        if (selectedDate) {
            setLeavingDate(selectedDate);
        }
    };

    // --- Photo Upload Logic ---

    const handlePhotoEdit = () => {
        setImageOptionsVisible(true);
    };

    const processPickedImage = (image) => {
        setImageOptionsVisible(false);
        if (!image) return;

        // ImagePicker returns object with path, data (base64) etc.
        // We will upload immediately
        uploadPhoto(image);
    };

    const handleCamera = () => {
        ImagePicker.openCamera({
            width: 500,
            height: 500,
            cropping: true,
            compressImageQuality: 0.7,
            includeBase64: true,
            mediaType: 'photo'
        }).then(image => {
            processPickedImage(image);
        }).catch(e => {
            if (e.code !== 'E_PICKER_CANCELLED') console.log(e);
        });
    };

    const handleGallery = () => {
        ImagePicker.openPicker({
            width: 500,
            height: 500,
            cropping: true,
            compressImageQuality: 0.7,
            includeBase64: true,
            mediaType: 'photo'
        }).then(image => {
            processPickedImage(image);
        }).catch(e => {
            if (e.code !== 'E_PICKER_CANCELLED') console.log(e);
        });
    };

    const uploadPhoto = async (image) => {
        if (!image || !image.data) {
            Alert.alert('Error', 'No image data found');
            return;
        }
        setUploading(true);
        // Toast.show({ type: 'info', text1: 'Uploading...', text2: 'Please wait' });

        try {
            // Legacy EmpProfile.js uses /file-upload-staff-direct
            // Payload: { filepath: data, branchid, owner }
            const payload = {
                filepath: image.data,
                branchid,
                owner: empDetails.mobile
            };

            const uploadRes = await axios.post('/file-upload-staff-direct', payload);

            // Legacy just shows success toast, implying it auto-updates the record.
            Toast.show({ type: 'success', text1: 'Success', text2: 'Photo uploaded successfully' });

            // Refresh details
            fetchEmployeeDetails(staff.phone);
            coreContext.fetchStaffs();

        } catch (error) {
            console.error('Upload Error Details:', error);
            if (error.response) {
                console.error('Response Status:', error.response.status);
                console.error('Response Data:', error.response.data);
                Alert.alert('Upload Error', `Server Error: ${JSON.stringify(error.response.data)}`);
            } else {
                Alert.alert('Upload Error', error.message);
            }
        } finally {
            setUploading(false);
        }
    };

    const renderImageOptionsActionSheet = () => {
        if (!imageOptionsVisible) return null;
        return (
            <View style={styles.modalOverlay}>
                <TouchableOpacity style={styles.modalOverlay} onPress={() => setImageOptionsVisible(false)} activeOpacity={1}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Update Photo</Text>
                        <TouchableOpacity style={styles.modalItem} onPress={handleCamera}>
                            <Icon name="camera" size={24} color={styleContext.primaryColor} style={{ marginRight: 10 }} />
                            <Text style={styles.modalItemText}>Take Photo</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.modalItem} onPress={handleGallery}>
                            <Icon name="image" size={24} color={styleContext.primaryColor} style={{ marginRight: 10 }} />
                            <Text style={styles.modalItemText}>Choose from Gallery</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.modalItem, { borderBottomWidth: 0 }]} onPress={() => setImageOptionsVisible(false)}>
                            <Text style={[styles.modalItemText, { color: 'red' }]}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </View>
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styleContext.background}>
                <ActivityIndicator size="large" color={styleContext.primaryColor} style={{ marginTop: 50 }} />
            </SafeAreaView>
        );
    }

    if (!empDetails) {
        return (
             <SafeAreaView style={styleContext.background}>
                <Text style={{ textAlign: 'center', marginTop: 50 }}>No Details Available</Text>
            </SafeAreaView>
        );
    }

    const getPhotoSource = () => {
        if (!empDetails || !empDetails.photo) return null;
        let path = empDetails.photo.trim();
        if (path === '') return null;
        if (path.startsWith('http')) return { uri: path };
        if (path.startsWith('/')) path = path.substring(1);
        return { uri: `https://school.siddhantait.com/admin/${path}` };
    };


    return (
        <SafeAreaView style={styleContext.background} edges={['bottom', 'left', 'right']}>


            <ScrollView contentContainerStyle={{ padding: 16 }}>
                
                {/* ID Card Style */}
                <View style={styleContext.card}>
                     <View style={{ alignItems: 'center', marginBottom: 20 }}>
                        <TouchableOpacity onPress={handlePhotoEdit} disabled={uploading}>
                            <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center', marginBottom: 10, overflow: 'hidden' }}>
                                {uploading ? (
                                    <ActivityIndicator size="small" color={styleContext.primaryColor} />
                                ) : getPhotoSource() ? (
                                    <Image source={getPhotoSource()} style={{ width: 100, height: 100 }} />
                                ) : (
                                    <Icon name="account" size={60} color="#ccc" />
                                )}
                                {!uploading && (
                                    <View style={{ position: 'absolute', bottom: 0, width: '100%', height: 25, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' }}>
                                        <Icon name="camera" size={16} color="#fff" />
                                    </View>
                                )}
                            </View>
                        </TouchableOpacity>
                         <Text style={{ fontSize: 22, fontWeight: 'bold', color: styleContext.titleColor }}>
                             {empDetails.fname} {empDetails.lname}
                         </Text>
                         <Text style={{ fontSize: 16, color: '#666', fontWeight: 'bold' }}>{empDetails.empid}</Text>
                     </View>

                     <View style={styles.infoRow}>
                        <Icon name="phone" size={20} color={styleContext.primaryColor} style={{ width: 30 }} />
                        <Text style={styles.infoText}>{empDetails.mobile}</Text>
                     </View>
                     <View style={styles.infoRow}>
                        <Icon name="email" size={20} color={styleContext.primaryColor} style={{ width: 30 }} />
                        <Text style={styles.infoText}>{empDetails.email || 'No Email'}</Text>
                     </View>
                     <View style={styles.infoRow}>
                        <Icon name="map-marker" size={20} color={styleContext.primaryColor} style={{ width: 30 }} />
                        <Text style={styles.infoText}>{empDetails.address || 'No Address'}</Text>
                     </View>

                     <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 }}>
                         <TouchableOpacity 
                            style={[styles.actionBtn, { backgroundColor: staff.status === 'suspended' ? '#388e3c' : '#E0A800' }]}
                            onPress={handleSuspend}
                         >
                            <Text style={styles.btnText}>{staff.status === 'suspended' ? 'Activate' : 'Suspend'}</Text>
                         </TouchableOpacity>
                         
                         <TouchableOpacity 
                            style={[styles.actionBtn, { backgroundColor: '#C82333' }]}
                            onPress={handleDelete}
                         >
                             <Text style={styles.btnText}>Delete</Text>
                         </TouchableOpacity>
                     </View>
                </View>

                {/* Additional Actions */}
                 <View style={styleContext.card}>
                    <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.navigate('SalaryDetailsScreen', { staff: staff || empDetails })}>
                        <Text style={styles.secondaryBtnText}>Salary Details</Text>
                        <Icon name="chevron-right" size={20} color="#666" />
                    </TouchableOpacity>
                    <View style={{ height: 1, backgroundColor: '#eee' }} />
                    <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.navigate('StaffAttendanceScreen', { staff: staff || empDetails })}>
                        <Text style={styles.secondaryBtnText}>Attendance</Text>
                        <Icon name="chevron-right" size={20} color="#666" />
                    </TouchableOpacity>
                 </View>

            </ScrollView>

            {imageOptionsVisible && (
                <View style={[StyleSheet.absoluteFill, { zIndex: 999 }]}>
                    {renderImageOptionsActionSheet()}
                </View>
            )}

            {/* Resignation Modal */}
            <Modal
                visible={deleteModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setDeleteModalVisible(false)}
            >
                <View style={styles.modalOverlayCenter}>
                    <View style={styles.modalBox}>
                        <Text style={styles.modalTitle}>Resignation Details</Text>

                        <Text style={styleContext.label}>Reason For Leaving</Text>
                        <TextInput
                            style={[styleContext.input, { height: 80, textAlignVertical: 'top', marginBottom: 15 }]}
                            multiline
                            numberOfLines={3}
                            placeholder="Enter reason..."
                            placeholderTextColor="#888"
                            value={leavingReason}
                            onChangeText={setLeavingReason}
                        />

                        <Text style={styleContext.label}>Date of Leaving</Text>
                        <TouchableOpacity
                            style={[styleContext.pickerButton, { backgroundColor: '#fff', marginBottom: 20 }]}
                            onPress={() => setShowDatePicker(true)}
                        >
                            <Text style={{ color: '#333', fontSize: 16 }}>{formatDate(leavingDate)}</Text>
                            <Icon name="calendar" size={20} color="#666" />
                        </TouchableOpacity>

                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <TouchableOpacity
                                style={[styles.actionBtn, { backgroundColor: '#ddd', flex: 0.45 }]}
                                onPress={() => setDeleteModalVisible(false)}
                            >
                                <Text style={[styles.btnText, { color: '#333' }]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.actionBtn, { backgroundColor: '#C82333', flex: 0.45 }]}
                                onPress={handleResignationSubmit}
                            >
                                <Text style={styles.btnText}>Delete</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {showDatePicker && (
                <DateTimePicker
                    value={leavingDate}
                    mode="date"
                    display="default"
                    onChange={onDateChange}
                />
            )}

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0'
    },
    infoText: {
        fontSize: 16,
        color: '#444',
        flex: 1,
        marginLeft: 8
    },
    actionBtn: {
        flex: 0.48,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center'
    },
    btnText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16
    },
    secondaryBtn: {
        paddingVertical: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    secondaryBtnText: {
        fontSize: 16,
        color: '#333'
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        textAlign: 'center',
        color: '#333'
    },
    modalItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee'
    },
    modalItemText: {
        fontSize: 16,
        color: '#333'
    },
    modalOverlayCenter: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20
    },
    modalBox: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 20,
        elevation: 5
    }
});
