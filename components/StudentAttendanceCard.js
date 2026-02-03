import React, { useState, useContext } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import axios from 'axios';
import Toast from 'react-native-toast-message';

import { CoreContext } from '../context/CoreContext';
import { StyleContext } from '../context/StyleContext';

export default function StudentAttendanceCard({ 
    item, 
    isAbsent, 
    isMarked, 
    onToggleAbsence, 
    selectedClass, 
    selectedSection 
}) {
    const coreContext = useContext(CoreContext);
    const styleContext = useContext(StyleContext);
    const navigation = useNavigation();
    
    // Core Data
    const { phone, branchid } = coreContext;

    // Local state for refreshed details
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [refreshedDetails, setRefreshedDetails] = useState(null);
    const [isRefreshed, setIsRefreshed] = useState(false);

    // Derive display values
    const displayDues = refreshedDetails?.till_month_pending ?? refreshedDetails?.previous_dues ?? item.till_month_pending ?? '0';
    const displayAtt = item.att_record ?? 'NA';
    const displayMonthStatus = refreshedDetails?.month_status ?? item.month_status ?? '';
    
    const handleRefresh = async () => {
        setLoadingDetails(true);
        try {
            const params = {
                classid: item.classid, 
                sectionid: item.sectionid,
                enrid: item.enrollment,
                astatus: item.ignore_fee, 
                action: 'mark-attendance',
                owner: phone,
                branchid: branchid,
                _ts: new Date().getTime() // Prevent caching
            };
            
            // 1. Legacy Step 1: Fetch on-demand details
            const resOnDemand = await axios.get('other-attendance-details-on-demand', { params });
            
            let newDetails = {};
            if (resOnDemand.data) {
                newDetails.till_month_pending = resOnDemand.data.pendingAmount;
            }

            // 2. Legacy Step 2: Fetch v2 details
            const resV2 = await axios.get('other-attendance-details-v2', { params });
            
            if (resV2.data) {
                // Get both record and status
                newDetails.att_record = resV2.data.att_record;
                newDetails.month_status = resV2.data.month_status;
                newDetails.previous_dues = resV2.data.previous_dues;
            }

            setRefreshedDetails(prev => ({ ...prev, ...newDetails }));
            setIsRefreshed(true); // Hide the refresh button after success

        } catch (err) {
             Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to refresh details' });
        } finally {
            setLoadingDetails(false);
        }
    };

    // Determine Status Colors
    const statusColor = isAbsent ? '#D33A2C' : '#28a745';

    return (
        <View style={[
            styleContext.card, 
            { 
                borderLeftWidth: 8, 
                borderLeftColor: statusColor,
                paddingHorizontal: 16,
                paddingVertical: 12,
                marginHorizontal: 4,
                marginBottom: 12,
                borderWidth: 0, 
                elevation: 4,
            }
        ]}>
            {/* Header: Name and Roll */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                 <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: styleContext.titleColor }}>
                        {item.firstname} {item.lastname}
                    </Text>
                    <Text style={{ fontSize: 14, color: '#666', marginTop: 2 }}>
                        Roll No: <Text style={{ fontWeight: 'bold', color: styleContext.blackColor }}>{item.roll}</Text>
                    </Text>
                 </View>
                 <View style={{ alignItems: 'flex-end' }}>
                     <Text style={{ fontSize: 12, color: '#888' }}>Adm No</Text>
                     <Text style={{ fontWeight: 'bold', color: styleContext.blackColor }}>{item.scholarno}</Text>
                 </View>
            </View>

            {/* Sub-details Row: Enrollment & Status */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text style={{ fontSize: 14, color: '#444' }}>
                    Enr: <Text style={{ fontWeight: '600' }}>{item.enrollment}</Text>
                </Text>
                {/* Status Badge */}
                <View style={{ 
                    backgroundColor: isAbsent ? '#ffebee' : '#e8f5e9', 
                    paddingHorizontal: 8, 
                    paddingVertical: 2, 
                    borderRadius: 4,
                    borderWidth: 1,
                    borderColor: isAbsent ? '#ffcdd2' : '#c8e6c9'
                }}>
                    <Text style={{ fontSize: 12, fontWeight: 'bold', color: statusColor }}>
                        {isAbsent ? 'ABSENT' : 'PRESENT'}
                    </Text>
                </View>
            </View>

            {/* Divider */}
            <View style={{ height: 1, backgroundColor: '#eee', marginVertical: 8 }} />

            {/* Stats Row: CD, Att */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                
                {/* CD (Current Dues) */}
                <View style={{ alignItems: 'center', flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                        <Text style={{ fontSize: 12, color: '#888' }}>CD</Text>
                         {/* Calendar Icon - Visual only for now */}
                        <TouchableOpacity 
                            style={{ marginLeft: 6 }}
                            onPress={() => navigation.navigate('ViewStudentAttendanceScreen', { student: item })}
                        >
                             <Icon name="calendar-month" size={16} color={styleContext.primary} />
                        </TouchableOpacity>
                    </View>
                    {loadingDetails ? <ActivityIndicator size="small" color="#d32f2f" /> : 
                        <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#d32f2f' }}>{displayDues}</Text>
                    }
                </View>

                 {/* Vertical Divider */}
                 <View style={{ width: 1, height: 24, backgroundColor: '#eee' }} />

                {/* Attendance Record */}
                <View style={{ alignItems: 'center', flex: 1 }}>
                    <Text style={{ fontSize: 12, color: '#888', marginBottom: 2 }}>
                        Attendance {displayMonthStatus ? `(${displayMonthStatus})` : ''}
                    </Text>
                    {loadingDetails ? <ActivityIndicator size="small" color={styleContext.purple} /> :
                        <Text style={{ fontSize: 16, fontWeight: 'bold', color: styleContext.purple }}>{displayAtt}</Text>
                    }
                </View>
            </View>

            {/* Action Row: Checkboxes */}
            <View style={{ 
                flexDirection: 'row', 
                justifyContent: !isMarked ? 'space-between' : (isAbsent ? 'flex-end' : 'flex-start'), 
                alignItems: 'center', 
                marginTop: 16,
                backgroundColor: '#fafafa',
                borderRadius: 8,
                padding: 8
            }}>
                
                {/* Present Box */}
                {(!isMarked || !isAbsent) && (
                    <TouchableOpacity 
                        onPress={() => !isMarked && onToggleAbsence(item.enrollment, false)}
                        disabled={isMarked}
                        style={{ flexDirection: 'row', alignItems: 'center' }}
                    >
                        <Icon 
                            name={(!isMarked && !isAbsent) || (isMarked && !isAbsent) ? "checkbox-marked-circle" : "checkbox-blank-circle-outline"}
                            size={28} 
                            color={(!isMarked && !isAbsent) || (isMarked && !isAbsent) ? "#28a745" : "#bbb"} 
                        />
                        <Text style={{ 
                            marginLeft: 6, 
                            color: (!isMarked && !isAbsent) || (isMarked && !isAbsent) ? "#28a745" : "#777", 
                            fontWeight: 'bold' 
                        }}>Present</Text>
                    </TouchableOpacity>
                )}

                {/* Absent Box */}
                {(!isMarked || isAbsent) && (
                    <TouchableOpacity 
                        onPress={() => !isMarked && onToggleAbsence(item.enrollment, true)} 
                        disabled={isMarked}
                        style={{ flexDirection: 'row', alignItems: 'center' }}
                    >
                        <Text style={{ 
                            marginRight: 6, 
                            color: isAbsent ? "#D33A2C" : "#777", 
                            fontWeight: 'bold' 
                        }}>Absent</Text>
                        <Icon 
                            name={isAbsent ? "checkbox-marked-circle" : "checkbox-blank-circle-outline"} 
                            size={28} 
                            color={isAbsent ? "#D33A2C" : "#bbb"} 
                        />
                    </TouchableOpacity>
                )}
            </View>
            
            {/* Footer: Refresh Button (Restored) */}
            {!isRefreshed && !loadingDetails && (
                <View style={{ alignItems: 'flex-end', marginTop: 8 }}>
                     <TouchableOpacity 
                        style={{ paddingVertical: 4, paddingHorizontal: 8 }}
                        onPress={handleRefresh}
                     >
                        <Text style={{ color: '#00796b', fontSize: 12, fontWeight: 'bold', textDecorationLine: 'underline' }}>Refresh Details</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}
