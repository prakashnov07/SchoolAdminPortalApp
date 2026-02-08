import React, { useState, useEffect, useContext, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, Image } from 'react-native';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { CoreContext } from '../context/CoreContext';
import { StyleContext } from '../context/StyleContext';
import { useFocusEffect } from '@react-navigation/native';

const ViewOnlineExamQuestionsScreen = ({ navigation, route }) => {
    const { examId, examData } = route.params;
    const { branchid, phone, appUrl, role } = useContext(CoreContext);
    const { primary, background, textColor } = useContext(StyleContext);

    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(false);

    useFocusEffect(
        useCallback(() => {
            fetchQuestions();
        }, [examId])
    );

    const fetchQuestions = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/online-exam-questions', { 
                params: { 
                    branchid, 
                    role, 
                    owner: phone,
                    qpid: examId 
                } 
            });
            setQuestions(response.data.questions || []);
        } catch (error) {
            console.error(error);
            Toast.show({ type: 'error', text1: 'Failed to fetch questions' });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (id) => {
        Alert.alert(
            "Delete Question",
            "Are you sure you want to delete this question?",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Delete", 
                    style: "destructive", 
                    onPress: async () => {
                        try {
                            await axios.post('/delete-online-exam-question', { 
                                id, 
                                qpid: examId,
                                owner: phone, 
                                branchid 
                            });
                            Toast.show({ type: 'success', text1: 'Question deleted successfully' });
                            fetchQuestions();
                        } catch (error) {
                            console.error(error);
                            Toast.show({ type: 'error', text1: 'Failed to delete question' });
                        }
                    }
                }
            ]
        );
    };

    const handleAddQuestion = () => {
        navigation.navigate('AddOnlineExamQuestionScreen', { examId, examData });
    };

    const handleEditQuestion = (item) => {
         navigation.navigate('AddOnlineExamQuestionScreen', { examId, examData, questionData: item });
    };

    const renderItem = ({ item, index }) => (
        <View style={styles.itemCard}>
            <View style={styles.headerRow}>
                <Text style={styles.qIndex}>Q{index + 1}.</Text>
                <View style={styles.actionRow}>
                   <TouchableOpacity onPress={() => handleEditQuestion(item)} style={styles.iconBtn}>
                        <Icon name="pencil" size={20} color="#f0ad4e" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.iconBtn}>
                        <Icon name="delete" size={20} color="#d9534f" />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.qContent}>
                {(item.question || item.qp) ? <Text style={styles.qText}>{item.question || item.qp}</Text> : null}
                {(item.qimage || item.qimg) ? (
                    <Image 
                        source={{ uri: `${appUrl}/${(item.qimage || item.qimg).split('||')[0]}` }} 
                        style={[
                            styles.qImage, 
                            (item.qimage || item.qimg).split('||')[1] ? { aspectRatio: (item.qimage || item.qimg).split('||')[1] / (item.qimage || item.qimg).split('||')[2] } : {}
                        ]} 
                        resizeMode="contain" 
                    />
                ) : null}
            </View>

            <View style={styles.metaRow}>
                <Text style={styles.metaText}>Marks: {item.marks}</Text>
                <Text style={styles.metaText}>Type: {item.etype || 'Objective'}</Text>
            </View>

            {item.etype === 'Objective' && (
                <View style={styles.optionsContainer}>
                   {item.option1 ? (
                       <View>
                           <Text style={item.correct === 'A' ? styles.correctOption : styles.optionText}>A. {item.option1}</Text>
                           {(item.oimage1 || item.oimg1) && <Image source={{ uri: `${appUrl}/${(item.oimage1 || item.oimg1).split('||')[0]}` }} style={[styles.qImage, {height: 100}]} resizeMode="contain" />}
                       </View>
                   ) : null}
                   {item.option2 ? (
                       <View>
                           <Text style={item.correct === 'B' ? styles.correctOption : styles.optionText}>B. {item.option2}</Text>
                           {(item.oimage2 || item.oimg2) && <Image source={{ uri: `${appUrl}/${(item.oimage2 || item.oimg2).split('||')[0]}` }} style={[styles.qImage, {height: 100}]} resizeMode="contain" />}
                       </View>
                   ) : null}
                   {item.option3 ? (
                       <View>
                           <Text style={item.correct === 'C' ? styles.correctOption : styles.optionText}>C. {item.option3}</Text>
                           {(item.oimage3 || item.oimg3) && <Image source={{ uri: `${appUrl}/${(item.oimage3 || item.oimg3).split('||')[0]}` }} style={[styles.qImage, {height: 100}]} resizeMode="contain" />}
                       </View>
                   ) : null}
                   {item.option4 ? (
                       <View>
                           <Text style={item.correct === 'D' ? styles.correctOption : styles.optionText}>D. {item.option4}</Text>
                           {(item.oimage4 || item.oimg4) && <Image source={{ uri: `${appUrl}/${(item.oimage4 || item.oimg4).split('||')[0]}` }} style={[styles.qImage, {height: 100}]} resizeMode="contain" />}
                       </View>
                   ) : null}
                   {item.option5 ? (
                       <View>
                           <Text style={item.correct === 'E' ? styles.correctOption : styles.optionText}>E. {item.option5}</Text>
                           {(item.oimage5 || item.oimg5) && <Image source={{ uri: `${appUrl}/${(item.oimage5 || item.oimg5).split('||')[0]}` }} style={[styles.qImage, {height: 100}]} resizeMode="contain" />}
                       </View>
                   ) : null}
                </View>
            )}
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: background?.backgroundColor || '#f5f5f5' }]}>
            <View style={styles.examHeader}>
                <Text style={styles.examTitle}>{examData?.examname}</Text>
                <Text style={styles.examSubtitle}>{examData?.cls} | {examData?.subject}</Text>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color={primary?.backgroundColor} style={{ marginTop: 20 }} />
            ) : (
                <FlatList
                    data={questions}
                    renderItem={renderItem}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No questions added yet.</Text>
                        </View>
                    }
                />
            )}

            <TouchableOpacity
                style={[styles.fab, { backgroundColor: primary?.backgroundColor || '#6200ee' }]}
                onPress={handleAddQuestion}
            >
                <Icon name="plus" size={30} color="#fff" />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    examHeader: {
        padding: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    examTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    examSubtitle: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    listContent: {
        padding: 15,
        paddingBottom: 80,
    },
    itemCard: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 15,
        marginBottom: 15,
        elevation: 2,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    qIndex: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#444',
    },
    actionRow: {
        flexDirection: 'row',
    },
    iconBtn: {
        padding: 5,
        marginLeft: 10,
    },
    qContent: {
        marginBottom: 10,
    },
    qText: {
        fontSize: 16,
        color: '#333',
        marginBottom: 5,
    },
    qImage: {
        width: '100%',
        height: 150,
        backgroundColor: '#eee',
        borderRadius: 5,
    },
    metaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    metaText: {
        fontSize: 12,
        color: '#888',
        backgroundColor: '#f9f9f9',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    optionsContainer: {
        marginTop: 5,
        paddingTop: 5,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    optionText: {
        fontSize: 14,
        color: '#555',
        marginBottom: 2,
    },
    correctOption: {
        fontSize: 14,
        color: 'green',
        fontWeight: 'bold',
        marginBottom: 2,
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
    },
});

export default ViewOnlineExamQuestionsScreen;
