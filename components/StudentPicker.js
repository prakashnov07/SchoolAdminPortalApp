import React, { useState, useContext, useRef } from 'react';
import { View, TextInput, FlatList, TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import axios from 'axios';
import { CoreContext } from '../context/CoreContext';

export default function StudentPicker({ onSelect, selectedStudent, placeholder }) {
    const coreContext = useContext(CoreContext);
    const [searchQuery, setSearchQuery] = useState(selectedStudent || '');
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const timerRef = useRef(null);

    const placeholderText = placeholder || "By (Name, " + coreContext.schoolData?.smallEnr + ", " + coreContext.schoolData?.smallReg + ", Contact No)";

    const handleTextChange = (text) => {
        setSearchQuery(text);
        
        // Clear existing timer
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }

        if (text.length > 0) {
            // Set new timer for debounce (e.g. 800ms)
            timerRef.current = setTimeout(() => {
                executeSearch(text);
            }, 800);
        } else {
            setSearchResults([]);
            setShowResults(false);
        }
    };

    const executeSearch = (searchTerm) => {
        // Use provided term or fallback to state (handle button click case)
        const text = typeof searchTerm === 'string' ? searchTerm : searchQuery;
        
        if (!text) return; 
        
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
    };

    const handleSelect = (student) => {
        const name = student.name || `${student.firstname} ${student.lastname}`;
        setSearchQuery(name);
        setShowResults(false);
        if (onSelect) {
            onSelect(student);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.searchContainer}>
                <TouchableOpacity onPress={executeSearch}>
                    <Icon name="account-search" size={24} color="#666" style={{ marginRight: 10 }} />
                </TouchableOpacity>
                <TextInput
                    style={[styles.searchInput, { fontSize: searchQuery ? 16 : 11 }]}
                    placeholder={placeholderText}
                    placeholderTextColor="#999"
                    value={searchQuery}
                    onChangeText={handleTextChange}
                    onSubmitEditing={executeSearch}
                />
                {searching && <ActivityIndicator size="small" color="#666" />}
            </View>

            {showResults && searchResults.length > 0 && (
                <View style={styles.resultsList}>
                    <FlatList
                        data={searchResults}
                        keyExtractor={item => item.enrollment.toString()}
                        renderItem={({ item }) => (
                            <TouchableOpacity 
                                style={styles.resultItem} 
                                onPress={() => handleSelect(item)}
                            >
                                <Text style={styles.resultName}>{item.firstname} {item.lastname}</Text>
                                <Text style={styles.resultInfo}>{item.clas} {item.section} | Roll: {item.roll} | {coreContext.schoolData?.smallEnr}: {item.enrollment} | {coreContext.schoolData?.smallReg}: {item.scholarno}</Text>
                            </TouchableOpacity>
                        )}
                        scrollEnabled={false} 
                        keyboardShouldPersistTaps="handled"
                    />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        zIndex: 1000,
        marginBottom: 10
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
        backgroundColor: '#fff',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#ddd',
        marginTop: 5,
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
    }
});
