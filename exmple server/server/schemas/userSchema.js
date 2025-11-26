import { redis } from '../config/redis.js';
import User from '../models/User.js';

export const userTypeDefs = `#graphql
  type User {
    _id: ID 
    name: String
    email: String
    balance: Int
  }

  type Query {
    getUsers: [User]
    getUserById(id: ID): User
    getProfile: User
  }
  
  input UserInput {
    name: String
    username: String
    password: String
  }

  type Mutation {
    register(newUser: UserInput): String
    login(username: String, password: String): String
    transfer(amount: Int, receiverId: ID, senderId: ID): String
  }
`;

export const userResolvers = {
  Query: {
    getUsers: async () => {
      const cacheUsers = await redis.get("users")
      if(cacheUsers) return JSON.parse(cacheUsers)

      const users = await User.getUsers() 
      await redis.set("users", JSON.stringify(users))

      return users
    },
    getUserById: async (_, args) => {
      const {id} = args
      
      const user = await User.getUserById(id)
      
      return user
    },
    getProfile: async function(_, args, contextValue){
      const user = await contextValue.auth()
      return null
    }
  },
  Mutation : {
    register: async function(_, args){
      const {name, username, password} = args.newUser
      const message = await User.createUser({name, username, password})
     
      await redis.del("users")
      return message
    },
    login: async function(_, args, contextValue){
      const {username, password} = args
      const token = await User.login(username, password)  
      
      return token
    },
    transfer: async (_, args) => {
      const {amount, receiverId, senderId} = args
      const message = await User.transfer(amount, receiverId, senderId) 
      
      return message
    }
  }
}

