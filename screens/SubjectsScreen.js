import React, { useState, useContext, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Alert, ActivityIndicator, Image, Linking, TextInput, Platform, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import axios from 'axios';
import Toast from 'react-native-toast-message';

import { CoreContext } from '../context/CoreContext';
import { StyleContext } from '../context/StyleContext';

const SubjectItem = ({ item, onDelete, styleContext }) => (
    <View style={styleContext.card}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: styleContext.titleColor, flex: 1 }}>{item.name}</Text>
            
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

export default function SubjectsScreen({ navigation }) {
    const coreContext = useContext(CoreContext);
    const styleContext = useContext(StyleContext);
    const { branchid } = coreContext;

    const [newSubject, setNewSubject] = useState('');
    const [adding, setAdding] = useState(false);
    const [loading, setLoading] = useState(false);
    const [subjects, setSubjects] = useState([]);

    useEffect(() => {
        fetchSubjects();
    }, []);

    const fetchSubjects = () => {
        //  console.log("Fetching subjects with branchid:", branchid);
        setLoading(true);
        axios.get('/getsubjects', { params: { branchid } })
            .then(response => {
                // console.log("Subjects API Response:", response.data);
                const data = response.data.subjects || [];
                setSubjects(data);
                if (coreContext.updateSubjects) {
                     coreContext.updateSubjects(data);
                }
            })
            .catch(error => {
                console.error(error);
                Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to fetch subjects' });
            })
            .finally(() => setLoading(false));
    };

    const handleAddSubject = () => {
        if (!newSubject.trim()) {
            return Toast.show({ type: 'error', text1: 'Error', text2: 'Please enter a subject name' });
        }

        setAdding(true);
        axios.post('/addsubject', { subject: newSubject, owner: coreContext.phone, branchid })
            .then(() => {
                Toast.show({ type: 'success', text1: 'Success', text2: 'Subject added' });
                setNewSubject('');
                Keyboard.dismiss();
                fetchSubjects();
            })
            .catch(error => {
                console.error(error);
                Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to add subject' });
            })
            .finally(() => setAdding(false));
    };

    const handleDelete = (id) => {
        Alert.alert(
            "Delete Subject",
            "Are you sure you want to delete this subject?",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: () => processDelete(id) }
            ]
        );
    };

    const processDelete = (id) => {
        console.log("Attempting to delete subject with ID:", id);
        if (!id) return;

        // Optimistic Update
        const previousSubjects = [...subjects];
        setSubjects(subjects.filter(s => s.id !== id));

        axios.post('/deletesubject', { id, owner: coreContext.phone, branchid })
            .then(response => {
                console.log("Delete Response:", response);
                Toast.show({ type: 'success', text1: 'Success', text2: 'Subject deleted' });
                // Small delay to ensure server consistency
                setTimeout(fetchSubjects, 1000);
            })
            .catch(error => {
                console.error("Delete Error:", error);
                // Revert on error
                setSubjects(previousSubjects);
                Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to delete subject' });
            });
    };

    return (
        <SafeAreaView style={styleContext.background} edges={['bottom', 'left', 'right']}>
            <View style={{ padding: 16 }}>
                
                {/* Add Subject Input */}
                <View style={{ marginBottom: 20 }}>
                     <View style={[styleContext.pickerButton, { paddingVertical: Platform.OS === 'ios' ? 12 : 0, flexDirection: 'row', alignItems: 'center' }]}>
                        <TextInput 
                            placeholder="Enter new subject name..."
                            placeholderTextColor="#999"
                            style={{ flex: 1, color: '#333', fontSize: 16 }}
                            value={newSubject}
                            onChangeText={setNewSubject}
                        />
                         <Icon name="book-plus" size={24} color={styleContext.blackColor} />
                    </View>

                    <TouchableOpacity 
                        style={[styleContext.button, { marginTop: 10 }]} 
                        onPress={handleAddSubject}
                        disabled={adding}
                    >
                        {adding ? <ActivityIndicator color="#fff" /> : <Text style={styleContext.buttonText}>Add Subject</Text>}
                    </TouchableOpacity>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                    <Icon name="format-list-bulleted" size={24} color={styleContext.titleColor} style={{ marginRight: 8 }} />
                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: styleContext.titleColor }}>Subject List</Text>
                </View>

            </View>

            {/* Subject List */}
            <FlatList
                data={subjects}
                renderItem={({ item }) => <SubjectItem item={item} onDelete={handleDelete} styleContext={styleContext} />}
                keyExtractor={(item) => item.id ? item.id.toString() : Math.random().toString()}
                contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
                refreshing={loading}
                onRefresh={fetchSubjects}
                ListEmptyComponent={
                    !loading ? 
                    <Text style={{ textAlign: 'center', marginTop: 30, color: '#888' }}>
                        No subjects found. Add one above.
                    </Text> : null
                }
            />

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({});
