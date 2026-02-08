import React, { useState, useContext, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { CoreContext } from '../context/CoreContext';
import { StyleContext } from '../context/StyleContext';
import CustomPickerModal from '../components/CustomPickerModal'; // Assuming this exists or we use similar logic

const StaffItem = ({ item, index, styleContext, navigation }) => {
    
    // Derived from styling in EmployeeItems.js
    let containerStyle = { 
        backgroundColor: '#fff', 
        padding: 12, 
        borderBottomWidth: 1, 
        borderBottomColor: '#eee',
        marginBottom: 8,
        borderRadius: 12,
        ...styleContext.card // Inherit card styles if available
    };

    if (item.status === 'suspended') {
        containerStyle.backgroundColor = '#f0f0f0'; // Visual cue for suspended
    }

    return (
        <View style={containerStyle}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                <Text style={{ fontSize: 16, fontWeight: 'bold', marginRight: 8, color: styleContext.blackColor }}>{index}.</Text>
                <Text style={{ fontSize: 16, fontWeight: 'bold', flex: 1, color: styleContext.titleColor }}>
                    {item.name} <Text style={{ fontSize: 14, fontWeight: 'normal', color: '#666' }}>({item.empid})</Text>
                </Text>
                 <Text style={{ fontSize: 14, color: '#666' }}>{item.classname}-{item.sectionname}</Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                <Text style={{ fontSize: 14, color: '#444' }}>{item.phone}</Text>
                <Text style={{ fontSize: 14, color: '#444', fontStyle: 'italic' }}>{item.role}</Text>
                 <Text style={{ fontSize: 14, color: item.status === 'active' ? 'green' : 'red', textTransform: 'capitalize' }}>{item.status}</Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 4 }}>
                 <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#388e3c' }]} onPress={() => navigation.navigate('AddStaffScreen', { staff: item })}>
                    <Text style={styles.actionButtonText}>Edit</Text>
                </TouchableOpacity>
                 <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#333' }]} onPress={() => navigation.navigate('StaffProfileScreen', { staff: item })}>
                    <Text style={styles.actionButtonText}>Profile</Text>
                </TouchableOpacity>
                 <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#1976d2' }]} onPress={() => navigation.navigate('StaffRemarksScreen', { staff: item })}>
                    <Text style={styles.actionButtonText}>Remarks</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default function ManageStaffScreen({ navigation }) {
    const coreContext = useContext(CoreContext);
    const styleContext = useContext(StyleContext);
    const { branchid } = coreContext;

    const [search, setSearch] = useState('');
    const [selectedRole, setSelectedRole] = useState('');
    const [loading, setLoading] = useState(false);
    
    // For Picker Modal
    const [pickerVisible, setPickerVisible] = useState(false);
    const [pickerTitle, setPickerTitle] = useState('');
    const [pickerData, setPickerData] = useState([]);
    const [currentPickerValue, setCurrentPickerValue] = useState('');
    const [onPickerSelect, setOnPickerSelect] = useState(() => {});

    useEffect(() => {
        // Fetch initials - passing undefined to let backend handle default
        coreContext.fetchStaffs();
        coreContext.fetchRoles();
    }, []);

    const openPicker = (title, data, currentValue, onSelect) => {
        setPickerTitle(title);
        setPickerData(data);
        setCurrentPickerValue(currentValue);
        setOnPickerSelect(() => (val) => {
             onSelect(val);
        });
        setPickerVisible(true);
    };

    const handleRoleChange = (roleValue) => {
         setSelectedRole(roleValue);
    };
    
    // Local search status update
    const handleSearch = (text) => {
        setSearch(text);
    };


    const getFilteredStaffs = () => {
        let filtered = coreContext.staffs || [];

        //  console.log(filtered);

        // 1. Filter by Role (Local filtering on the fetched results)
        if (selectedRole) {
            filtered = filtered.filter(s => s.role === selectedRole);
        }

        // 2. Filter by Search Text (Name or Phone) - Local filtering
        if (search.trim()) {
            const lowerSearch = search.toLowerCase();
            filtered = filtered.filter(s => 
                (s.name && s.name.toLowerCase().includes(lowerSearch)) || 
                (s.phone && s.phone.includes(lowerSearch))
            );
        }

        return filtered;
    };

    const rolesData = () => {
        const roles = coreContext.roles || [];
        const mapped = roles.map(r => ({ label: r.rolenames, value: r.rolevalues }));
        return [{ label: 'All Roles', value: '' }, ...mapped];
    };
    
    const filteredStaffs = getFilteredStaffs();


    return (
        <SafeAreaView style={styleContext.background} edges={['bottom', 'left', 'right']}>
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

                {/* Header Actions */}
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 16, paddingTop: 10 }}>
                     <TouchableOpacity 
                        style={[styles.actionButton, { backgroundColor: styleContext.primaryColor || '#6200ea', paddingHorizontal: 16 }]} 
                        onPress={() => navigation.navigate('AddStaffScreen')}
                    >
                        <Icon name="plus" size={18} color="#fff" style={{ marginRight: 4 }} />
                        <Text style={styles.actionButtonText}>Add Staff</Text>
                    </TouchableOpacity>
                </View>
                
            {/* Search & Filter - Glass Theme */}
            <View style={styleContext.glassFilterContainer}>
                <View style={[styleContext.whitePickerButton, { marginBottom: 10, paddingVertical: 0, paddingHorizontal: 10 }]}>
                         <Icon name="magnify" size={24} color="#999" />
                        <TextInput
                            placeholder="Search by name / Contact..."
                        placeholderTextColor="#999"
                        style={{ flex: 1, padding: 12, fontSize: 16, color: '#333' }}
                            value={search}
                            onChangeText={handleSearch}
                        />
                    </View>

                    <TouchableOpacity 
                    style={[styleContext.whitePickerButton, { marginBottom: 0 }]}
                        onPress={() => openPicker('Filter By Role', rolesData(), selectedRole, handleRoleChange)}
                    >
                         <Text style={{ fontSize: 16, color: selectedRole ? '#333' : '#666' }}>
                            {selectedRole ? rolesData().find(r => r.value === selectedRole)?.label : 'Filter By Role'}
                        </Text>
                        <Icon name="chevron-down" size={24} color="#666" />
                    </TouchableOpacity>
                </View>



            {/* Staff List */}
            <FlatList
                style={{ flex: 1 }}
                data={filteredStaffs}
                renderItem={({ item, index }) => <StaffItem item={item} index={index + 1} styleContext={styleContext} navigation={navigation} />}
                keyExtractor={(item) => item.id ? item.id.toString() : Math.random().toString()}
                contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
                ListEmptyComponent={
                    <Text style={{ textAlign: 'center', marginTop: 30, color: '#888' }}>
                         {coreContext.staffs && coreContext.staffs.length > 0 ? 'No staff found matching filters.' : 'Loading or no staff data.'}
                    </Text>
                }
            />

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 4,
        marginLeft: 8,
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    }
});
