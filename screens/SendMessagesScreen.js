import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
  Modal,
  TouchableWithoutFeedback,
  Alert,
  KeyboardAvoidingView,
  ActivityIndicator,
  StyleSheet,
  Image
} from 'react-native';
import ImagePicker from 'react-native-image-crop-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons as Icon, MaterialIcons } from '@expo/vector-icons';
import SectionedMultiSelect from 'react-native-sectioned-multi-select';
import * as DocumentPicker from 'expo-document-picker';
import { readAsStringAsync } from 'expo-file-system';
import ReactNativeBlobUtil from 'react-native-blob-util';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import DateTimePicker from '@react-native-community/datetimepicker';


import { CoreContext } from '../context/CoreContext';
import { StyleContext } from '../context/StyleContext';

export default function SendMessagesScreen() {
  const {
    messages,
    setMessages,
    allClasses,
    getAllClasses,
    allSections,
    getAllSections,
    branchid,
    owner, // phone
    schoolData
  } = useContext(CoreContext);
  const styleContext = useContext(StyleContext);

  if (!styleContext) {
    throw new Error('SendMessagesScreen must be used within a StyleProvider');
  }

  const {
    blackColor,
    mainBackgroundGradient,
    container,
    input,
    button,
    buttonText,
    label,
    pickerWrapper,
    picker,
    pageTitle,
    pickerButton,
    pickerButtonText,
    attachmentContainer,
    attachmentOption,
    attachmentOptionSelected,
    attachmentOptionText,
    attachmentInfo,
    pickerModalOverlay,
    pickerModalContent,
    pickerModalTitle,
    pickerModalItem,
    pickerModalItemSelected,
    pickerModalItemText,
    pickerModalItemTextSelected,
    pickerModalButtons,
    pickerModalButton,
    pickerModalButtonText
  } = styleContext;

  const priorities = [
    { label: 'Normal', value: '0' },
    { label: 'High', value: '1' },
    { label: 'Urgent', value: '4' },
    { label: 'Restricted', value: '2' },
    { label: 'Scheduled', value: '3' },
  ];

  const [selectedClassItems, setSelectedClassItems] = useState(['All Class']);
  const [selectedSection, setSelectedSection] = useState('A');
  const [selectedPriority, setSelectedPriority] = useState('0');
  const [selectedAttachmentType, setSelectedAttachmentType] = useState(null); // 'Image' (1) or 'PDF' (2)

  // Attachments State
  const [attachments, setAttachments] = useState([]); // Array of { uri, name, size, type, base64? }
  // Kept for single PDF or general logic, but images use attachments array.
  const [attachmentDetails, setAttachmentDetails] = useState(null);

  const [messageText, setMessageText] = useState('');
  const [msgType, setMsgType] = useState('');
  const [schDate, setSchDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  // Picker Modal State (for Section and Priority)
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerData, setPickerData] = useState([]); // Array of objects {label, value} or strings
  const [pickerSelectedValue, setPickerSelectedValue] = useState(null);
  const [pickerOnSelect, setPickerOnSelect] = useState(() => () => {});
  const [pickerTitle, setPickerTitle] = useState('');

  // Image Options Modal
  const [imageOptionsVisible, setImageOptionsVisible] = useState(false);

  useEffect(() => {
    getAllClasses();
    getAllSections();
  }, []);

  const getClassOptions = () => {
    const opts = [
      { name: 'All Classes', id: 'All Class' },
      { name: 'Staff', id: 'Staff' }
    ];
    if (allClasses && allClasses.length > 0) {
      allClasses.forEach(c => opts.push({ name: c.classname, id: c.classid }));
    }
    return opts;
  };

  const onSelectedItemsChange = (selectedItems) => {
    if (selectedItems.includes('All Class') && selectedItems.length > 1) {
      const filteredSelectedItems = selectedItems.filter(item => item !== 'All Class');
      setSelectedClassItems(filteredSelectedItems);
    } else {
      setSelectedClassItems(selectedItems);
    }
  };

  const getSectionOptions = () => {
    if (allSections && allSections.length > 0) {
      return allSections.map(s => ({ label: s.sectionname, value: s.sectionname }));
    }
    return ['A', 'B', 'C', 'D'].map(s => ({ label: s, value: s }));
  };

  const openPicker = (data, selectedValue, onSelect, title) => {
    setPickerData(data);
    setPickerSelectedValue(selectedValue);
    setPickerOnSelect(() => onSelect);
    setPickerTitle(title);
    setPickerVisible(true);
  };

  const onConfirmPicker = () => {
    pickerOnSelect(pickerSelectedValue);
    setPickerVisible(false);
  };

  const onCancelPicker = () => {
    setPickerVisible(false);
  };

  /* Refactored to includeBase64: true to bypass FileSystem issues */
  const handleCamera = () => {
    ImagePicker.openCamera({
      cropping: true,
      freeStyleCropEnabled: true,
      compressImageMaxWidth: 1080,
      compressImageMaxHeight: 1080,
      compressImageQuality: 0.7,
      mediaType: 'photo',
      cropperStatusBarColor: 'black',
      cropperToolbarColor: 'white',
      cropperToolbarWidgetColor: 'black',
      cropperActiveWidgetColor: '#5a45d4',
    }).then(image => {
      processPickedImage([image]);
    }).catch(e => {
      if (e.code !== 'E_PICKER_CANCELLED') {
        Alert.alert('Error', e.message ? e.message : e);
      }
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
      cropperStatusBarColor: 'black',
      cropperToolbarColor: 'white',
      cropperToolbarWidgetColor: 'black',
      cropperActiveWidgetColor: '#5a45d4',
    }).then(image => {
      processPickedImage([image]);
    }).catch(e => {
      if (e.code !== 'E_PICKER_CANCELLED') {
        Alert.alert('Error', e.message ? e.message : e);
      }
    });
  };

  const handleMultiPick = () => {
    ImagePicker.openPicker({
      multiple: true,
      waitAnimationEnd: false,
      includeExif: true,
      forceJpg: true, // Legacy often did this
      compressImageQuality: 0.7,
      compressImageMaxWidth: 1080,
      compressImageMaxHeight: 1080,
      maxFiles: 10,
      mediaType: 'photo',
      // Note: Multi-pick often disables cropping in this lib. 
      // If legacy had cropping + multi, it might have been one by one or just multi-select without crop.
      // Usually "Pick Multiple" implies just selection.
      cropping: false,
      cropperStatusBarColor: 'black',
      cropperToolbarColor: 'white',
      cropperToolbarWidgetColor: 'black',
      cropperActiveWidgetColor: '#5a45d4',
    }).then(images => {
      processPickedImage(images);
    }).catch(e => {
      if (e.code !== 'E_PICKER_CANCELLED') {
        Alert.alert('Error', e.message ? e.message : e);
      }
    });
  };

  const processPickedImage = (assets) => {
    setImageOptionsVisible(false);
    if (assets && assets.length > 0) {
      const newAttachments = assets.map(a => {
        let finalUri = a.path;
        if (Platform.OS === 'android' && !finalUri.startsWith('file://') && !finalUri.startsWith('content://')) {
          finalUri = `file://${finalUri}`;
        }
        return {
          uri: finalUri,
          name: a.filename || `image_${Date.now()}_${Math.random().toString(36).substr(2, 5)}.jpg`,
          size: a.size || 0,
          type: a.mime || 'image/jpeg'
        };
      });

      setAttachments(prev => [...prev, ...newAttachments]);
      setSelectedAttachmentType('Image');
    }
  };

  const pickPDF = async () => {
    let result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
    if (result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      let finalUri = asset.uri;
      if (Platform.OS === 'android' && !finalUri.startsWith('file://') && !finalUri.startsWith('content://')) {
        finalUri = `file://${finalUri}`;
      }
      setAttachmentDetails({
        uri: finalUri,
        name: asset.name,
        size: asset.size,
        uri_real: finalUri
      });
      setSelectedAttachmentType('PDF');
      setAttachments([]); // Clear images if PDF selected
    }
  };

  const onSelectAttachmentType = (type) => {
    if (type === 'Image') {
      setImageOptionsVisible(true);
    } else if (type === 'PDF') {
      pickPDF();
    }
  };

  const clearAttachments = () => {
    setAttachments([]);
    setAttachmentDetails(null);
    setSelectedAttachmentType(null);
  };

  const removeAttachment = (indexToRemove) => {
    setAttachments(prev => prev.filter((_, index) => index !== indexToRemove));
  };


  const uploadMultiImages = async (id, title, classid, sectionid) => {
    try {
      const filePayloads = [];
      for (const att of attachments) {
        // Use BlobUtil for robust reading, handle file:// prefix
        const path = att.uri.replace('file://', '');
        const base64 = await ReactNativeBlobUtil.fs.readFile(path, 'base64');
        filePayloads.push({ ...att, data: base64 });
      }

      await axios.post('/upload-msg-images', {
        id,
        filepaths: JSON.stringify(filePayloads),
        owner,
        branchid
      });

      Toast.show({ type: 'success', text1: 'Message sent with images.' });
      finalizeSend(title, classid, sectionid);

    } catch (error) {
      console.log('Image upload error', error);
      Alert.alert('Upload Error', `Failed to upload images. ${error.message || ''}`);
      setLoading(false);
    }
  };

  const uploadDocument = async (id, title, classid, sectionid) => {
    try {
      const path = attachmentDetails.uri.replace('file://', '');
      const base64 = await ReactNativeBlobUtil.fs.readFile(path, 'base64');

      await axios.post('/upload-msg-doc', {
        id,
        filepath: base64,
        name: attachmentDetails.name,
        owner,
        branchid
      });

      Toast.show({ type: 'success', text1: 'Message sent with PDF.' });
      finalizeSend(title, classid, sectionid);
    } catch (error) {
      console.log('Doc upload error', error);
      Alert.alert('Upload Error', `Failed to upload document. ${error.message || ''}`);
      setLoading(false);
    }
  };

  const finalizeSend = (title, classid, sectionid) => {
    axios.post('/sendnotification', {
      title,
      content: 'You have a message on Noticeboard',
      classid,
      sectionid,
      branchid
    }).catch(e => console.log(e));

    setLoading(false);
    setMessageText('');
    setMsgType('');
    clearAttachments();
  };

  const getSelectedNames = (ids) => {
    let names = [];
    const options = getClassOptions();
    ids.forEach(id => {
      const found = options.find(x => x.id === id);
      if (found) names.push(found.name);
    });
    return names;
  };

  const onSendMessage = () => {
    const selectedClassLabel = getSelectedNames(selectedClassItems).join(',');
    const title = `Message for Class: ${selectedClassLabel}${selectedSection}`;

    // Validations
    if (selectedClassItems.length === 0) {
      Toast.show({ type: 'error', text1: 'Please choose a class.' });
      return;
    }

    if ((selectedClassItems[0] === 'All Class' || selectedClassItems.length > 1) && selectedPriority === '2') {
      Alert.alert('Notice', 'Priority Messages can be sent to One class at a time.');
      return;
    }

    const hasAttachments = (selectedAttachmentType === 'Image' && attachments.length > 0) || (selectedAttachmentType === 'PDF' && attachmentDetails);

    if (!messageText.trim() && !hasAttachments) {
      Alert.alert('Validation', 'Please enter content or attach a file.');
      return;
    }

    // Size Check Logic
    let totalSize = 0;
    if (selectedAttachmentType === 'Image') {
      attachments.forEach(a => totalSize += a.size);
    } else if (attachmentDetails) {
      totalSize = attachmentDetails.size;
    }

    if (totalSize > 5 * 1024 * 1024) {
      Alert.alert('Limit', 'Total attachment size exceeds 5MB.');
      return;
    }

    setLoading(true);
    Toast.show({ type: 'info', text1: 'Sending message...' });

    const classIdString = selectedClassItems.toString();

    const payload = {
      title,
      content: messageText,
      classid: classIdString,
      enr: '',
      owner,
      filepath: '',
      sectionid: selectedSection,
      priority: selectedPriority,
      attendancedate: schDate,
      astatus: 'not',
      branchid: branchid,
      etype: msgType
    };

    const endpoint = selectedPriority === '3' ? '/save-scheduled-message' : '/savemessage';

    axios.post(endpoint, payload)
      .then(response => {
        const messageId = response.data.lastInsertId;

        if (!hasAttachments) {
          Toast.show({ type: 'success', text1: 'Message sent successfully.' });
          finalizeSend(title, classIdString, selectedSection);
        } else {
          if (selectedAttachmentType === 'Image') {
            // Pass directly as handled by uploadMultiImages which now uses pre-filled data
            uploadMultiImages(messageId, title, classIdString, selectedSection);
          } else {
            uploadDocument(messageId, title, classIdString, selectedSection);
          }
        }
      })
      .catch(error => {
        console.log('Send Error', error);
        Alert.alert('Error', 'Failed to send message.');
        setLoading(false);
      });
  };

  const renderPickerModal = () => (
    <Modal visible={pickerVisible} transparent animationType="fade" onRequestClose={onCancelPicker}>
      <TouchableWithoutFeedback onPress={onCancelPicker}>
        <View style={pickerModalOverlay}>
          <View style={pickerModalContent}>
            <Text style={pickerModalTitle}>{pickerTitle}</Text>
            <ScrollView style={{ maxHeight: 200 }}>
              {pickerData.map((item, idx) => {
                const label = item.label || item; // Handle object or string
                const value = item.value || item;
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      pickerModalItem,
                      value === pickerSelectedValue && pickerModalItemSelected,
                    ]}
                    onPress={() => setPickerSelectedValue(value)}
                  >
                    <Text
                      style={[
                        pickerModalItemText,
                        value === pickerSelectedValue && pickerModalItemTextSelected,
                      ]}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <View style={pickerModalButtons}>
              <TouchableOpacity style={pickerModalButton} onPress={onCancelPicker}>
                <Text style={pickerModalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={pickerModalButton} onPress={onConfirmPicker}>
                <Text style={pickerModalButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );

  const renderImageOptionsModal = () => (
    <Modal visible={imageOptionsVisible} transparent animationType="slide" onRequestClose={() => setImageOptionsVisible(false)}>
      <TouchableWithoutFeedback onPress={() => setImageOptionsVisible(false)}>
        <View style={pickerModalOverlay}>
          <View style={pickerModalContent}>
            <Text style={pickerModalTitle}>Select Image Option</Text>

            <TouchableOpacity style={[pickerModalItem, { alignItems: 'center' }]} onPress={handleCamera}>
              <Text style={[pickerModalItemText, { fontSize: 18, paddingVertical: 10 }]}>Use Camera</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[pickerModalItem, { alignItems: 'center' }]} onPress={handleCropPick}>
              <Text style={[pickerModalItemText, { fontSize: 18, paddingVertical: 10 }]}>Crop & Pick Image</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[pickerModalItem, { alignItems: 'center', borderBottomWidth: 0 }]} onPress={handleMultiPick}>
              <Text style={[pickerModalItemText, { fontSize: 18, paddingVertical: 10 }]}>Pick Multiple Images</Text>
            </TouchableOpacity>

            <View style={{ marginTop: 20 }}>
              <TouchableOpacity style={[pickerModalButton, { backgroundColor: '#eee', borderRadius: 10 }]} onPress={() => setImageOptionsVisible(false)}>
                <Text style={[pickerModalButtonText, { color: 'black' }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );

  const getPriorityLabel = (val) => priorities.find(p => p.value === val)?.label || val;

  const onChangeDate = (event, selectedDate) => {
    const currentDate = selectedDate || schDate;
    setShowDatePicker(Platform.OS === 'ios');
    setSchDate(currentDate);
  };

  // Calculate total size for display
  const totalSizeBytes = attachments.reduce((sum, item) => sum + (item.size || 0), 0);
  const totalSizeMB = (totalSizeBytes / (1024 * 1024)).toFixed(2);
  const isOverSizeLimit = totalSizeBytes > 5 * 1024 * 1024;


  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f4e0ff' }} edges={['bottom', 'left', 'right']}>
      <KeyboardAvoidingView
        style={{ flex: 1, flexDirection: 'column' }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ ...container, justifyContent: 'flex-start', padding: 20, paddingTop: 10, paddingBottom: 20 }}
          keyboardShouldPersistTaps="handled"
        >

          <Text style={label}>Select Class</Text>
          <View style={{ width: '100%', backgroundColor: '#d6bee7', borderRadius: 16, borderColor: blackColor, borderWidth: 1, marginBottom: 20, paddingVertical: 5 }}>
            <SectionedMultiSelect
              items={getClassOptions()}
              IconRenderer={MaterialIcons}
              uniqueKey="id"
              subKey="children"
              selectText="Choose Classes..."
              showDropDowns={true}
              readOnlyHeadings={false}
              onSelectedItemsChange={onSelectedItemsChange}
              selectedItems={selectedClassItems}
              styles={{
                container: { backgroundColor: '#fff', borderRadius: 10 },
                selectToggle: { paddingHorizontal: 16, paddingVertical: 12 },
                selectToggleText: { color: blackColor, fontSize: 16 },
                chipContainer: { backgroundColor: '#d6bee7', borderRadius: 8, borderColor: blackColor, borderWidth: 0.5 },
                chipText: { color: blackColor },
                chipIcon: { color: blackColor },
                confirmText: { color: '#fff', fontWeight: 'bold' },
                button: { backgroundColor: '#5a45d4' }
              }}
            />
          </View>

          <Text style={label}>Select Section</Text>
          {Platform.OS === 'ios' ? (
            <TouchableOpacity
              style={pickerButton}
              onPress={() => openPicker(getSectionOptions(), selectedSection, setSelectedSection, 'Select Section')}
            >
              <Text style={pickerButtonText}>{selectedSection}</Text>
              <Icon name="menu-down" size={24} color={blackColor} />
            </TouchableOpacity>
          ) : (
              <View style={pickerWrapper}>
                <Picker selectedValue={selectedSection} onValueChange={setSelectedSection} style={picker} dropdownIconColor={blackColor}>
                  {getSectionOptions().map((sec) => (
                    <Picker.Item key={sec.value} label={sec.label} value={sec.value} color={blackColor} />
                ))}
              </Picker>
            </View>
          )}

          <Text style={label}>Select Priority</Text>
          {Platform.OS === 'ios' ? (
            <TouchableOpacity
              style={pickerButton}
              onPress={() => openPicker(priorities, selectedPriority, setSelectedPriority, 'Select Priority')}
            >
              <Text style={pickerButtonText}>{getPriorityLabel(selectedPriority)}</Text>
              <Icon name="menu-down" size={24} color={blackColor} />
            </TouchableOpacity>
          ) : (
              <View style={pickerWrapper}>
                <Picker selectedValue={selectedPriority} onValueChange={setSelectedPriority} style={picker} dropdownIconColor={blackColor}>
                  {priorities.map((pri) => (
                    <Picker.Item key={pri.value} label={pri.label} value={pri.value} color={blackColor} />
                ))}
              </Picker>
            </View>
          )}

          {selectedPriority === '3' && (
            <View style={{ marginBottom: 20 }}>
              <Text style={label}>Message Delivery Date</Text>
              {Platform.OS === 'android' && (
                <TouchableOpacity style={pickerButton} onPress={() => setShowDatePicker(true)}>
                  <Text style={pickerButtonText}>{schDate.toDateString()}</Text>
                  <Icon name="calendar" size={24} color={blackColor} />
                </TouchableOpacity>
              )}
              {(showDatePicker || Platform.OS === 'ios') && (
                <DateTimePicker
                  testID="dateTimePicker"
                  value={schDate}
                  mode="date"
                  is24Hour={true}
                  display="default"
                  minimumDate={new Date()}
                  maximumDate={schoolData?.sessionLastDate ? new Date(schoolData.sessionLastDate) : undefined}
                  onChange={onChangeDate}
                  style={{ width: '100%', backgroundColor: 'transparent' }}
                />
              )}
            </View>
          )}

          <Text style={label}>Message Type</Text>
          <TextInput
            style={[input, { marginBottom: 20 }]}
            multiline
            numberOfLines={2}
            placeholder="e.g. Holiday Notice, Homework..."
            placeholderTextColor="#b496d6"
            value={msgType}
            onChangeText={setMsgType}
          />

          <Text style={label}>Enter Message</Text>
          <TextInput
            style={[input, { textAlignVertical: 'top' }]}
            multiline
            numberOfLines={5}
            placeholder="Type your message here..."
            placeholderTextColor="#b496d6"
            value={messageText}
            onChangeText={setMessageText}
          />

          <Text style={label}>Attachment Type</Text>
          <View style={attachmentContainer}>
            {['Image', 'PDF'].map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  attachmentOption,
                  selectedAttachmentType === type && attachmentOptionSelected,
                  {
                    backgroundColor: type === 'Image' ? '#b7a7de' : '#ffccbc',
                    borderColor: blackColor,
                  },
                ]}
                onPress={() => onSelectAttachmentType(type)}
              >
                <Icon name={type === 'Image' ? 'image' : 'file-pdf-box'} size={28} color={selectedAttachmentType === type ? blackColor : '#555'} />
                <Text style={[attachmentOptionText, selectedAttachmentType === type && { fontWeight: 'bold' }]}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {selectedAttachmentType === 'Image' && attachments.length > 0 && (
            <View style={{ marginBottom: 10 }}>
              <Text style={attachmentInfo}>
                {attachments.length} Image(s) Attached — Total Size: {totalSizeMB} MB
              </Text>
              {isOverSizeLimit && (
                <Text style={{ color: 'red', fontSize: 12, marginBottom: 5 }}>
                  Warning: Total size exceeds 5MB limit. Please remove some images.
                </Text>
              )}
              <ScrollView horizontal style={{ flexDirection: 'row', marginTop: 5 }} contentContainerStyle={{ paddingTop: 12, paddingRight: 12 }}>
                {attachments.map((att, index) => (
                  <View key={index} style={{ marginRight: 10, position: 'relative' }}>
                    <Image source={{ uri: att.uri }} style={{ width: 80, height: 80, borderRadius: 8 }} />
                    <TouchableOpacity
                      onPress={() => removeAttachment(index)}
                      style={{
                        position: 'absolute',
                        top: -8,
                        right: -8,
                        backgroundColor: 'red',
                        borderRadius: 15,
                        width: 30,
                        height: 30,
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 1,
                        borderWidth: 1.5,
                        borderColor: 'white'
                      }}
                    >
                      <Icon name="close" size={18} color="white" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
              <TouchableOpacity onPress={clearAttachments} style={{ alignItems: 'center', marginTop: 5 }}>
                <Text style={{ color: 'red', fontSize: 12 }}>Clear All Images</Text>
              </TouchableOpacity>
            </View>
          )}

          {selectedAttachmentType === 'PDF' && attachmentDetails && (
            <View style={{ marginBottom: 10 }}>
              <Text style={attachmentInfo}>
                Attached PDF: {attachmentDetails.name}
              </Text>
              <TouchableOpacity onPress={clearAttachments} style={{ alignItems: 'center', marginTop: 5 }}>
                <Text style={{ color: 'red', fontSize: 12 }}>Clear PDF</Text>
              </TouchableOpacity>
            </View>
          )}

        </ScrollView>

        <View style={{ paddingHorizontal: 20, paddingBottom: 20, paddingTop: 10, backgroundColor: '#f4e0ff', justifyContent: 'flex-end' }}>
          <TouchableOpacity
            style={[
              button,
              {
                width: '100%',
                padding: 0,
                overflow: 'visible',
                borderRadius: 25,
                marginBottom: 0,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 4.65,
                elevation: 8,
                backgroundColor: 'transparent' // Ensure no background color interferes

              }
            ]}
            onPress={onSendMessage}
            disabled={loading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={mainBackgroundGradient || ['#5a45d4', '#8ec5fc']} // Fallback gradient just in case
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                paddingVertical: 15,
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                borderRadius: 25
              }}
            >
              {loading ? (
                <ActivityIndicator color={buttonText?.color || '#fff'} />
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Icon name="send" size={22} color={buttonText?.color || '#fff'} style={{ marginRight: 8 }} />
                  <Text style={[buttonText, { fontWeight: 'bold', fontSize: 18, letterSpacing: 0.5 }]}>
                    Send Message
                  </Text>
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {renderPickerModal()}
        {renderImageOptionsModal()}

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}