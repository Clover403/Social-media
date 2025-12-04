import { ObjectId } from "mongodb";
import { getDb } from "../config/mongodb.js";
import { comparePassword, hashPassword } from "../helpers/bcrypt.js";
import { signToken } from "../helpers/jwt.js";

export default class User {
  static getCollection() {
    const db = getDb();
    return db.collection("users");
  }

  static async getUsers() {
    const db = getDb();
    const usersCollection = db.collection("users");

    const users = await usersCollection
      .aggregate([
        // Lookup followers
        {
          $lookup: {
            from: "follows",
            localField: "_id",
            foreignField: "followingId",
            as: "followerRelations"
          }
        },
        // Lookup following
        {
          $lookup: {
            from: "follows",
            localField: "_id",
            foreignField: "followerId",
            as: "followingRelations"
          }
        },
        // Lookup user details untuk followers
        {
          $lookup: {
            from: "users",
            localField: "followerRelations.followerId",
            foreignField: "_id",
            as: "followers"
          }
        },
        // Lookup user details untuk following
        {
          $lookup: {
            from: "users",
            localField: "followingRelations.followingId",
            foreignField: "_id",
            as: "following"
          }
        },
        // Hapus field temporary
        {
          $project: {
            followerRelations: 0,
            followingRelations: 0
          }
        }
      ])
      .toArray();

    return users;
  }

  static async getUserById(id) {
    const _id = new ObjectId(id);
    const db = getDb();
    const usersCollection = db.collection("users");

    const result = await usersCollection
      .aggregate([
        { $match: { _id } },
        // Lookup followers (yang follow user ini)
        {
          $lookup: {
            from: "follows",
            localField: "_id",
            foreignField: "followingId",
            as: "followerRelations"
          }
        },
        // Lookup following (yang di-follow user ini)
        {
          $lookup: {
            from: "follows",
            localField: "_id",
            foreignField: "followerId",
            as: "followingRelations"
          }
        },
        // Lookup user details untuk followers
        {
          $lookup: {
            from: "users",
            localField: "followerRelations.followerId",
            foreignField: "_id",
            as: "followers"
          }
        },
        // Lookup user details untuk following
        {
          $lookup: {
            from: "users",
            localField: "followingRelations.followingId",
            foreignField: "_id",
            as: "following"
          }
        },
        // Hapus field temporary
        {
          $project: {
            followerRelations: 0,
            followingRelations: 0
          }
        }
      ])
      .toArray();

    return result[0];
  }

  static async findByUsername(username) {
    const collection = this.getCollection();
    const user = await collection.findOne({ username });
    return user;
  }

  static async searchUsers(keyword) {
    const collection = this.getCollection();
    const users = await collection
      .find({
        $or: [
          { username: { $regex: keyword, $options: "i" } },
          { name: { $regex: keyword, $options: "i" } },
        ],
      })
      .toArray();

    return users;
  }

  static async createUser(payload) {
    const collection = this.getCollection();

    const name = payload.name?.trim();
    const username = payload.username?.trim();
    const email = payload.email?.trim().toLowerCase();
    const password = payload.password;

    if (!name) {
      throw new Error("Name is required");
    }

    if (!username) {
      throw new Error("Username is required");
    }

    if (!email) {
      throw new Error("Email is required");
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      throw new Error("Invalid email format");
    }

    const existingEmail = await collection.findOne({ email });
    if (existingEmail) {
      throw new Error("Email already registered");
    }

    const existingUsername = await collection.findOne({ username });
    if (existingUsername) {
      throw new Error("Username already taken");
    }

    if (!password || password.length < 5) {
      throw new Error("Password must be at least 5 characters long");
    }

    const newUser = {
      name,
      username,
      email,
      password: hashPassword(password),
      profilePicture: payload.profilePicture,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await collection.insertOne(newUser);
    return "create sukses";
  }

  static async login(username, password) {
    const collection = this.getCollection();
    const normalizedUsername = username?.trim();
    if (!normalizedUsername || !password) {
      throw new Error("Invalid username or password");
    }

    const user = await collection.findOne({ username: normalizedUsername });
    if (!user) throw new Error("Invalid username or password");

    const isPasswordValid = comparePassword(password, user.password);
    if (!isPasswordValid) throw new Error("Invalid username or password");

    const token = signToken({ username: user.username, _id: user._id });
    return token;
  }

  static async updateProfile(userId, payload) {
    const _id = new ObjectId(userId);
    const collection = this.getCollection();
    
    const updateData = {};
    if (payload.name) updateData.name = payload.name;
    if (payload.profilePicture !== undefined) updateData.profilePicture = payload.profilePicture;
    
    await collection.updateOne(
      { _id },
      { $set: updateData }
    );
    
    return this.getUserById(userId);
  }
}
