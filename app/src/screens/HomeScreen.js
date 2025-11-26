import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useQuery, useMutation } from '@apollo/client';
import { GET_POSTS } from '../queries/queries';
import { LIKE_POST } from '../queries/mutations';

export default function HomeScreen({ navigation }) {
  const { loading, error, data, refetch } = useQuery(GET_POSTS);
  const [likePost] = useMutation(LIKE_POST, {
    refetchQueries: [{ query: GET_POSTS }],
  });

  const handleLike = (postId) => {
    likePost({ variables: { postId } });
  };

  const formatDate = (date) => {
    const d = new Date(parseInt(date));
    const now = new Date();
    const diff = Math.floor((now - d) / 1000);
    
    if (diff < 60) return `${diff}s`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
  };

  const renderPost = ({ item }) => (
    <TouchableOpacity
      style={styles.postCard}
      onPress={() => navigation.navigate('PostDetailScreen', { postId: item._id })}
    >
      <View style={styles.postHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {item.author?.name?.charAt(0).toUpperCase() || '?'}
          </Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.authorName}>{item.author?.name || 'Unknown'}</Text>
          <Text style={styles.username}>@{item.author?.username || 'unknown'}</Text>
        </View>
        <Text style={styles.time}>{formatDate(item.createdAt)}</Text>
      </View>

      <Text style={styles.content}>{item.content}</Text>

      {item.tags && item.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {item.tags.map((tag, index) => (
            <Text key={index} style={styles.tag}>
              #{tag}
            </Text>
          ))}
        </View>
      )}

      {item.imgUrl && (
        <View style={styles.imageContainer}>
          <Text style={styles.imageText}>🖼️ Image attached</Text>
        </View>
      )}

      <View style={styles.postActions}>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>💬</Text>
          <Text style={styles.actionText}>{item.comments?.length || 0}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleLike(item._id)}
        >
          <Text style={styles.actionIcon}>
            {item.likes?.some(like => like.username) ? '❤️' : '🤍'}
          </Text>
          <Text style={styles.actionText}>{item.likes?.length || 0}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>🔄</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

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

  return (
    <View style={styles.container}>
      <FlatList
        data={data?.getPosts || []}
        renderItem={renderPost}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refetch}
            tintColor="#6364ff"
          />
        }
        contentContainerStyle={styles.listContainer}
      />
    </View>
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
  listContainer: {
    padding: 10,
  },
  postCard: {
    backgroundColor: '#282c37',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#393f4f',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6364ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerInfo: {
    flex: 1,
  },
  authorName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  username: {
    color: '#9baec8',
    fontSize: 14,
  },
  time: {
    color: '#9baec8',
    fontSize: 12,
  },
  content: {
    color: '#fff',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 10,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  tag: {
    color: '#6364ff',
    marginRight: 8,
    fontSize: 14,
  },
  imageContainer: {
    backgroundColor: '#393f4f',
    padding: 20,
    borderRadius: 4,
    alignItems: 'center',
    marginBottom: 10,
  },
  imageText: {
    color: '#9baec8',
  },
  postActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#393f4f',
    paddingTop: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  actionIcon: {
    fontSize: 18,
    marginRight: 5,
  },
  actionText: {
    color: '#9baec8',
    fontSize: 14,
  },
  errorText: {
    color: '#ff5050',
    fontSize: 16,
  },
});
