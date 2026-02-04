import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import axios from 'axios';
import Toast from 'react-native-toast-message';

import { CoreContext } from '../context/CoreContext';
import { StyleContext } from '../context/StyleContext';
import CustomPickerModal from '../components/CustomPickerModal';
import ReportMenuModal from '../components/ReportMenuModal';

export default function DisciplineProfileScreen({ navigation, route }) {
    const coreContext = useContext(CoreContext);
    const styleContext = useContext(StyleContext);

    // Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);

    useEffect(() => {
        if (route && route.params && route.params?.student) {
            handleSelectStudent(route.params.student);
        }
    }, [route]);

    // State
    const [student, setStudent] = useState(null);
    
    // Upload State
    const [selectedRule, setSelectedRule] = useState('');
    const [comment, setComment] = useState('');
    const [uploading, setUploading] = useState(false);
    
    // History State
    const [history, setHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    // Data
    const [rules, setRules] = useState([]);

    // UI
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
            fetchDisciplineIncidences();
        }
    }, [coreContext.branchid]);

    const fetchDisciplineIncidences = async () => {
        try {
             const response = await axios.get('/discipline-incidences', { 
                params: { branchid: coreContext.branchid, owner: coreContext.phone, action: 'reporting' } 
            });
            if (response.data && response.data.rules) {
                setRules(response.data.rules.map(r => ({ label: r.name, value: r.id })));
            }
        } catch (error) {
             console.error('Error fetching discipline rules:', error);
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
        setHistory([]); // reset history
        fetchHistory(selected.enrollment);
    };

    const fetchHistory = async (enrollment) => {
        if (!enrollment) return;
        setLoadingHistory(true);
        try {
             const response = await axios.get('/discipline-remarks', { 
                params: { regno: enrollment, branchid: coreContext.branchid } 
            });
            if (response.data && response.data.remarks) {
                setHistory(response.data.remarks);
            }
        } catch (error) {
             console.error('Error fetching discipline history:', error);
        } finally {
            setLoadingHistory(false);
        }
    };


    const handleUpload = async () => {
        if (!student) {
            return Toast.show({ type: 'error', text1: 'Error', text2: 'Please search for a student first' });
        }
        if (!selectedRule) {
            return Toast.show({ type: 'error', text1: 'Error', text2: 'Please select an incidence' });
        }
        
        setUploading(true);
        try {
             await axios.post('/mark-discipline', { 
                regno: student?.enrollment, // Use enrollment as per legacy code logic (regno param in post)
                comment, 
                rule: selectedRule, 
                branchid: coreContext.branchid, 
                owner: coreContext.phone 
            });
            
            Toast.show({ type: 'success', text1: 'Success', text2: 'Report updated successfully' });
            
            // Reset Input
            setComment('');
            setSelectedRule('');
            // Refresh history
            if (student?.enrollment) {
                fetchHistory(student.enrollment);
            }

        } catch (error) {
            console.error('Error uploading report:', error);
            Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to upload report' });
        } finally {
            setUploading(false);
        }
    };

    // Picker Logic
    const openPicker = (title, data, selected, onSelect) => {
        setPickerConfig({ title, data, selected, onSelect });
        setPickerVisible(true);
    };
    
    const handlePickerSelect = (val) => {
        setPickerConfig(prev => ({...prev, selected: val}));
    };

    const handlePickerConfirm = () => {
        if(pickerConfig.onSelect) pickerConfig.onSelect(pickerConfig.selected);
        setPickerVisible(false);
    };

    const renderHistoryItem = ({ item }) => {
        // Fallback for various backend field names
        const ruleId = item.ruleid || item.rule || item.rule_id;
        // Loose equality to handle string/number mismatch
        const ruleLabel = item.name;

        return (
            <View style={styles.historyCard}>
                <View style={styles.historyHeader}>
                    <Text style={styles.historyDate}>{item.date}</Text>
                    <Text style={styles.historyOwner}>By: {item.rby}</Text>
                </View>
                <Text style={styles.historyRule}>Incidence: {ruleLabel || 'N/A'}</Text>
                <Text style={styles.historyComment}>{item.remarks}</Text> 
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
                 <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 10 }}>
                     
                     {/* Student Details Card */}
                     {student && (
                         <View style={[styles.studentCard, { backgroundColor: '#e8eaf6', borderColor: '#3f51b5' }]}>
                             <View>
                                <Text style={styles.studentName}>{student?.firstname} {student?.lastname}</Text>
                                <Text style={styles.studentInfo}>Class: {student?.clas} - {student?.section} | Roll: {student?.roll}</Text>
                                <Text style={styles.studentInfo}>{coreContext.schoolData?.smallReg || 'Reg No'}: {student?.scholarno} | {coreContext.schoolData?.smallEnr || 'Enr'}: {student?.enrollment}</Text>
                             </View>
                             {/* DP Status link mimicking legacy if needed, or simple indicator */}
                             {student?.dp && (
                                  <Text style={{ color: 'red', fontWeight: 'bold', marginTop: 5 }}>Discipline Profile Issues: {student?.dp}</Text>
                             )}
                         </View>
                     )}

                     {/* Upload Section */}
                     {student && (
                         <View style={styles.sectionContainer}>
                             <Text style={[styles.sectionTitle, { color: styleContext.titleColor }]}>Add Report</Text>
                             
                             <TouchableOpacity 
                                style={[styleContext.pickerButton, { marginBottom: 10 }]} 
                                onPress={() => openPicker('Select Incidence', rules, selectedRule, setSelectedRule)}
                            >
                                <Text style={styleContext.pickerButtonText}>{selectedRule ? rules.find(r => r.value === selectedRule)?.label : 'Select Incidence'}</Text>
                                <Icon name="chevron-down" size={24} color={styleContext.blackColor} />
                            </TouchableOpacity>

                            <View style={[styles.textInputWrapper]}>
                                <TextInput 
                                    placeholder="Enter Comment"
                                    placeholderTextColor="#999"
                                    value={comment}
                                    onChangeText={setComment}
                                    style={[styles.textInput, { height: 80, textAlignVertical: 'top' }]}
                                    multiline
                                    numberOfLines={4}
                                />
                            </View>

                            <TouchableOpacity 
                                style={[styleContext.button, { marginTop: 10, backgroundColor: '#d32f2f' }]} 
                                onPress={handleUpload}
                                disabled={uploading}
                            >
                                {uploading ? <ActivityIndicator color="#fff" /> : <Text style={styleContext.buttonText}>Upload Discipline Report</Text>}
                            </TouchableOpacity>
                         </View>
                     )}

                     {/* History Section */}
                     {student && (
                         <View style={styles.sectionContainer}>
                             <Text style={[styles.sectionTitle, { color: styleContext.titleColor, marginTop: 10 }]}>Discipline History</Text>
                             {loadingHistory ? (
                                 <ActivityIndicator size="small" color="#5a45d4" style={{ marginTop: 10 }} />
                             ) : history.length === 0 ? (
                                 <Text style={{ color: '#888', fontStyle: 'italic', marginTop: 5 }}>No discipline records found.</Text>
                             ) : (
                                 history.map((item, index) => {
                                     // console.log('History Item:', item); 
                                     return <View key={index} style={{ marginBottom: 10 }}>{renderHistoryItem({item})}</View>
                                 })
                             )}
                         </View>
                     )}

                 </ScrollView>

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
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 10,
        paddingHorizontal: 15,
        height: 50,
        borderWidth: 1,
        borderColor: '#ddd',
        marginBottom: 0, // Removed bottom margin as padding handles it
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
        top: 0, // Top of the flex container (just below fixed header)
        left: 15,
        right: 15,
        backgroundColor: '#fff',
        borderRadius: 10,
        // maxHeight handled in FlatList style or here
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
        marginBottom: 20, // push content down
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
    sectionContainer: {
        marginBottom: 20
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10
    },
    textInputWrapper: {
        backgroundColor: '#fff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        paddingHorizontal: 10,
        marginVertical: 5
    },
    textInput: {
        paddingVertical: 10,
        fontSize: 16,
        color: '#333'
    },
    historyCard: {
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#d32f2f',
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1
    },
    historyHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5
    },
    historyDate: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#d32f2f'
    },
    historyOwner: {
        fontSize: 12,
        color: '#888'
    },
    historyRule: {
        fontSize: 14, 
        fontWeight: 'bold', 
        color: '#333',
        marginBottom: 2
    },
    historyComment: {
        fontSize: 14,
        color: '#555'
    }
});
