import React, { useState, useContext } from 'react';
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
  SafeAreaView,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { MessagesContext } from '../context/MessagesContext';

const blackColor = '#000';
const mainTextColor = '#fff';
const mainBackgroundGradient = ['#8e2de2', '#4a00e0'];

const sendMessageStyles = {
  container: { flexGrow: 1, padding: 20, backgroundColor: '#f4e0ff' },
  title: { fontSize: 28, fontWeight: '900', marginBottom: 24, textAlign: 'center', color: blackColor },
  label: { fontWeight: '700', fontSize: 18, marginTop: 12, marginBottom: 8, color: blackColor },
  pickerWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: blackColor,
  },
  picker: { height: 50, color: blackColor },
  messageInput: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    fontSize: 16,
    textAlignVertical: 'top',
    backgroundColor: '#f4e0ff',
    borderColor: blackColor,
    color: blackColor,
  },
  attachmentContainer: { flexDirection: 'row', marginTop: 18, marginBottom: 10, justifyContent: 'space-between' },
  attachmentOption: {
    flex: 1,
    marginHorizontal: 6,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: blackColor,
  },
  attachmentOptionSelected: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  attachmentOptionText: { marginTop: 6, fontWeight: '600', fontSize: 16, color: blackColor },
  sendButton: { marginTop: 30, borderRadius: 24, overflow: 'hidden', elevation: 8 },
  sendButtonGradient: { paddingVertical: 16, alignItems: 'center' },
  sendButtonText: { fontSize: 20, fontWeight: 'bold', color: mainTextColor },
  pickerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  pickerModalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
  },
  pickerModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  pickerModalItem: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomColor: '#ddd',
    borderBottomWidth: 1,
  },
  pickerModalItemSelected: {
    backgroundColor: '#d1bee7',
  },
  pickerModalItemText: {
    fontSize: 16,
    color: '#000',
  },
  pickerModalItemTextSelected: {
    fontWeight: 'bold',
    color: mainTextColor,
  },
  pickerModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  pickerModalButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
  },
  pickerModalButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: mainTextColor,
  },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    borderColor: blackColor,
    backgroundColor: '#d6bee7',
  },
  pickerButtonText: {
    fontSize: 16,
    color: blackColor,
  },
  attachmentInfo: { marginTop: 8, fontStyle: 'italic', fontSize: 14, textAlign: 'center', color: blackColor },
};

