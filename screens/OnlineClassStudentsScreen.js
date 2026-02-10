import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import { CoreContext } from '../context/CoreContext';
import { StyleContext } from '../context/StyleContext';

const OnlineClassStudentsScreen = ({ route, navigation }) => {
    const { classid, sectionid, date, id, type } = route.params;
    const { branchid } = useContext(CoreContext);
    const styleContext = useContext(StyleContext);

    const [loading, setLoading] = useState(true);
    const [students, setStudents] = useState([]);

    useEffect(() => {
        fetchStudents();
        navigation.setOptions({
            title: type === 'present' ? 'Present Students' : 'Absent Students'
        });
    }, []);

    const fetchStudents = async () => {
        setLoading(true);
        try {
            const endpoint = type === 'present' ? '/show-online-class-students' : '/show-online-class-absent-students';
            const params = {
                id, // online class id
                attendancedate: date,
                branchid
            };

            const response = await axios.get(endpoint, { params });
            setStudents(response.data.rows || []);
        } catch (error) {
            console.error(error);
            Toast.show({ type: 'error', text1: 'Failed to fetch students' });
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }) => {
        const contact = item.contact2 ? `${item.contact1}, ${item.contact2}` : item.contact1;
        const qname = `${item.firstname} ${item.lastname}`;

        return (
            <View style={[styles.card, { backgroundColor: styleContext.card?.backgroundColor || '#fff' }]}>
                <View style={styles.cardHeader}>
                    <Text style={[styles.cardTitle, { color: styleContext.textTextStyle?.color }]}>{qname}</Text>
                </View>

                <View style={styles.cardSection}>
                    <Text style={[styles.cardText, { color: styleContext.textTextStyle?.color }]}>
                        Class : {item.clas} {item.section}
                    </Text>
                    <Text style={[styles.cardText, { color: styleContext.textTextStyle?.color }]}>
                        Roll No : {item.roll}
                    </Text>
                </View>

                <View style={styles.cardSection}>
                    <Text style={[styles.cardText, { color: styleContext.textTextStyle?.color }]}>
                        Reg No : {item.scholarno}
                    </Text>
                    <Text style={[styles.cardText, { color: styleContext.textTextStyle?.color }]}>
                        Enr No : {item.enrollment}
                    </Text>
                </View>

                <View style={styles.cardSection}>
                    <Text style={[styles.cardText, { color: styleContext.textTextStyle?.color }]}>
                        Father's Name : {item.father}
                    </Text>
                </View>

                <View style={styles.cardSection}>
                    <Text style={[styles.cardText, { color: styleContext.textTextStyle?.color }]}>
                        Contact No. : {contact}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {loading ? (
                <ActivityIndicator size="large" color="#6200ee" style={{ marginTop: 20 }} />
            ) : (
                <FlatList
                    data={students}
                    renderItem={renderItem}
                    keyExtractor={(item, index) => index.toString()}
                    ListEmptyComponent={<Text style={styles.emptyText}>No students found.</Text>}
                    contentContainerStyle={{ padding: 10 }}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    card: {
        padding: 15,
        borderRadius: 8,
        marginBottom: 10,
        backgroundColor: '#fff',
        elevation: 2,
    },
    cardHeader: {
        marginBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: 5,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    cardSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    cardText: {
        fontSize: 14,
        color: '#444',
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 30,
        color: '#777',
        fontSize: 16,
    },
});

export default OnlineClassStudentsScreen;
