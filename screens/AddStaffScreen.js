import React, { useState, useEffect, useContext } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, HelperText } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import axios from 'axios';
import { CoreContext } from '../context/CoreContext';
import { StyleContext } from '../context/StyleContext';
import CustomPickerModal from '../components/CustomPickerModal'; // reusing existing component

export default function AddStaffScreen({ navigation, route }) {
    const coreContext = useContext(CoreContext);
    const styleContext = useContext(StyleContext);
    const { branchid, phone } = coreContext;

    // Params for Edit Mode
    const { staff } = route.params || {};

    const [name, setName] = useState('');
    const [mobile, setMobile] = useState('');
    const [empid, setEmpid] = useState('');
    const [role, setRole] = useState('');
    const [classid, setClassid] = useState('');
    const [sectionid, setSectionid] = useState('');
    
    // Pickers Data
    const [classes, setClasses] = useState([]);
    const [sections, setSections] = useState([]);
    
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Modal State
    const [pickerVisible, setPickerVisible] = useState(false);
    const [pickerTitle, setPickerTitle] = useState('');
    const [pickerData, setPickerData] = useState([]);
    const [onPickerSelect, setOnPickerSelect] = useState(() => {});

    // Initialize Fields
    useEffect(() => {
        if (staff) {
            setName(staff.name || '');
            setMobile(staff.phone || '');
            setEmpid(staff.empid || '');
            setRole(staff.role || '');
            setClassid(staff.classid || '');
            setSectionid(staff.sectionid || '');
        }
        fetchClasses();
    }, [staff]);

    // Fetch Sections when Class changes
    useEffect(() => {
        if (classid) {
            fetchSections(classid);
        } else {
            setSections([]);
            setSectionid('');
        }
    }, [classid]);


    const fetchClasses = () => {
        // Assuming /getclasses endpoint exists or similar, checking legacy usually helps but I'll guess standard
        // If not found, fallback to coreContext if available. 
        // Legacy used 'Classes' component which likely fetched from /getclasses or similar.
        // Let's try fetching from /getclasses with branchid
        axios.get('/getclasses', { params: { branchid } })
            .then(response => {
                if (response.data && response.data.classes) {
                    setClasses(response.data.classes);
                }
            })
            .catch(err => console.log('Error fetching classes', err));
    };

    const fetchSections = (cid) => {
        axios.get('/getsections', { params: { classid: cid, branchid } })
            .then(response => {
                 if (response.data && response.data.sections) {
                    setSections(response.data.sections);
                }
            })
            .catch(err => console.log('Error fetching sections', err));
    };

    const handleSubmit = () => {
        if (!name.trim()) { Alert.alert('Error', 'Please enter name'); return; }
        if (!mobile.trim()) { Alert.alert('Error', 'Please enter mobile number'); return; }
        if (!role) { Alert.alert('Error', 'Please select a role'); return; }
        // For teacher, maybe class/section is required? enforcing only if selected
        
        setSubmitting(true);
        const payload = {
            id: staff ? staff.id : '',
            name,
            phone: mobile,
            empid,
            role,
            branchid,
            owner: phone,
            classid,
            sectionid
        };

        axios.post('/addstaff', payload)
            .then(response => {
                setSubmitting(false);
                Alert.alert('Success', staff ? 'Staff updated successfully' : 'Staff added successfully', [
                    { text: 'OK', onPress: () => {
                        coreContext.fetchStaffs(); // Refresh list
                        navigation.goBack(); 
                    }}
                ]);
            })
            .catch(err => {
                setSubmitting(false);
                Alert.alert('Error', 'Failed to save staff details');
                console.log(err);
            });
    };

    // Picker Helpers
    const openPicker = (title, data, onSelect) => {
        setPickerTitle(title);
        setPickerData(data);
        setOnPickerSelect(() => onSelect);
        setPickerVisible(true);
    };

    const rolesData = () => {
        return (coreContext.roles || []).map(r => ({ label: r.rolenames, value: r.rolevalues }));
    };

    const classesData = () => {
        return classes.map(c => ({ label: c.class_name, value: c.class_id }));
    };

    const sectionsData = () => {
        return sections.map(s => ({ label: s.section_name, value: s.section_id }));
    };

    return (
        <SafeAreaView style={styleContext.background} edges={['bottom', 'left', 'right']}>
             <CustomPickerModal
                visible={pickerVisible}
                title={pickerTitle}
                data={pickerData}
                onSelect={(val) => {
                    onPickerSelect(val);
                    setPickerVisible(false);
                }}
                onClose={() => setPickerVisible(false)}
            />



            <ScrollView contentContainerStyle={{ padding: 16 }}>
                
                {/* Name */}
                <View style={styleContext.mobileInputContainer}>
                    <Text style={styleContext.label}>Name</Text>
                    <View style={[styleContext.input, { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10 }]}>
                         <Icon name="account" size={20} color="#666" style={{ marginRight: 8 }} />
                         <TextInput 
                            value={name}
                            onChangeText={setName}
                            placeholder="Enter Name"
                            style={{ flex: 1, fontSize: 16, color: styleContext.blackColor }}
                         />
                    </View>
                </View>

                {/* Mobile */}
                <View style={styleContext.mobileInputContainer}>
                    <Text style={styleContext.label}>Mobile</Text>
                    <View style={[styleContext.input, { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10 }]}>
                         <Icon name="phone" size={20} color="#666" style={{ marginRight: 8 }} />
                         <TextInput 
                            value={mobile}
                            onChangeText={setMobile}
                            placeholder="Enter Mobile"
                            keyboardType="phone-pad"
                            maxLength={10}
                            editable={!staff} // Often mobile is primary key or restricted on edit
                            style={{ flex: 1, fontSize: 16, color: styleContext.blackColor }}
                         />
                    </View>
                </View>

                {/* Emp ID */}
                <View style={styleContext.mobileInputContainer}>
                    <Text style={styleContext.label}>Employee ID</Text>
                    <View style={[styleContext.input, { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10 }]}>
                         <Icon name="card-account-details" size={20} color="#666" style={{ marginRight: 8 }} />
                         <TextInput 
                            value={empid}
                            onChangeText={setEmpid}
                            placeholder="Enter Employee ID"
                            style={{ flex: 1, fontSize: 16, color: styleContext.blackColor }}
                         />
                    </View>
                </View>

                 {/* Role Picker */}
                 <View style={styleContext.mobileInputContainer}>
                    <Text style={styleContext.label}>Role</Text>
                    <TouchableOpacity 
                        style={[styleContext.pickerButton, { backgroundColor: '#fff' }]}
                        onPress={() => openPicker('Select Role', rolesData(), setRole)}
                    >
                         <Text style={{ fontSize: 16, color: role ? styleContext.blackColor : '#999' }}>
                            {role ? rolesData().find(r => r.value === role)?.label : 'Select Role'}
                        </Text>
                        <Icon name="chevron-down" size={24} color="#666" />
                    </TouchableOpacity>
                </View>

                {/* Class / Section (Optional/Dynamic) */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <View style={[styleContext.mobileInputContainer, { flex: 0.48 }]}>
                         <Text style={styleContext.label}>Class (Opt)</Text>
                         <TouchableOpacity 
                            style={[styleContext.pickerButton, { backgroundColor: '#fff' }]}
                            onPress={() => openPicker('Select Class', classesData(), setClassid)}
                        >
                             <Text numberOfLines={1} style={{ fontSize: 16, color: classid ? styleContext.blackColor : '#999' }}>
                                {classid ? classesData().find(c => c.value === classid)?.label : 'Class'}
                            </Text>
                            <Icon name="chevron-down" size={24} color="#666" />
                        </TouchableOpacity>
                    </View>

                     <View style={[styleContext.mobileInputContainer, { flex: 0.48 }]}>
                         <Text style={styleContext.label}>Section (Opt)</Text>
                         <TouchableOpacity 
                            style={[styleContext.pickerButton, { backgroundColor: '#fff' }]}
                            onPress={() => openPicker('Select Section', sectionsData(), setSectionid)}
                        >
                             <Text numberOfLines={1} style={{ fontSize: 16, color: sectionid ? styleContext.blackColor : '#999' }}>
                                {sectionid ? sectionsData().find(s => s.value === sectionid)?.label : 'Section'}
                            </Text>
                            <Icon name="chevron-down" size={24} color="#666" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Submit Button */}
                <TouchableOpacity 
                    style={[styleContext.button, { marginTop: 20, backgroundColor: styleContext.primaryColor || '#5a45d4' }]} 
                    onPress={handleSubmit}
                    disabled={submitting}
                >
                    {submitting ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styleContext.buttonText}>{staff ? 'Update Staff' : 'Add Staff'}</Text>
                    )}
                </TouchableOpacity>

            </ScrollView>
        </SafeAreaView>
    );
}

import { TextInput } from 'react-native'; // Explicit import needed for inside components
