import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useQuery, useMutation } from '@apollo/client';
import { GET_USER_BY_ID, GET_POSTS } from '../queries/queries';
import { FOLLOW_USER } from '../queries/mutations';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen({ route, navigation }) {
  const { userId } = route.params;

  const { loading, error, data, refetch } = useQuery(GET_USER_BY_ID, {
    variables: { id: userId },
  });

  const { data: postsData, loading: postsLoading } = useQuery(GET_POSTS);

  const [followUser, { loading: followLoading }] = useMutation(FOLLOW_USER, {
    onCompleted: () => {
      refetch();
    },
    onError: (error) => {
      console.log('Follow error:', error.message);
    },
  });

  const handleFollow = () => {
    followUser({ variables: { followingId: userId } });
  };

  if (loading) {
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
  const userPosts = postsData?.getPosts?.filter(post => post.author?._id === userId) || [];

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.header}>
        {user?.profilePicture ? (
          <Image source={{ uri: user.profilePicture }} style={styles.avatarLarge} />
        ) : (
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarLargeText}>
              {user?.name?.charAt(0).toUpperCase() || '?'}
            </Text>
          </View>
        )}
        <Text style={styles.name}>{user?.name || 'Unknown'}</Text>
        <Text style={styles.username}>@{user?.username || 'unknown'}</Text>

        <TouchableOpacity
          style={[styles.followButton, followLoading && styles.followButtonDisabled]}
          onPress={handleFollow}
          disabled={followLoading}
        >
          {followLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.followButtonText}>Follow</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Stats */}
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
          <Text style={styles.statNumber}>{userPosts.length}</Text>
          <Text style={styles.statLabel}>Posts</Text>
        </View>
      </View>

      {/* User Posts */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Posts</Text>
        {postsLoading ? (
          <ActivityIndicator size="small" color="#6364ff" style={{ marginVertical: 20 }} />
        ) : userPosts.length > 0 ? (
          userPosts.map((post) => (
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

      <View style={styles.bottomSpace} />
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
    color: '#fff',
    fontSize: 40,
    fontWeight: 'bold',
  },
  profileInfo: {
    padding: 20,
    paddingTop: 60,
    alignItems: 'center',
  },
  name: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  username: {
    color: '#9baec8',
    fontSize: 16,
    marginBottom: 15,
  },
  followButton: {
    backgroundColor: '#6364ff',
    paddingHorizontal: 30,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 120,
    alignItems: 'center',
  },
  followButtonDisabled: {
    opacity: 0.6,
  },
  followButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  stats: {
    flexDirection: 'row',
    backgroundColor: '#282c37',
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#393f4f',
    borderBottomWidth: 1,
    borderBottomColor: '#393f4f',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#9baec8',
    fontSize: 14,
    marginTop: 5,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#393f4f',
  },
  section: {
    padding: 15,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#282c37',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#6364ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  userUsername: {
    color: '#9baec8',
    fontSize: 14,
  },
  errorText: {
    color: '#ff5050',
    fontSize: 16,
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
  emptyText: {
    color: '#9baec8',
    textAlign: 'center',
    paddingVertical: 20,
  },
  bottomSpace: {
    height: 30,
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
});
