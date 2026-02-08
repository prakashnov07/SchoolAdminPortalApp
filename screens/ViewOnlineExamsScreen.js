import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { CoreContext } from '../context/CoreContext';
import { StyleContext } from '../context/StyleContext';
import { useIsFocused } from '@react-navigation/native';
import OnlineExamMenu from '../components/OnlineExamMenu';

const ViewOnlineExamsScreen = ({ navigation }) => {
    const { branchid, phone, role } = useContext(CoreContext);
    const { primary, background, textColor } = useContext(StyleContext);
    const isFocused = useIsFocused();
    const [menuVisible, setMenuVisible] = useState(false);

    useEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <TouchableOpacity onPress={() => setMenuVisible(true)} style={{ marginRight: 15 }}>
                     <Icon name="dots-vertical" size={26} color="#fff" />
                </TouchableOpacity>
            ),
        });
    }, [navigation, textColor]);

    const [exams, setExams] = useState([]);
    const [examDefinitions, setExamDefinitions] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isFocused) {
            fetchExams();
        }
    }, [isFocused]);

    const fetchExams = async () => {
        setLoading(true);
        try {
            const [examsRes, defsRes] = await Promise.all([
                axios.get('online-exams-staff', { 
                    params: { branchid, role, owner: phone } 
                }),
                axios.get('/getallexams', { params: { branchid } })
            ]);

            setExams(examsRes.data.papers || []);
            
            // Create a map of valid exam definitions
            const defsMap = {};
            (defsRes.data.rows || []).forEach(def => {
                defsMap[def.id] = def.examname;
            });
            setExamDefinitions(defsMap);

        } catch (error) {
            console.error(error);
            Toast.show({ type: 'error', text1: 'Failed to fetch exams' });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (id) => {
        Alert.alert(
            "Delete Exam",
            "Are you sure you want to delete this exam permanently?",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Delete", 
                    style: "destructive", 
                    onPress: async () => {
                        try {
                            // endpoint from legacy: /delete-online-exam-paper
                            await axios.post('delete-online-exam-paper', { id, owner: phone, branchid });
                            Toast.show({ type: 'success', text1: 'Exam deleted successfully' });
                            fetchExams();
                        } catch (error) {
                            console.error(error);
                            Toast.show({ type: 'error', text1: 'Failed to delete exam' });
                        }
                    }
                }
            ]
        );
    };

    const handleEdit = (item) => {
        navigation.navigate('CreateOnlineExamScreen', { examData: item });
    };

    const handleQuestions = (item) => {
        navigation.navigate('ViewOnlineExamQuestionsScreen', { examId: item.id, examData: item });
    };

    const formatTime = (dateStamp) => {
        if (!dateStamp) return '';
        const d = new Date(dateStamp);
        let hours = d.getHours();
        let minutes = d.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        minutes = minutes < 10 ? '0' + minutes : minutes;
        return `${hours}:${minutes} ${ampm}`;
    };

    const formatDate = (dateStamp) => {
        if (!dateStamp) return '';
        const d = new Date(dateStamp);
        let month = d.getMonth() + 1;
        let day = d.getDate();
        if (month < 10) month = '0' + month;
        if (day < 10) day = '0' + day;
        return `${day}-${month}-${d.getFullYear()}`;
    };

    const renderItem = ({ item }) => (
        <View style={styles.itemCard}>
            <View style={styles.itemHeader}>
                <Text style={styles.itemTitle}>{item.subject || 'Online Exam'}</Text>
                <Text style={[styles.itemStatus, { color: item.qstatus === 'active' ? 'green' : 'red' }]}>
                    {item.qstatus === 'active' ? 'Active' : 'Inactive'}
                </Text>
            </View>
            
            <Text style={styles.itemDetail}>
                Date: {formatDate(item.dateStamp) || item.date} | Time: {formatTime(item.dateStamp) || item.examtime || ''}
            </Text>
            <Text style={styles.itemDetail}>Class: {item.cls} | Exam: {examDefinitions[item.examid] || item.exam || item.examid}</Text>
            <Text style={styles.itemDetail}>Max Marks: {item.max_marks} | Duration: {item.duration} mins</Text>

            <View style={styles.actionButtons}>
                <TouchableOpacity style={[styles.actionBtn, styles.editBtn]} onPress={() => handleEdit(item)}>
                    <Text style={styles.actionBtnText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: primary?.backgroundColor || '#6200ee' }]} onPress={() => handleQuestions(item)}>
                    <Text style={styles.actionBtnText}>Questions</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={() => handleDelete(item.id)}>
                    <Text style={styles.actionBtnText}>Delete</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: background?.backgroundColor || '#f5f5f5' }]}>
            {loading ? (
                <ActivityIndicator size="large" color={primary?.backgroundColor} style={{ marginTop: 20 }} />
            ) : (
                <FlatList
                    data={exams}
                    renderItem={renderItem}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No exams scheduled.</Text>
                        </View>
                    }
                />
            )}

            <TouchableOpacity
                style={[styles.fab, { backgroundColor: primary?.backgroundColor || '#6200ee' }]}
                onPress={() => navigation.navigate('CreateOnlineExamScreen')}
            >
                <Icon name="plus" size={30} color="#fff" />
            </TouchableOpacity>

            <OnlineExamMenu visible={menuVisible} onClose={() => setMenuVisible(false)} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    listContent: {
        padding: 15,
        paddingBottom: 80, // Space for FAB
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
        marginBottom: 10,
    },
    itemTitle: {
        fontWeight: 'bold',
        fontSize: 16,
        color: '#444',
        flex: 1,
    },
    itemStatus: {
        fontWeight: 'bold',
        fontSize: 14,
        textTransform: 'capitalize',
    },
    itemDetail: {
        fontSize: 14,
        color: '#666',
        marginBottom: 5,
    },
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 10,
    },
    actionBtn: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 5,
        marginLeft: 8,
    },
    editBtn: {
        backgroundColor: '#f0ad4e',
    },
    deleteBtn: {
        backgroundColor: '#d9534f',
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
    },
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 20,
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
    }
});

export default ViewOnlineExamsScreen;
