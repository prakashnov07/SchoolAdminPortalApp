
import React, { useState, useEffect, useContext } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import axios from 'axios';
import Toast from 'react-native-toast-message';

import { CoreContext } from '../context/CoreContext';
import { StyleContext } from '../context/StyleContext';
import CustomPickerModal from '../components/CustomPickerModal';
import StaffLeaveApplicationItem from '../components/StaffLeaveApplicationItem';

export default function LeaveApplicationScreen({ navigation }) {
    const coreContext = useContext(CoreContext);
    const styleContext = useContext(StyleContext);
    const { branchid } = coreContext;

    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('raised');
    const [staffFilter, setStaffFilter] = useState('all');
    
    // Pickers
    const [pickerVisible, setPickerVisible] = useState(false);
    const [pickerTitle, setPickerTitle] = useState('');
    const [pickerData, setPickerData] = useState([]);
    const [currentPickerValue, setCurrentPickerValue] = useState('');
    const [onPickerSelect, setOnPickerSelect] = useState(() => {});

    useEffect(() => {
        fetchApplications();
    }, [status, staffFilter]);

    const fetchApplications = () => {
        setLoading(true);
        const params = {
            branchid, 
            astatus: status,
            owner: ""
        };
        
        if (staffFilter !== 'all') {
            params.empid = staffFilter;
        } else params.empid = "all";

        console.log('Fetching leaves params:', params, staffFilter);

        axios.get('/staff-leave-applications', { params })
        .then(response => {
          console.log('Leave Applications Response:', response.data.applications);
            setApplications(response.data.applications || []);
            setLoading(false);
            if (response.data.applications?.length === 0) {
                // Toast.show({ type: 'info', text1: 'No applications found' });
            }
        })
        .catch(error => {
            console.log(error);
            setLoading(false);
            Toast.show({ type: 'error', text1: 'Error fetching applications' });
        });
    };

    const getStaffOptions = () => {
        const staffList = coreContext.staffs || [];
        const options = staffList.map(s => ({ label: s.name, value: s.empid }));
        return [{ label: 'All Staff', value: 'all' }, ...options];
    };

    const getStatusOptions = () => [
        { label: 'Pending', value: 'raised' },
        { label: 'Approved', value: 'approved' },
        { label: 'Declined', value: 'declined' }
    ];

    const openPicker = (title, data, currentValue, onSelect) => {
        setPickerTitle(title);
        setPickerData(data);
        setCurrentPickerValue(currentValue);
        setOnPickerSelect(() => (val) => {
             onSelect(val);
        });
        setPickerVisible(true);
    };

    // console.log('LeaveApplicationScreen - branchid:', branchid);

    return (
        <SafeAreaView style={[styleContext.background, { flex: 1 }]} edges={['bottom', 'left', 'right']}>
             <CustomPickerModal
                visible={pickerVisible}
                title={pickerTitle}
                data={pickerData}
                selectedValue={currentPickerValue}
                onSelect={(val) => {
                    onPickerSelect(val);
                    setPickerVisible(false);
                }}
                onClose={() => setPickerVisible(false)}
            />

            {/* Filters */}
            <View style={styleContext.glassFilterContainer}>
                <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                    <TouchableOpacity 
                        style={[styleContext.whitePickerButton, { flex: 1, marginRight: 5, marginBottom: 0 }]}
                        onPress={() => openPicker('Select Status', getStatusOptions(), status, setStatus)}
                    >
                         <Text style={styleContext.pickerButtonText}>
                            {getStatusOptions().find(s => s.value === status)?.label}
                        </Text>
                        <Icon name="chevron-down" size={20} color="#666" />
                    </TouchableOpacity>

                    <TouchableOpacity 
                         style={[styleContext.whitePickerButton, { flex: 1, marginLeft: 5, marginBottom: 0 }]}
                         onPress={() => openPicker('Filter by Staff', getStaffOptions(), staffFilter, setStaffFilter)}
                    >
                        <Text style={styleContext.pickerButtonText} numberOfLines={1}>
                            {staffFilter === 'all' ? 'All Staff' : getStaffOptions().find(s => s.value === staffFilter)?.label || 'All Staff'}
                        </Text>
                        <Icon name="chevron-down" size={20} color="#666" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* List */}
            {loading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={styleContext.primaryColor} />
                </View>
            ) : (
                <FlatList
                    data={applications}
                    renderItem={({ item }) => (
                        <StaffLeaveApplicationItem 
                            item={item} 
                            status={status}
                            refresh={fetchApplications}
                            branchid={branchid}
                            owner={coreContext.phone}
                            navigation={navigation}
                        />
                    )}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                    ListHeaderComponent={
                        <View style={{ marginBottom: 10, padding: 5 }}>
                            <Text style={{ color: '#666', fontSize: 13 }}>
                                Found {applications.length} {status} application(s)
                            </Text>
                        </View>
                    }
                    ListEmptyComponent={
                        <View style={{ alignItems: 'center', marginTop: 50 }}>
                            <Icon name="file-document-outline" size={60} color="#ddd" />
                            <Text style={{ color: '#888', marginTop: 10 }}>No leave applications found</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({});
