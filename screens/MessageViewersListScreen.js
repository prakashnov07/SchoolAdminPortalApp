import React, { useState, useEffect, useContext } from 'react';
import { Text, View, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import axios from 'axios';
import { CoreContext } from '../context/CoreContext';
import { StyleContext } from '../context/StyleContext';
import MessageViewersListItem from '../components/MessageViewersListItem';

const MessageViewersListScreen = ({ route }) => {
    const { item } = route.params;
    const coreContext = useContext(CoreContext);
    const styleContext = useContext(StyleContext);
    
    const [loader, setLoader] = useState(false);
    const [viewers, setViewers] = useState([]);

    useEffect(() => {
        fetchMessageViewers();
    }, []);

    const fetchMessageViewers = () => {
        setLoader(true);
        axios.get('get-message-readers', { params: { id: item.id, branchid: coreContext.branchid } })
            .then(response => {
                setViewers(response.data.viewers);
                setLoader(false);
            })
            .catch(error => {
                console.error(error);
                setLoader(false);
            });
    };

    if (loader) {
        return (
            <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color={styleContext?.primaryColor || '#6a00ff'} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: styleContext?.backgroundColor || '#f5f5f5' }]}>
             <FlatList
                ListHeaderComponent={
                    <View style={styles.headerContainer}>
                        <Text style={[styles.headerText, { color: styleContext?.textColor || '#333' }]}>
                            {item.content?.replace(/<[^>]+>/g, '') || item.title}
                        </Text>
                    </View>
                }
                data={viewers}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item, index }) => <MessageViewersListItem item={item} index={index} />}
                contentContainerStyle={styles.listContent}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerContainer: {
        padding: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        marginBottom: 10,
    },
    headerText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    listContent: {
        paddingBottom: 20,
    }
});

export default MessageViewersListScreen;
