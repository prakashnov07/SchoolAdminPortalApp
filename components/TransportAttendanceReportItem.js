import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import axios from 'axios';
import { StyleContext } from '../context/StyleContext';
import { CoreContext } from '../context/CoreContext';

export default function TransportAttendanceReportItem({ item, index, action, branchid, owner, schoolData }) {
    const styleContext = useContext(StyleContext);
    const { text, primary } = styleContext;
    
    // otime might change if we mark out
    const [otime, setOtime] = useState(item.otime);

    const markOutAttendance = (act) => {
        axios.post('/mark-transport-attendance-out', { 
            regno: item.stuid, 
            branchid: branchid, 
            owner: owner, 
            action: act 
        }).then(() => {
            if (act === 'reset') {
                setOtime('');
            } else {
                // If backend returns new time we should use it, but legacy code just sets 'set' or relies on reload? 
                // Legacy: setOtime('set'); -> Wait, 'set' is not a time. 
                // Let's assume for now valid time or just a string indicating done. 
                // Legacy also had reload logic or just local state update. 
                // We'll set a placeholder or "Just Now" if successful, or maybe re-fetch?
                // Legacy: setOtime('set') likely just triggered UI change. 
                // Better: set current time formatted.
                const now = new Date().toLocaleTimeString();
                setOtime(now); 
            }
        }).catch(err => console.error(err));
    };

    const renderButton = () => {
        if (item.showOutButton === 'yes' && action === 'mark-out') {
            if (otime && otime !== '') {
                return (
                    <TouchableOpacity 
                        style={[styles.button, { backgroundColor: '#f44336' }]} // Red for Reset
                        onPress={() => markOutAttendance('reset')}
                    >
                        <Text style={styles.buttonText}>Reset</Text>
                    </TouchableOpacity>
                );
            } else {
                return (
                    <TouchableOpacity 
                        style={[styles.button, { backgroundColor: primary?.backgroundColor || '#6200ee' }]} 
                        onPress={() => markOutAttendance('out')}
                    >
                        <Text style={styles.buttonText}>Mark Out</Text>
                    </TouchableOpacity>
                );
            }
        }
        return null;
    };

    return (
        <View style={styles.card}>
            <Text style={styles.title}>{index}. {item.name}</Text>
            
            <View style={styles.row}>
                <Text style={styles.label}>{schoolData?.smallReg || 'Reg No'} : {item.scholarno}</Text>
                <Text style={styles.label}>{item.clas}</Text>
            </View>

            <View style={styles.row}>
                <Text style={styles.label}>{schoolData?.smallEnr || 'Enr No'} : {item.stuid}</Text>
            </View>

            <View style={styles.row}>
                <Text style={styles.label}>Bus : {item.busno}</Text>
            </View>

            <View style={styles.row}>
                <Text style={styles.label}>Route : {item.routename}</Text>
            </View>
            
            <View style={styles.row}>
                <Text style={styles.label}>Station : {item.station}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.row}>
                <Text style={styles.label}>In Time : {item.atime}</Text>
                <Text style={styles.subLabel}>By : {item.owner}</Text>
            </View>

            <View style={styles.row}>
                <Text style={styles.label}>Out Time : {otime || '-'}</Text>
                <Text style={styles.subLabel}>By : {item.owner2 || '-'}</Text>
            </View>

            {renderButton() && (
                <View style={[styles.row, { justifyContent: 'flex-end', marginTop: 10 }]}>
                    {renderButton()}
                </View>
            )}

        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        padding: 15,
        marginVertical: 5,
        borderRadius: 8,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    label: {
        fontSize: 14,
        color: '#555',
    },
    subLabel: {
        fontSize: 12,
        color: '#888',
        fontStyle: 'italic'
    },
    divider: {
        height: 1,
        backgroundColor: '#eee',
        marginVertical: 8
    },
    button: {
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 5,
        alignItems: 'center'
    },
    buttonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold'
    }
});
