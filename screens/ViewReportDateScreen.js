import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import DateTimePicker from '@react-native-community/datetimepicker';

import { CoreContext } from '../context/CoreContext';
import { StyleContext } from '../context/StyleContext';
import CustomPickerModal from '../components/CustomPickerModal';
import ReportMenuModal from '../components/ReportMenuModal';

export default function ViewReportDateScreen({ navigation }) {
    const coreContext = useContext(CoreContext);
    const styleContext = useContext(StyleContext);

    // State
    const [fromDate, setFromDate] = useState(new Date());
    const [toDate, setToDate] = useState(new Date());
    const [showFromPicker, setShowFromPicker] = useState(false);
    const [showToPicker, setShowToPicker] = useState(false);

    const [classId, setClassId] = useState('');
    const [sectionId, setSectionId] = useState('');
    const [category, setCategory] = useState('');
    const [subject, setSubject] = useState('');
    const [staff, setStaff] = useState('');

    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(false);

    // Data for Pickers
    const [categories, setCategories] = useState([]);
    const [classes, setClasses] = useState([]);
    const [sections, setSections] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [staffs, setStaffs] = useState([]);

    // Modals
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
        }
    }, [coreContext.branchid]);

    const fetchInitialData = async () => {
        try {
            // Categories
            const catRes = await axios.get('/getcategories', { params: { branchid: coreContext.branchid } });
            if (catRes.data && catRes.data.categories) {
                setCategories(catRes.data.categories.map(c => ({ label: c.name, value: c.name })));
            }

            // Classes
            const clsRes = await axios.get('/getallclasses', { params: { branchid: coreContext.branchid } });
            if (clsRes.data && clsRes.data.rows) {
                setClasses(clsRes.data.rows.map(c => ({ label: c.classname, value: c.classid })));
            }
             // Subjects
             const subRes = await axios.get('/getsubjects', { params: { branchid: coreContext.branchid } });
             if (subRes.data && (subRes.data.subjects || subRes.data.rows)) {
                 const subs = subRes.data.subjects || subRes.data.rows;
                 setSubjects(subs.map(s => ({ label: s.name, value: s.name })));
             }

             // Staffs (Only if Admin/Principal/etc - assuming user has permission if they can access this screen)
             const staffRes = await axios.get('/fetchstaffs', { params: { branchid: coreContext.branchid } });
             if (staffRes.data && staffRes.data.staffs) {
                 setStaffs(staffRes.data.staffs.map(s => ({ label: s.name, value: s.phone })));
             }


        } catch (error) {
            console.error('Error fetching initial data:', error);
        }
    };

    useEffect(() => {
        if (classId) {
            fetchSections(classId);
        } else {
             setSections([]);
             setSectionId('');
        }
    }, [classId]);

    const fetchSections = async (clsId) => {
        try {
            const response = await axios.get('/getallsections', { params: { classid: clsId, branchid: coreContext.branchid } });
            if (response.data && response.data.rows) {
                setSections(response.data.rows.map(s => ({ label: s.sectionname, value: s.sectionid })));
            }
        } catch (error) {
            console.error('Error fetching sections:', error);
        }
    };


    const fetchReports = async () => {
        if (classId && !sectionId) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Please select a Section' });
            return;
        }

        setLoading(true);
        setReports([]);
        try {
            const params = {
                reportdate: formatDate(fromDate),
                toreportdate: formatDate(toDate),
                category: category,
                classid: classId,
                sectionid: sectionId,
                subject: subject,
                action: '',
                by: staff,
                branchid: coreContext.branchid,
                // These might be needed based on legacy code logic for role checks, 
                // but usually backend handles it from token/context or passed params.
                role: coreContext.role, 
                owner: coreContext.phone
            };

            const response = await axios.get('/view-student-report-date', { params });
            const rows = response.data.rows || [];
            
            setReports(rows);
            if (rows.length === 0) {
                 // Toast.show({ type: 'info', text1: 'Info', text2: 'No reports found' });
            }

        } catch (error) {
            console.error('Error fetching reports:', error);
            Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to fetch reports' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if(coreContext.branchid) {
            fetchReports();
        }
    }, [coreContext.branchid]);

    const formatDate = (dateObj) => {
        const d = new Date(dateObj);
        let month = '' + (d.getMonth() + 1);
        let day = '' + d.getDate();
        const year = d.getFullYear();
        if (month.length < 2) month = '0' + month;
        if (day.length < 2) day = '0' + day;
        return [day, month, year].join('-');
    };

    const openPicker = (title, data, selected, onSelect) => {
        setPickerConfig({ title, data, selected, onSelect });
        setPickerVisible(true);
    };

    const handlePickerSelect = (value) => {
        setPickerConfig(prev => ({ ...prev, selected: value }));
    };

    const handlePickerConfirm = () => {
        if (pickerConfig.onSelect) {
            pickerConfig.onSelect(pickerConfig.selected);
        }
        setPickerVisible(false);
    };

    const renderReportItem = ({ item }) => {
         const studentName = item.firstname ? `${item.firstname} ${item.lastname || ''}` : item.stuid;
         const studentInfo = `Class: ${item.clas} | ${coreContext.schoolData?.smallReg || 'Reg'}: ${item.scholarno || '-'} | ${coreContext.schoolData?.smallEnr || 'Enr'}: ${item.enrollment || '-'}`;
         
        return (
            <View style={[styles.card, { backgroundColor: styleContext.card?.backgroundColor || '#fff' }]}>
                <View style={styles.cardHeader}>
                    <View style={{flex: 1}}>
                        <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2}}>
                            <Text style={styles.cardDate}>{item.sdate}</Text>
                        </View>
                        <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#333' }}>{studentName}</Text>
                        <Text style={{ fontSize: 12, color: '#666' }}>{studentInfo}</Text>
                    </View>
                </View>
                
                <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>
                        {item.subject ? `Subject: ${item.subject}` : `Category: ${item.category}`}
                    </Text>
                    <Text style={styles.cardComment}>{item.comment}</Text>
                </View>
                
                <View style={styles.cardFooter}>
                     <Text style={styles.footerText}>By: {item.owner}</Text>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={[styles.container, styleContext.background]} edges={['bottom', 'left', 'right']}>
             <ScrollView contentContainerStyle={{ padding: 16 }}>
                 
                 {/* Dates */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 }}>
                    <TouchableOpacity style={[styleContext.pickerButton, { flex: 1, marginRight: 5 }]} onPress={() => setShowFromPicker(true)}>
                         <Text style={{ fontSize: 12, color: '#666' }}>From:</Text>
                         <Text style={styleContext.pickerButtonText}>{formatDate(fromDate)}</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={[styleContext.pickerButton, { flex: 1, marginLeft: 5 }]} onPress={() => setShowToPicker(true)}>
                         <Text style={{ fontSize: 12, color: '#666' }}>To:</Text>
                         <Text style={styleContext.pickerButtonText}>{formatDate(toDate)}</Text>
                    </TouchableOpacity>
                </View>

                {showFromPicker && (
                    <DateTimePicker value={fromDate} mode="date" onChange={(e, d) => { setShowFromPicker(false); if(d) setFromDate(d); }} />
                )}
                {showToPicker && (
                    <DateTimePicker value={toDate} mode="date" onChange={(e, d) => { setShowToPicker(false); if(d) setToDate(d); }} />
                )}

                {/* Class & Section */}
                <View style={{ flexDirection: 'row', marginBottom: 10 }}>
                     <TouchableOpacity 
                        style={[styleContext.pickerButton, { flex: 1, marginRight: 5 }]} 
                        onPress={() => openPicker('Select Class', classes, classId, setClassId)}
                    >
                         <Text style={styleContext.pickerButtonText}>{classId ? classes.find(c => c.value === classId)?.label : 'Select Class'}</Text>
                         <Icon name="chevron-down" size={24} color={styleContext.blackColor} />
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[styleContext.pickerButton, { flex: 1, marginLeft: 5 }]} 
                        onPress={() => {
                            if (!classId) Toast.show({type: 'info', text1: 'Select Class First'});
                            else openPicker('Select Section', sections, sectionId, setSectionId);
                        }}
                    >
                         <Text style={styleContext.pickerButtonText}>{sectionId ? sections.find(s => s.value === sectionId)?.label : 'Select Section'}</Text>
                         <Icon name="chevron-down" size={24} color={styleContext.blackColor} />
                    </TouchableOpacity>
                </View>

                {/* Category */}
                 <TouchableOpacity 
                    style={[styleContext.pickerButton, { marginBottom: 10 }]} 
                    onPress={() => openPicker('Select Category', categories, category, setCategory)}
                >
                    <Text style={styleContext.pickerButtonText}>{category || 'Select Category'}</Text>
                    <Icon name="chevron-down" size={24} color={styleContext.blackColor} />
                </TouchableOpacity>

                {/* Subject - Only if Home Work */}
                {category === 'Home Work' && (
                     <TouchableOpacity 
                        style={[styleContext.pickerButton, { marginBottom: 10 }]} 
                        onPress={() => openPicker('Select Subject', subjects, subject, setSubject)}
                    >
                        <Text style={styleContext.pickerButtonText}>{subject || 'Select Subject'}</Text>
                        <Icon name="chevron-down" size={24} color={styleContext.blackColor} />
                    </TouchableOpacity>
                )}

                {/* Staff */}
                <TouchableOpacity 
                    style={[styleContext.pickerButton, { marginBottom: 10 }]} 
                    onPress={() => openPicker('Select Staff', [{label: 'All Staffs', value: ''}, ...staffs], staff, setStaff)}
                >
                    <Text style={styleContext.pickerButtonText}>{staff ? staffs.find(s => s.value === staff)?.label : 'All Staffs'}</Text>
                    <Icon name="chevron-down" size={24} color={styleContext.blackColor} />
                </TouchableOpacity>

                {/* View Button */}
                <TouchableOpacity 
                    style={[styleContext.button, { marginBottom: 10 }]} 
                    onPress={fetchReports}
                    disabled={loading}
                >
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styleContext.buttonText}>View</Text>}
                </TouchableOpacity>

                  {/* Reports List */}
                {!loading && reports.length === 0 ? (
                    <Text style={{ textAlign: 'center', marginTop: 20, color: '#888' }}>
                        No reports found.
                    </Text>
                ) : (
                    reports.map((item, index) => (
                         <View key={item.id || index} style={{ marginBottom: 10 }}>
                            {renderReportItem({ item })}
                         </View>
                    ))
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
    card: {
        borderRadius: 8,
        padding: 15,
        backgroundColor: '#fff',
        // Shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
        elevation: 2,
        borderLeftWidth: 4,
        borderLeftColor: '#5a45d4'
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        paddingBottom: 5
    },
    cardDate: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#5a45d4'
    },
    cardContent: {
        marginBottom: 8
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4
    },
    cardComment: {
        fontSize: 14,
        color: '#555',
        lineHeight: 20
    },
    cardFooter: {
        alignItems: 'flex-end'
    },
    footerText: {
        fontSize: 12,
        color: '#999',
        fontStyle: 'italic'
    }
});
