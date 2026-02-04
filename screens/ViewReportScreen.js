import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import DateTimePicker from '@react-native-community/datetimepicker';

import { CoreContext } from '../context/CoreContext';
import { StyleContext } from '../context/StyleContext';
import CustomPickerModal from '../components/CustomPickerModal';
import ReportMenuModal from '../components/ReportMenuModal';

export default function ViewReportScreen({ navigation }) {
    const coreContext = useContext(CoreContext);
    const styleContext = useContext(StyleContext);

    // Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    
    // State
    const [student, setStudent] = useState(null);
    const [category, setCategory] = useState('');
    const [categories, setCategories] = useState([]);
    
    // Dates
    const [fromDate, setFromDate] = useState(new Date());
    const [toDate, setToDate] = useState(new Date());
    const [showFromPicker, setShowFromPicker] = useState(false);
    const [showToPicker, setShowToPicker] = useState(false);

    // Data
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(false);

    // Modals
    const [pickerVisible, setPickerVisible] = useState(false);
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
            fetchCategories();
        }
    }, [coreContext.branchid]);

    const fetchCategories = async () => {
        try {
            const response = await axios.get('/getcategories', { params: { branchid: coreContext.branchid } });
            if (response.data && response.data.categories) {
                const cats = response.data.categories.map(c => ({ label: c.name, value: c.name }));
                setCategories(cats);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const handleSearch = (text) => {
        setSearchQuery(text);
        if (text && text.length > 2) {
            setSearching(true);
            setShowResults(true);
            axios.get('/filter-search-student-2', { 
                params: { filter: text, branchid: coreContext.branchid } 
            })
            .then(res => {
                setSearchResults(res.data.allStudents || []);
                setSearching(false);
            })
            .catch(err => {
                console.error(err);
                setSearching(false);
            });
        } else {
            setSearchResults([]);
            setShowResults(false);
        }
    };

    const handleSelectStudent = (selected) => {
        if (!selected) return;
        setStudent(selected);
        const name = selected.name || `${selected.firstname} ${selected.lastname}`;
        setSearchQuery(name);
        setShowResults(false);
        setReports([]); // Clear previous reports
    };

    const fetchReports = async () => {
        if (!student) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Please search for a student first' });
            return;
        }
        if (!category) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Please select a Category' });
            return;
        }

        setLoading(true);
        setReports([]);
        try {
            const params = {
                // Use enrollment or available ID as per context
                studentsforreportdetails: [student.enrollment || student.id],
                reportdate: formatDate(fromDate),
                toreportdate: formatDate(toDate),
                category: category,
                branchid: coreContext.branchid
            };

            const response = await axios.get('/view-student-report', { params });
            const rows = response.data.rows || [];
            
            setReports(rows);
            if (rows.length === 0) {
                Toast.show({ type: 'info', text1: 'Info', text2: 'No reports found' });
            }

        } catch (error) {
            console.error('Error fetching reports:', error);
            Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to fetch reports' });
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

    const renderReportItem = ({ item }) => {
        return (
            <View style={[styles.card, { backgroundColor: styleContext.card?.backgroundColor || '#fff' }]}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardDate}>{item.sdate}</Text>
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
            {/* Fixed Search Header */}
             <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 5, zIndex: 1001 }}>
                 <View style={styles.searchContainer}>
                    <Icon name="magnify" size={24} color="#666" style={{ marginRight: 10 }} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search Student (Name, ID, Roll)"
                        placeholderTextColor="#999"
                        value={searchQuery}
                        onChangeText={handleSearch}
                    />
                    {searching && <ActivityIndicator size="small" color="#666" />}
                 </View>
             </View>

            <View style={{ flex: 1, position: 'relative' }}>
                <View style={{ padding: 16 }}>
                    
                    {/* Student Details Card */}
                    {student && (
                         <View style={[styles.studentCard, { backgroundColor: '#e8eaf6', borderColor: '#3f51b5' }]}>
                             <View>
                                <Text style={styles.studentName}>{student?.firstname} {student?.lastname}</Text>
                                <Text style={styles.studentInfo}>Class: {student?.clas} - {student?.section} | Roll: {student?.roll}</Text>
                                <Text style={styles.studentInfo}>{coreContext.schoolData?.smallReg || 'Reg No'}: {student?.scholarno} | {coreContext.schoolData?.smallEnr || 'Enr'}: {student?.enrollment}</Text>
                             </View>
                         </View>
                     )}

                    {/* Category Picker */}
                    <TouchableOpacity 
                        style={[styleContext.pickerButton, { marginBottom: 10 }]} 
                        onPress={() => setPickerVisible(true)}
                    >
                        <Text style={styleContext.pickerButtonText}>{category || 'Select Category'}</Text>
                        <Icon name="chevron-down" size={24} color={styleContext.blackColor} />
                    </TouchableOpacity>

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

                    {/* Get Reports Button */}
                    <TouchableOpacity 
                        style={[styleContext.button, { marginBottom: 10 }]} 
                        onPress={fetchReports}
                        disabled={loading}
                    >
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styleContext.buttonText}>View Reports</Text>}
                    </TouchableOpacity>

                </View>

                {/* Reports List */}
                <FlatList
                    data={reports}
                    renderItem={renderReportItem}
                    keyExtractor={(item) => item.id ? item.id.toString() : Math.random().toString()}
                    contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
                    ListEmptyComponent={
                        !loading && reports.length === 0 && student ? 
                        <Text style={{ textAlign: 'center', marginTop: 20, color: '#888' }}>
                            No reports found for this criteria.
                        </Text> : null
                    }
                />

                {/* Search Results Overlay matches absolute position relative to this container */}
                 {showResults && searchResults.length > 0 && (
                     <View style={styles.resultsList}>
                         <FlatList
                             data={searchResults}
                             keyExtractor={(item, index) => (item.id || index).toString()}
                             renderItem={({ item }) => (
                                 <TouchableOpacity 
                                     style={styles.resultItem} 
                                     onPress={() => handleSelectStudent(item)}
                                 >
                                     <Text style={styles.resultName}>{item.firstname} {item.lastname}</Text>
                                     <Text style={styles.resultInfo}>{item.clas} {item.section} | Roll: {item.roll} | {coreContext.schoolData?.smallEnr || 'ID'}: {item.enrollment}</Text>
                                 </TouchableOpacity>
                             )}
                             style={{ maxHeight: 200 }}
                         />
                     </View>
                 )}
            </View>

            <CustomPickerModal
                visible={pickerVisible}
                title="Select Category"
                data={categories}
                selectedValue={category}
                onSelect={setCategory}
                onConfirm={() => setPickerVisible(false)}
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
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 10,
        paddingHorizontal: 15,
        height: 50,
        borderWidth: 1,
        borderColor: '#ddd',
        marginBottom: 0, 
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#333'
    },
    resultsList: {
        position: 'absolute',
        top: 0, 
        left: 15,
        right: 15,
        backgroundColor: '#fff',
        borderRadius: 10,
        zIndex: 2000,
        borderWidth: 1,
        borderColor: '#ddd',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 5,
    },
    resultItem: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee'
    },
    resultName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333'
    },
    resultInfo: {
        fontSize: 12,
        color: '#666'
    },
    studentCard: {
        padding: 15,
        borderRadius: 8,
        borderLeftWidth: 5,
        marginBottom: 20, 
        marginTop: 5
    },
    studentName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4
    },
    studentInfo: {
        fontSize: 14,
        color: '#555'
    },
    card: {
        borderRadius: 8,
        padding: 15,
        marginBottom: 10,
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

