import React, { useState, useContext, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Alert, TextInput, ActivityIndicator, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import axios from 'axios';
import Toast from 'react-native-toast-message';

import { CoreContext } from '../context/CoreContext';
import { StyleContext } from '../context/StyleContext';

const CategoryItem = ({ item, onDelete, styleContext }) => (
    <View style={styleContext.card}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: styleContext.titleColor, flex: 1 }}>{item.name}</Text>
            
            {item.is_sys !== 'yes' ? (
                <TouchableOpacity 
                    style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffebee', padding: 8, borderRadius: 6 }}
                    onPress={() => onDelete(item.id)}
                >
                    <Icon name="trash-can-outline" size={20} color="#d32f2f" />
                    <Text style={{ color: '#d32f2f', fontWeight: 'bold', marginLeft: 4 }}>Delete</Text>
                </TouchableOpacity>
            ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#e0e0e0', padding: 8, borderRadius: 6 }}>
                    <Icon name="lock" size={20} color="#757575" />
                    <Text style={{ color: '#757575', fontWeight: 'bold', marginLeft: 4 }}>System</Text>
                </View>
            )}
        </View>
    </View>
);

export default function CategoriesScreen({ navigation }) {
    const coreContext = useContext(CoreContext);
    const styleContext = useContext(StyleContext);
    const { branchid } = coreContext;

    const [newCategory, setNewCategory] = useState('');
    const [adding, setAdding] = useState(false);
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = () => {
        setLoading(true);
        axios.get('/getcategories', { params: { branchid } })
            .then(response => {
                const data = response.data.categories || [];
                setCategories(data);
            })
            .catch(error => {
                console.error(error);
                Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to fetch categories' });
            })
            .finally(() => setLoading(false));
    };

    const handleAddCategory = () => {
        if (!newCategory.trim()) {
            return Toast.show({ type: 'error', text1: 'Error', text2: 'Please enter a category name' });
        }

        setAdding(true);
        axios.post('/addcategory', { category: newCategory, owner: coreContext.phone, branchid })
            .then(() => {
                Toast.show({ type: 'success', text1: 'Success', text2: 'Category added' });
                setNewCategory('');
                Keyboard.dismiss();
                fetchCategories();
            })
            .catch(error => {
                console.error(error);
                Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to add category' });
            })
            .finally(() => setAdding(false));
    };

    const handleDelete = (id) => {
        Alert.alert(
            "Delete Category",
            "Are you sure you want to delete this category?",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: () => processDelete(id) }
            ]
        );
    };

    const processDelete = (id) => {
        if (!id) return;

        // Optimistic Update
        const previousCategories = [...categories];
        setCategories(categories.filter(c => c.id !== id));

        axios.post('/deletecategory', { id, owner: coreContext.phone, branchid })
            .then(() => {
                Toast.show({ type: 'success', text1: 'Success', text2: 'Category deleted' });
                setTimeout(fetchCategories, 1000);
            })
            .catch(error => {
                console.error(error);
                setCategories(previousCategories);
                Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to delete category' });
            });
    };

    return (
        <SafeAreaView style={styleContext.background} edges={['bottom', 'left', 'right']}>
            <View style={{ padding: 16 }}>
                
                {/* Add Category Input */}
                <View style={{ marginBottom: 20 }}>
                     <View style={[styleContext.pickerButton, { flexDirection: 'row', alignItems: 'center' }]}>
                        <TextInput 
                            placeholder="Enter new category name..."
                            placeholderTextColor="#999"
                            style={{ flex: 1, color: '#333', fontSize: 16, paddingVertical: 8 }}
                            value={newCategory}
                            onChangeText={setNewCategory}
                        />
                         <Icon name="plus-box-outline" size={24} color={styleContext.blackColor} />
                    </View>

                    <TouchableOpacity 
                        style={[styleContext.button, { marginTop: 10 }]} 
                        onPress={handleAddCategory}
                        disabled={adding}
                    >
                        {adding ? <ActivityIndicator color="#fff" /> : <Text style={styleContext.buttonText}>Add Category</Text>}
                    </TouchableOpacity>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                    <Icon name="format-list-bulleted" size={24} color={styleContext.titleColor} style={{ marginRight: 8 }} />
                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: styleContext.titleColor }}>Category List</Text>
                </View>

            </View>

            {/* Category List */}
            <FlatList
                data={categories}
                renderItem={({ item }) => <CategoryItem item={item} onDelete={handleDelete} styleContext={styleContext} />}
                keyExtractor={(item) => item.id ? item.id.toString() : Math.random().toString()}
                contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
                refreshing={loading}
                onRefresh={fetchCategories}
                ListEmptyComponent={
                    !loading ? 
                    <Text style={{ textAlign: 'center', marginTop: 30, color: '#888' }}>
                        No categories found. Add one above.
                    </Text> : null
                }
            />

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({});
