import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Use 10.0.2.2 for Android Emulator, local IP for physical devices
const getServerUrl = () => {
  // Simple check: if running on Android emulator use 10.0.2.2, otherwise use local network IP
  return 'http://192.168.1.30:3000/';
};

const httpLink = createHttpLink({
  uri: getServerUrl(),
});

const authLink = setContext(async (_, { headers }) => {
  const token = await AsyncStorage.getItem('access_token');
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    }
  };
});

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});

export default client;
