import User from "../models/User.js";
import Follow from "../models/Follow.js";

export const userTypeDefs = `#graphql
  type User {
    _id: ID
    name: String
    username: String
    email: String
    password: String
    profilePicture: String
    followers: [User]
    following: [User]
  }

  type Query {
    getUsers: [User]
    getUserById(id: ID): User
    getProfile: User
    searchUsers(username: String!): [User]
  }
  
  input UserInput {
    name: String
    username: String
    email: String
    password: String
  }

  type Mutation {
    register(newUser: UserInput): String
    login(username: String, password: String): String
    followUser(followingId: ID!): String
    updateProfile(name: String, profilePicture: String): User
  }
`;

export const userResolvers = {
  Query: {
    getUsers: async () => {
      const users = await User.getUsers();
      return users;
    },
    getUserById: async (_, args) => {
      const { id } = args;
      const user = await User.getUserById(id);
      return user;
    },
    getProfile: async function (_, __, contextValue) {
      const user = await contextValue.auth();
      return user;
    },
    searchUsers: async (_, args) => {
      const { username } = args;
      const users = await User.searchUsers(username);
      return users;
    },
  },
  Mutation: {
    register: async function (_, args) {
      const { name, username, email, password } = args.newUser;
      const message = await User.createUser({ name, username, email, password });
      return message;
    },
    login: async function (_, args) {
      const { username, password } = args;
      const token = await User.login(username, password);
      return token;
    },
    followUser: async function (_, args, contextValue) {
      const currentUser = await contextValue.auth();
      const { followingId } = args;
      
      if (currentUser._id.toString() === followingId) {
        throw new Error("You cannot follow yourself");
      }
      
      await Follow.followUser(followingId, currentUser._id.toString());
      return "Successfully followed user";
    },
    updateProfile: async function (_, args, contextValue) {
      const currentUser = await contextValue.auth();
      const { name, profilePicture } = args;
      
      const updatedUser = await User.updateProfile(
        currentUser._id.toString(),
        { name, profilePicture }
      );
      return updatedUser;
    },
  },
};
