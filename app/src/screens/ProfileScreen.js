import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useQuery, useMutation } from '@apollo/client';
import { GET_USER_BY_ID } from '../queries/queries';
import { FOLLOW_USER } from '../queries/mutations';

export default function ProfileScreen({ route, navigation }) {
  const { userId } = route.params;

  const { loading, error, data, refetch } = useQuery(GET_USER_BY_ID, {
    variables: { id: userId },
  });

  const [followUser, { loading: followLoading }] = useMutation(FOLLOW_USER, {
    onCompleted: () => {
      Alert.alert('Success', 'User followed!');
      refetch();
    },
    onError: (error) => {
      Alert.alert('Error', error.message);
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

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.coverPhoto}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarLargeText}>
              {user?.name?.charAt(0).toUpperCase() || '?'}
            </Text>
          </View>
        </View>

        <View style={styles.profileInfo}>
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
      </View>

      {/* Stats */}
      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{user?.followers?.length || 0}</Text>
          <Text style={styles.statLabel}>Followers</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{user?.following?.length || 0}</Text>
          <Text style={styles.statLabel}>Following</Text>
        </View>
      </View>

      {/* Followers List */}
      {user?.followers && user.followers.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Followers</Text>
          {user.followers.map((follower) => (
            <TouchableOpacity
              key={follower._id}
              style={styles.userCard}
              onPress={() => navigation.push('ProfileScreen', { userId: follower._id })}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {follower.name?.charAt(0).toUpperCase() || '?'}
                </Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{follower.name}</Text>
                <Text style={styles.userUsername}>@{follower.username}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Following List */}
      {user?.following && user.following.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Following</Text>
          {user.following.map((following) => (
            <TouchableOpacity
              key={following._id}
              style={styles.userCard}
              onPress={() => navigation.push('ProfileScreen', { userId: following._id })}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {following.name?.charAt(0).toUpperCase() || '?'}
                </Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{following.name}</Text>
                <Text style={styles.userUsername}>@{following.username}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
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
    backgroundColor: '#282c37',
  },
  coverPhoto: {
    height: 150,
    backgroundColor: '#393f4f',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  avatarLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#6364ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#282c37',
    marginBottom: -50,
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
});
