import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Image,
  TextInput,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation } from '@apollo/client';
import { GET_USER_BY_ID, GET_POSTS } from '../queries/queries';
import { UPDATE_PROFILE } from '../queries/mutations';
import { jwtDecode } from 'jwt-decode';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

export default function MyProfileScreen({ navigation }) {
  const [userId, setUserId] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editProfilePicture, setEditProfilePicture] = useState('');

  useEffect(() => {
    const getUserId = async () => {
      try {
        const token = await AsyncStorage.getItem('access_token');
        if (token) {
          const decoded = jwtDecode(token);
          setUserId(decoded._id);
        }
      } catch (error) {
        console.error('Error getting user ID:', error);
      }
    };
    getUserId();
  }, []);

  const { loading, error, data, refetch } = useQuery(GET_USER_BY_ID, {
    variables: { id: userId },
    skip: !userId,
  });

  const { data: postsData, loading: postsLoading } = useQuery(GET_POSTS, {
    skip: !userId,
  });

  const [updateProfile, { loading: updateLoading }] = useMutation(UPDATE_PROFILE, {
    onCompleted: () => {
      setEditModalVisible(false);
      refetch();
    },
    onError: (error) => {
      console.error('Update error:', error.message);
    },
  });

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setEditProfilePicture(result.assets[0].uri);
    }
  };

  const handleEditProfile = () => {
    const user = data?.getUserById;
    setEditName(user?.name || '');
    setEditProfilePicture(user?.profilePicture || '');
    setEditModalVisible(true);
  };

  const handleSaveProfile = () => {
    updateProfile({
      variables: {
        name: editName,
        profilePicture: editProfilePicture,
      },
    });
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem('access_token');
          navigation.reset({
            index: 0,
            routes: [{ name: 'LoginScreen' }],
          });
        },
      },
    ]);
  };

  if (loading || !userId) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6364ff" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Error: {error.message}</Text>
      </View>
    );
  }

  const user = data?.getUserById;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={user?.profilePicture ? null : handleEditProfile}>
          {user?.profilePicture ? (
            <Image source={{ uri: user.profilePicture }} style={styles.avatarLarge} />
          ) : (
            <View style={styles.avatarLarge}>
              <Text style={styles.avatarLargeText}>
                {user?.name?.charAt(0).toUpperCase() || '?'}
              </Text>
            </View>
          )}
        </TouchableOpacity>
        <Text style={styles.name}>{user?.name || 'Unknown'}</Text>
        <Text style={styles.username}>@{user?.username || 'unknown'}</Text>
        
        <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
          <Ionicons name="create-outline" size={20} color="#fff" />
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{user?.followers?.length || 0}</Text>
          <Text style={styles.statLabel}>Followers</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{user?.following?.length || 0}</Text>
          <Text style={styles.statLabel}>Following</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>
            {postsData?.getPosts?.filter(post => post.author?._id === userId).length || 0}
          </Text>
          <Text style={styles.statLabel}>Posts</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>My Posts</Text>
        {postsLoading ? (
          <ActivityIndicator size="small" color="#6364ff" style={{ marginVertical: 20 }} />
        ) : postsData?.getPosts?.filter(post => post.author?._id === userId).length > 0 ? (
          postsData.getPosts
            .filter(post => post.author?._id === userId)
            .map((post) => (
              <TouchableOpacity
                key={post._id}
                style={styles.postCard}
                onPress={() => navigation.navigate('PostDetail', { postId: post._id })}
              >
                <Text style={styles.postContent} numberOfLines={3}>
                  {post.content}
                </Text>
                {post.imgUrl && (
                  <Image source={{ uri: post.imgUrl }} style={styles.postThumbnail} />
                )}
                <View style={styles.postStats}>
                  <View style={styles.postStat}>
                    <Ionicons name="chatbubble-outline" size={14} color="#9baec8" />
                    <Text style={styles.postStatText}>{post.comments?.length || 0}</Text>
                  </View>
                  <View style={styles.postStat}>
                    <Ionicons name="star-outline" size={14} color="#9baec8" />
                    <Text style={styles.postStatText}>{post.likes?.length || 0}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
        ) : (
          <Text style={styles.emptyText}>No posts yet</Text>
        )}
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>

      <View style={styles.bottomSpace} />

      {/* Edit Profile Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            
            <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
              {editProfilePicture ? (
                <Image source={{ uri: editProfilePicture }} style={styles.editAvatar} />
              ) : (
                <View style={styles.editAvatarPlaceholder}>
                  <Ionicons name="camera" size={40} color="#9baec8" />
                  <Text style={styles.editAvatarText}>Tap to select photo</Text>
                </View>
              )}
            </TouchableOpacity>

            <Text style={styles.inputLabel}>Name</Text>
            <TextInput
              style={styles.input}
              value={editName}
              onChangeText={setEditName}
              placeholder="Enter your name"
              placeholderTextColor="#9baec8"
            />

            <Text style={styles.inputLabel}>Profile Picture URL (optional)</Text>
            <TextInput
              style={styles.input}
              value={editProfilePicture}
              onChangeText={setEditProfilePicture}
              placeholder="Enter image URL"
              placeholderTextColor="#9baec8"
              autoCapitalize="none"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveProfile}
                disabled={updateLoading}
              >
                {updateLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#191b22',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#191b22',
  },
  header: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#282c37',
  },
  avatarLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#6364ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarLargeText: {
    fontSize: 48,
    color: '#fff',
    fontWeight: 'bold',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  username: {
    fontSize: 16,
    color: '#9baec8',
    marginBottom: 15,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6364ff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 10,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#282c37',
    marginTop: 1,
    paddingVertical: 20,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 14,
    color: '#9baec8',
    marginTop: 5,
  },
  section: {
    marginTop: 10,
    backgroundColor: '#282c37',
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#393f4f',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6364ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  userUsername: {
    fontSize: 14,
    color: '#9baec8',
  },
  emptyText: {
    color: '#9baec8',
    textAlign: 'center',
    paddingVertical: 20,
  },
  logoutButton: {
    backgroundColor: '#ff4757',
    margin: 15,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#ff5050',
    fontSize: 16,
  },
  bottomSpace: {
    height: 30,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#282c37',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  imagePicker: {
    alignSelf: 'center',
    marginBottom: 20,
  },
  editAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  editAvatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#393f4f',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editAvatarText: {
    color: '#9baec8',
    fontSize: 12,
    marginTop: 5,
  },
  inputLabel: {
    color: '#9baec8',
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#393f4f',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 16,
    marginBottom: 15,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#393f4f',
  },
  saveButton: {
    backgroundColor: '#6364ff',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  postCard: {
    backgroundColor: '#393f4f',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  postContent: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 10,
  },
  postThumbnail: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 10,
  },
  postStats: {
    flexDirection: 'row',
    gap: 15,
  },
  postStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  postStatText: {
    color: '#9baec8',
    fontSize: 12,
  },
});
