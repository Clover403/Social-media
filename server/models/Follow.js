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
  static async getFollowers(userId) {
    const collection = this.getCollection();
    const _id = new ObjectId(userId);

    const followers = await collection
      .aggregate([
        { $match: { followingId: _id } },
        {
          $lookup: {
            from: "users",
            localField: "followerId",
            foreignField: "_id",
            as: "follower",
          },
        },
        {
          $unwind: "$follower",
        },
        {
          $replaceRoot: { newRoot: "$follower" },
        },
      ])
      .toArray();
    return followers;
  }
  static async getFollowing(userId) {
    const collection = this.getCollection();
    const _id = new ObjectId(userId);

    const following = await collection
      .aggregate([
        { $match: { followerId: _id } },
        {
          $lookup: {
            from: "users",
            localField: "followingId",
            foreignField: "_id",
            as: "following",
          },
        },
        {
          $unwind: "$following",
        },
        {
          $replaceRoot: { newRoot: "$following" },
        },
      ])
      .toArray();
    return following;
  }
}
