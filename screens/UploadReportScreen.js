import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ScrollView, Alert, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import DateTimePicker from '@react-native-community/datetimepicker';

import { CoreContext } from '../context/CoreContext';
import { StyleContext } from '../context/StyleContext';
import CustomPickerModal from '../components/CustomPickerModal';
import ReportMenuModal from '../components/ReportMenuModal';

export default function UploadReportScreen({ navigation }) {
    const coreContext = useContext(CoreContext);
    const styleContext = useContext(StyleContext);

    // Selections
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSection, setSelectedSection] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedRule, setSelectedRule] = useState('');

    // Data
    const [classes, setClasses] = useState([]);
    const [sections, setSections] = useState([]);
    const [categories, setCategories] = useState([]);
    const [rules, setRules] = useState([]);
    
    // Student Selection State (IDs of selected students)
    const [checkedStudents, setCheckedStudents] = useState([]);

    // Inputs
    const [comment, setComment] = useState('');
    const [reportDate, setReportDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);

    // UI State
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    
    // Custom Picker State
    const [pickerVisible, setPickerVisible] = useState(false);
    const [pickerConfig, setPickerConfig] = useState({ title: '', data: [], selected: null, onSelect: () => {} });
    const [menuVisible, setMenuVisible] = useState(false);

    useEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <TouchableOpacity onPress={() => setMenuVisible(true)} style={{ marginRight: 15 }}>
                     <Icon name="dots-vertical" size={26} color="#fff" />
                </TouchableOpacity>
            ),
        });
    }, [navigation]);

    useEffect(() => {
        if (coreContext.branchid) {
            fetchInitialData();
            fetchCategories();
            fetchDisciplineIncidences();
        }
    }, [coreContext.branchid]);

    // Reset selection when search results change
    useEffect(() => {
        setCheckedStudents([]);
    }, [coreContext.selectedStudents]);

    const fetchInitialData = async () => {
        try {
            const branchid = coreContext.branchid;
            
            // Fetch Classes
            const classRes = await axios.get('/getallclasses', { params: { branchid } });
            setClasses((classRes.data.rows || []).map(c => ({ label: c.classname, value: c.classid })));
            
             // Fetch Sections
            const sectionRes = await axios.get('/getallsections', { params: { branchid } });
            setSections((sectionRes.data.rows || []).map(s => ({ label: s.sectionname, value: s.sectionid })));

        } catch (error) {
            console.error(error);
            Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to load classes/sections' });
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await axios.get('/getcategories', { params: { branchid: coreContext.branchid } });
            if (response.data && response.data.categories) {
                // Filter out 'Home Work' if needed, or keeping it as per OtherReports.js
                const cats = response.data.categories
                    .filter(c => c.name !== 'Home Work')
                    .map(c => ({ label: c.name, value: c.name }));
                setCategories(cats);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const fetchDisciplineIncidences = async () => {
        try {
            const response = await axios.get('/discipline-incidences', { 
                params: { branchid: coreContext.branchid, owner: coreContext.phone, action: 'reporting' } 
            });
            if (response.data && response.data.rules) {
                setRules(response.data.rules.map(r => ({ label: r.name, value: r.id })));
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleSearch = () => {
        if (!selectedClass) return Toast.show({ type: 'error', text1: 'Error', text2: 'Please select a Class' });
        if (!selectedSection) return Toast.show({ type: 'error', text1: 'Error', text2: 'Please select a Section' });

        // Use context to search - it updates selectedStudents in context
        coreContext.searchStudentsByClass(selectedClass, selectedSection);
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
    
    const toggleStudentSelection = (id) => {
        setCheckedStudents(prev => {
            if (prev.includes(id)) {
                return prev.filter(sid => sid !== id);
            } else {
                return [...prev, id];
            }
        });
    };

    const handleUpload = async () => {
        if (checkedStudents.length === 0) {
            return Toast.show({ type: 'error', text1: 'Error', text2: 'No Student Selected' });
        }
        if (!selectedCategory) {
            return Toast.show({ type: 'error', text1: 'Error', text2: 'Please select a category' });
        }
        if (selectedCategory === 'Discipline' && !selectedRule) {
            return Toast.show({ type: 'error', text1: 'Error', text2: 'Please select a discipline incidence' });
        }
        if (!comment.trim()) {
            return Toast.show({ type: 'error', text1: 'Error', text2: 'Please enter a comment' });
        }

        setUploading(true);
        try {
            const formattedDate = formatDate(reportDate);
            
            await axios.post('/otherreport', {
                comment,
                category: selectedCategory,
                attendancedate: formattedDate,
                rule: selectedRule,
                absentstudents: checkedStudents, 
                owner: coreContext.phone,
                branchid: coreContext.branchid
            });

            Toast.show({ type: 'success', text1: 'Success', text2: 'Report Uploaded Successfully' });
            setComment('');
            setCheckedStudents([]);
            
        } catch (error) {
            console.error(error);
            Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to upload report' });
        } finally {
            setUploading(false);
        }
    };

    // Helper for Picker
    const openPicker = (title, data, selected, onSelect) => {
        setPickerConfig({
            title,
            data: [{ label: `Select ${title}`, value: '' }, ...data],
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

    // Render Student Item matching HomeWorkListItem.js design
    const renderStudentItem = (item) => {
        const id = item.enrollment || item.id;
        const isSelected = checkedStudents.includes(id);
        
        // Colors from logic or context. 
        // HomeWorkListItem uses props.styles.cardContainerStyle.backgroundColor for unselected
        // and props.styles.headerStyle.backgroundColor for selected.
        // I'll approximate with reasonable defaults if context values are missing, or use high contrast.
        const unselectedColor = styleContext.card?.backgroundColor || '#fff';
        const selectedColor = styleContext.headerStyle?.backgroundColor || '#ffe0b2'; // Fallback highlight
        
        const bgColor = isSelected ? selectedColor : unselectedColor;
        const roll = item.roll || item.roll_no || item.rollno || '-';
        const name = item.firstname ? `${item.firstname} ${item.lastname || ''}` : (item.name || item.studentname || 'No Name');
        const qname = `${name} (Roll: ${roll})`;

        return (
            <View key={id || Math.random()} style={[styles.studentCard, { backgroundColor: bgColor, borderColor: '#ddd', borderWidth: 1 }]}>
                {/* Title */}
                <View style={{ alignItems: 'center', marginBottom: 10 }}>
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: styleContext.titleColor || '#333', textAlign: 'center' }}>
                        {qname}
                    </Text>
                </View>

                {/* Reg No Row */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <Text style={{ fontSize: 14, color: '#666' }}>
                       Reg No : {item.scholarno || '-'}
                    </Text>
                    {isSelected && <Icon name="check" size={20} color={styleContext.button?.backgroundColor || '#6200ee'} />}
                </View>

                {/* Enr No Row + Button */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 14, color: '#666' }}>
                       Enr No : {item.enrollment || '-'}
                    </Text>
                    
                    <TouchableOpacity 
                        style={[
                            styles.selectButton, 
                            { backgroundColor: styleContext.button?.backgroundColor || '#6200ee' }
                        ]}
                        onPress={() => toggleStudentSelection(id)}
                    >
                        <Text style={styles.selectButtonText}>{isSelected ? 'Select' : 'Select'}</Text> 
                        {/* Button text says 'Select' in ref regardless of state, but state changes color. I'll keep it simple 'Select' */}
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={[styles.container, styleContext.background]} edges={['bottom', 'left', 'right']}>
             <ScrollView contentContainerStyle={{ padding: 16 }}>
                
                {/* Date Picker */}
                <TouchableOpacity style={[styleContext.pickerButton, { marginBottom: 15 }]} onPress={() => setShowDatePicker(true)}>
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
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 }}>
                    <TouchableOpacity style={[styleContext.pickerButton, { flex: 1, marginRight: 8 }]} onPress={() => openPicker('Class', classes, selectedClass, setSelectedClass)}>
                         <Text style={styleContext.pickerButtonText}>{selectedClass ? classes.find(c => c.value === selectedClass)?.label : 'Select Class'}</Text>
                         <Icon name="chevron-down" size={20} color={styleContext.blackColor} />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styleContext.pickerButton, { flex: 1, marginLeft: 8 }]} onPress={() => openPicker('Section', sections, selectedSection, setSelectedSection)}>
                         <Text style={styleContext.pickerButtonText}>{selectedSection ? sections.find(s => s.value === selectedSection)?.label : 'Select Section'}</Text>
                         <Icon name="chevron-down" size={20} color={styleContext.blackColor} />
                    </TouchableOpacity>
                </View>

                {/* Search Button */}
                <TouchableOpacity 
                    style={[styleContext.button, { marginBottom: 20 }]} 
                    onPress={handleSearch}
                    disabled={coreContext.loading}
                >
                    {coreContext.loading ? <ActivityIndicator color="#fff" /> : <Text style={styleContext.buttonText}>Search Students</Text>}
                </TouchableOpacity>

                {/* Category Picker */}
                <TouchableOpacity style={[styleContext.pickerButton, { marginBottom: 15 }]} onPress={() => openPicker('Category', categories, selectedCategory, setSelectedCategory)}>
                        <Text style={styleContext.pickerButtonText}>{selectedCategory || 'Select Category'}</Text>
                        <Icon name="chevron-down" size={20} color={styleContext.blackColor} />
                </TouchableOpacity>

                {/* Discipline Rule Picker (Conditional) */}
                {selectedCategory === 'Discipline' && (
                     <TouchableOpacity style={[styleContext.pickerButton, { marginBottom: 15 }]} onPress={() => openPicker('Incidence', rules, selectedRule, setSelectedRule)}>
                        <Text style={styleContext.pickerButtonText}>{selectedRule ? rules.find(r => r.value === selectedRule)?.label : 'Select Incidence'}</Text>
                        <Icon name="chevron-down" size={20} color={styleContext.blackColor} />
                    </TouchableOpacity>
                )}

                {/* Comment Input */}
                <View style={[styles.textInputWrapper, { backgroundColor: '#fff' }]}>
                    <TextInput 
                        placeholder="Enter Comment"
                        placeholderTextColor="#999"
                        value={comment}
                        onChangeText={setComment}
                        style={[styles.textInput, { height: 100, textAlignVertical: 'top' }]}
                        multiline
                        numberOfLines={6}
                    />
                </View>

                {/* Upload Button */}
                <TouchableOpacity 
                    style={[styleContext.button, { marginTop: 10, backgroundColor: '#388e3c' }]} 
                    onPress={handleUpload}
                    disabled={uploading}
                >
                    {uploading ? <ActivityIndicator color="#fff" /> : <Text style={styleContext.buttonText}>Upload Report ({checkedStudents.length})</Text>}
                </TouchableOpacity>

                {/* Students List Header */}
                <View style={{ marginTop: 25, flexDirection: 'row', alignItems: 'center' }}>
                    <Icon name="account-group" size={24} color={styleContext.titleColor} style={{ marginRight: 8 }} />
                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: styleContext.titleColor }}>
                        Students ({coreContext.selectedStudents.length})
                    </Text>
                </View>

                {/* Students List */}
                {/* {console.log('Selected Students Debug:', coreContext.selectedStudents)} */}
                {coreContext.selectedStudents.length > 0 ? (
                    <View style={{ marginTop: 10 }}>
                        {coreContext.selectedStudents.map(item => renderStudentItem(item))}
                    </View>
                ) : (
                    <Text style={{ textAlign: 'center', marginTop: 20, color: '#888' }}>
                        No students selected. Search above.
                    </Text>
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

            <ReportMenuModal 
                visible={menuVisible} 
                onClose={() => setMenuVisible(false)} 
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    textInputWrapper: {
        borderRadius: 8,
        marginVertical: 5,
        borderWidth: 1,
        borderColor: '#ddd',
        paddingHorizontal: 10
    },
    textInput: {
        paddingVertical: 10,
        fontSize: 16,
        color: '#333'
    },
    studentCard: {
        padding: 12,
        borderRadius: 8,
        marginBottom: 10,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
    },
    selectButton: {
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 4,
    },
    selectButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14
    }
});
