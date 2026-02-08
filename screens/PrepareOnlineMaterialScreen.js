import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Alert, ActivityIndicator, TouchableOpacity, Modal } from 'react-native';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { CoreContext } from '../context/CoreContext';
import { StyleContext } from '../context/StyleContext';
import CustomPickerModal from '../components/CustomPickerModal';

const PrepareOnlineMaterialScreen = ({ navigation, route }) => {
    const { branchid, phone, allClasses, subjects, fetchSubjects } = useContext(CoreContext);
    const { primary, background, textColor } = useContext(StyleContext);

    // State
    const [id, setId] = useState(''); // ID for editing
    const [classid, setClassid] = useState('');
    const [subject, setSubject] = useState('');
    const [chapter, setChapter] = useState('');
    const [topic, setTopic] = useState('');
    const [linkLabel, setLinkLabel] = useState('');
    const [link, setLink] = useState('');
    
    const [chapters, setChapters] = useState([]);
    const [topics, setTopics] = useState([]);
    
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Modal State for Adding Items
    const [modalVisible, setModalVisible] = useState(false);
    const [modalType, setModalType] = useState(''); // 'chapter' or 'topic'
    const [newItemText, setNewItemText] = useState('');

    // Custom Picker State
    const [pickerVisible, setPickerVisible] = useState(false);
    const [pickerConfig, setPickerConfig] = useState({ title: '', data: [] });
    const [pickerSelectedValue, setPickerSelectedValue] = useState(null);
    const [pickerType, setPickerType] = useState(null); // 'class', 'subject', 'chapter', 'topic'

    useEffect(() => {
        fetchSubjects();
    }, []);

    useEffect(() => {
        if (route.params && route.params.materialData) {
            const data = route.params.materialData;
            setId(data.id);
            setClassid(data.classid);
            setSubject(data.subject);
            setChapter(data.chapter);
            setTopic(data.topic);
            setLinkLabel(data.link_label);
            setLink(data.link);
            
            if (data.classid && data.subject) {
                 getChapters(data.classid, data.subject);
                 getTopics(data.classid, data.subject);
            }
        }
    }, [route.params]);

    const getChapters = async (selectedClass, selectedSubject) => {
        if (!selectedClass || !selectedSubject) return;
        setLoading(true);
        try {
            const response = await axios.get('online-chapters', { params: { classid: selectedClass, subject: selectedSubject } });
            setChapters(response.data.chapters || []);
        } catch (error) {
            console.error(error);
            Toast.show({ type: 'error', text1: 'Failed to fetch chapters' });
        } finally {
            setLoading(false);
        }
    };

    const getTopics = async (selectedClass, selectedSubject) => {
        if (!selectedClass || !selectedSubject) return;
        try {
            const response = await axios.get('online-topics', { params: { classid: selectedClass, subject: selectedSubject } });
            setTopics(response.data.topics || []);
        } catch (error) {
            console.error(error);
        }
    };

    // --- Picker Logic ---

    const openPicker = (type) => {
        let title = '';
        let data = [];
        let currentValue = '';

        if (type === 'class') {
            title = 'Select Class';
            data = allClasses.map(c => ({ label: c.classname, value: c.classid }));
            currentValue = classid;
        } else if (type === 'subject') {
            title = 'Select Subject';
            data = subjects.map(s => ({ label: s.name, value: s.id }));
            currentValue = subject;
        } else if (type === 'chapter') {
            title = 'Select Chapter';
            data = chapters.map(c => ({ label: c, value: c }));
            currentValue = chapter;
        } else if (type === 'topic') {
            title = 'Select Topic';
            data = topics.map(t => ({ label: t, value: t }));
            currentValue = topic;
        }

        setPickerConfig({ title, data });
        setPickerSelectedValue(currentValue);
        setPickerType(type);
        setPickerVisible(true);
    };

    const onPickerConfirm = () => {
        const val = pickerSelectedValue;

        if (pickerType === 'class') {
            setClassid(val);
            setChapter('');
            setTopic('');
            if (subject) {
                getChapters(val, subject);
                getTopics(val, subject);
            }
        } else if (pickerType === 'subject') {
            setSubject(val);
            setChapter('');
            setTopic('');
            if (classid) {
                getChapters(classid, val);
                getTopics(classid, val);
            }
        } else if (pickerType === 'chapter') {
            setChapter(val);
        } else if (pickerType === 'topic') {
            setTopic(val);
        }

        setPickerVisible(false);
    };


    // --- Add Item Logic ---

    const handleAddItem = () => {
        if (!newItemText.trim()) {
            Toast.show({ type: 'error', text1: `Please enter a ${modalType} name` });
            return;
        }

        if (modalType === 'chapter') {
            const newChapters = [...chapters, newItemText];
            setChapters(newChapters);
            setChapter(newItemText);
        } else {
            const newTopics = [...topics, newItemText];
            setTopics(newTopics);
            setTopic(newItemText);
        }

        setNewItemText('');
        setModalVisible(false);
    };

    const handleUpload = async () => {
        if (!classid) { Alert.alert('Error', 'Please select a class'); return; }
        if (!subject) { Alert.alert('Error', 'Please select a subject'); return; }
        if (!chapter) { Alert.alert('Error', 'Please select a chapter'); return; }
        if (!link.trim()) { Alert.alert('Error', 'Please enter Material Link'); return; }

        setUploading(true);
        try {
            const payload = {
                id: id || '', // Empty for new, populated for edit
                classid,
                subject,
                chapter,
                topic,
                name: linkLabel,
                link: link.trim(),
                owner: phone,
                branchid
            };
            
            // Using same endpoint for both create and update
            const response = await axios.post('/upload-online-material', payload);
            console.log("Upload Response:", response.data);

            Toast.show({ type: 'success', text1: id ? 'Material updated successfully' : 'Material uploaded successfully' });
            
            if (id) {
                navigation.goBack();
            } else {
                setLinkLabel('');
                setLink('');
            }

        } catch (error) {
            console.error("Upload Error:", error);
            Toast.show({ type: 'error', text1: 'Failed to upload material' });
        } finally {
            setUploading(false);
        }
    };

    // Helper to get Label
    const getLabel = (type, value) => {
        if (!value) return `Select ${type.charAt(0).toUpperCase() + type.slice(1)}`;
        if (type === 'class') return allClasses.find(c => c.classid === value)?.classname || value;
        if (type === 'subject') return subjects.find(s => s.id === value)?.name || value;
        return value;
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: background?.backgroundColor || '#f5f5f5' }]}>
            <View style={styles.card}>
                
                <Text style={[styles.label, { color: textColor?.color || '#333' }]}>Select Class</Text>
                <TouchableOpacity style={styles.pickerButton} onPress={() => openPicker('class')}>
                    <Text style={styles.pickerText}>{getLabel('class', classid)}</Text>
                    <Icon name="chevron-down" size={20} color="#666" />
                </TouchableOpacity>

                <Text style={[styles.label, { color: textColor?.color || '#333' }]}>Select Subject</Text>
                <TouchableOpacity style={styles.pickerButton} onPress={() => openPicker('subject')}>
                    <Text style={styles.pickerText}>{getLabel('subject', subject)}</Text>
                    <Icon name="chevron-down" size={20} color="#666" />
                </TouchableOpacity>

                <View style={styles.rowLabel}>
                    <Text style={[styles.label, { color: textColor?.color || '#333' }]}>Select Chapter</Text>
                    <TouchableOpacity onPress={() => { setModalType('chapter'); setModalVisible(true); }}>
                        <Icon name="plus-circle" size={24} color={primary?.backgroundColor || '#6200ee'} />
                    </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.pickerButton} onPress={() => openPicker('chapter')}>
                    <Text style={styles.pickerText}>{chapter || 'Select Chapter'}</Text>
                    <Icon name="chevron-down" size={20} color="#666" />
                </TouchableOpacity>
                {loading && <ActivityIndicator size="small" color={primary?.backgroundColor} />}

                <View style={styles.rowLabel}>
                    <Text style={[styles.label, { color: textColor?.color || '#333' }]}>Select Topic</Text>
                    <TouchableOpacity onPress={() => { setModalType('topic'); setModalVisible(true); }}>
                        <Icon name="plus-circle" size={24} color={primary?.backgroundColor || '#6200ee'} />
                    </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.pickerButton} onPress={() => openPicker('topic')}>
                    <Text style={styles.pickerText}>{topic || 'Select Topic'}</Text>
                    <Icon name="chevron-down" size={20} color="#666" />
                </TouchableOpacity>

                <Text style={[styles.label, { color: textColor?.color || '#333' }]}>Material Link Label</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Enter Link Label"
                    value={linkLabel}
                    onChangeText={setLinkLabel}
                />

                <Text style={[styles.label, { color: textColor?.color || '#333' }]}>Material Link</Text>
                <TextInput
                    style={[styles.input, { height: 80 }]}
                    placeholder="Enter Material Link (URL)"
                    value={link}
                    onChangeText={setLink}
                    multiline
                />

                <TouchableOpacity
                    style={[styles.button, { backgroundColor: primary?.backgroundColor || '#6200ee' }]}
                    onPress={handleUpload}
                    disabled={uploading}
                >
                    {uploading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>{id ? 'Update Material' : 'Upload Material'}</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.viewButton, { borderColor: primary?.backgroundColor || '#6200ee' }]}
                    onPress={() => navigation.navigate('ViewOnlineMaterialScreen')}
                >
                    <Text style={[styles.viewButtonText, { color: primary?.backgroundColor || '#6200ee' }]}>View Uploaded Material</Text>
                </TouchableOpacity>
            </View>

            {/* Add Chapter/Topic Modal */}
            <Modal
                transparent={true}
                visible={modalVisible}
                animationType="slide"
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Add New {modalType === 'chapter' ? 'Chapter' : 'Topic'}</Text>
                        <TextInput
                            style={styles.modalInput}
                            placeholder={`Enter ${modalType} name`}
                            value={newItemText}
                            onChangeText={setNewItemText}
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={styles.modalButtonCancel} onPress={() => setModalVisible(false)}>
                                <Text style={styles.modalButtonTextCancel}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalButtonAdd, { backgroundColor: primary?.backgroundColor || '#6200ee' }]} onPress={handleAddItem}>
                                <Text style={styles.modalButtonTextAdd}>Add</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Custom Picker Modal */}
            <CustomPickerModal
                visible={pickerVisible}
                title={pickerConfig.title}
                data={pickerConfig.data}
                selectedValue={pickerSelectedValue}
                onSelect={(val) => setPickerSelectedValue(val)}
                onConfirm={onPickerConfirm}
                onClose={() => setPickerVisible(false)}
            />

        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 15,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 15,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 5,
        marginTop: 10,
    },
    rowLabel: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 5,
    },
    pickerButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        backgroundColor: '#fafafa',
        marginBottom: 5,
    },
    pickerText: {
        color: '#333',
        fontSize: 16,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 10,
        backgroundColor: '#fafafa',
        fontSize: 16,
        marginBottom: 5,
    },
    button: {
        marginTop: 20,
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    viewButton: {
        marginTop: 15,
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 1,
    },
    viewButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 20,
        width: '80%',
        elevation: 5,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        textAlign: 'center',
    },
    modalInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 10,
        marginBottom: 20,
        fontSize: 16,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    modalButtonCancel: {
        padding: 10,
        flex: 1,
        alignItems: 'center',
    },
    modalButtonAdd: {
        padding: 10,
        borderRadius: 8,
        flex: 1,
        alignItems: 'center',
        marginLeft: 10,
    },
    modalButtonTextCancel: {
        fontSize: 16,
        color: '#666',
    },
    modalButtonTextAdd: {
        fontSize: 16,
        color: '#fff',
        fontWeight: 'bold',
    },
});

export default PrepareOnlineMaterialScreen;
