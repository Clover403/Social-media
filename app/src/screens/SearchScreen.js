import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useLazyQuery } from '@apollo/client';
import { SEARCH_USERS } from '../queries/queries';

export default function SearchScreen({ navigation }) {
  const [searchText, setSearchText] = useState('');
  const [searchUsers, { loading, data }] = useLazyQuery(SEARCH_USERS);

  const handleSearch = () => {
    if (searchText.trim()) {
      searchUsers({ variables: { username: searchText.trim() } });
    }
  };

  const renderUser = ({ item }) => (
    <TouchableOpacity
      style={styles.userCard}
      onPress={() => navigation.navigate('ProfileScreen', { userId: item._id })}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {item.name?.charAt(0).toUpperCase() || '?'}
        </Text>
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.username}>@{item.username}</Text>
      </View>
      <Text style={styles.arrow}>›</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search users..."
          placeholderTextColor="#666"
          value={searchText}
          onChangeText={setSearchText}
          onSubmitEditing={handleSearch}
          autoCapitalize="none"
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>

      {loading && (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#6364ff" />
        </View>
      )}

      {!loading && data?.searchUsers && (
        <FlatList
          data={data.searchUsers}
          renderItem={renderUser}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No users found</Text>
            </View>
          }
        />
      )}

      {!loading && !data && (
        <View style={styles.centerContainer}>
          <Text style={styles.placeholderText}>🔍</Text>
          <Text style={styles.placeholderSubtext}>
            Search for users by username
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#191b22',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#282c37',
    borderBottomWidth: 1,
    borderBottomColor: '#393f4f',
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#393f4f',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 16,
    marginRight: 10,
  },
  searchButton: {
    backgroundColor: '#6364ff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 10,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#282c37',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#393f4f',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#6364ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  name: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  username: {
    color: '#9baec8',
    fontSize: 14,
  },
  arrow: {
    color: '#9baec8',
    fontSize: 24,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#9baec8',
    fontSize: 16,
  },
  placeholderText: {
    fontSize: 60,
    marginBottom: 10,
  },
  placeholderSubtext: {
    color: '#9baec8',
    fontSize: 16,
  },
});
