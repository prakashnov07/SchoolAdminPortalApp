import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Linking, ActivityIndicator } from 'react-native';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { CoreContext } from '../context/CoreContext';
import { StyleContext } from '../context/StyleContext';
import CustomPickerModal from '../components/CustomPickerModal';

const ViewOnlineMaterialScreen = ({ navigation }) => {
    const { branchid, phone, role, allClasses, subjects, fetchSubjects } = useContext(CoreContext);
    const { primary, background, textColor } = useContext(StyleContext);

    const [classid, setClassid] = useState('');
    const [subject, setSubject] = useState('');
    const [chapter, setChapter] = useState('');
    const [chapters, setChapters] = useState([]);
    
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetchingChapters, setFetchingChapters] = useState(false);

    // Custom Picker State
    const [pickerVisible, setPickerVisible] = useState(false);
    const [pickerConfig, setPickerConfig] = useState({ title: '', data: [] });
    const [pickerSelectedValue, setPickerSelectedValue] = useState(null);
    const [pickerType, setPickerType] = useState(null); // 'class', 'subject', 'chapter'

    useEffect(() => {
        fetchSubjects();
    }, []);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            if (classid && subject) {
                fetchMaterials();
            }
        });
        return unsubscribe;
    }, [navigation, classid, subject, chapter]);

    useEffect(() => {
        if (classid && subject) {
            getChapters(classid, subject);
            fetchMaterials(); // Fetch when class/subject changes, even without chapter
        } else {
            setMaterials([]);
            setChapters([]);
        }
    }, [classid, subject]);

    useEffect(() => {
        if (classid && subject && chapter) {
            fetchMaterials();
        }
    }, [chapter]);

    const getChapters = async (selectedClass, selectedSubject) => {
        setFetchingChapters(true);
        try {
            const response = await axios.get('online-chapters', { params: { classid: selectedClass, subject: selectedSubject } });
            setChapters(response.data.chapters || []);
        } catch (error) {
            console.error(error);
        } finally {
            setFetchingChapters(false);
        }
    };

    const fetchMaterials = async () => {
        if (!classid || !subject) return;
        
        setLoading(true);
        try {
            // endpoint from legacy: online-material
            const response = await axios.get('online-material', { 
                params: { 
                    branchid, 
                    role, 
                    owner: phone, 
                    classid, 
                    subject, 
                    chapter: chapter || '' 
                } 
            });
            setMaterials(response.data.allMaterial || []);
        } catch (error) {
            console.error(error);
            Toast.show({ type: 'error', text1: 'Failed to fetch materials' });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (id) => {
        Alert.alert(
            "Delete Material",
            "Are you sure you want to delete this material?",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Delete", 
                    style: "destructive", 
                    onPress: async () => {
                        try {
                            // endpoint from legacy: hide-online-material
                            await axios.post('hide-online-material', { id, branchid, owner: phone });
                            Toast.show({ type: 'success', text1: 'Material deleted successfully' });
                            fetchMaterials();
                        } catch (error) {
                            console.error(error);
                            Toast.show({ type: 'error', text1: 'Failed to delete material' });
                        }
                    }
                }
            ]
        );
    };

    const handleEdit = (item) => {
        navigation.navigate('PrepareOnlineMaterialScreen', { materialData: item });
    };

    const handleOpenLink = (url) => {
        Linking.canOpenURL(url).then(supported => {
            if (supported) {
                Linking.openURL(url);
            } else {
                Toast.show({ type: 'error', text1: "Cannot open this URL" });
            }
        });
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
        } else if (pickerType === 'subject') {
            setSubject(val);
            setChapter('');
        } else if (pickerType === 'chapter') {
            setChapter(val);
        }

        setPickerVisible(false);
    };

    const getLabel = (type, value) => {
        if (!value) return `Select ${type.charAt(0).toUpperCase() + type.slice(1)}`;
        if (type === 'class') return allClasses.find(c => c.classid === value)?.classname || value;
        if (type === 'subject') return subjects.find(s => s.id === value)?.name || value;
        return value;
    };

    const renderItem = ({ item }) => (
        <View style={styles.itemCard}>
            <View style={styles.itemHeader}>
                <Text style={styles.itemTopic}>Topic: {item.topic}</Text>
                <Text style={styles.itemDate}>{item.date}</Text> 
            </View>
            
            <Text style={styles.itemLabel}>{item.link_label}</Text>
            
            <TouchableOpacity onPress={() => handleOpenLink(item.link)}>
                <Text style={[styles.itemLink, { color: primary?.backgroundColor || '#007bff' }]}>{item.link}</Text>
            </TouchableOpacity>

            <View style={styles.actionButtons}>
                <TouchableOpacity style={[styles.actionBtn, styles.editBtn]} onPress={() => handleEdit(item)}>
                    <Text style={styles.actionBtnText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={() => handleDelete(item.id)}>
                    <Text style={styles.actionBtnText}>Delete</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: background?.backgroundColor || '#f5f5f5' }]}>
            
            <View style={styles.filterContainer}>
                <Text style={[styles.label, { color: textColor?.color || '#333' }]}>Class</Text>
                <TouchableOpacity style={styles.pickerButton} onPress={() => openPicker('class')}>
                    <Text style={styles.pickerText}>{getLabel('class', classid)}</Text>
                    <Icon name="chevron-down" size={20} color="#666" />
                </TouchableOpacity>

                <Text style={[styles.label, { color: textColor?.color || '#333' }]}>Subject</Text>
                <TouchableOpacity style={styles.pickerButton} onPress={() => openPicker('subject')}>
                    <Text style={styles.pickerText}>{getLabel('subject', subject)}</Text>
                    <Icon name="chevron-down" size={20} color="#666" />
                </TouchableOpacity>

                <View style={styles.rowLabel}>
                    <Text style={[styles.label, { color: textColor?.color || '#333' }]}>Chapter</Text>
                </View>
                <TouchableOpacity style={styles.pickerButton} onPress={() => openPicker('chapter')}>
                    <Text style={styles.pickerText}>{chapter || 'Select Chapter'}</Text>
                    <Icon name="chevron-down" size={20} color="#666" />
                </TouchableOpacity>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color={primary?.backgroundColor} style={{ marginTop: 20 }} />
            ) : (
                <FlatList
                    data={materials}
                    renderItem={renderItem}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No materials found.</Text>
                        </View>
                    }
                />
            )}

            <CustomPickerModal
                visible={pickerVisible}
                title={pickerConfig.title}
                data={pickerConfig.data}
                selectedValue={pickerSelectedValue}
                onSelect={(val) => setPickerSelectedValue(val)}
                onConfirm={onPickerConfirm}
                onClose={() => setPickerVisible(false)}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    filterContainer: {
        padding: 15,
        backgroundColor: '#fff',
        elevation: 2,
    },
    label: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 5,
        marginTop: 5,
    },
    pickerButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 10,
        backgroundColor: '#fafafa',
        marginBottom: 5,
    },
    pickerText: {
        color: '#333',
        fontSize: 15,
    },
    listContent: {
        padding: 15,
        paddingBottom: 30,
    },
    itemCard: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 15,
        marginBottom: 15,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5,
    },
    itemTopic: {
        fontWeight: 'bold',
        fontSize: 16,
        color: '#444',
    },
    itemDate: {
        fontSize: 12,
        color: '#888',
    },
    itemLabel: {
        fontSize: 14,
        color: '#333',
        marginBottom: 5,
        fontWeight: '600'
    },
    itemLink: {
        fontSize: 14,
        textDecorationLine: 'underline',
        marginBottom: 10,
    },
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 5,
    },
    actionBtn: {
        paddingVertical: 6,
        paddingHorizontal: 15,
        borderRadius: 5,
        marginLeft: 10,
    },
    editBtn: {
        backgroundColor: '#2196F3',
    },
    deleteBtn: {
        backgroundColor: '#F44336',
    },
    actionBtnText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 12,
    },
    emptyContainer: {
        padding: 20,
        alignItems: 'center',
    },
    emptyText: {
        color: '#777',
        fontSize: 16,
    }
});

export default ViewOnlineMaterialScreen;
