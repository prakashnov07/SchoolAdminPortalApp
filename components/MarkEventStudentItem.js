import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { StyleContext } from '../context/StyleContext';

export default function MarkEventStudentItem({ student, isSelected, onToggle, attStatus, color }) {
    const styleContext = useContext(StyleContext);
    const { text, primary } = styleContext;

    // Determine colors based on selection
    // Selected = Absent = Red
    const borderColor = isSelected ? '#D33A2C' : (attStatus === 'present' ? 'green' : (attStatus === 'absent' ? 'red' : '#ccc'));
    const backgroundColor = isSelected ? '#ffebee' : '#fff';
    const iconColor = isSelected ? '#D33A2C' : '#757575';

    return (
        <TouchableOpacity 
            style={[styles.card, {
                borderLeftColor: borderColor,
                borderLeftWidth: 5,
                backgroundColor: backgroundColor,
                borderColor: isSelected ? '#D33A2C' : 'transparent',
                borderWidth: isSelected ? 1 : 0
            }]} 
            onPress={onToggle}
        >
            <View style={styles.row}>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.name, { color: text?.color || '#333' }]}>{student.firstname} {student.lastname}</Text>
                    <Text style={styles.details}>Roll: {student.roll} | Reg: {student.scholarno}</Text>
                    <Text style={styles.details}>{student.father}</Text>
                </View>

                <View>
                    <Icon 
                        name={isSelected ? "checkbox-marked" : "checkbox-blank-outline"} 
                        size={28} 
                        color={iconColor} 
                    />
                </View>
            </View>
            {attStatus !== 'unmarked' && (
                <Text style={[styles.statusText, { color: attStatus === 'present' ? 'green' : 'red' }]}>
                    Marked {attStatus.toUpperCase()}
                </Text>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        padding: 15,
        marginVertical: 4,
        marginHorizontal: 8,
        borderRadius: 8,
        elevation: 1,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 2,
        shadowOffset: { width: 0, height: 1 }
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    name: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4
    },
    details: {
        fontSize: 12,
        color: '#666',
        marginBottom: 2
    },
    statusText: {
        marginTop: 5,
        fontSize: 12,
        fontWeight: 'bold',
        alignSelf: 'flex-start'
    }
});
