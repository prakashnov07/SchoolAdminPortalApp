import React, { useContext } from 'react';
import { View, Text } from 'react-native';
import { StyleContext } from '../context/StyleContext';

export default function AttendanceReviewCard({ item, isAbsent }) {
    const styleContext = useContext(StyleContext);
    
    // Status Color
    const statusColor = isAbsent ? '#D33A2C' : '#28a745';

    return (
        <View style={[
            styleContext.card, 
            { 
                borderLeftWidth: 6, 
                borderLeftColor: statusColor,
                padding: 12,
                marginVertical: 4,
                borderWidth: 0,
                elevation: 2,
            }
        ]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View>
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: styleContext.titleColor }}>
                         {item.firstname} {item.lastname}
                    </Text>
                    <Text style={{ fontSize: 12, color: '#666' }}>Roll: {item.roll} | Adm: {item.scholarno}</Text>
                </View>
                
                <View>
                     <Text style={{ 
                         color: statusColor, 
                         fontWeight: 'bold', 
                         fontSize: 14 
                     }}>
                         {isAbsent ? 'ABSENT' : 'PRESENT'}
                     </Text>
                </View>
            </View>
        </View>
    );
}
