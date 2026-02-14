
import React, { useState, useEffect, useContext, useLayoutEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput, StyleSheet, FlatList } from 'react-native';
import { Card, Icon, BottomSheet, ListItem } from 'react-native-elements';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import Toast from 'react-native-toast-message';

import { CoreContext } from '../context/CoreContext';
import { StyleContext } from '../context/StyleContext';
import StudentPicker from '../components/StudentPicker';
import CustomPickerModal from '../components/CustomPickerModal';

export default function AdminFeeReportScreen({ navigation, route }) {
    const coreContext = useContext(CoreContext);
    const styleContext = useContext(StyleContext);
    
    // Add menu state
    const [menuVisible, setMenuVisible] = useState(false);
    const { branchid, schooldata } = coreContext;

    const { enrollment } = route.params || {};

    const [regno, setRegno] = useState(enrollment);
    const [loading, setLoading] = useState(false);
    const [feeReport, setFeeReport] = useState(null);
    const [selectedMonth, setSelectedMonth] = useState(coreContext.cmo + '');
    const [monthLabel, setMonthLabel] = useState('Till Month');

    // Picker Modal State
    const [pickerVisible, setPickerVisible] = useState(false);
    const [pickerTitle, setPickerTitle] = useState('');
    const [pickerData, setPickerData] = useState([]);
    const [pickerValue, setPickerValue] = useState(coreContext.cmo + '');
    const [onPickerSelect, setOnPickerSelect] = useState(() => { });

    const months = [
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
    ];

    // Menu Navigation
    const goToFeeReport = () => {
        setMenuVisible(false);
        // Already here
    };
    const goToFeeReminder = () => {
        setMenuVisible(false);
        navigation.navigate('FeeReminderScreen');
    };
    const goToDefaulterList = () => {
        setMenuVisible(false);
         navigation.navigate('DefaulterListScreen');
    };
    const goToAdminPanel = () => {
        setMenuVisible(false);
        navigation.navigate('AdminPanel');
    };

    const menuList = [
        { title: 'Fee Report', onPress: goToFeeReport },
        { title: 'Fee Reminder', onPress: goToFeeReminder },
        { title: 'Defaulter List', onPress: goToDefaulterList },
        { title: 'Admin Panel', onPress: goToAdminPanel },
    ];

    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <TouchableOpacity onPress={() => setMenuVisible(true)} style={{ marginRight: 15 }}>
                     <MaterialIcons name="more-vert" size={28} color="#fff" />
                </TouchableOpacity>
            ),
        });
    }, [navigation]);

    useEffect(() => {
        if (coreContext.cmo) {
            const mId = parseInt(coreContext.cmo);
            const m = months.find(item => item.id === mId);
            if (m) {
                setMonthLabel(m.name);
                setSelectedMonth(m.id);
                setPickerValue(m.id);
                if (regno) {
                    fetchFeeReport();
                }
            }
        }
    }, [coreContext.cmo]);

    const fetchFeeReport = () => {
        if (!regno) {
            Alert.alert('Error', 'Please enter a Registration Number');
            return;
        }

        setLoading(true);
        axios.get('/getfeedetailstest', {
            params: {
                regno,
                feetillmonth: selectedMonth,
                branchid
            }
        })
            .then(response => {
                setLoading(false);
                setFeeReport(response.data);
                if (response.data && response.data.feePendingDets && response.data.feePendingDets.gtotal) {
                    Toast.show({ type: 'success', text1: 'Total Fee: Rs. ' + response.data.feePendingDets.gtotal });
                }
            })
            .catch(err => {
                console.log(err);
                setLoading(false);
                Toast.show({ type: 'error', text1: 'Failed to fetch fee report' });
            });
    };

    const openMonthPicker = () => {
        setPickerTitle('Select Till Month');
        const data = months.map(m => ({ label: m.name, value: m.id }));
        setPickerData(data);
        setPickerValue(selectedMonth);
        
        setOnPickerSelect(() => (val) => {
            setSelectedMonth(val);
            const selected = months.find(m => m.id === val);
            setMonthLabel(selected ? selected.name : 'Till Month');
            setPickerVisible(false);
        });
        
        setPickerVisible(true);
    };

    const renderPendingFeeItem = ({ item }) => {
        return (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, borderBottomWidth: 0.5, borderBottomColor: '#eee' }}>
                <Text style={{ width: '70%', color: '#333' }}>{item.feeheadname || item.item}</Text>
                <Text style={{ width: '30%', textAlign: 'right', color: '#333' }}>{item.amount || item.value}</Text>
            </View>
        );
    };

    const renderPaidFeeItem = ({ item }) => (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, borderBottomWidth: 0.5, borderBottomColor: '#eee' }}>
            <Text style={{ width: '70%', color: '#333' }}>{item.feeheadname}</Text>
            <Text style={{ width: '30%', textAlign: 'right', color: '#333' }}>{item.amount}</Text>
        </View>
    );

    return (
        <SafeAreaView style={[styleContext.background, { flex: 1 }]} edges={['bottom', 'left', 'right']}>
            <ScrollView contentContainerStyle={{ padding: 10 }}>
                {/* Search Card */}
                <Card containerStyle={{ borderRadius: 10, padding: 15 }}>
                    <Card.Title>Search Student</Card.Title>
                    <Card.Divider />
                    
                    <StudentPicker 
                        onSelect={(student) => setRegno(student.enrollment)}
                        selectedStudent={regno}
                    />

                    <View style={{ marginBottom: 15 }} />

                    <TouchableOpacity
                        onPress={openMonthPicker}
                        style={{
                            borderWidth: 1,
                            borderColor: '#ddd',
                            borderRadius: 8,
                            padding: 12,
                            marginBottom: 15,
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}
                    >
                        <Text style={{ color: selectedMonth ? '#000' : '#999', fontSize: 16 }}>{monthLabel}</Text>
                        <MaterialIcons name="keyboard-arrow-down" size={24} color="#666" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={fetchFeeReport}
                        disabled={loading}
                        style={{
                            backgroundColor: styleContext.primaryColor || '#5a45d4',
                            padding: 12,
                            borderRadius: 8,
                            alignItems: 'center'
                        }}
                    >
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: 'bold' }}>Get Report</Text>}
                    </TouchableOpacity>
                </Card>

                {/* Pending Fees Section */}
                {feeReport && feeReport.feePendingDets && (
                    <Card containerStyle={{ borderRadius: 10, padding: 15, marginTop: 15 }}>
                        <Card.Title>Current Dues</Card.Title>
                        <Card.Divider />
                         {feeReport.feePendingDets.feeDets.map((group, index) => {
                             const filteredGroup = group.filter(item => {
                                 const amt = parseFloat(item.amount || item.value);
                                 return amt !== 0;
                             });

                             if (filteredGroup.length === 0) return null;

                             const headerTitle = filteredGroup[0].my;
                             
                             return (
                                 <View key={index} style={{ marginBottom: 15 }}>
                                    {!!headerTitle && (
                                        <Text style={{ fontSize: 14, fontWeight: 'bold', color: styleContext.primaryColor || '#5a45d4', marginBottom: 5 }}>
                                            {headerTitle}
                                        </Text>
                                    )}
                                    <FlatList
                                        data={filteredGroup}
                                        renderItem={renderPendingFeeItem}
                                        keyExtractor={(item, idx) => item.uid || idx.toString()}
                                        scrollEnabled={false}
                                    />
                                 </View>
                             );
                         })}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#ddd' }}>
                            <Text style={{ fontWeight: 'bold', fontSize: 16 }}>Total Dues:</Text>
                            <Text style={{ fontWeight: 'bold', fontSize: 16, color: '#d32f2f' }}>{feeReport.feePendingDets.gtotal}</Text>
                        </View>
                    </Card>
                )}

                {/* Payment History Section */}
                {feeReport && feeReport.feePaidDets && feeReport.feePaidDets.length > 0 && (
                     <View style={{ marginTop: 20, marginBottom: 10, paddingHorizontal: 5, alignItems: 'center' }}>
                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#333' }}>Payment History</Text>
                     </View>
                )}

                {feeReport && feeReport.feePaidDets && [...feeReport.feePaidDets].reverse().map((receiptGroup, index) => {
                     const receiptInfo = receiptGroup[0] || {};
                     
                     // Filter non-zero items
                     const filteredReceiptItems = receiptGroup.filter(item => {
                        const amt = parseFloat(item.amount);
                        return amt !== 0;
                     });
                     
                     if (filteredReceiptItems.length === 0) return null;

                     // Group by Month/Year (my)
                     const groupedItems = filteredReceiptItems.reduce((acc, item) => {
                         const key = item.my || 'Other';
                         if (!acc[key]) acc[key] = [];
                         acc[key].push(item);
                         return acc;
                     }, {});

                     return (
                        <Card key={index} containerStyle={{ borderRadius: 10, padding: 15, marginTop: 5 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                                <Text style={{ fontWeight: 'bold', color: '#555' }}>Receipt: {receiptInfo.receiptid}</Text>
                                <Text style={{ color: '#777' }}>{receiptInfo.dat}</Text>
                            </View>
                            <Card.Divider />
                            
                            {Object.entries(groupedItems).map(([my, items], idx) => (
                                <View key={idx} style={{ marginBottom: 10 }}>
                                    <Text style={{ fontSize: 14, fontWeight: 'bold', color: styleContext.primaryColor || '#5a45d4', marginBottom: 5 }}>{my}</Text>
                                    <FlatList
                                        data={items}
                                        renderItem={renderPaidFeeItem}
                                        keyExtractor={(item, i) => idx + '_' + i}
                                        scrollEnabled={false}
                                    />
                                </View>
                            ))}

                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#ddd' }}>
                                <Text style={{ fontWeight: 'bold' }}>Total Paid:</Text>
                                <Text style={{ fontWeight: 'bold', color: '#388e3c' }}>{receiptInfo.totalfees}</Text>
                            </View>
                        </Card>
                     );
                })}

                <View style={{ height: 40 }} />
            </ScrollView>

            <CustomPickerModal
                visible={pickerVisible}
                title={pickerTitle}
                data={pickerData}
                selectedValue={pickerValue}
                onSelect={(val) => setPickerValue(val)}
                onClose={() => setPickerVisible(false)}
                onConfirm={() => onPickerSelect(pickerValue)}
            />

            <BottomSheet isVisible={menuVisible} onBackdropPress={() => setMenuVisible(false)}>
                {menuList.map((l, i) => (
                    <ListItem key={i} containerStyle={l.containerStyle} onPress={l.onPress}>
                        <ListItem.Content>
                            <ListItem.Title style={l.titleStyle}>{l.title}</ListItem.Title>
                        </ListItem.Content>
                    </ListItem>
                ))}
            </BottomSheet>
        </SafeAreaView>
    );
}
