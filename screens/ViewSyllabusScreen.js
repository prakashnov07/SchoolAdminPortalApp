import React, { useState, useContext, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Alert, ActivityIndicator, Image, Linking, TextInput, Platform, Modal, TouchableWithoutFeedback } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import PhotoView from 'react-native-image-viewing';

import { CoreContext } from '../context/CoreContext';
import { StyleContext } from '../context/StyleContext';
import CustomPickerModal from '../components/CustomPickerModal';

// Helper Component for Individual Syllabus Item
const SyllabusItem = ({ item, onDelete, styleContext, appUrl }) => {
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
                 const parts = file.split('||');
                 const cleanPath = parts[0];
                 const ext = cleanPath.split('.').pop().toLowerCase();
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
            <View style={{ marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: styleContext.titleColor }}>{item.subject}</Text>
                    <Text style={{ fontSize: 12, color: '#666' }}>{item.dat}</Text>
                </View>
                {item.name ? <Text style={{ fontSize: 12, color: '#888', fontStyle: 'italic' }}>Uploaded by: {item.name}</Text> : null}
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

            {/* Footer: Delete */}
            <View style={{ alignItems: 'flex-end', marginTop: 5 }}>
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

export default function ViewSyllabusScreen({ navigation }) {
    const coreContext = useContext(CoreContext);
    const styleContext = useContext(StyleContext);
    const { 
        allClasses, getAllClasses, 
        allSections, getAllSections, 
        branchid, phone,
        appUrl 
    } = coreContext;

    // Filters
    const [selectedClass, setSelectedClass] = useState(null);
    const [selectedSection, setSelectedSection] = useState(null);
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [selectedMonth, setSelectedMonth] = useState(null);

    const [selectedClassName, setSelectedClassName] = useState('Select Class');
    const [selectedSectionName, setSelectedSectionName] = useState('Select Section');
    
    const [subjects, setSubjects] = useState([]);
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    // Modals
    const [pickerVisible, setPickerVisible] = useState(false);
    const [pickerConfig, setPickerConfig] = useState({ title: '', data: [], selected: null, onSelect: () => {} });

    // Academic Months (matching legacy)
    const months = [
        { id: '1', name: 'April' },
        { id: '2', name: 'May' },
        { id: '3', name: 'June' },
        { id: '4', name: 'July' },
        { id: '5', name: 'August' },
        { id: '6', name: 'September' },
        { id: '7', name: 'October' },
        { id: '8', name: 'November' },
        { id: '9', name: 'December' },
        { id: '10', name: 'January' },
        { id: '11', name: 'February' },
        { id: '12', name: 'March' },
    ];

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

    const fetchSyllabus = () => {
        if (!selectedClass || !selectedSection) {
            return Alert.alert("Error", "Please select Class and Section");
        }
        if (!selectedSubject) {
             return Alert.alert("Error", "Please select a Subject");
        }
        if (!selectedMonth) {
             return Alert.alert("Error", "Please select a Month");
        }

        setLoading(true);
        const params = {
            classid: selectedClass,
            sectionid: selectedSection,
            branchid: branchid,
            subject: selectedSubject,
            week: selectedMonth // Legacy uses 'week' param for month id
        };

        axios.get('/view-syllabus', { params })
            .then(response => {
                const rows = response.data.rows || [];
                setData(rows);
                if (rows.length === 0) {
                    Toast.show({ type: 'info', text1: 'Info', text2: 'No syllabus found for this selection.' });
                }
            })
            .catch(error => {
                console.error(error);
                Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to fetch syllabus' });
            })
            .finally(() => setLoading(false));
    };

    const handleDelete = (id) => {
        Alert.alert(
            "Delete Syllabus",
            "Are you sure you want to delete this item?",
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

        axios.post('/delete-syllabus', payload)
            .then(() => {
                Toast.show({ type: 'success', text1: 'Success', text2: 'Syllabus deleted' });
                fetchSyllabus();
            })
            .catch(error => {
                console.error(error);
                Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to delete' });
            });
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
    const getMonthOptions = () => months.map(m => ({ label: m.name, value: m.id }));

    return (
        <SafeAreaView style={styleContext.background} edges={['bottom', 'left', 'right']}>
            <View style={{ padding: 16 }}>
                
                {/* Class & Section */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
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

                {/* Subject & Month */}
                <View style={{ flexDirection: 'row', marginBottom: 10 }}>
                    <TouchableOpacity 
                         style={[styleContext.pickerButton, { flex: 1, marginRight: 5 }]}
                         onPress={() => openPicker('Subject', subjects, selectedSubject, setSelectedSubject)}
                    >
                         <Text style={styleContext.pickerButtonText}>{selectedSubject || 'Select Subject'}</Text>
                         <Icon name="book-open-variant" size={24} color={styleContext.blackColor} />
                    </TouchableOpacity>

                    <TouchableOpacity 
                         style={[styleContext.pickerButton, { flex: 1, marginLeft: 5 }]}
                         onPress={() => openPicker('Month', getMonthOptions(), selectedMonth, setSelectedMonth)}
                    >
                         <Text style={styleContext.pickerButtonText}>{selectedMonth ? months.find(m => m.id === selectedMonth)?.name : 'Select Month'}</Text>
                         <Icon name="calendar-month" size={24} color={styleContext.blackColor} />
                    </TouchableOpacity>
                </View>
                
                {/* View Button */}
                <TouchableOpacity 
                    style={[styleContext.button, { marginTop: 5 }]} 
                    onPress={fetchSyllabus}
                    disabled={loading}
                >
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styleContext.buttonText}>View Syllabus</Text>}
                </TouchableOpacity>

            </View>

            {/* List */}
            <FlatList
                data={data}
                renderItem={({ item }) => (
                    <SyllabusItem 
                        item={item} 
                        onDelete={handleDelete} 
                        styleContext={styleContext}
                        appUrl={appUrl || axios.defaults.baseURL?.replace('/api', '')} 
                    />
                )}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
                ListEmptyComponent={
                    !loading ? 
                    <Text style={{ textAlign: 'center', marginTop: 30, color: '#888' }}>
                        No syllabus found. Select filters.
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

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({});
