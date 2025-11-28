import { gql } from '@apollo/client';

export const GET_POSTS = gql`
  query GetPosts {
    getPosts {
      _id
      content
      tags
      imgUrl
      createdAt
      author {
        _id
        username
        name
        profilePicture
      }
      comments {
        content
        username
        createdAt
      }
      likes {
        username
        createdAt
      }
    }
  }
`;

export const GET_POST_BY_ID = gql`
  query GetPostById($id: ID!) {
    getPostById(id: $id) {
      _id
      content
      tags
      imgUrl
      createdAt
      author {
        _id
        username
        name
        email
        profilePicture
      }
      comments {
        content
        username
        createdAt
        user {
          _id
          username
          name
          profilePicture
        }
      }
      likes {
        username
        createdAt
        user {
          _id
          username
          name
          profilePicture
        }
      }
    }
  }
`;

export const SEARCH_USERS = gql`
  query SearchUsers($username: String!) {
    searchUsers(username: $username) {
      _id
      username
      name
      profilePicture
    }
  }
`;

export const GET_USER_BY_ID = gql`
  query GetUserById($id: ID!) {
    getUserById(id: $id) {
      _id
      username
      name
      profilePicture
      followers {
        _id
        username
        name
        profilePicture
      }
      following {
        _id
        username
        name
        profilePicture
      }
    }
  }
`;
