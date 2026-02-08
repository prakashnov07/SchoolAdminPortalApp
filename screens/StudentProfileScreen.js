import React, { useState, useContext, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput, Platform, Linking, Image } from 'react-native';
import { CoreContext } from '../context/CoreContext';
import { StyleContext } from '../context/StyleContext';
import StudentPicker from '../components/StudentPicker';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import DateTimePicker from '@react-native-community/datetimepicker';
import ImagePicker from 'react-native-image-crop-picker';
import CustomPickerModal from '../components/CustomPickerModal';

export default function StudentProfileScreen({ navigation, route }) {
    const { schoolData, branchid, phone: owner, hasTabPermission } = useContext(CoreContext);
    const styleContext = useContext(StyleContext);
    // Destructure styles from context
    const { 
        primary, text, background, button, buttonText, input, label, card,
        pickerButton, pickerButtonText, mainButtonColor, blackColor
    } = styleContext;

    const [selectedStudent, setSelectedStudent] = useState(null);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    
    // Student Data State
    const [formData, setFormData] = useState({});
    const [houses, setHouses] = useState([]);
    
    // Custom Picker State
    const [pickerVisible, setPickerVisible] = useState(false);
    const [pickerConfig, setPickerConfig] = useState({ title: '', data: [], selected: null, onSelect: () => {} });

    // Editable limits
    const studentRecordEditable = schoolData?.studentRecordEditable || false;
    const studentPhotoEditable = schoolData?.studentPhotoEditable || false;

    // Suspend/Delete Modal State
    const [showSuspendModal, setShowSuspendModal] = useState(false);
    const [suspendType, setSuspendType] = useState(null); // 'suspended' or 'deleted'
    const [suspendDate, setSuspendDate] = useState(new Date());
    const [suspendRemarks, setSuspendRemarks] = useState('');
    const [showDatePicker, setShowDatePicker] = useState(false);

    useEffect(() => {
        fetchHouses();
        
        // Add Search Icon to Header
        navigation.setOptions({
             headerRight: () => (
                 <TouchableOpacity onPress={() => navigation.navigate('SearchStudentScreen')} style={{ marginRight: 15 }}>
                     <Icon name="account-group" size={24} color="#fff" />
                 </TouchableOpacity>
             ),
        });

        // Check for student coming from SearchStudentScreen
        const student = route.params?.student;
        if (student) {
            handleSelectStudent(student);
        }

    }, [route.params]);

    const fetchHouses = async () => {
        try {
            const response = await axios.get('houses', { params: { branchid } });
            if (response.data && response.data.houses) {
                setHouses(response.data.houses.map(h => ({ label: h.housename, value: h.id })));
            }
        } catch (error) {
            console.error('Error fetching houses:', error);
        }
    };

    const handleSelectStudent = async (student) => {
        // Set basic info from picker first
        setSelectedStudent(student);
        setFormData({
            ...student,
            salut: student.salut || '',
            firstname: student.firstname || '',
            lastname: student.lastname || '',
            father: student.father || '',
            mother: student.mother || '',
            contact1: student.contact1 || '',
            contact2: student.contact2 || '',
            aadharno: student.aadharno || '',
            caste: student.caste || '',
            category: student.category || '',
            house: student.house || '',
            admissiondate: (student.doa || student.admissiondate || '').replace(/\//g, '-'), // Match DOB format
        });

        // Fetch full details to get 'dp' and other missing fields
        setLoading(true);
        try {
            const response = await axios.get('/fetchstudentdetails', { 
                params: { regnos: [student.enrollment], branchid } 
            });
            
            if (response.data && response.data.students && response.data.students.length > 0) {
                const fullStudent = response.data.students[0];
                // Debug log removed
                setSelectedStudent(fullStudent);
                setFormData(prev => ({
                    ...prev,
                    ...fullStudent,
                    // Ensure strings for inputs
                    salut: fullStudent.salut || '',
                    firstname: fullStudent.firstname || '',
                    lastname: fullStudent.lastname || '',
                    father: fullStudent.father || '',
                    mother: fullStudent.mother || '',
                    contact1: fullStudent.contact1 || '',
                    contact2: fullStudent.contact2 || '',
                    aadharno: fullStudent.aadharno || '',
                    caste: fullStudent.caste || '',
                    category: fullStudent.category || '',
                    house: fullStudent.house || '',
                    dob: fullStudent.dob || student.dob || '', 
                    admissiondate: (fullStudent.doa || student.doa || fullStudent.admissiondate || '').replace(/\//g, '-'), // Use doa from search result if missing in full details and format it
                     // dp field should now be present if it exists
                }));
            }
        } catch (error) {
            console.error('Error fetching full student details:', error);
            Toast.show({ type: 'error', text1: 'Failed to fetch full details' });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async () => {
        if (!selectedStudent) return;
        
        setActionLoading(true);
        try {
            const payload = {
                salut: formData.salut,
                firstname: formData.firstname,
                lastname: formData.lastname,
                father: formData.father,
                mother: formData.mother,
                enr: formData.enrollment,
                scholarno: formData.scholarno,
                roll: formData.roll,
                contact1: formData.contact1,
                contact2: formData.contact2,
                caste: formData.caste,
                category: formData.category,
                aadharno: formData.aadharno,
                house: formData.house,
                filepath: formData.stpath || '',
                branchid,
                owner
            };

            await axios.post('/updatestudent', payload);
            
            Toast.show({ type: 'success', text1: 'Student updated successfully' });
        } catch (error) {
            console.error(error);
            Toast.show({ type: 'error', text1: 'Failed to update student' });
        } finally {
            setActionLoading(false);
        }
    };

    const handleMakePhotoEditable = async () => {
         setActionLoading(true);
         try {
            const value = studentPhotoEditable ? 'no' : 'yes';
            await axios.post('/set-other-details', { name: 'app_student_photo_editable', per: value, branchid });
            // Ideally trigger a refresh of schoolData or manually update local check (but schoolData comes from context)
            // For now, feedback to user
            Toast.show({ type: 'success', text1: `Photo editing ${value === 'yes' ? 'enabled' : 'disabled'}` });
            if(coreContext.getSchoolData) coreContext.getSchoolData(); 
         } catch (e) {
             console.error(e);
         } finally {
             setActionLoading(false);
         }
    };
    
    const handleMakeRecordEditable = async () => {
         setActionLoading(true);
         try {
            const value = studentRecordEditable ? 'no' : 'yes';
            await axios.post('/set-other-details', { name: 'app_student_record_editable', per: value, branchid });
            Toast.show({ type: 'success', text1: `Record editing ${value === 'yes' ? 'enabled' : 'disabled'}` });
            if(coreContext.getSchoolData) coreContext.getSchoolData();
         } catch (e) {
             console.error(e);
         } finally {
             setActionLoading(false);
         }
    };

    const handleImagePick = async () => {
        if (!studentPhotoEditable) {
             return Toast.show({ type: 'info', text1: 'Photo editing is disabled' });
        }

        Alert.alert(
            'Update Photo',
            'Choose an option',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Camera', onPress: () => openCamera() },
                { text: 'Gallery', onPress: () => openPicker() },
            ]
        );
    };

    const processImage = async (image) => {
         if (!image) return;
         
         const uri = image.path;
         const type = image.mime;
         
         // react-native-image-crop-picker returns 'data' if includeBase64 is true
         const base64Data = `data:${type};base64,${image.data}`;

         // Update visible state
         setFormData(prev => ({ ...prev, photo: uri, photoData: base64Data }));
         
         // Immediate upload as per legacy
         setActionLoading(true);
         try {
             const response = await axios.post('/file-upload-student-direct', { 
                 regno: formData.enrollment, 
                 filepath: image.data, 
                 branchid, 
                 owner 
             });
             Toast.show({ type: 'success', text1: 'Photo uploaded successfully' });
             if(response.data.stpath) {
                  setFormData(prev => ({ ...prev, stpath: response.data.stpath })); 
             }
         } catch (error) {
             console.error('Photo upload error:', error);
             Toast.show({ type: 'error', text1: 'Failed to upload photo' });
         } finally {
             setActionLoading(false);
         }
    };

    const openCamera = () => {
        ImagePicker.openCamera({
            mediaType: 'photo',
            freeStyleCropEnabled: true,
            cropping: true,
            includeBase64: true,
            compressImageMaxWidth: 600,
            compressImageMaxHeight: 900
        }).then(image => {
            processImage(image);
        }).catch(e => console.log(e));
    };

    const openPicker = () => {
        ImagePicker.openPicker({
            mediaType: 'photo',
            freeStyleCropEnabled: true,
            cropping: true,
            includeBase64: true,
            compressImageMaxWidth: 600,
            compressImageMaxHeight: 900
        }).then(image => {
           processImage(image);
        }).catch(e => console.log(e));
    };


    const handleGenerateOTP = async () => {
        if (!selectedStudent) return;
        setActionLoading(true);
        try {
            const response = await axios.post('/generate-otp', { branchid, contact: formData.contact1 });
            Alert.alert('App OTP', `OTP for App login is ${response.data.otp}`);
        } catch (error) {
            console.error(error);
            Toast.show({ type: 'error', text1: 'Failed to generate OTP' });
        } finally {
            setActionLoading(false);
        }
    };

    const handleSuspendDelete = async () => {
        if (!suspendRemarks) {
            Toast.show({ type: 'error', text1: 'Please enter remarks' });
            return;
        }

        setActionLoading(true);
        try {
            await axios.post('/suspend-student', {
                enr: formData.enrollment, 
                astatus: suspendType,
                remarks: suspendRemarks,
                attendancedate: suspendDate.toISOString().split('T')[0],
                owner, 
                branchid 
            });
            
            Toast.show({ type: 'success', text1: `Student ${suspendType} successfully` });
            setFormData(prev => ({ ...prev, cstatus: suspendType }));
            setShowSuspendModal(false);

        } catch (error) {
            console.error(error);
            Toast.show({ type: 'error', text1: `Failed to ${suspendType} student` });
        } finally {
            setActionLoading(false);
        }
    };
    
    const handleReinstate = async () => {
         setActionLoading(true);
        try {
            await axios.post('/suspend-student', {
                enr: formData.enrollment,
                astatus: 'active',
                remarks: '',
                attendancedate: new Date().toISOString().split('T')[0],
                owner,
                branchid
            });
             Toast.show({ type: 'success', text1: 'Student reinstated successfully' });
             setFormData(prev => ({ ...prev, cstatus: 'active' }));
        } catch (error) {
            console.error(error);
            Toast.show({ type: 'error', text1: 'Failed to reinstate student' });
        } finally {
            setActionLoading(false);
        }
    }

    const openSuspendModal = (type) => {
        setSuspendType(type);
        setSuspendRemarks('');
        setSuspendDate(new Date());
        setShowSuspendModal(true);
    };

    const handleCall = (number) => {
        if(number) Linking.openURL(`tel:${number}`);
        else Toast.show({type: 'info', text1: 'No number available'});
    };

    const handleFeeReport = () => {
        navigation.navigate('AdminFeeReportScreen');
    };

    // Picker Logic
    const openPickerModal = (title, data, selected, onSelect) => {
        if (!studentRecordEditable) return; // Disable if not editable
        setPickerConfig({ title, data, selected, onSelect });
        setPickerVisible(true);
    };
    
    const handlePickerSelect = (val) => {
        setPickerConfig(prev => ({...prev, selected: val}));
    };

    const handlePickerConfirm = () => {
        if(pickerConfig.onSelect) pickerConfig.onSelect(pickerConfig.selected);
        setPickerVisible(false);
    };

    const renderInput = (labelKey, valueKey, labelText, editable = true, maxLength = 100, multiline = false) => (
        <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: label?.color || '#000' }]}>{labelText}</Text>
            <TextInput
                style={[styles.input, { borderColor: input?.borderColor || '#000', color: input?.color || '#000', backgroundColor: editable ? (input?.backgroundColor || '#fff') : '#f0f0f0' }, multiline && { height: 80, textAlignVertical: 'top' }]}
                value={formData[valueKey]}
                onChangeText={(text) => setFormData(prev => ({ ...prev, [valueKey]: text }))}
                editable={editable && studentRecordEditable} // Global edit lock
                maxLength={maxLength}
                multiline={multiline}
                numberOfLines={multiline ? 4 : 1}
            />
        </View>
    );

    const categories = [
        { label: "General", value: "General" },
        { label: "OBC", value: "OBC" },
        { label: "EBC", value: "EBC" },
        { label: "SC", value: "SC" },
        { label: "ST", value: "ST" },
        { label: "Others", value: "Others" }
    ];

    const salutations = [
        { label: "Master", value: "Master" },
        { label: "Miss", value: "Miss" },
        { label: "Mr", value: "Mr" },
        { label: "Mrs", value: "Mrs" },
        { label: "Ms", value: "Ms" },
        { label: "Md", value: "Md" },
    ];

    return (
        <View style={[styles.container, { backgroundColor: background?.backgroundColor || '#fff' }]}>
             
             <View style={{ padding: 15, zIndex: 1000}}>
                <StudentPicker onSelect={handleSelectStudent} />
             </View>

             <ScrollView contentContainerStyle={styles.scrollContent}>
                {selectedStudent ? (
                    <View style={[styles.card, { backgroundColor: card?.backgroundColor || '#fff', borderColor: card?.borderColor || '#000' }]}>
                        
                        {/* Image Section */}
                        <View style={{ alignItems: 'center', marginBottom: 20 }}>
                            <TouchableOpacity onPress={handleImagePick}>
                                 {formData.photo ? (
                                     <Image 
                                        source={{ uri: formData.photo.startsWith('http') || formData.photo.startsWith('file') ? formData.photo : `${schoolData.studentimgpath}${formData.photo}` }} 
                                        style={styles.profileImage} 
                                     />
                                 ) : (
                                     <View style={[styles.profileImage, { backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center' }]}>
                                         <Icon name="camera" size={40} color="#999" />
                                         <Text style={{fontSize: 10, color: '#999'}}>Tap to upload</Text>
                                     </View>
                                 )}
                            </TouchableOpacity>
                        </View>

                        {/* Basic Info (Read Only mainly) */}
                        <View style={styles.row}>
                             <View style={{flex: 1, marginRight: 5}}>
                                <Text style={styles.readOnlyLabel}>{schoolData?.smallEnr || 'Enr No'}</Text>
                                <Text style={styles.readOnlyValue}>{formData.enrollment}</Text>
                            </View>
                            <View style={{flex: 1, marginLeft: 5}}>
                                <Text style={styles.readOnlyLabel}>{schoolData?.smallReg || 'Reg No'}</Text>
                                <Text style={styles.readOnlyValue}>{formData.scholarno || 'NA'}</Text>
                            </View>
                        </View>
                        
                        {Number(formData.pendingAmount) > 0 && (
                            <View style={{ marginBottom: 15, padding: 10, backgroundColor: '#ffebee', borderRadius: 5, borderWidth: 1, borderColor: '#ffcdd2', alignItems: 'center' }}>
                                <Text style={{ color: '#d32f2f', fontWeight: 'bold', fontSize: 16 }}>
                                    Current Dues: Rs.{formData.pendingAmount}
                                </Text>
                            </View>
                        )}


                         <View style={styles.row}>
                             <View style={{flex: 1, marginRight: 5}}>
                                <Text style={styles.readOnlyLabel}>Class</Text>
                                <Text style={styles.readOnlyValue}>{formData.clas} {formData.section}</Text>
                            </View>
                            <View style={{flex: 1, marginLeft: 5}}>
                                <Text style={styles.readOnlyLabel}>Roll No</Text>
                                <Text style={styles.readOnlyValue}>{formData.roll}</Text>
                            </View>
                        </View>
                        
                        <View style={styles.inputContainer}>
                             <Text style={[styles.label, { color: label?.color || '#000' }]}>Transport</Text>
                             <TextInput
                                style={[styles.input, { backgroundColor: '#f0f0f0', color: '#333' }]}
                                value={formData.routeName || 'NA'}
                                editable={false}
                             />
                        </View>

                         {/* Editable Fields */}
                         {/* Custom Title Input with Discipline Profile Link */}
                         <View style={styles.inputContainer}>
                            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                                <Text style={[styles.label, { color: label?.color || '#000' }]}>Title</Text>
                                {formData.dp ? (
                                    <TouchableOpacity 
                                        onPress={() => navigation.navigate('DisciplineProfileScreen', { student: selectedStudent })}
                                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                        style={{ padding: 5 }}
                                    >
                                        <Text style={{ color: formData.dp, textDecorationLine: 'underline', fontWeight: 'bold' }}>Discipline Profile</Text>
                                    </TouchableOpacity>
                                ) : null}
                            </View>
                            <TouchableOpacity 
                                style={[pickerButton, { backgroundColor: studentRecordEditable ? (pickerButton.backgroundColor) : '#f0f0f0' }]}
                                onPress={() => openPickerModal('Select Title', salutations, formData.salut, (val) => setFormData(prev => ({ ...prev, salut: val })))}
                                disabled={!studentRecordEditable}
                            >
                                <Text style={[pickerButtonText, { color: studentRecordEditable ? (pickerButtonText.color) : '#555' }]}>
                                    {formData.salut || 'Select Title'}
                                </Text>
                                <Icon name="chevron-down" size={20} color={studentRecordEditable ? pickerButtonText.color : '#555'} />
                            </TouchableOpacity>
                        </View>
                         {renderInput('firstname', 'firstname', 'First Name')}
                         {renderInput('lastname', 'lastname', 'Last Name')}
                         
                         {renderInput('dob', 'dob', 'Date of Birth', false)}
                         {renderInput('admissiondate', 'admissiondate', 'Admission Date', false)}
                         
                         {renderInput('father', 'father', 'Father\'s Name')}
                         {renderInput('mother', 'mother', 'Mother\'s Name')}

                         {renderInput('contact1', 'contact1', 'Contact I', true, 10)}
                         {renderInput('contact2', 'contact2', 'Contact II', true, 10)}
                         
                         {renderInput('contact2', 'contact2', 'Contact II', true, 10)}
                         
                         {renderInput('localaddress', 'localaddress', 'Address', false, 200, true)} 
                         {renderInput('aadharno', 'aadharno', 'Aadhar No', true, 12)} 
                         {renderInput('aadharno', 'aadharno', 'Aadhar No', true, 12)}
                         {renderInput('caste', 'caste', 'Caste')}
                         
                         {/* Category Picker - Custom */}
                         <View style={styles.inputContainer}>
                            <Text style={[styles.label, { color: label?.color || '#000' }]}>Category</Text>
                            <TouchableOpacity 
                                style={[pickerButton, { backgroundColor: studentRecordEditable ? (pickerButton.backgroundColor) : '#f0f0f0' }]}
                                onPress={() => openPickerModal('Select Category', categories, formData.category, (val) => setFormData(prev => ({ ...prev, category: val })))}
                            >
                                <Text style={pickerButtonText}>{formData.category || 'Select Category'}</Text>
                                <Icon name="chevron-down" size={24} color={blackColor} />
                            </TouchableOpacity>
                         </View>

                         {/* House Picker - Custom */}
                         <View style={styles.inputContainer}>
                            <Text style={[styles.label, { color: label?.color || '#000' }]}>House</Text>
                            <TouchableOpacity 
                                style={[pickerButton, { backgroundColor: studentRecordEditable ? (pickerButton.backgroundColor) : '#f0f0f0' }]}
                                onPress={() => openPickerModal('Select House', houses, formData.house, (val) => setFormData(prev => ({ ...prev, house: val })))}
                            >
                                <Text style={pickerButtonText}>{houses.find(h => h.value === formData.house)?.label || formData.house || 'Select House'}</Text>
                                <Icon name="chevron-down" size={24} color={blackColor} />
                            </TouchableOpacity>
                         </View>

                         {/* Actions - Colored Buttons */}
                         <View style={styles.feeCallContainer}>
                             <TouchableOpacity 
                                style={[styles.coloredButton, { backgroundColor: mainButtonColor }]} 
                                onPress={handleUpdate} 
                                disabled={!studentRecordEditable || actionLoading}
                             >
                                 {actionLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.coloredButtonText}>SAVE</Text>}
                             </TouchableOpacity>
                             
                             <TouchableOpacity style={[styles.coloredButton, { backgroundColor: mainButtonColor }]} onPress={handleFeeReport}>
                                 <Icon name="currency-inr" size={24} color="#fff" />
                                 <Text style={styles.coloredButtonText}> Fee</Text>
                             </TouchableOpacity>
                             
                             <TouchableOpacity style={[styles.coloredButton, { backgroundColor: mainButtonColor }]} onPress={() => handleCall(formData.contact1)}>
                                 <Icon name="phone" size={24} color="#fff" />
                                 <Text style={styles.coloredButtonText}> Call</Text>
                             </TouchableOpacity>
                         </View>

                         {/* Admin Actions */}
                         <View style={styles.adminActions}>
                            <TouchableOpacity style={[styles.adminButton, { backgroundColor: '#1976d2' }]} onPress={handleGenerateOTP}>
                                <Text style={styles.adminButtonText}>App OTP</Text>
                            </TouchableOpacity>

                            {formData.cstatus === 'active' ? (
                                <>
                                    <TouchableOpacity style={[styles.adminButton, { backgroundColor: '#fbc02d' }]} onPress={() => openSuspendModal('suspended')}>
                                        <Text style={styles.adminButtonText}>Suspend</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.adminButton, { backgroundColor: '#d32f2f' }]} onPress={() => openSuspendModal('deleted')}>
                                        <Text style={styles.adminButtonText}>Delete</Text>
                                    </TouchableOpacity>
                                </>
                            ) : (
                                <TouchableOpacity style={[styles.adminButton, { backgroundColor: '#388e3c' }]} onPress={handleReinstate}>
                                     <Text style={styles.adminButtonText}>Reinstate</Text>
                                </TouchableOpacity>
                            )}
                         </View>

                         {/* Admin Controls */}
                         {(schoolData.role === 'super' || schoolData.role === 'tech') && (
                             <View style={{ marginTop: 20 }}>
                                 <TouchableOpacity onPress={handleMakeRecordEditable} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                                     <Icon name={studentRecordEditable ? "checkbox-marked" : "checkbox-blank-outline"} size={24} color="#666" />
                                     <Text style={{ marginLeft: 10 }}>Student Record {studentRecordEditable ? 'Editable' : 'Not Editable'}</Text>
                                 </TouchableOpacity>
                                 <TouchableOpacity onPress={handleMakePhotoEditable} style={{ flexDirection: 'row', alignItems: 'center' }}>
                                     <Icon name={studentPhotoEditable ? "checkbox-marked" : "checkbox-blank-outline"} size={24} color="#666" />
                                     <Text style={{ marginLeft: 10 }}>Student Photo {studentPhotoEditable ? 'Editable' : 'Not Editable'}</Text>
                                 </TouchableOpacity>
                             </View>
                         )}

                    </View>
                ) : (
                    <View style={styles.emptyState}>
                        <Icon name="account-search-outline" size={64} color="#ccc" />
                        <Text style={{ color: '#666', marginTop: 10 }}>Search for a student to view profile</Text>
                    </View>
                )}
             </ScrollView>
             
             <CustomPickerModal
                visible={pickerVisible}
                title={pickerConfig.title}
                data={pickerConfig.data}
                selectedValue={pickerConfig.selected}
                onSelect={handlePickerSelect}
                onConfirm={handlePickerConfirm}
                onClose={() => setPickerVisible(false)}
            />

             {/* Suspend/Delete Modal Same as before */}
             {showSuspendModal && (
                 <View style={styles.modalOverlay}>
                     <View style={styles.modalContent}>
                         <Text style={styles.modalTitle}>{suspendType === 'suspended' ? 'Suspend Student' : 'Delete Student'}</Text>
                         
                         <Text style={styles.label}>Suspend Till</Text>
                         <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.datePickerButton}>
                             <Text>{suspendDate.toDateString()}</Text>
                             <Icon name="calendar" size={20} />
                         </TouchableOpacity>
                         
                         {showDatePicker && (
                             <DateTimePicker
                                 value={suspendDate}
                                 mode="date"
                                 display="default"
                                 onChange={(event, selectedDate) => {
                                     setShowDatePicker(false);
                                     if (selectedDate) setSuspendDate(selectedDate);
                                 }}
                             />
                         )}

                         <Text style={styles.label}>Remarks</Text>
                         <TextInput
                             style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                             multiline
                             value={suspendRemarks}
                             onChangeText={setSuspendRemarks}
                             placeholder="Enter remarks..."
                         />

                         <View style={styles.modalActions}>
                             <TouchableOpacity onPress={() => setShowSuspendModal(false)} style={[styles.modalButton, { backgroundColor: '#ccc' }]}>
                                 <Text>Cancel</Text>
                             </TouchableOpacity>
                             <TouchableOpacity onPress={handleSuspendDelete} style={[styles.modalButton, { backgroundColor: '#d32f2f' }]}>
                                 <Text style={{ color: '#fff' }}>Confirm</Text>
                             </TouchableOpacity>
                         </View>
                     </View>
                 </View>
             )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 15,
        paddingTop: 0, 
    },
    card: {
        padding: 15,
        borderRadius: 10,
        borderWidth: 1,
        marginBottom: 20,
        backgroundColor: '#fff', 
    },
    row: {
        flexDirection: 'row',
        marginBottom: 15,
    },
    readOnlyLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
    },
    readOnlyValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    inputContainer: {
        marginBottom: 15,
    },
    label: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 10,
        fontSize: 16,
    },
    pickerContainer: {
        borderWidth: 1,
        borderRadius: 8,
        overflow: 'hidden',
    },
    profileImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 2,
        borderColor: '#ddd',
    },
    feeCallContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
        marginBottom: 10,
    },
    coloredButton: {
        padding: 10,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        marginHorizontal: 5,
        flexDirection: 'row'
    },
    coloredButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        marginLeft: 5
    },
    actionButtons: {
        marginTop: 20,
        alignItems: 'center',
    },
    saveButton: {
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 20,
        alignItems: 'center',
        minWidth: 120,
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    adminActions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 30,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        paddingTop: 20,
    },
    adminButton: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        minWidth: 80,
        alignItems: 'center',
    },
    adminButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 50,
    },
    modalOverlay: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2000,
    },
    modalContent: {
        width: '80%',
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 20,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        textAlign: 'center',
    },
    datePickerButton: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 10,
        borderRadius: 5,
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 20,
    },
    modalButton: {
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 5,
        marginLeft: 10,
    },
});
