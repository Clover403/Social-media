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
    const collection = this.getCollection();
    const users = await collection.find().toArray();
    return users;
  }

  static async getUserById(id) {
    const _id = new ObjectId(id);
    const collection = this.getCollection();
    const user = await collection.findOne({ _id });
    return user;
  }

  static async findByUsername(username) {
    const collection = this.getCollection();
    const user = await collection.findOne({ username });
    return user;
  }

  static async findByUsernameOrEmail(username, email) {
    const collection = this.getCollection();
    const user = await collection.findOne({
      $or: [{ username }, { email }],
    });
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
    payload.password = hashPassword(payload.password);
    await collection.insertOne(payload);
    return "create sukses";
  }

  static async login(username, password) {
    const collection = this.getCollection();
    const user = await collection.findOne({ username });
    if (!user) throw new Error("Invalid username or password");

    const isPasswordValid = comparePassword(password, user.password);
    if (!isPasswordValid) throw new Error("Invalid username or password");

    const token = signToken({ username: user.username, _id: user._id });
    return token;
  }
}
