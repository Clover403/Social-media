import { ObjectId } from "mongodb";
import { getDb } from "../config/mongodb.js";

export default class Follow {
  static getCollection() {
    const db = getDb();
    const collection = db.collection("follows");
    return collection;
  }
  
  static async followUser(followingId, followerId) {
    const collection = this.getCollection();

    const follow = {
      followingId: new ObjectId(followingId),
      followerId: new ObjectId(followerId),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await collection.insertOne(follow);
  }
}
