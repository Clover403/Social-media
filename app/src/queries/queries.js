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
      }
      comments {
        content
        username
        createdAt
        user {
          _id
          username
          name
        }
      }
      likes {
        username
        createdAt
        user {
          _id
          username
          name
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
    }
  }
`;

export const GET_USER_BY_ID = gql`
  query GetUserById($id: ID!) {
    getUserById(id: $id) {
      _id
      username
      name
      followers {
        _id
        username
        name
      }
      following {
        _id
        username
        name
      }
    }
  }
`;
