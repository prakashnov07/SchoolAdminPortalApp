import React, { useEffect, useState, useContext } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import axios from 'axios';
import { StyleContext } from '../context/StyleContext';
import { CoreContext } from '../context/CoreContext';

export default function TransportAttendanceCountItem({ item, attendanceDate }) {
    const styleContext = useContext(StyleContext);
    const coreContext = useContext(CoreContext);
    const { text, card } = styleContext;

    const [report, setReport] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getRouteAttendanceReport();
    }, [attendanceDate]);

    const getRouteAttendanceReport = () => {
        setLoading(true);
        // Format date as YYYY-MM-DD for API if needed, but existing legacy code sends raw Date object which axios might convert or backend accepts.
        // Legacy code: params: { attendancedate: da, ... }
        // Let's ensure it's formatted if backend expects string. 
        // Assuming legacy logic: passing the date object/string directly.
        
        axios.get('/route-attendance-report', { 
            params: { 
                attendancedate: attendanceDate, 
                id: item.id, 
                branchid: coreContext.branchid 
            } 
        }).then((response) => {
            // console.log('cr', response.data);
            setReport(response.data.row || {});
            setLoading(false);
        }).catch(err => {
            console.error(err);
            setLoading(false);
        });
    };

    return (
        <View style={styles.card}>
            <Text style={styles.title}>{item.name}</Text>
            {loading ? (
                <Text style={styles.loading}>Loading...</Text>
            ) : (
                <View style={styles.content}>
                   {report.stu_count ? (
                       <Text style={styles.countText}>
                           Present : {report.present_count} / {report.stu_count}
                       </Text>
                   ) : (
                       <Text style={styles.noDataText}>No Data</Text>
                   )}
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
        marginHorizontal: 10,
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
    content: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    countText: {
        fontSize: 15,
        color: '#444',
        fontWeight: '500'
    },
    loading: {
        fontSize: 12,
        color: '#999',
        fontStyle: 'italic'
    },
    noDataText: {
        fontSize: 14,
        color: '#999'
    }
});
