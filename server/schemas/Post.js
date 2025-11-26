import Post from '../models/Post.js';

// Simple in-memory cache
let postsCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const postTypeDefs = `#graphql
  type UserDetail {
    _id: ID
    name: String
    username: String
  }

  type Comment {
    content: String
    username: String
    createdAt: String
    updatedAt: String
    user: UserDetail
  }

  type Like {
    username: String
    createdAt: String
    updatedAt: String
    user: UserDetail
  }

  type Author {
    _id: ID
    name: String
    username: String
    email: String
  }

  type Post {
    _id: ID
    content: String
    tags: [String]
    imgUrl: String
    authorId: ID
    author: Author
    comments: [Comment]
    likes: [Like]
    createdAt: String
    updatedAt: String
  }

  type Query {
    getPosts: [Post]
    getPostById(id: ID!): Post
  }

  input PostInput {
    content: String!
    tags: [String]
    imgUrl: String
    authorId: ID!
  }

  input CommentInput {
    content: String!
    username: String!
  }

  type Mutation {
    addPost(newPost: PostInput): Post
    commentPost(postId: ID!, comment: CommentInput!): String
    likePost(postId: ID!, username: String!): String
  }
`;

export const postResolvers = {
  Query: {
    getPosts: async () => {
      // Check if cache is valid
      const now = Date.now();
      if (postsCache && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
        console.log('Returning cached posts');
        return postsCache;
      }

      // Fetch fresh data
      console.log('Fetching fresh posts from database');
      const posts = await Post.getPosts();
      
      // Update cache
      postsCache = posts;
      cacheTimestamp = now;
      
      return posts;
    },
    
    getPostById: async (_, args) => {
      const { id } = args;
      const post = await Post.getPostById(id);
      return post;
    }
  },
  
  Mutation: {
    addPost: async (_, args) => {
      const { content, tags, imgUrl, authorId } = args.newPost;
      
      // Validation
      if (!content || content.trim().length === 0) {
        throw new Error("Content is required");
      }

      const post = await Post.addPost({ content, tags, imgUrl, authorId });
      
      // Invalidate cache
      console.log('Invalidating posts cache');
      postsCache = null;
      cacheTimestamp = null;
      
      return post;
    },
    
    commentPost: async (_, args) => {
      const { postId, comment } = args;
      
      if (!comment.content || comment.content.trim().length === 0) {
        throw new Error("Comment content is required");
      }
      
      if (!comment.username || comment.username.trim().length === 0) {
        throw new Error("Username is required");
      }
      
      const result = await Post.addComment(postId, comment);
      
      // Invalidate cache
      console.log('Invalidating posts cache');
      postsCache = null;
      cacheTimestamp = null;
      
      return result;
    },
    
    likePost: async (_, args) => {
      const { postId, username } = args;
      
      if (!username || username.trim().length === 0) {
        throw new Error("Username is required");
      }
      
      const result = await Post.likePost(postId, username);
      
      // Invalidate cache
      console.log('Invalidating posts cache');
      postsCache = null;
      cacheTimestamp = null;
      
      return result;
    }
  }
};

// Helper function to manually clear cache (if needed)
export const clearPostsCache = () => {
  postsCache = null;
  cacheTimestamp = null;
  console.log('Posts cache cleared manually');
};
