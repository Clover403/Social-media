import { gql } from '@apollo/client';

export const LOGIN = gql`
  mutation Login($username: String!, $password: String!) {
    login(username: $username, password: $password)
  }
`;

export const REGISTER = gql`
  mutation Register($newUser: UserInput!) {
    register(newUser: $newUser)
  }
`;

export const ADD_POST = gql`
  mutation AddPost($newPost: PostInput!) {
    addPost(newPost: $newPost) {
      _id
      content
      tags
      imgUrl
      createdAt
    }
  }
`;

export const COMMENT_POST = gql`
  mutation CommentPost($postId: ID!, $comment: CommentInput!) {
    commentPost(postId: $postId, comment: $comment)
  }
`;

export const LIKE_POST = gql`
  mutation LikePost($postId: ID!) {
    likePost(postId: $postId)
  }
`;

export const FOLLOW_USER = gql`
  mutation FollowUser($followingId: ID!) {
    followUser(followingId: $followingId)
  }
`;

export const UPDATE_PROFILE = gql`
  mutation UpdateProfile($name: String, $profilePicture: String) {
    updateProfile(name: $name, profilePicture: $profilePicture) {
      _id
      name
      username
      profilePicture
    }
  }
`;
