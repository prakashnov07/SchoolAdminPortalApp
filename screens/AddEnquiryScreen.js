import React, { useState, useEffect, useContext } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, TextInput, Image, Platform, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import axios from 'axios';
import { CoreContext } from '../context/CoreContext';
import { StyleContext } from '../context/StyleContext';
import CustomPickerModal from '../components/CustomPickerModal';
import DateTimePicker from '@react-native-community/datetimepicker';
import ImagePicker from 'react-native-image-crop-picker';
import Toast from 'react-native-toast-message';

export default function AddEnquiryScreen({ navigation, route }) {
    const coreContext = useContext(CoreContext);
    const styleContext = useContext(StyleContext);
    const { branchid, phone } = coreContext;
    const { enquiry } = route.params || {}; // Get enquiry if in edit mode
    const isEditMode = !!enquiry;

    React.useLayoutEffect(() => {
        navigation.setOptions({
            title: isEditMode ? 'Edit Enquiry' : 'Add Enquiry',
            headerRight: () => (
                <TouchableOpacity onPress={() => navigation.navigate('EnquiryListScreen')} style={{ marginRight: 15 }}>
                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>List</Text>
                </TouchableOpacity>
            ),
        });
    }, [navigation, isEditMode]);

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [cls, setCls] = useState('');
    const [dob, setDOB] = useState(new Date());
    const [father, setFather] = useState('');
    const [mother, setMother] = useState('');
    const [contact, setContact] = useState('');
    const [email, setEmail] = useState('');
    const [address, setAddress] = useState('');
    const [remarks, setRemarks] = useState('');
    const [filePath, setFilePath] = useState('');
    const [enquiryId, setEnquiryId] = useState('');

    // Pickers Data
    const [classes, setClasses] = useState([]);

    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Modal State
    const [pickerVisible, setPickerVisible] = useState(false);
    const [pickerTitle, setPickerTitle] = useState('');
    const [pickerData, setPickerData] = useState([]);
    const [onPickerSelect, setOnPickerSelect] = useState(() => { });

    // Date Picker State
    const [showDatePicker, setShowDatePicker] = useState(false);

    useEffect(() => {
        if (branchid) {
            fetchClasses();
        }
        if (isEditMode && enquiry) {
            populateForm(enquiry);
            // console.log(enquiry);
        }
    }, [branchid, isEditMode]);

    const populateForm = (data) => {
        setFirstName(data.firstname || '');
        setLastName(data.lastname || '');
        setCls(data.aclass);
        setFather(data.father || '');
        setMother(data.mother || '');
        // Contact might be contact1 or contact (if API returns it differently)
        setContact(data.contact1 || '');
        setEmail(data.emailid || '');
        setAddress(data.localaddress || '');
        setRemarks(data.remarks || '');
        setEnquiryId(data.enrollment);
        const imgUrl = data.imgurl.includes('https://school.siddhantait.com/admin/') ? data.imgurl : 'https://school.siddhantait.com/admin/' + data.imgurl;
        setFilePath(imgUrl || '');

        // Date handling
        // API might return 'attendancedate' or 'dob' or 'attendance_date'
        const dateStr = data.dob || data.attendancedate;
        if (dateStr) {
            const parts = dateStr.split('-');
            if (parts.length === 3) {
                if (parts[0].length === 4) {
                    // YYYY-MM-DD
                    const d = new Date(parts[0], parts[1] - 1, parts[2]);
                    if (!isNaN(d.getTime())) setDOB(d);
                } else {
                    // DD-MM-YYYY
                    const d = new Date(parts[2], parts[1] - 1, parts[0]);
                    if (!isNaN(d.getTime())) setDOB(d);
                }
            } else {
                // Try standard parse
                const d = new Date(dateStr);
                if (!isNaN(d.getTime())) setDOB(d);
            }
        }
    };

    const fetchClasses = () => {
        axios.get('/getallclasses', { params: { branchid } })
            .then(response => {
                if (response.data && response.data.rows) {
                    setClasses(response.data.rows);
                }
            })
            .catch(err => console.log('Error fetching classes', err));
    };

    const handleDateChange = (event, selectedDate) => {
        const currentDate = selectedDate || dob;
        setShowDatePicker(Platform.OS === 'ios');
        setDOB(currentDate);
        if (Platform.OS !== 'ios') {
            setShowDatePicker(false);
        }
    };

    // Image Picker State
    const [imageOptionsVisible, setImageOptionsVisible] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);

    const handlePhotoEdit = () => {
        setImageOptionsVisible(true);
    };

    const handleCamera = () => {
        ImagePicker.openCamera({
            width: 300,
            height: 400,
            cropping: true,
            includeBase64: true,
            mediaType: 'photo',
        }).then(image => {
            setImageOptionsVisible(false);
            setFilePath(null);
            setSelectedImage({ uri: image.path, base64: image.data });
        }).catch(err => {
            console.log(err);
             if (err.code !== 'E_PICKER_CANCELLED') {
                Alert.alert('Error', 'Failed to open camera');
            }
        });
    };

    const handleGallery = () => {
        ImagePicker.openPicker({
            width: 300,
            height: 400,
            cropping: true,
            includeBase64: true,
            mediaType: 'photo',
        }).then(image => {
            setImageOptionsVisible(false);
            setFilePath(null);
            setSelectedImage({ uri: image.path, base64: image.data });
        }).catch(err => {
            console.log(err);
             if (err.code !== 'E_PICKER_CANCELLED') {
                Alert.alert('Error', 'Failed to open gallery');
            }
        });
    };

    // Helper to upload image and return Promise with path
    const uploadImagePromise = (asset) => {
        return new Promise((resolve, reject) => {
            // Match the format expected by the backend
            if (asset.base64) {
                axios.post('/file-upload-enquiry-direct', {
                    filepath: asset.base64, // Sending base64 string
                    branchid: branchid,
                    owner: phone
                }).then(response => {
                    resolve(response.data.stpath);
                }).catch(err => {
                    reject(err);
                });
            } else {
                reject(new Error("No base64 data"));
            }
        });
    };

    const renderImageOptionsActionSheet = () => {
        if (!imageOptionsVisible) return null;
        return (
            <View style={styles.modalOverlayWrapper}>
                <TouchableOpacity style={styles.modalOverlay} onPress={() => setImageOptionsVisible(false)} activeOpacity={1}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Update Photo</Text>
                        <TouchableOpacity style={styles.modalItem} onPress={handleCamera}>
                            <Icon name="camera" size={24} color={styleContext.primaryColor || '#5a45d4'} style={{ marginRight: 10 }} />
                            <Text style={styles.modalItemText}>Take Photo</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.modalItem} onPress={handleGallery}>
                            <Icon name="image" size={24} color={styleContext.primaryColor || '#5a45d4'} style={{ marginRight: 10 }} />
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

    // Helper for legacy date format DD-MM-YYYY
    const formatDateLegacy = (date) => {
        let month = date.getMonth() + 1;
        let day = date.getDate();
        if (month < 10) month = `0${month}`;
        if (day < 10) day = `0${day}`;
        return `${day}-${month}-${date.getFullYear()}`;
    };

    const handleSubmit = async () => {
        if (!firstName.trim()) { Alert.alert('Error', 'First name is required'); return; }
        if (!cls) { Alert.alert('Error', 'Class is required'); return; }
        if (!contact.trim()) { Alert.alert('Error', 'Contact is required'); return; }
        if (!address.trim()) { Alert.alert('Error', 'Address is required'); return; }
        if (!remarks.trim()) { Alert.alert('Error', 'Remarks is required'); return; }

        setSubmitting(true);
        Toast.show({
            type: 'info',
            text1: 'Processing...',
            text2: 'Please wait...'
        });

        let currentFilePath = filePath;

        // Upload Image if selected
        if (selectedImage) {
            try {
                Toast.show({ type: 'info', text1: 'Uploading photo...', text2: 'Please wait.' });
                currentFilePath = await uploadImagePromise(selectedImage);
                setFilePath(currentFilePath); // Update state just in case
            } catch (error) {
                setSubmitting(false);
                console.log(error);
                Toast.show({
                    type: 'error',
                    text1: 'Upload Error',
                    text2: 'Failed to upload photo. Please try again.'
                });
                return; // Stop submission
            }
        }

        // Use legacy format DD-MM-YYYY
        const formattedDate = formatDateLegacy(dob);

        const payload = {
            id: enquiryId,
            firstname: firstName,
            lastname: lastName,
            classid: cls,
            father: father,
            mother: mother,
            attendancedate: formattedDate,
            contact,
            email,
            address,
            filepath: currentFilePath,
            branchid: branchid,
            owner: phone,
            remarks: remarks
        };

        if (isEditMode) {
            payload.id = enquiry.enrollment; // Or enquiry.id depending on object
        }

        axios.post('add-enquiry', payload).then(response => {
            setSubmitting(false);
            if (response.data.status === 'ok') {
                Toast.show({
                    type: 'success',
                    text1: 'Success',
                    text2: 'Enquiry created successfully'
                });
                navigation.navigate('EnquiryListScreen');
                
            } else {
                Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: 'Enquiry not created'
                });
            }
        }).catch(err => {
            setSubmitting(false);
            console.log(err);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Something went wrong'
            });
        });
    };

    // Picker Helpers
    // We need state for pickerSelectedValue like MarkAttendance
    const [pickerSelectedValue, setPickerSelectedValue] = useState(null);

    const openPickerWithSelection = (title, data, currentVal, onSelect) => {
        setPickerTitle(title);
        setPickerData(data);
        setPickerSelectedValue(currentVal);
        setOnPickerSelect(() => onSelect); // Store the setter to call on confirm
        setPickerVisible(true);
    };

    const onPickerConfirm = () => {
        // Call the stored setter with the *current* selected value from the modal
        if (onPickerSelect) {
            onPickerSelect(pickerSelectedValue);
        }
        setPickerVisible(false);
    };

    const classesData = () => {
        return classes.map(c => ({ label: c.classname, value: c.classid }));
    };

    return (
        <SafeAreaView style={styleContext.background} edges={['bottom', 'left', 'right']}>
            <CustomPickerModal
                visible={pickerVisible}
                title={pickerTitle}
                data={pickerData}
                selectedValue={pickerSelectedValue}
                onSelect={setPickerSelectedValue} // Update local selection state only
                onClose={() => setPickerVisible(false)}
                onConfirm={onPickerConfirm} // Commit on verify
            />

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
            >
                <ScrollView contentContainerStyle={{ padding: 16 }}>

                    {/* Image Picker */}
                    <View style={{ alignItems: 'center', marginBottom: 20 }}>
                        <TouchableOpacity onPress={handlePhotoEdit} style={{
                            width: 100,
                            height: 100,
                            borderRadius: 50,
                            backgroundColor: '#eee',
                            justifyContent: 'center',
                            alignItems: 'center',
                            overflow: 'hidden',
                            borderWidth: 1,
                            borderColor: '#ddd'
                        }}>
                            {selectedImage ? (
                                <Image source={{ uri: selectedImage.uri }} style={{ width: 100, height: 100 }} />
                            ) : filePath ? (
                                <Image source={{ uri: filePath.startsWith('http') ? filePath : 'https://school.siddhantait.com/' + filePath }} style={{ width: 100, height: 100 }} />
                            ) : (
                                <Icon name="camera" size={40} color="#999" />
                            )}
                        </TouchableOpacity>
                        <Text style={{ marginTop: 8, color: '#666', fontSize: 12 }}>Tap to add photo</Text>
                    </View>

                    {/* First Name */}
                    <View style={styleContext.mobileInputContainer}>
                        <Text style={styleContext.label}>First Name</Text>
                        <View style={[styleContext.input, { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10 }]}>
                            <TextInput
                                value={firstName}
                                onChangeText={setFirstName}
                                placeholder="Enter First Name"
                                placeholderTextColor="#888"
                                style={{ flex: 1, fontSize: 16, color: styleContext.blackColor }}
                            />
                        </View>
                    </View>

                    {/* Last Name */}
                    <View style={styleContext.mobileInputContainer}>
                        <Text style={styleContext.label}>Last Name</Text>
                        <View style={[styleContext.input, { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10 }]}>
                            <TextInput
                                value={lastName}
                                onChangeText={setLastName}
                                placeholder="Enter Last Name"
                                placeholderTextColor="#888"
                                style={{ flex: 1, fontSize: 16, color: styleContext.blackColor }}
                            />
                        </View>
                    </View>

                    {/* Class Picker */}
                    <View style={styleContext.mobileInputContainer}>
                        <Text style={styleContext.label}>Class</Text>
                        <TouchableOpacity
                            style={styleContext.pickerButton}
                            onPress={() => openPickerWithSelection('Select Class', classesData(), cls, setCls)}
                        >
                            <Text style={styleContext.pickerButtonText}>
                                {cls ? classesData().find(c => c.value === cls)?.label : 'Select Class'}
                            </Text>
                            <Icon name="chevron-down" size={24} color={styleContext.blackColor} />
                        </TouchableOpacity>
                    </View>

                    {/* DOB */}
                    <View style={styleContext.mobileInputContainer}>
                        <Text style={styleContext.label}>Date of Birth</Text>
                        <TouchableOpacity
                            style={[styleContext.input, { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, justifyContent: 'space-between' }]}
                            onPress={() => setShowDatePicker(true)}
                        >
                            <Text style={{ fontSize: 16, color: styleContext.blackColor }}>
                                {dob.toDateString()}
                            </Text>
                            <Icon name="calendar" size={24} color="#666" />
                        </TouchableOpacity>
                        {showDatePicker && (
                            <DateTimePicker
                                testID="dateTimePicker"
                                value={dob}
                                mode="date"
                                display="default"
                                onChange={handleDateChange}
                            />
                        )}
                    </View>

                    {/* Father Name */}
                    <View style={styleContext.mobileInputContainer}>
                        <Text style={styleContext.label}>Father Name</Text>
                        <View style={[styleContext.input, { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10 }]}>
                            <TextInput
                                value={father}
                                onChangeText={setFather}
                                placeholder="Enter Father Name"
                                placeholderTextColor="#888"
                                style={{ flex: 1, fontSize: 16, color: styleContext.blackColor }}
                            />
                        </View>
                    </View>

                    {/* Mother Name */}
                    <View style={styleContext.mobileInputContainer}>
                        <Text style={styleContext.label}>Mother Name</Text>
                        <View style={[styleContext.input, { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10 }]}>
                            <TextInput
                                value={mother}
                                onChangeText={setMother}
                                placeholder="Enter Mother Name"
                                placeholderTextColor="#888"
                                style={{ flex: 1, fontSize: 16, color: styleContext.blackColor }}
                            />
                        </View>
                    </View>

                    {/* Contact */}
                    <View style={styleContext.mobileInputContainer}>
                        <Text style={styleContext.label}>Contact No.</Text>
                        <View style={[styleContext.input, { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10 }]}>
                            <TextInput
                                value={contact}
                                onChangeText={setContact}
                                placeholder="Enter Contact No."
                                placeholderTextColor="#888"
                                keyboardType="phone-pad"
                                maxLength={10}
                                style={{ flex: 1, fontSize: 16, color: styleContext.blackColor }}
                            />
                        </View>
                    </View>

                    {/* Email */}
                    <View style={styleContext.mobileInputContainer}>
                        <Text style={styleContext.label}>Email</Text>
                        <View style={[styleContext.input, { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10 }]}>
                            <TextInput
                                value={email}
                                onChangeText={setEmail}
                                placeholder="Enter Email"
                                placeholderTextColor="#888"
                                keyboardType="email-address"
                                style={{ flex: 1, fontSize: 16, color: styleContext.blackColor }}
                            />
                        </View>
                    </View>

                    {/* Address */}
                    <View style={styleContext.mobileInputContainer}>
                        <Text style={styleContext.label}>Address</Text>
                        <View style={[styleContext.input, { paddingHorizontal: 10, height: 80, paddingVertical: 10 }]}>
                            <TextInput
                                value={address}
                                onChangeText={setAddress}
                                placeholder="Enter Address"
                                placeholderTextColor="#888"
                                multiline
                                numberOfLines={3}
                                style={{ flex: 1, fontSize: 16, color: styleContext.blackColor, textAlignVertical: 'top' }}
                            />
                        </View>
                    </View>

                    {/* Remarks */}
                    <View style={styleContext.mobileInputContainer}>
                        <Text style={styleContext.label}>Remarks</Text>
                        <View style={[styleContext.input, { paddingHorizontal: 10, height: 80, paddingVertical: 10 }]}>
                            <TextInput
                                value={remarks}
                                onChangeText={setRemarks}
                                placeholder="Enter Remarks"
                                placeholderTextColor="#888"
                                multiline
                                numberOfLines={3}
                                style={{ flex: 1, fontSize: 16, color: styleContext.blackColor, textAlignVertical: 'top' }}
                            />
                        </View>
                    </View>

                    {/* Submit Button */}
                    <TouchableOpacity
                        style={[styleContext.button, { marginTop: 20, marginBottom: 40, backgroundColor: styleContext.primaryColor || '#5a45d4' }]}
                        onPress={handleSubmit}
                        disabled={submitting}
                    >
                        {submitting ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styleContext.buttonText}>{isEditMode ? 'Update Enquiry' : 'Submit Enquiry'}</Text>
                        )}
                    </TouchableOpacity>


                </ScrollView>
            </KeyboardAvoidingView>

            {/* Image Options Modal */}
            {imageOptionsVisible && (
                <View style={[styles.absoluteFill, { zIndex: 999 }]}>
                    {renderImageOptionsActionSheet()}
                </View>
            )}

        </SafeAreaView>
    );
}

const styles = {
    absoluteFill: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    modalOverlayWrapper: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalOverlay: {
        flex: 1,
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
    }
};
