import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useMutation } from '@apollo/client';
import { ADD_POST } from '../queries/mutations';
import { GET_POSTS } from '../queries/queries';

export default function CreatePostScreen({ navigation }) {
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [imgUrl, setImgUrl] = useState('');

  const [addPost, { loading }] = useMutation(ADD_POST, {
    refetchQueries: [{ query: GET_POSTS }],
    onCompleted: () => {
      Alert.alert('Success', 'Post created successfully!');
      setContent('');
      setTags('');
      setImgUrl('');
      navigation.goBack();
    },
    onError: (error) => {
      Alert.alert('Error', error.message);
    },
  });

  const handleSubmit = () => {
    if (!content.trim()) {
      Alert.alert('Error', 'Content is required');
      return;
    }

    const tagsArray = tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    addPost({
      variables: {
        newPost: {
          content: content.trim(),
          tags: tagsArray.length > 0 ? tagsArray : null,
          imgUrl: imgUrl.trim() || null,
        },
      },
    });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Text style={styles.label}>What's on your mind?</Text>
          
          <TextInput
            style={styles.textArea}
            placeholder="Write your post here..."
            placeholderTextColor="#666"
            value={content}
            onChangeText={setContent}
            multiline
            numberOfLines={6}
          />

          <Text style={styles.label}>Tags (comma separated)</Text>
          <TextInput
            style={styles.input}
            placeholder="tech, news, thoughts"
            placeholderTextColor="#666"
            value={tags}
            onChangeText={setTags}
          />

          <Text style={styles.label}>Image URL (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="https://example.com/image.jpg"
            placeholderTextColor="#666"
            value={imgUrl}
            onChangeText={setImgUrl}
            autoCapitalize="none"
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Publish</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#191b22',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  label: {
    color: '#9baec8',
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '600',
  },
  textArea: {
    backgroundColor: '#282c37',
    borderRadius: 8,
    padding: 15,
    color: '#fff',
    fontSize: 16,
    minHeight: 150,
    textAlignVertical: 'top',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#393f4f',
  },
  input: {
    backgroundColor: '#282c37',
    borderRadius: 8,
    padding: 15,
    color: '#fff',
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#393f4f',
  },
  button: {
    backgroundColor: '#6364ff',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  cancelButtonText: {
    color: '#9baec8',
    fontSize: 16,
  },
});