export default function SendMessagesScreen() {
  const classes = ['All Classes', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5'];
  const sections = ['A', 'B', 'C', 'D'];
  const priorities = ['Normal', 'High', 'Restricted', 'Scheduled'];

  const { messages, setMessages } = useContext(MessagesContext);

  const [selectedClass, setSelectedClass] = useState('All Classes');
  const [selectedSection, setSelectedSection] = useState(sections[0]);
  const [selectedPriority, setSelectedPriority] = useState(priorities[0]);
  const [selectedAttachment, setSelectedAttachment] = useState(null);
  const [attachmentUri, setAttachmentUri] = useState(null);
  const [messageText, setMessageText] = useState('');

  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerData, setPickerData] = useState([]);
  const [pickerSelectedValue, setPickerSelectedValue] = useState(null);
  const [pickerOnSelect, setPickerOnSelect] = useState(() => () => {});
  const [pickerTitle, setPickerTitle] = useState('');

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

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      alert('Permission to access gallery is required!');
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 1 });
    if (!result.cancelled) {
      setAttachmentUri(result.uri);
      setSelectedAttachment('Image');
    }
  };

  const pickPDF = async () => {
    let result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });
    if (result.type === 'success') {
      setAttachmentUri(result.uri);
      setSelectedAttachment('PDF');
    }
  };

  const onSelectAttachmentType = (type) => {
    if (type === 'Image') {
      pickImage();
    } else if (type === 'PDF') {
      pickPDF();
    }
  };

  const onSendMessage = () => {
    if (!messageText.trim()) {
      Alert.alert('Validation', 'Please enter a message to send.');
      return;
    }
    const newMessage = {
      id: (messages.length + 1).toString(),
      title: `Message to ${selectedClass} - Section ${selectedSection}`,
      description: messageText,
      priority: selectedPriority,
      attachment: selectedAttachment ? { type: selectedAttachment, uri: attachmentUri } : null,
      photos: selectedAttachment === 'Image' && attachmentUri ? [attachmentUri] : [],
    };
    setMessages([newMessage, ...messages]);
    Alert.alert('Success', 'Message sent successfully.');
    setMessageText('');
    setSelectedAttachment(null);
    setAttachmentUri(null);
  };

  const renderPickerModal = () => (
    <Modal visible={pickerVisible} transparent animationType="fade" onRequestClose={onCancelPicker}>
      <TouchableWithoutFeedback onPress={onCancelPicker}>
        <View style={sendMessageStyles.pickerModalOverlay}>
          <View style={sendMessageStyles.pickerModalContent}>
            <Text style={sendMessageStyles.pickerModalTitle}>{pickerTitle}</Text>
            <ScrollView style={{ maxHeight: 200 }}>
              {pickerData.map((item, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    sendMessageStyles.pickerModalItem,
                    item === pickerSelectedValue && sendMessageStyles.pickerModalItemSelected,
                  ]}
                  onPress={() => setPickerSelectedValue(item)}
                >
                  <Text
                    style={[
                      sendMessageStyles.pickerModalItemText,
                      item === pickerSelectedValue && sendMessageStyles.pickerModalItemTextSelected,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={sendMessageStyles.pickerModalButtons}>
              <TouchableOpacity style={sendMessageStyles.pickerModalButton} onPress={onCancelPicker}>
                <Text style={sendMessageStyles.pickerModalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={sendMessageStyles.pickerModalButton} onPress={onConfirmPicker}>
                <Text style={sendMessageStyles.pickerModalButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f4e0ff' }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}>
        <ScrollView contentContainerStyle={sendMessageStyles.container} keyboardShouldPersistTaps="handled">
          <Text style={sendMessageStyles.title}>Send Messages</Text>

          {/* Class Picker */}
          <Text style={sendMessageStyles.label}>Select Class</Text>
          {Platform.OS === 'ios' ? (
            <TouchableOpacity
              style={[sendMessageStyles.pickerButton, { backgroundColor: '#d6bee7', borderColor: blackColor }]}
              onPress={() => openPicker(classes, selectedClass, setSelectedClass, 'Select Class')}
            >
              <Text style={sendMessageStyles.pickerButtonText}>{selectedClass}</Text>
              <Icon name="menu-down" size={24} color={blackColor} />
            </TouchableOpacity>
          ) : (
            <View style={[sendMessageStyles.pickerWrapper, { backgroundColor: '#d6bee7', borderColor: blackColor }]}>
              <Picker selectedValue={selectedClass} onValueChange={setSelectedClass} style={sendMessageStyles.picker} dropdownIconColor={blackColor}>
                {classes.map((cls) => (
                  <Picker.Item key={cls} label={cls} value={cls} color={blackColor} />
                ))}
              </Picker>
            </View>
          )}

          {/* Section Picker */}
          <Text style={sendMessageStyles.label}>Select Section</Text>
          {Platform.OS === 'ios' ? (
            <TouchableOpacity
              style={[sendMessageStyles.pickerButton, { backgroundColor: '#d6bee7', borderColor: blackColor }]}
              onPress={() => openPicker(sections, selectedSection, setSelectedSection, 'Select Section')}
            >
              <Text style={sendMessageStyles.pickerButtonText}>{selectedSection}</Text>
              <Icon name="menu-down" size={24} color={blackColor} />
            </TouchableOpacity>
          ) : (
            <View style={[sendMessageStyles.pickerWrapper, { backgroundColor: '#d6bee7', borderColor: blackColor }]}>
              <Picker selectedValue={selectedSection} onValueChange={setSelectedSection} style={sendMessageStyles.picker} dropdownIconColor={blackColor}>
                {sections.map((sec) => (
                  <Picker.Item key={sec} label={sec} value={sec} color={blackColor} />
                ))}
              </Picker>
            </View>
          )}

          {/* Priority Picker */}
          <Text style={sendMessageStyles.label}>Select Priority</Text>
          {Platform.OS === 'ios' ? (
            <TouchableOpacity
              style={[sendMessageStyles.pickerButton, { backgroundColor: '#d6bee7', borderColor: blackColor }]}
              onPress={() => openPicker(priorities, selectedPriority, setSelectedPriority, 'Select Priority')}
            >
              <Text style={sendMessageStyles.pickerButtonText}>{selectedPriority}</Text>
              <Icon name="menu-down" size={24} color={blackColor} />
            </TouchableOpacity>
          ) : (
            <View style={[sendMessageStyles.pickerWrapper, { backgroundColor: '#d6bee7', borderColor: blackColor }]}>
              <Picker selectedValue={selectedPriority} onValueChange={setSelectedPriority} style={sendMessageStyles.picker} dropdownIconColor={blackColor}>
                {priorities.map((pri) => (
                  <Picker.Item key={pri} label={pri} value={pri} color={blackColor} />
                ))}
              </Picker>
            </View>
          )}

          <Text style={sendMessageStyles.label}>Enter Message</Text>
          <TextInput
            style={sendMessageStyles.messageInput}
            multiline
            numberOfLines={5}
            placeholder="Type your message here..."
            placeholderTextColor="#b496d6"
            value={messageText}
            onChangeText={setMessageText}
          />

          <Text style={sendMessageStyles.label}>Attachment Type</Text>
          <View style={sendMessageStyles.attachmentContainer}>
            {['Image', 'PDF'].map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  sendMessageStyles.attachmentOption,
                  selectedAttachment === type && sendMessageStyles.attachmentOptionSelected,
                  {
                    backgroundColor: type === 'Image' ? '#b7a7de' : '#ffccbc',
                    borderColor: blackColor,
                  },
                ]}
                onPress={() => onSelectAttachmentType(type)}
              >
                <Icon name={type === 'Image' ? 'image' : 'file-pdf-box'} size={28} color={selectedAttachment === type ? blackColor : '#555'} />
                <Text style={[sendMessageStyles.attachmentOptionText, selectedAttachment === type && { fontWeight: 'bold' }, { color: blackColor }]}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {attachmentUri && (
            <Text style={sendMessageStyles.attachmentInfo}>
              Attached: {selectedAttachment} (tap icon again to change)
            </Text>
          )}

          <TouchableOpacity style={sendMessageStyles.sendButton} onPress={onSendMessage}>
            <LinearGradient colors={mainBackgroundGradient} style={sendMessageStyles.sendButtonGradient}>
              <Text style={sendMessageStyles.sendButtonText}>Send Message</Text>
            </LinearGradient>
          </TouchableOpacity>

          {renderPickerModal()}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}