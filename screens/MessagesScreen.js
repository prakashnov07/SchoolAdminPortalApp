import React, { useContext, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { CoreContext } from '../context/CoreContext';
import { StyleContext } from '../context/StyleContext';
import { LinearGradient } from 'expo-linear-gradient';
import SqlMessageItem from '../components/SqlMessageItem';

const blackColor = '#000';
const mainTextColorDark = '#4a00e0';

const styles = {
  studentPanelHeader: { paddingHorizontal: 15, paddingTop: 0, paddingBottom: 8 },
  studentUserName: { fontSize: 18, fontWeight: '600', marginBottom: 14, marginTop: 6, color: blackColor },
  searchBox: { flexDirection: 'row', borderRadius: 25, overflow: 'hidden', alignItems: 'center', backgroundColor: '#fff' },
  searchInput: { flex: 1, paddingHorizontal: 15, paddingVertical: 8, fontSize: 16, color: blackColor },
  searchButton: { padding: 10, borderTopRightRadius: 25, borderBottomRightRadius: 25, backgroundColor: '#ddd' },
  studentPanelBody: { flex: 1, padding: 15, backgroundColor: '#f4e0ff' }, 
  studentPanelTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 12, alignSelf: 'center', color: blackColor },
  schoolInfoBox: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  schoolName: { fontSize: 18, fontWeight: 'bold', color: blackColor },
  schoolSubtitle: { fontSize: 14, color: mainTextColorDark },
  postsContainer: { flex: 1 },
  postHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  postTitle: { fontSize: 18, fontWeight: '700', marginLeft: 8, flexShrink: 1, color: blackColor },
  postDescription: { fontSize: 16, marginBottom: 12, color: mainTextColorDark },
  photosCount: { fontSize: 14, marginBottom: 8, fontWeight: '600', color: blackColor },
  photosContainer: { flexDirection: 'row', justifyContent: 'flex-start' },
  photoThumbnail: { width: 90, height: 70, borderRadius: 12, marginRight: 10, backgroundColor: '#ccc' },
};

export default function MessagesScreen({ navigation }) {
  const coreContext = useContext(CoreContext);
  const styleContext = useContext(StyleContext);
  const {
    messages,
    fetchSqlMessages,
    getAllClasses,
    getAllSections,
    getSchoolData,
    checkUserValidity,
    markMessageAsRead,
    getCmo,
    getAllowedTabs,
    fetchCategories,
    checkFcmToken,
    checkStudentAttendance,
    addAllEnqiryNo,
    addAllRegistrationNo
  } = coreContext;

  const [searchText, setSearchText] = useState('');

  // Auto-refresh when screen comes into focus (e.g. after sending a message)
  useFocusEffect(
    useCallback(() => {
      fetchSqlMessages();
    }, [])
  );

  // Initialization logic from Home.js
  useEffect(() => {
    checkUserValidity(navigation);
    // fetchSqlMessages(); // Moved to useFocusEffect
    getAllClasses();
    getAllSections();
    getSchoolData();
    getCmo();
    getAllowedTabs();

    // Calling the newly added actions
    fetchCategories();
    // checkFcmToken(token); // Token needs to be retrieved first
    checkStudentAttendance('no'); // passing 'no' as default like in Home.js logic
    addAllEnqiryNo();
    addAllRegistrationNo();
  }, []);

  // Safety check for messages
  const safeMessages = messages || [];

  const filteredPosts = safeMessages.filter((post) => {
    const term = searchText.toLowerCase();
    const title = String(post.title || '').toLowerCase();
    const desc = String(post.description || '').toLowerCase();
    const content = String(post.content || '').toLowerCase();

    return title.includes(term) || desc.includes(term) || content.includes(term);
  });



  // Use SqlMessageItem for rendering
  const renderItem = useCallback(({ item: post }) => {
    if (!post) return null;
    return <SqlMessageItem item={post} />;
  }, []);

  // AdminPanelScreen style custom header
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false, // Hide default header
    });
  }, [navigation]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f4e0ff' }} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Custom Admin-Style Header */}
        <LinearGradient colors={['#5a45d4', '#8562ff']} style={{
          paddingTop: Platform.OS === 'android' ? 40 : 20,
          paddingBottom: 24,
          paddingHorizontal: 20,
          borderBottomLeftRadius: 24,
          borderBottomRightRadius: 24
        }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={{ fontSize: 18, color: '#ddd' }}>School Management Portal</Text>
              <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#fff', marginTop: 4 }}>Messages</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity onPress={() => fetchSqlMessages()} style={{ padding: 8, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20 }}>
                <Icon name="refresh" size={24} color="#fff" />
              </TouchableOpacity>
              {safeMessages.filter(m => m.isread !== 'yes').length > 0 && (
                <View style={{
                  position: 'absolute',
                  top: -5,
                  right: -5,
                  backgroundColor: 'red',
                  borderRadius: 10,
                  minWidth: 20,
                  height: 20,
                  justifyContent: 'center',
                  alignItems: 'center',
                  paddingHorizontal: 4,
                  borderWidth: 1.5,
                  borderColor: '#fff'
                }}>
                  <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>
                    {safeMessages.filter(m => m.isread !== 'yes').length}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Search Box */}
          <View style={{ marginTop: 20, flexDirection: 'row', backgroundColor: '#fff', borderRadius: 15, alignItems: 'center', paddingHorizontal: 15 }}>
            <Icon name="magnify" color="#555" size={20} />
            <TextInput
              placeholder="Search Messages..."
              placeholderTextColor="#999"
              style={{ flex: 1, paddingVertical: 12, paddingHorizontal: 10, fontSize: 16, color: '#000' }}
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>
        </LinearGradient>

        <View style={styles.studentPanelBody}>

          <View style={styles.schoolInfoBox}>
            <Image
              source={{ uri: coreContext.branch?.logo || 'https://via.placeholder.com/150' }}
              style={{ width: 36, height: 36, borderRadius: 18 }}
            />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={styles.schoolName}>{coreContext.branch?.branchname || 'SiddhantaIT'}</Text>
            </View>
          </View>
          <FlatList
            data={filteredPosts}
            renderItem={renderItem}
            keyExtractor={(item, index) => item.id?.toString() || index.toString()}
            style={styles.postsContainer}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}