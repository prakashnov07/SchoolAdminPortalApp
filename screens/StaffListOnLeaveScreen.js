import React, { useState, useEffect, useContext } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; // Import SafeAreaView
import { CoreContext } from '../context/CoreContext';
import { StyleContext } from '../context/StyleContext';
import axios from 'axios';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

export default function StaffListOnLeaveScreen({ route, navigation }) {
    const { date } = route.params;
    const coreContext = useContext(CoreContext);
    const styleContext = useContext(StyleContext);
    const { branchid, phone } = coreContext;

    const [report, setReport] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReport();
    }, []);

    const fetchReport = () => {
        setLoading(true);
        axios.get('employee-on-leave', { 
            params: { 
                branchid, 
                owner: phone, 
                reportdate: date 
            } 
        }).then(response => {
            setLoading(false);
            if (response.data && response.data.employees) {
                setReport(response.data.employees);
            } else {
                setReport([]);
            }
        }).catch(err => {
            setLoading(false);
            console.error(err);
        });
    };

    const StaffListOnLeaveItem = ({ item, index }) => {
        // Matches legacy display logic
        const empId = item.empid || item.emp_id;

        return (
            <View style={[styleContext.card, { marginBottom: 10, padding: 15 }]}>
                 <Text style={{ fontSize: 16, fontWeight: 'bold', color: styleContext.titleColor, marginBottom: 5 }}>
                    {empId}
                </Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 15, color: '#333' }}>
                        {item.name}
                    </Text>
                    <Text style={{ fontSize: 14, color: '#666', fontWeight: 'bold' }}>
                        {item.leave_type}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styleContext.background} edges={['bottom', 'left', 'right']}>
             <View style={{ padding: 15, backgroundColor: styleContext.glassEffect?.backgroundColor || '#fff', borderBottomWidth: 1, borderBottomColor: '#eee', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: styleContext.titleColor }}>{date}</Text>
                {loading && <ActivityIndicator size="small" color={styleContext.primaryColor} />}
            </View>

            <FlatList
                data={report}
                keyExtractor={(item, index) => (item.id || index).toString()}
                renderItem={({ item, index }) => <StaffListOnLeaveItem item={item} index={index} />}
                contentContainerStyle={{ padding: 16 }}
                ListEmptyComponent={
                    !loading ? (
                        <View style={{ alignItems: 'center', marginTop: 50, padding: 20 }}>
                            <Icon name="account-off-outline" size={60} color="#ccc" />
                            <Text style={{ textAlign: 'center', marginTop: 10, color: '#888', fontSize: 16 }}>
                                No employees on leave
                            </Text>
                        </View>
                    ) : null
                }
            />
        </SafeAreaView>
    );
}
