import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useQuery, useMutation } from '@apollo/client';
import { GET_POST_BY_ID } from '../queries/queries';
import { COMMENT_POST, LIKE_POST } from '../queries/mutations';

export default function PostDetailScreen({ route, navigation }) {
  const { postId } = route.params;
  const [commentText, setCommentText] = useState('');

  const { loading, error, data, refetch } = useQuery(GET_POST_BY_ID, {
    variables: { id: postId },
  });

  const [commentPost, { loading: commentLoading }] = useMutation(COMMENT_POST, {
    onCompleted: () => {
      setCommentText('');
      refetch();
      Alert.alert('Success', 'Comment added!');
    },
    onError: (error) => {
      Alert.alert('Error', error.message);
    },
  });

  const [likePost] = useMutation(LIKE_POST, {
    onCompleted: () => refetch(),
    onError: (error) => Alert.alert('Error', error.message),
  });

  const handleComment = () => {
    if (!commentText.trim()) {
      Alert.alert('Error', 'Comment cannot be empty');
      return;
    }
    commentPost({
      variables: {
        postId,
        comment: { content: commentText.trim() },
      },
    });
  };

  const handleLike = () => {
    likePost({ variables: { postId } });
  };

  const formatDate = (date) => {
    const d = new Date(parseInt(date));
    return d.toLocaleString();
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

  const post = data?.getPostById;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView}>
        {/* Post Header */}
        <View style={styles.postHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {post.author?.name?.charAt(0).toUpperCase() || '?'}
            </Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.authorName}>{post.author?.name || 'Unknown'}</Text>
            <Text style={styles.username}>@{post.author?.username || 'unknown'}</Text>
            <Text style={styles.time}>{formatDate(post.createdAt)}</Text>
          </View>
        </View>

        {/* Post Content */}
        <Text style={styles.content}>{post.content}</Text>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {post.tags.map((tag, index) => (
              <Text key={index} style={styles.tag}>
                #{tag}
              </Text>
            ))}
          </View>
        )}

        {/* Image */}
        {post.imgUrl && (
          <View style={styles.imageContainer}>
            <Text style={styles.imageText}>🖼️ {post.imgUrl}</Text>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actionsBar}>
          <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
            <Text style={styles.actionIcon}>
              {post.likes?.length > 0 ? '❤️' : '🤍'}
            </Text>
            <Text style={styles.actionText}>
              {post.likes?.length || 0} likes
            </Text>
          </TouchableOpacity>

          <View style={styles.actionButton}>
            <Text style={styles.actionIcon}>💬</Text>
            <Text style={styles.actionText}>
              {post.comments?.length || 0} comments
            </Text>
          </View>
        </View>

        {/* Comments Section */}
        <View style={styles.commentsSection}>
          <Text style={styles.sectionTitle}>Comments</Text>

          {post.comments && post.comments.length > 0 ? (
            post.comments.map((comment, index) => (
              <View key={index} style={styles.commentCard}>
                <View style={styles.commentHeader}>
                  <View style={styles.commentAvatar}>
                    <Text style={styles.commentAvatarText}>
                      {comment.user?.name?.charAt(0).toUpperCase() || comment.username?.charAt(0).toUpperCase() || '?'}
                    </Text>
                  </View>
                  <View style={styles.commentInfo}>
                    <Text style={styles.commentAuthor}>
                      {comment.user?.name || comment.username || 'Unknown'}
                    </Text>
                    <Text style={styles.commentUsername}>
                      @{comment.user?.username || comment.username || 'unknown'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.commentContent}>{comment.content}</Text>
                <Text style={styles.commentTime}>{formatDate(comment.createdAt)}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.noComments}>No comments yet</Text>
          )}
        </View>
      </ScrollView>

      {/* Comment Input */}
      <View style={styles.commentInputContainer}>
        <TextInput
          style={styles.commentInput}
          placeholder="Write a comment..."
          placeholderTextColor="#666"
          value={commentText}
          onChangeText={setCommentText}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendButton, commentLoading && styles.sendButtonDisabled]}
          onPress={handleComment}
          disabled={commentLoading}
        >
          {commentLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.sendButtonText}>Send</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
  scrollView: {
    flex: 1,
  },
  postHeader: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#282c37',
    borderBottomWidth: 1,
    borderBottomColor: '#393f4f',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6364ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerInfo: {
    flex: 1,
  },
  authorName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  username: {
    color: '#9baec8',
    fontSize: 14,
  },
  time: {
    color: '#9baec8',
    fontSize: 12,
    marginTop: 4,
  },
  content: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 24,
    padding: 15,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  tag: {
    color: '#6364ff',
    marginRight: 8,
    fontSize: 14,
  },
  imageContainer: {
    backgroundColor: '#282c37',
    padding: 15,
    marginHorizontal: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  imageText: {
    color: '#9baec8',
    fontSize: 14,
  },
  actionsBar: {
    flexDirection: 'row',
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderTopWidth: 1,
    borderTopColor: '#393f4f',
    borderBottomWidth: 1,
    borderBottomColor: '#393f4f',
    backgroundColor: '#282c37',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  actionIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  actionText: {
    color: '#9baec8',
    fontSize: 14,
  },
  commentsSection: {
    padding: 15,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  commentCard: {
    backgroundColor: '#282c37',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  commentHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#6364ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  commentAvatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  commentInfo: {
    flex: 1,
  },
  commentAuthor: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  commentUsername: {
    color: '#9baec8',
    fontSize: 12,
  },
  commentContent: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 5,
  },
  commentTime: {
    color: '#9baec8',
    fontSize: 11,
  },
  noComments: {
    color: '#9baec8',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
  },
  commentInputContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#282c37',
    borderTopWidth: 1,
    borderTopColor: '#393f4f',
    alignItems: 'center',
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#393f4f',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    color: '#fff',
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#6364ff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginLeft: 8,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  errorText: {
    color: '#ff5050',
    fontSize: 16,
  },
});
