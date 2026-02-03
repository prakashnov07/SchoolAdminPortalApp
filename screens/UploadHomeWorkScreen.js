import React, { useState, useEffect, useContext, useLayoutEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ScrollView, Alert, Platform, Image, Modal, TouchableWithoutFeedback } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import DateTimePicker from '@react-native-community/datetimepicker';
import ImagePicker from 'react-native-image-crop-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

import { CoreContext } from '../context/CoreContext';
import { StyleContext } from '../context/StyleContext';
import CustomPickerModal from '../components/CustomPickerModal';
import HomeWorkMenuModal from '../components/HomeWorkMenuModal';

export default function UploadHomeWorkScreen({ navigation }) {
    const coreContext = useContext(CoreContext);
    const styleContext = useContext(StyleContext);
    const { 
        primary, 
        text, 
        background,
        pickerModalOverlay,
        pickerModalContent,
        pickerModalTitle,
        pickerModalItem,
        pickerModalItemText,
        pickerModalButton,
        pickerModalButtonText
    } = styleContext;

    // Mode: 'homework' or 'syllabus'
    const [mode, setMode] = useState('homework');
    
    // Selections
    const [selectedClass, setSelectedClass] = useState(0);
    const [selectedSection, setSelectedSection] = useState(0);
    const [selectedSubject, setSelectedSubject] = useState('');
    
    // Inputs
    const [title, setTitle] = useState('');
    const [comment, setComment] = useState('');
    const [attendanceDate, setAttendanceDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Attachments
    const [attachmentType, setAttachmentType] = useState('image'); // 'image' or 'pdf'
    const [pickedImages, setPickedImages] = useState([]);
    const [pickedDocs, setPickedDocs] = useState([]);

    // Data lists
    const [classes, setClasses] = useState([]);
    const [sections, setSections] = useState([]);
    const [subjects, setSubjects] = useState([]); // Would fetch or use context

    const [loading, setLoading] = useState(false);
    
    // Custom Picker State
    const [pickerVisible, setPickerVisible] = useState(false);
    const [pickerConfig, setPickerConfig] = useState({ title: '', data: [], selected: null, onSelect: () => {} });

    // Image Options Modal
    const [imageOptionsVisible, setImageOptionsVisible] = useState(false);

    // Menu Modal State
    const [menuVisible, setMenuVisible] = useState(false);

    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <TouchableOpacity onPress={() => setMenuVisible(true)} style={{ marginRight: 15 }}>
                    <Icon name="dots-vertical" size={24} color="#fff" />
                </TouchableOpacity>
            ),
        });
    }, [navigation]);

    useEffect(() => {
        if (coreContext.branchid) {
            fetchInitialData();
        }
    }, [coreContext.branchid]);

    useEffect(() => {
        if (coreContext.subjects && coreContext.subjects.length > 0) {
            const subjectOptions = coreContext.subjects.map(s => {
                let name = s.name;
                return { label: name, value: name };
            });
            setSubjects(subjectOptions);
        }
    }, [coreContext.subjects]);


    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const branchid = coreContext.branchid;
            
            // Fetch Classes
            const classRes = await axios.get('/getallclasses', { params: { branchid } });
            setClasses((classRes.data.rows || []).map(c => ({ label: c.classname, value: c.classid })));
            
             // Fetch Sections
            const sectionRes = await axios.get('/getallsections', { params: { branchid } });
            setSections((sectionRes.data.rows || []).map(s => ({ label: s.sectionname, value: s.sectionid })));

             // Fetch Subjects (Assuming API exists or use existing lists)
             // If no API, we might need to hardcode or use a known list. 
             // Legacy uses props.subjects from Redux. 
             // Let's try fetching or mock if fails.
             // Subjects are handled by CoreContext
             if (coreContext.subjects && coreContext.subjects.length > 0) {
                 setSubjects(coreContext.subjects.map(s => ({ label: s.name, value: s.name })));
             } else {
                 coreContext.fetchSubjects();
             }


        } catch (error) {
            console.error(error);
            Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to load initial data' });
        } finally {
            setLoading(false);
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

    // --- File Picking Logic ---

    const processPickedImage = (assets) => {
        setImageOptionsVisible(false);
        if (assets && assets.length > 0) {
          const newAttachments = assets.map(a => {
            const finalUri = a.path; 
            // react-native-image-crop-picker returns 'path', 'size', 'mime', 'filename'(ios only often), 'data'(if includeBase64)
            // We need to ensure we have data if we upload base64, or just uri if we read later.
            // Upload logic in handleUpload reads base64 for PDFs but expected JSON of objects for images.
            // Let's assume we need to read base64 here or later. 
            // SentMessagesScreen reads it later using ReactNativeBlobUtil.fs.readFile(path, 'base64').
            // UploadHomeWorkScreen currently (legacy code I wrote) assumed `data` property exists or was Expo asset.
            
            // Let's mimic SendMessageScreen which sets uri and then reads it during upload.
            // BUT wait, my `handleUpload` for images in this file does:
            // `filepaths: JSON.stringify(pickedImages)`
            // Legacy UploadHomeWork used `imagePickedHandler` which set `imageData` (base64) into the object?
            // Re-checking legacy `UploadHomeWork.js`:
            // `imagePickedFromCameraHandler` -> `pickedImages.concat([pickedImage])`
            // `PickCropCameraHomeWork.js` -> `ImagePicker.openCamera({ includeBase64: true }).then(image => { onImagePicked(image); })`
            // So legacy objects HAD `data` (base64) inside them!
            
            return {
              uri: finalUri,
              type: a.mime || 'image/jpeg',
              name: a.filename || `image_${Date.now()}_${Math.random().toString(36).substr(2, 5)}.jpg`,
              data: a.data || null // Ensure we requested base64
            };
          });
    
          setPickedImages(prev => [...prev, ...newAttachments]);
        }
      };

    const handleCamera = () => {
        ImagePicker.openCamera({
            cropping: true,
            freeStyleCropEnabled: true,
            compressImageMaxWidth: 1080,
            compressImageMaxHeight: 1080,
            compressImageQuality: 0.7,
            mediaType: 'photo',
            includeBase64: true, // Legacy expects base64 in the object
            cropperStatusBarColor: 'black',
            cropperToolbarColor: 'white',
            cropperToolbarWidgetColor: 'black',
            cropperActiveWidgetColor: '#5a45d4',
        }).then(image => {
             processPickedImage([image]);
        }).catch(e => {
            if (e.code !== 'E_PICKER_CANCELLED') alert('Error: ' + e.message);
        });
    };

    const handleCropPick = () => {
        ImagePicker.openPicker({
            cropping: true,
            freeStyleCropEnabled: true,
            compressImageQuality: 0.7,
            compressImageMaxWidth: 1080,
            compressImageMaxHeight: 1080,
            mediaType: 'photo',
            includeBase64: true,
            cropperStatusBarColor: 'black',
            cropperToolbarColor: 'white',
            cropperToolbarWidgetColor: 'black',
            cropperActiveWidgetColor: '#5a45d4',
        }).then(image => {
            processPickedImage([image]);
        }).catch(e => {
            if (e.code !== 'E_PICKER_CANCELLED') alert('Error: ' + e.message);
        });
    };

    const handleMultiPick = () => {
        ImagePicker.openPicker({
            multiple: true,
            waitAnimationEnd: false,
            includeExif: true,
            forceJpg: true,
            compressImageQuality: 0.7,
            compressImageMaxWidth: 1080,
            compressImageMaxHeight: 1080,
            maxFiles: 10,
            mediaType: 'photo',
            includeBase64: true,
            cropping: false,
        }).then(images => {
            processPickedImage(images);
        }).catch(e => {
            if (e.code !== 'E_PICKER_CANCELLED') alert('Error: ' + e.message);
        });
    };

    const renderImageOptionsModal = () => (
        <Modal visible={imageOptionsVisible} transparent animationType="slide" onRequestClose={() => setImageOptionsVisible(false)}>
          <TouchableWithoutFeedback onPress={() => setImageOptionsVisible(false)}>
            <View style={pickerModalOverlay || styles.modalOverlay}>
              <View style={pickerModalContent || styles.modalContent}>
                <Text style={pickerModalTitle || styles.modalTitle}>Select Image Option</Text>
    
                <TouchableOpacity style={[pickerModalItem || styles.modalItem, { alignItems: 'center' }]} onPress={handleCamera}>
                  <Text style={[pickerModalItemText || styles.modalItemText, { fontSize: 18, paddingVertical: 10 }]}>Use Camera</Text>
                </TouchableOpacity>
    
                <TouchableOpacity style={[pickerModalItem || styles.modalItem, { alignItems: 'center' }]} onPress={handleCropPick}>
                  <Text style={[pickerModalItemText || styles.modalItemText, { fontSize: 18, paddingVertical: 10 }]}>Crop & Pick Image</Text>
                </TouchableOpacity>
    
                <TouchableOpacity style={[pickerModalItem || styles.modalItem, { alignItems: 'center', borderBottomWidth: 0 }]} onPress={handleMultiPick}>
                  <Text style={[pickerModalItemText || styles.modalItemText, { fontSize: 18, paddingVertical: 10 }]}>Pick Multiple Images</Text>
                </TouchableOpacity>
    
                <View style={{ marginTop: 20 }}>
                  <TouchableOpacity style={[pickerModalButton || styles.modalButton, { backgroundColor: '#eee', borderRadius: 10 }]} onPress={() => setImageOptionsVisible(false)}>
                    <Text style={[pickerModalButtonText || styles.modalButtonText, { color: 'black' }]}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      );

    const pickDocument = async () => {
        if (attachmentType !== 'pdf') {
            setPickedImages([]);
            setAttachmentType('pdf');
        }

        let result = await DocumentPicker.getDocumentAsync({
            type: 'application/pdf',
            copyToCacheDirectory: true 
        });

        if (result.assets && result.assets.length > 0) {
            const doc = result.assets[0];
            
            // Read Base64
            try {
                const base64 = await FileSystem.readAsStringAsync(doc.uri, { encoding: FileSystem.EncodingType.Base64 });
                
                const docObj = {
                    uri: doc.uri,
                    name: doc.name,
                    size: doc.size,
                    data: base64
                };
                setPickedDocs(prev => [...prev, docObj]);

            } catch (e) {
                console.error(e);
                Alert.alert("Error", "Could not read document file.");
            }
        }
    };
    
    // --- Upload Logic ---

    const handleUpload = async () => {
        if (!selectedClass) return Alert.alert("Error", "Please select a Class");
        if (!selectedSubject) return Alert.alert("Error", "Please select a Subject"); // Optional in legacy? No, required.
        if (!title && !comment && pickedImages.length === 0 && pickedDocs.length === 0) {
             return Alert.alert("Error", "Please enter some content or attach files");
        }

        setLoading(true);
        const branchid = coreContext.branchid;
        const owner = coreContext.phone;
        const formattedDate = formatDate(attendanceDate);

        try {
            // Case 1: PDF Upload
            if (attachmentType === 'pdf' && pickedDocs.length > 0) {
                 const doc = pickedDocs[0]; // Legacy supports 1 doc?
                 
                 // 1. Upload Document
                 Toast.show({ type: 'info', text1: 'Uploading PDF...', text2: 'Please wait' });
                 const uploadDocRes = await axios.post('/uploadhomeworkdocuments', {
                     filepath: doc.data, // Base64
                     name: doc.name,
                     owner,
                     branchid
                 });
                 
                 const serverFilePath = [uploadDocRes.data.sFPath]; // Legacy sends array?

                 // 2. Create Entry
                 await axios.post('/uploadhomeworkmulti', {
                     subject: selectedSubject,
                     comment: comment || '',
                     cid: selectedClass,
                     sid: selectedSection,
                     owner,
                     filepath: serverFilePath,
                     astatus: 'not',
                     branchid,
                     title: title || (mode === 'syllabus' ? 'Syllabus' : 'Home Work'),
                     attendancedate: formattedDate
                 });

            } 
            // Case 2: Images Upload
            else if (attachmentType === 'image' && pickedImages.length > 0) {
                 // 1. Create Entry first (to get ID)
                 Toast.show({ type: 'info', text1: 'Creating Entry...', text2: 'Please wait' });
                 const entryRes = await axios.post('/uploadhomeworkmulti', {
                     subject: selectedSubject,
                     comment: comment || '',
                     cid: selectedClass,
                     sid: selectedSection,
                     owner,
                     filepath: '', // Empty initially
                     astatus: 'not',
                     branchid,
                     title: title || (mode === 'syllabus' ? 'Syllabus' : 'Home Work'),
                     attendancedate: formattedDate
                 });
                 
                 const lastId = entryRes.data.lastId;

                 // 2. Upload Images
                 if (lastId) {
                     Toast.show({ type: 'info', text1: 'Uploading Images...', text2: `${pickedImages.length} images` });
                     
                     // Legacy structure for `filepaths` is JSON string of image objects
                     // It likely expects the Objects to contain `data` (base64). 
                     // Legacy code: `filepaths: JSON.stringify(pickedImages)`
                     
                     await axios.post('/upload-homework-images', {
                         id: lastId,
                         filepaths: JSON.stringify(pickedImages),
                         owner,
                         branchid
                     });
                 }
            } 
            // Case 3: Text Only
            else {
                 await axios.post('/uploadhomeworkmulti', {
                     subject: selectedSubject,
                     comment: comment || '',
                     cid: selectedClass,
                     sid: selectedSection,
                     owner,
                     filepath: '',
                     astatus: 'not',
                     branchid,
                     title: title || (mode === 'syllabus' ? 'Syllabus' : 'Home Work'),
                     attendancedate: formattedDate
                 });
            }

            // 3. Notification (Always)
            const notificationContent = `${mode === 'syllabus' ? 'Syllabus' : 'Home Work'} for Class: ${selectedClass} ${selectedSection}`;
            await axios.post('/sendnotification', {
                title: title || 'New Homework',
                content: notificationContent,
                classid: selectedClass,
                sectionid: selectedSection,
                branchid
            });

            Toast.show({ type: 'success', text1: 'Success', text2: 'Uploaded Successfully' });
            
            // Reset
            setTitle('');
            setComment('');
            setPickedImages([]);
            setPickedDocs([]);

        } catch (error) {
            console.error(error);
            Toast.show({ type: 'error', text1: 'Upload Failed', text2: 'Something went wrong' });
        } finally {
            setLoading(false);
        }
    };
    
    // --- Render ---

    const openPicker = (title, data, selected, onSelect) => {
        setPickerConfig({
            title,
            data: [{ label: title, value: '' }, ...data],
            selected,
            onSelect
        });
        setPickerVisible(true);
    };
    
     const handlePickerSelect = (val) => {
         setPickerConfig(prev => ({ ...prev, selected: val }));
    };

    const handlePickerConfirm = () => {
        if (pickerConfig.onSelect) pickerConfig.onSelect(pickerConfig.selected);
        setPickerVisible(false);
    };

    return (
        <SafeAreaView style={styleContext.background} edges={['bottom', 'left', 'right']}>
            {/* Header Switch */}
            <View style={styles.headerSwitch}>
                <TouchableOpacity 
                    style={[styles.switchBtn, mode === 'homework' && styles.switchBtnActive]}
                    onPress={() => setMode('homework')}
                >
                    <Text style={[styles.switchText, mode === 'homework' && styles.switchTextActive]}>Upload Home Work</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.switchBtn, mode === 'syllabus' && styles.switchBtnActive]}
                    onPress={() => setMode('syllabus')}
                >
                    <Text style={[styles.switchText, mode === 'syllabus' && styles.switchTextActive]}>Upload Syllabus</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 10 }}>
                
                {/* Date */}
                <TouchableOpacity style={styleContext.pickerButton} onPress={() => setShowDatePicker(true)}>
                    <Text style={styleContext.pickerButtonText}>Date: {formatDate(attendanceDate)}</Text>
                    <Icon name="calendar" size={24} color={styleContext.blackColor} />
                </TouchableOpacity>
                 {showDatePicker && (
                    <DateTimePicker
                        value={attendanceDate}
                        mode="date"
                        display="default"
                        onChange={(e, d) => { setShowDatePicker(false); if(d) setAttendanceDate(d); }}
                    />
                )}

                {/* Class & Section */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <TouchableOpacity style={[styleContext.pickerButton, { flex: 1, marginRight: 5 }]} onPress={() => openPicker('Class', classes, selectedClass, setSelectedClass)}>
                         <Text style={styleContext.pickerButtonText}>{selectedClass ? classes.find(c => c.value === selectedClass)?.label : 'Select Class'}</Text>
                         <Icon name="chevron-down" size={20} color={styleContext.blackColor} />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styleContext.pickerButton, { flex: 1, marginLeft: 5 }]} onPress={() => openPicker('Section', sections, selectedSection, setSelectedSection)}>
                         <Text style={styleContext.pickerButtonText}>{selectedSection ? sections.find(s => s.value === selectedSection)?.label : 'Select Section'}</Text>
                         <Icon name="chevron-down" size={20} color={styleContext.blackColor} />
                    </TouchableOpacity>
                </View>

                {/* Subject & Type */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
                    <TouchableOpacity style={[styleContext.pickerButton, { flex: 1, marginRight: 5 }]} onPress={() => openPicker('Subject', subjects, selectedSubject, setSelectedSubject)}>
                         <Text style={styleContext.pickerButtonText}>{selectedSubject ? subjects.find(s => s.value === selectedSubject)?.label : 'Select Subject'}</Text>
                         <Icon name="chevron-down" size={20} color={styleContext.blackColor} />
                    </TouchableOpacity>
                    
                     <TouchableOpacity style={[styleContext.pickerButton, { flex: 1, marginLeft: 5 }]} onPress={() => openPicker('Type', [
                        { label: 'Image', value: 'image' },
                        { label: 'PDF', value: 'pdf' }
                     ], attachmentType, setAttachmentType)}>
                         <Text style={styleContext.pickerButtonText}>{attachmentType === 'image' ? 'Image' : 'PDF'}</Text>
                         <Icon name="chevron-down" size={20} color={styleContext.blackColor} />
                    </TouchableOpacity>
                </View>

                {/* Title & Comment */}
                <View style={styles.textInputWrapper}>
                    <TextInput 
                        placeholder="Enter Topic / Chapter Name..."
                        placeholderTextColor="#999"
                        value={title}
                        onChangeText={setTitle}
                        style={styles.textInput}
                    />
                </View>
                <View style={styles.textInputWrapper}>
                    <TextInput 
                        placeholder="Enter details..."
                        placeholderTextColor="#999"
                        value={comment}
                        onChangeText={setComment}
                        style={[styles.textInput, { height: 100, textAlignVertical: 'top' }]}
                        multiline
                    />
                </View>

                {/* File Pickers */}
                {attachmentType === 'image' && (
                    <View style={styles.attachContainer}>
                        <TouchableOpacity style={styles.attachBtn} onPress={() => setImageOptionsVisible(true)}>
                            <Icon name="image" size={24} color="#fff" />
                            <Text style={styles.attachText}>Add Image</Text>
                        </TouchableOpacity>
                        <Text style={styles.limitText}>{pickedImages.length} selected</Text>
                    </View>
                )}
                 {attachmentType === 'pdf' && (
                    <View style={styles.attachContainer}>
                        <TouchableOpacity style={[styles.attachBtn, { backgroundColor: '#d32f2f' }]} onPress={pickDocument}>
                            <Icon name="file-pdf-box" size={24} color="#fff" />
                            <Text style={styles.attachText}>Add PDF</Text>
                        </TouchableOpacity>
                        <Text style={styles.limitText}>{pickedDocs.length} selected</Text>
                    </View>
                )}

                {/* Previews */}
                {pickedImages.length > 0 && (
                    <FlatList 
                        data={pickedImages}
                        horizontal
                        renderItem={({ item, index }) => (
                            <View style={{ marginRight: 10, position: 'relative' }}>
                                <Image source={{ uri: item.uri }} style={{ width: 80, height: 80, borderRadius: 8 }} />
                                <TouchableOpacity 
                                    style={styles.deleteBadge}
                                    onPress={() => setPickedImages(prev => prev.filter((_, i) => i !== index))}
                                >
                                    <Icon name="close" size={14} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        )}
                        keyExtractor={(item, index) => index.toString()}
                        style={{ marginVertical: 10 }}
                    />
                )}
                
                 {pickedDocs.length > 0 && (
                    <View style={{ marginVertical: 10 }}>
                        {pickedDocs.map((doc, index) => (
                             <View key={index} style={styles.docItem}>
                                 <Icon name="file-pdf-box" size={24} color="#d32f2f" />
                                 <Text numberOfLines={1} style={{ flex: 1, marginLeft: 5 }}>{doc.name}</Text>
                                 <TouchableOpacity onPress={() => setPickedDocs(prev => prev.filter((_, i) => i !== index))}>
                                      <Icon name="close-circle" size={20} color="#666" />
                                 </TouchableOpacity>
                             </View>
                        ))}
                    </View>
                )}

                {/* Upload Button */}
                {/* Upload Button */}
                <TouchableOpacity 
                    style={[styleContext.button, { marginTop: 20, opacity: loading ? 0.7 : 1 }]}
                    onPress={handleUpload}
                    disabled={loading}
                >
                    <Text style={styleContext.buttonText}>{loading ? 'Uploading...' : 'Upload'}</Text>
                </TouchableOpacity>

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
            <HomeWorkMenuModal 
                visible={menuVisible} 
                onClose={() => setMenuVisible(false)} 
                setMode={setMode}
            />
            {renderImageOptionsModal()}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    headerSwitch: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        elevation: 2
    },
    switchBtn: {
        flex: 1,
        padding: 15,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent'
    },
    switchBtnActive: {
        borderBottomColor: '#6200ee'
    },
    switchText: {
        fontWeight: 'bold',
        color: '#666'
    },
    switchTextActive: {
        color: '#6200ee'
    },
    inputContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 8,
         marginVertical: 5,
         borderWidth: 1,
         borderColor: '#eee'
    },
    label: { color: '#333' },
    textInputWrapper: {
        backgroundColor: '#fff',
        borderRadius: 8,
        marginVertical: 5,
        borderWidth: 1,
        borderColor: '#eee',
        paddingHorizontal: 10
    },
    textInput: {
        paddingVertical: 10,
        fontSize: 16
    },
    attachContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 15
    },
    attachBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#4caf50',
        padding: 10,
        borderRadius: 8,
        marginRight: 10
    },
    attachText: { color: '#fff', fontWeight: 'bold', marginLeft: 5 },
    limitText: { color: '#666', fontStyle: 'italic' },
    deleteBadge: {
        position: 'absolute',
        top: -5,
        right: -5,
        backgroundColor: '#d32f2f',
        borderRadius: 10,
        width: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center'
    },
    docItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 10,
        borderRadius: 8,
        marginBottom: 5,
        borderWidth: 1,
        borderColor: '#eee'
    },
    uploadBtn: {
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginVertical: 20
    },
    uploadText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
    // Fallback styles if context is missing
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { width: '80%', backgroundColor: '#fff', borderRadius: 20, padding: 20 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
    modalItem: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
    modalItemText: { fontSize: 16 },
    modalButton: { paddingVertical: 10, alignItems: 'center', marginTop: 10 },
    modalButtonText: { fontSize: 16, fontWeight: 'bold' }
});
