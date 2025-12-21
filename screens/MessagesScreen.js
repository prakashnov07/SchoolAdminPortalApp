import React, { useContext, useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { CoreContext } from '../context/CoreContext';

const blackColor = '#000';
const mainTextColorDark = '#4a00e0';

const styles = {
  studentPanelHeader: { paddingHorizontal: 15, paddingVertical: 8 },
  studentUserName: { fontSize: 18, fontWeight: '600', marginBottom: 14, marginTop: 6, color: blackColor },
  searchBox: { flexDirection: 'row', borderRadius: 25, overflow: 'hidden', alignItems: 'center', marginTop: 18, backgroundColor: '#fff' },
  searchInput: { flex: 1, paddingHorizontal: 15, paddingVertical: 8, fontSize: 16, color: blackColor },
  searchButton: { padding: 10, borderTopRightRadius: 25, borderBottomRightRadius: 25, backgroundColor: '#ddd' },
  studentPanelBody: { flex: 1, padding: 15, backgroundColor: '#fff' },
  studentPanelTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 12, alignSelf: 'center', color: blackColor },
  schoolInfoBox: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  schoolName: { fontSize: 22, fontWeight: 'bold', color: blackColor },
  schoolSubtitle: { fontSize: 14, color: mainTextColorDark },
  postsContainer: { flex: 1 },
  postCard: {
    borderRadius: 18,
    padding: 15,
    marginBottom: 20,
    backgroundColor: '#f3e5f5',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84 },
      android: { elevation: 5 },
    }),
  },
  postHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  postTitle: { fontSize: 18, fontWeight: '700', marginLeft: 8, flexShrink: 1, color: blackColor },
  postDescription: { fontSize: 16, marginBottom: 12, color: mainTextColorDark },
  photosCount: { fontSize: 14, marginBottom: 8, fontWeight: '600', color: blackColor },
  photosContainer: { flexDirection: 'row', justifyContent: 'flex-start' },
  photoThumbnail: { width: 90, height: 70, borderRadius: 12, marginRight: 10, backgroundColor: '#ccc' },
};

export default function MessagesScreen({ navigation }) {
  const { messages } = useContext(CoreContext);
  const [searchText, setSearchText] = useState('');

  // Safety check for messages
  const safeMessages = messages || [];

  const filteredPosts = safeMessages.filter((post) =>
    post?.title?.toLowerCase().includes(searchText.toLowerCase())
  );

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      title: 'Messages',
      headerStyle: { backgroundColor: '#fff' },
      headerTintColor: blackColor,
      headerTitleStyle: { fontWeight: 'bold' },
    });
  }, [navigation]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
        <View style={styles.studentPanelHeader}>
          <Text style={styles.studentUserName}>Rahul Sharma - Class 10-A</Text>
          <View style={styles.searchBox}>
            <TextInput
              placeholder="Search Old Messages"
              placeholderTextColor="#999"
              style={styles.searchInput}
              value={searchText}
              onChangeText={setSearchText}
            />
            <TouchableOpacity style={styles.searchButton}>
              <Icon name="magnify" color={blackColor} size={20} />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.studentPanelBody}>
          <Text style={styles.studentPanelTitle}>Messages</Text>
          <View style={styles.schoolInfoBox}>
            <Icon name="school" size={36} color={blackColor} />
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.schoolName}>Goldentots</Text>
              <Text style={styles.schoolSubtitle}>School Management Portal</Text>
            </View>
          </View>
          <ScrollView style={styles.postsContainer}>
            {filteredPosts.map((post, index) => {
              if (!post) return null;
              return (
                <View key={post.id || index} style={styles.postCard}>
                  <View style={styles.postHeader}>
                    <Icon name="bell" size={20} color={blackColor} />
                    <Text style={styles.postTitle}>{post.title || 'No Title'}</Text>
                  </View>
                  <Text style={styles.postDescription}>{post.description || 'No Description'}</Text>
                  {post.attachment && (
                    <Text style={{ fontWeight: 'bold', marginTop: 8, color: '#555' }}>
                      Attachment: {post.attachment.type}
                    </Text>
                  )}
                  {post.photos && post.photos.length > 0 && (
                    <>
                      <Text style={styles.photosCount}>{post.photos.length} photos</Text>
                      <View style={styles.photosContainer}>
                        {post.photos.map((photoUri, idx) => (
                          <Image key={idx} source={{ uri: photoUri }} style={styles.photoThumbnail} />
                        ))}
                      </View>
                    </>
                  )}
                </View>
              );
            })}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}