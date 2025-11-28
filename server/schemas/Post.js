import { redis } from '../config/redis.js';
import Post from '../models/Post.js';

export const postTypeDefs = `#graphql
  type UserDetail {
    _id: ID
    name: String
    username: String
    profilePicture: String
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
    profilePicture: String
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
  }

  input CommentInput {
    content: String!
  }

  type Mutation {
    addPost(newPost: PostInput): Post
    commentPost(postId: ID!, comment: CommentInput!): String
    likePost(postId: ID!): String
  }
`;

export const postResolvers = {
  Query: {
    getPosts: async () => {
      const startRedis = Date.now()
      const cachePosts = await redis.get("posts")
      const redisTime = Date.now() - startRedis
      
      if(cachePosts) {
        console.log(` Returning cached posts from Redis (${redisTime}ms)`)
        return JSON.parse(cachePosts)
      }

      const posts = await Post.getPosts();
      
      await redis.set("posts", JSON.stringify(posts))
      
      return posts;
    },
    
    getPostById: async (_, args) => {
      const { id } = args;
      const post = await Post.getPostById(id);
      return post;
    }
  },
  
  Mutation: {
    addPost: async (_, args, contextValue) => {
      // Require authentication
      const currentUser = await contextValue.auth();
      
      const { content, tags, imgUrl } = args.newPost;
      
      // Validation
      if (!content || content.trim().length === 0) {
        throw new Error("Content is required");
      }

      // Auto-populate authorId dari user yang login
      const post = await Post.addPost({ 
        content, 
        tags, 
        imgUrl, 
        authorId: currentUser._id.toString() 
      });
      
      // Invalidate cache
      await redis.del("posts")
      console.log(' Redis cache invalidated (addPost)')
      
      return post;
    },
    
    commentPost: async (_, args, contextValue) => {
      // Require authentication
      const currentUser = await contextValue.auth();
      
      const { postId, comment } = args;
      
      if (!comment.content || comment.content.trim().length === 0) {
        throw new Error("Comment content is required");
      }
      
      // Auto-populate username dari user yang login
      const result = await Post.addComment(postId, {
        content: comment.content,
        username: currentUser.username
      });
      
      // Invalidate cache
      await redis.del("posts")
      console.log(' Redis cache invalidated (commentPost)')
      
      return result;
    },
    
    likePost: async (_, args, contextValue) => {
      // Require authentication
      const currentUser = await contextValue.auth();
      
      const { postId } = args;
      
      // Auto-populate username dari user yang login
      const result = await Post.likePost(postId, currentUser.username);
      
      // Invalidate cache
      await redis.del("posts")
      console.log(' Redis cache invalidated (likePost)')
      
      return result;
    }
  }
};
