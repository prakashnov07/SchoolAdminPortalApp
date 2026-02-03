import React, { useEffect, useState, useContext } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import axios from 'axios';
import { CoreContext } from '../context/CoreContext';
import { StyleContext } from '../context/StyleContext';

export default function AttendanceCountItem({ item, date }) {
    const coreContext = useContext(CoreContext);
    const styleContext = useContext(StyleContext);
    const { text, border } = styleContext;

    const [classReport, setClassReport] = useState({});
    const [sectionReports, setSectionReports] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReports();
    }, [date]);

    const fetchReports = async () => {
        setLoading(true);
        const formattedDate = formatDate(date);
        
        try {
            // Concurrent fetching for performance
            const [classRes, sectionRes] = await Promise.all([
                axios.get('/all-class-attendance-report', { 
                    params: { 
                        attendancedate: formattedDate, 
                        classid: item.classid, 
                        branchid: coreContext.branchid 
                    } 
                }),
                axios.get('/all-section-attendance-report', { 
                    params: { 
                        attendancedate: formattedDate, 
                        classid: item.classid, 
                        branchid: coreContext.branchid 
                    } 
                })
            ]);

            setClassReport(classRes.data.row || {});
            setSectionReports(sectionRes.data.reports || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (d) => {
        let month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

        if (month.length < 2) month = '0' + month;
        if (day.length < 2) day = '0' + day;

        return [day, month, year].join('-');
    };

    if (loading) {
         // Keep height to minimize jumpiness, or just return null
        return (
            <View style={[styles.card, { borderColor: border?.borderColor || '#eee', padding: 20 }]}>
                <Text style={{color: '#999'}}>Loading...</Text>
            </View>
        );
    }

    return (
        <View style={[styles.card, { borderColor: border?.borderColor || '#eee' }]}>
            <View style={styles.header}>
                <Text style={[styles.className, { color: text?.color || '#333' }]}>{item.classname}</Text>
                {classReport.stu_count ? (
                    <Text style={[styles.headerCount, { color: text?.color || '#333' }]}>
                        Present: <Text style={{fontWeight: 'bold', color: '#4caf50'}}>{classReport.present_count}</Text> / {classReport.stu_count}
                    </Text>
                ) : null}
            </View>

            {sectionReports.length > 0 && (
                <View style={styles.sectionList}>
                    {sectionReports.map((sec, index) => (
                        <View key={index} style={styles.sectionRow}>
                            <Text style={[styles.sectionName, { color: '#666' }]}>Sec. {sec.sectionname}</Text>
                            <Text style={styles.sectionCount}>
                                Present: <Text style={{fontWeight: 'bold', color: '#4caf50'}}>{sec.present_count}</Text> / {sec.stu_count}
                            </Text>
                        </View>
                    ))}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        borderRadius: 10,
        marginBottom: 10,
        borderWidth: 1,
        overflow: 'hidden',
        elevation: 1,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
    },
    header: {
        padding: 15,
        backgroundColor: 'rgba(0,0,0,0.02)',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0'
    },
    className: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    headerCount: {
        fontSize: 14,
    },
    sectionList: {
        padding: 15,
    },
    sectionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 4,
    },
    sectionName: {
        fontSize: 14,
    },
    sectionCount: {
        fontSize: 14,
        color: '#666'
    }
});
