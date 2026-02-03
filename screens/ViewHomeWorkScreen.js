import React, { useState, useContext, useEffect, useLayoutEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Alert, ActivityIndicator, Image, Linking, TextInput, Platform, Modal, TouchableWithoutFeedback } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import DateTimePicker from '@react-native-community/datetimepicker';
import PhotoView from 'react-native-image-viewing';

import { CoreContext } from '../context/CoreContext';
import { StyleContext } from '../context/StyleContext';
import CustomPickerModal from '../components/CustomPickerModal';

// Helper Component for Individual Homework Item
const HomeworkItem = ({ item, onDelete, onEdit, styleContext, appUrl }) => {
    const [images, setImages] = useState([]);
    const [pdfs, setPdfs] = useState([]);
    const [visible, setIsVisible] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    useEffect(() => {
        if (item.filepath) {
            const files = item.filepath.split(',');
            const imgs = [];
            const docs = [];

            files.forEach(file => {
                 // Check extension
                 // Legacy format usually "path||width||height" or just "path"
                 const parts = file.split('||');
                 const cleanPath = parts[0];
                 const ext = cleanPath.split('.').pop().toLowerCase();
                 // Full URL
                 // CoreContext typically has appUrl, but we passed it down or use generic
                 // Legacy uses `this.props.appUrl`. Assuming it's passed or we construct it.
                 // Ideally CoreContext should provide the base URL if it's dynamic, 
                 // otherwise axios.defaults.baseURL is used for API calls, but for images we need full URL if distinct.
                 // Assuming relative path works if using base Url, but Image component needs absolute.
                 // Let's assume axios.defaults.baseURL is the API base, but images might be served from root.
                 
                 // If appUrl is not provided, we might need to rely on what axios is using or a config.
                 // For now, let's treat `cleanPath` as relative.
                 const fullUrl = appUrl ? `${appUrl}/${cleanPath}` : cleanPath; 

                 if (ext === 'pdf') {
                     docs.push({ uri: fullUrl, name: cleanPath.split('/').pop() });
                 } else {
                     imgs.push({ uri: fullUrl });
                 }
            });
            setImages(imgs);
            setPdfs(docs);
        }
    }, [item.filepath, appUrl]);

    return (
        <View style={styleContext.card}>
            {/* Header: Subject & Date */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: styleContext.titleColor }}>{item.subject}</Text>
                <Text style={{ fontSize: 14, color: '#666', fontWeight: 'bold' }}>{item.dat}</Text>
            </View>

            {/* Content */}
            {item.hw ? (
                <Text style={{ fontSize: 15, color: '#444', marginBottom: 10 }}>{item.hw}</Text>
            ) : null}

            {/* Images */}
            {images.length > 0 && (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 }}>
                    {images.map((img, index) => (
                        <TouchableOpacity key={index} onPress={() => { setCurrentImageIndex(index); setIsVisible(true); }}>
                            <Image source={{ uri: img.uri }} style={{ width: 80, height: 80, borderRadius: 8, marginRight: 8, marginBottom: 8 }} />
                        </TouchableOpacity>
                    ))}
                    <PhotoView
                        images={images}
                        imageIndex={currentImageIndex}
                        visible={visible}
                        onRequestClose={() => setIsVisible(false)}
                        HeaderComponent={({ imageIndex }) => (
                            <SafeAreaView edges={['top', 'left', 'right']} style={{ position: 'absolute', top: 0, width: '100%', zIndex: 1 }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', padding: 10 }}>
                                    <TouchableOpacity 
                                        style={{ padding: 10, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20 }}
                                        onPress={() => setIsVisible(false)}
                                    >
                                        <Icon name="close" size={24} color="#fff" />
                                    </TouchableOpacity>
                                </View>
                            </SafeAreaView>
                        )}
                    />
                </View>
            )}

            {/* PDFs */}
            {pdfs.length > 0 && (
                <View style={{ marginBottom: 10 }}>
                    {pdfs.map((pdf, index) => (
                        <TouchableOpacity 
                            key={index} 
                            style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}
                            onPress={() => Linking.openURL(pdf.uri)}
                        >
                            <Icon name="file-pdf-box" size={24} color="#d32f2f" />
                            <Text style={{ color: '#007bff', marginLeft: 5, textDecorationLine: 'underline' }}>{pdf.name}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {/* Footer: Actions */}
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 5 }}>
                 <TouchableOpacity 
                    style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#e3f2fd', padding: 8, borderRadius: 6, marginRight: 10 }}
                    onPress={() => onEdit(item)}
                >
                    <Icon name="pencil" size={20} color="#1976d2" />
                    <Text style={{ color: '#1976d2', fontWeight: 'bold', marginLeft: 4 }}>Edit</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffebee', padding: 8, borderRadius: 6 }}
                    onPress={() => onDelete(item.id)}
                >
                    <Icon name="trash-can-outline" size={20} color="#d32f2f" />
                    <Text style={{ color: '#d32f2f', fontWeight: 'bold', marginLeft: 4 }}>Delete</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default function ViewHomeWorkScreen({ navigation }) {
    const coreContext = useContext(CoreContext);
    const styleContext = useContext(StyleContext);
    const { 
        allClasses, getAllClasses, 
        allSections, getAllSections, 
        branchid, phone,
        appUrl // Assuming this exists or we default
    } = coreContext;

    // Filters
    const [selectedClass, setSelectedClass] = useState(null);
    const [selectedSection, setSelectedSection] = useState(null);
    const [selectedClassName, setSelectedClassName] = useState('Select Class');
    const [selectedSectionName, setSelectedSectionName] = useState('Select Section');
    
    // Optional Filters
    const [selectedSubject, setSelectedSubject] = useState('');
    const [searchText, setSearchText] = useState('');
    const [subjects, setSubjects] = useState([]);

    const [reportDate, setReportDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Edit State
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [editComment, setEditComment] = useState('');
    const [editLoading, setEditLoading] = useState(false);

    // Data
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    // Modals
    const [pickerVisible, setPickerVisible] = useState(false);
    const [pickerConfig, setPickerConfig] = useState({ title: '', data: [], selected: null, onSelect: () => {} });

    useEffect(() => {
        if (!allClasses || allClasses.length === 0) getAllClasses();
        if (!allSections || allSections.length === 0) getAllSections();
        
        if (coreContext.subjects && coreContext.subjects.length > 0) {
            setSubjects(coreContext.subjects.map(s => ({ label: s.name, value: s.name })));
        } else {
             coreContext.fetchSubjects();
        }
    }, []);
    
     useEffect(() => {
         if (coreContext.subjects && coreContext.subjects.length > 0) {
            setSubjects(coreContext.subjects.map(s => ({ label: s.name, value: s.name })));
        }
    }, [coreContext.subjects]);

    const formatDate = (dateObj) => {
        const d = new Date(dateObj);
        let month = '' + (d.getMonth() + 1);
        let day = '' + d.getDate();
        const year = d.getFullYear();
        if (month.length < 2) month = '0' + month;
        if (day.length < 2) day = '0' + day;
        return [day, month, year].join('-');
    };

    const fetchHomeWork = () => {
        // Validation: Legacy ViewHomeWork usually requires class/section unless just searching? 
        // Legacy: this.props.viewHomeWork(this.state.showReportDate, this.state.classid, this.state.sectionid, this.state.searchText, this.state.subject);
        // It seems class/section might not be strictly required if searching by text, but usually are for date view.
        // Let's enforce class/section for consistency with other screens, but allow if searchText is present? 
        // No, let's keep it simple: Class/Section required.
        
        if (!selectedClass || !selectedSection) {
            return Alert.alert("Error", "Please select Class and Section");
        }

        setLoading(true);
        const params = {
            reportdate: formatDate(reportDate),
            classid: selectedClass,
            sectionid: selectedSection,
            branchid: branchid,
            searchText: searchText || '',
            subject: selectedSubject || ''
        };

        axios.get('/viewhomework', { params })
            .then(response => {
                const rows = response.data.rows || [];
                setData(rows);
                if (rows.length === 0) {
                    Toast.show({ type: 'info', text1: 'Info', text2: 'No homework found.' });
                }
            })
            .catch(error => {
                console.error(error);
                Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to fetch homework' });
            })
            .finally(() => setLoading(false));
    };

    const handleDelete = (id) => {
        Alert.alert(
            "Delete Homework",
            "Are you sure you want to delete this homework?",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: () => processDelete(id) }
            ]
        );
    };

    const processDelete = (id) => {
        const payload = {
            id,
            owner: phone,
            branchid: branchid
        };

        axios.post('/deletehomework', payload)
            .then(() => {
                Toast.show({ type: 'success', text1: 'Success', text2: 'Homework deleted' });
                // Refresh list
                fetchHomeWork();
            })
            .catch(error => {
                console.error(error);
                Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to delete' });
            });
    };

    // Edit Logic
    const handleEdit = (item) => {
        setEditingItem(item);
        setEditComment(item.hw || '');
        setEditModalVisible(true);
    };

    const saveEdit = () => {
        if (!editingItem) return;
        
        setEditLoading(true);
        const payload = {
            id: editingItem.id,
            comment: editComment,
            owner: phone,
            branchid: branchid
        };

        axios.post('/edithomework', payload)
            .then(() => {
                Toast.show({ type: 'success', text1: 'Success', text2: 'Homework updated' });
                setEditModalVisible(false);
                setEditingItem(null);
                setEditComment('');
                // Refresh list or update local state
                // Refreshing is safer to get updated server state
                fetchHomeWork(); 
            })
            .catch(error => {
                console.error(error);
                Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to update homework' });
            })
            .finally(() => setEditLoading(false));
    };

    // Pickers
    const openPicker = (title, data, selected, onSelect) => {
        setPickerConfig({
            title,
            data,
            selected,
            onSelect: (val) => {
                onSelect(val);
                if (title === 'Class') setSelectedClassName(data.find(d => d.value === val)?.label);
                if (title === 'Section') setSelectedSectionName(data.find(d => d.value === val)?.label);
            }
        });
        setPickerVisible(true);
    };

    const getFormattedClassOptions = () => (allClasses || []).map(c => ({ label: c.classname, value: c.classid }));
    const getFormattedSectionOptions = () => (allSections || []).map(s => ({ label: s.sectionname, value: s.sectionid }));

    return (
        <SafeAreaView style={styleContext.background} edges={['bottom', 'left', 'right']}>
            <View style={{ padding: 16 }}>
                
                {/* Filters */}
                {/* Date */}
                 <TouchableOpacity style={styleContext.pickerButton} onPress={() => setShowDatePicker(true)}>
                    <Text style={styleContext.pickerButtonText}>Date: {formatDate(reportDate)}</Text>
                    <Icon name="calendar" size={24} color={styleContext.blackColor} />
                </TouchableOpacity>
                 {showDatePicker && (
                    <DateTimePicker
                        value={reportDate}
                        mode="date"
                        display="default"
                        onChange={(e, d) => { setShowDatePicker(false); if(d) setReportDate(d); }}
                    />
                )}

                 {/* Class & Section */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
                    <TouchableOpacity 
                        style={[styleContext.pickerButton, { flex: 1, marginRight: 5 }]} 
                        onPress={() => openPicker('Class', getFormattedClassOptions(), selectedClass, setSelectedClass)}
                    >
                        <Text style={styleContext.pickerButtonText}>{selectedClassName}</Text>
                        <Icon name="chevron-down" size={24} color={styleContext.blackColor} />
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[styleContext.pickerButton, { flex: 1, marginLeft: 5 }]} 
                        onPress={() => openPicker('Section', getFormattedSectionOptions(), selectedSection, setSelectedSection)}
                    >
                        <Text style={styleContext.pickerButtonText}>{selectedSectionName}</Text>
                        <Icon name="chevron-down" size={24} color={styleContext.blackColor} />
                    </TouchableOpacity>
                </View>

                {/* Optional Search / Subject */}
                <View style={{ flexDirection: 'row', marginTop: 10 }}>
                    <TouchableOpacity 
                         style={[styleContext.pickerButton, { flex: 1, marginRight: 5 }]}
                         onPress={() => openPicker('Subject', [{ label: 'All Subjects', value: '' }, ...subjects], selectedSubject, setSelectedSubject)}
                    >
                         <Text style={styleContext.pickerButtonText}>{selectedSubject || 'All Subjects'}</Text>
                         <Icon name="book-open-variant" size={24} color={styleContext.blackColor} />
                    </TouchableOpacity>
                </View>
                
                <View style={[styleContext.pickerButton, { marginTop: 10, paddingVertical: Platform.OS === 'ios' ? 12 : 0 }]}>
                    <TextInput 
                        placeholder="Search text (optional)..."
                        placeholderTextColor="#999"
                        style={{ flex: 1, color: '#333', fontSize: 16 }}
                        value={searchText}
                        onChangeText={setSearchText}
                    />
                     <Icon name="magnify" size={24} color={styleContext.blackColor} />
                </View>

                {/* View Button */}
                <TouchableOpacity 
                    style={[styleContext.button, { marginTop: 15 }]} 
                    onPress={fetchHomeWork}
                    disabled={loading}
                >
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styleContext.buttonText}>View Home Work</Text>}
                </TouchableOpacity>

            </View>

            {/* List */}
            <FlatList
                data={data}
                renderItem={({ item }) => (
                    <HomeworkItem 
                        item={item} 
                        onDelete={handleDelete} 
                        onEdit={handleEdit}
                        styleContext={styleContext}
                        appUrl={appUrl || axios.defaults.baseURL?.replace('/api', '')} // Fallback logic for appUrl
                    />
                )}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
                ListEmptyComponent={
                    !loading ? 
                    <Text style={{ textAlign: 'center', marginTop: 30, color: '#888' }}>
                        No homework found. Select filters or change date.
                    </Text> : null
                }
            />

            <CustomPickerModal
                visible={pickerVisible}
                title={pickerConfig.title}
                data={pickerConfig.data}
                selectedValue={pickerConfig.selected}
                onSelect={(val) => {
                    pickerConfig.onSelect(val); 
                    setPickerConfig(prev => ({...prev, selected: val }));
                }}
                onConfirm={() => setPickerVisible(false)}
                onClose={() => setPickerVisible(false)}
            />

            {/* Edit Modal */}
            <Modal
                visible={editModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setEditModalVisible(false)}
            >
                <TouchableWithoutFeedback onPress={() => setEditModalVisible(false)}>
                    <View style={styleContext.pickerModalOverlay}>
                        <TouchableWithoutFeedback onPress={() => {}}>
                            <View style={[styleContext.pickerModalContent, { width: '90%' }]}>
                                <Text style={styleContext.pickerModalTitle}>Edit Homework</Text>
                                
                                <TextInput
                                    style={{ 
                                        borderWidth: 1, 
                                        borderColor: '#ccc', 
                                        borderRadius: 8, 
                                        padding: 10, 
                                        minHeight: 100, 
                                        textAlignVertical: 'top',
                                        fontSize: 16,
                                        marginBottom: 20,
                                        color: '#333'
                                    }}
                                    multiline
                                    value={editComment}
                                    onChangeText={setEditComment}
                                    placeholder="Enter homework details..."
                                />

                                <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                                    <TouchableOpacity 
                                        style={[styleContext.button, { backgroundColor: '#aaa', flex: 0, paddingHorizontal: 20, marginRight: 10, marginTop: 0 }]}
                                        onPress={() => setEditModalVisible(false)}
                                    >
                                        <Text style={styleContext.buttonText}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        style={[styleContext.button, { flex: 0, paddingHorizontal: 20, marginTop: 0 }]}
                                        onPress={saveEdit}
                                        disabled={editLoading}
                                    >
                                        <Text style={styleContext.buttonText}>{editLoading ? 'Saving...' : 'Save'}</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    // Using StyleContext mostly, but specific local styles can go here
});
