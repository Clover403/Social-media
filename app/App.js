import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ApolloProvider } from '@apollo/client';
import client from './src/config/apollo';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import MainNavigator from './src/navigators/MainNavigator';
import PostDetailScreen from './src/screens/PostDetailScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import CreatePostScreen from './src/screens/CreatePostScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <ApolloProvider client={client}>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen
            name="LoginScreen"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="RegisterScreen"
            component={RegisterScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="MainNavigator"
            component={MainNavigator}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Create"
            component={CreatePostScreen}
            options={{
              title: 'Create Post',
              headerStyle: { backgroundColor: '#282c37' },
              headerTintColor: '#fff',
            }}
          />
          <Stack.Screen
            name="PostDetail"
            component={PostDetailScreen}
            options={{
              title: 'Post',
              headerStyle: { backgroundColor: '#282c37' },
              headerTintColor: '#fff',
            }}
          />
          <Stack.Screen
            name="UserProfile"
            component={ProfileScreen}
            options={{
              title: 'Profile',
              headerStyle: { backgroundColor: '#282c37' },
              headerTintColor: '#fff',
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </ApolloProvider>
  );
}
