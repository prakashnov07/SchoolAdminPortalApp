import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker'; // Ensure this is installed or use CustomPickerModal
import { CoreContext } from '../context/CoreContext';
import { StyleContext } from '../context/StyleContext';
import axios from 'axios';
import LeavePlannerItem from '../components/LeavePlannerItem';
import CustomPickerModal from '../components/CustomPickerModal'; // Using CustomPickerModal for consistency if preferred

export default function LeavePlannerScreen({ navigation }) {
    const coreContext = useContext(CoreContext);
    const styleContext = useContext(StyleContext);
    const { branchid, phone, schoolData } = coreContext;

    const [months] = useState([
        { id: 1, name: 'April' },
        { id: 2, name: 'May' },
        { id: 3, name: 'June' },
        { id: 4, name: 'July' },
        { id: 5, name: 'August' },
        { id: 6, name: 'September' },
        { id: 7, name: 'October' },
        { id: 8, name: 'November' },
        { id: 9, name: 'December' },
        { id: 10, name: 'January' },
        { id: 11, name: 'February' },
        { id: 12, name: 'March' },
    ]);

    const [selectedMonth, setSelectedMonth] = useState(schoolData.cmo || (new Date().getMonth() + 1)); // Default to current month or cmo
    const [report, setReport] = useState([]);
    const [loading, setLoading] = useState(false);
    const [monthPickerVisible, setMonthPickerVisible] = useState(false);

    useEffect(() => {
        getReport(selectedMonth);
    }, []);

    const getReport = (month) => {
        setLoading(true);
        axios.get('leave-planner', { 
            params: { 
                branchid, 
                owner: phone, 
                month 
            } 
        }).then(response => {
            setLoading(false);
            if (response.data && response.data.data) {
                setReport(response.data.data);
            } else {
                setReport([]);
            }
        }).catch(err => {
            setLoading(false);
            console.error(err);
        });
    };

    const onMonthChange = (val) => {
        setSelectedMonth(val);
        setMonthPickerVisible(false);
        getReport(val);
    };

    const monthOptions = months.map(m => ({ label: m.name, value: m.id }));

    return (
        <SafeAreaView style={styleContext.background} edges={['bottom', 'left', 'right']}>
             <View style={{ padding: 15, backgroundColor: styleContext.glassEffect?.backgroundColor || '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' }}>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: styleContext.titleColor, marginBottom: 15 }}>Leave Planner</Text>
                
                <CustomPickerModal
                    visible={monthPickerVisible}
                    title="Select Month"
                    data={monthOptions}
                    selectedValue={selectedMonth}
                    onSelect={onMonthChange}
                    onClose={() => setMonthPickerVisible(false)}
                />

                <View style={{ backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#ddd', overflow: 'hidden' }}>
                    <Text 
                        style={{ padding: 12, color: '#333' }}
                        onPress={() => setMonthPickerVisible(true)}
                    >
                        {months.find(m => m.id === selectedMonth)?.name || 'Select Month'}
                    </Text>
                </View>
            </View>

            {loading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={styleContext.primaryColor} />
                </View>
            ) : (
                <FlatList
                    data={report}
                    keyExtractor={(item) => item.d.toString()}
                    renderItem={({ item, index }) => <LeavePlannerItem item={item} />}
                    contentContainerStyle={{ padding: 16 }}
                    ListHeaderComponent={
                        <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10, color: '#555' }}>
                            Approved Leave Count Report
                        </Text>
                    }
                    ListEmptyComponent={
                        <View style={{ alignItems: 'center', marginTop: 50, padding: 20 }}>
                            <Text style={{ textAlign: 'center', marginTop: 10, color: '#888', fontSize: 16 }}>No data to show ..</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}
