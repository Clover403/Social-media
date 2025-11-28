import { ObjectId } from "mongodb";
import { getDb } from "../config/mongodb.js";

export default class Post {
  static getCollection() {
    const db = getDb();
    const collection = db.collection("posts");
    return collection;
  }

  static async getPosts() {
    const collection = this.getCollection();
    const posts = await collection
      .aggregate([
        {
          $lookup: {
            from: "users",
            localField: "authorId",
            foreignField: "_id",
            as: "author"
          }
        },
        {
          $unwind: {
            path: "$author",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $sort: { createdAt: -1 }
        }
      ])
      .toArray();
    return posts;
  }

  static async getPostById(id) {
    const _id = new ObjectId(id);
    const collection = this.getCollection();
    const posts = await collection
      .aggregate([
        { $match: { _id } },
        {
          $lookup: {
            from: "users",
            localField: "authorId",
            foreignField: "_id",
            as: "author"
          }
        },
        {
          $unwind: {
            path: "$author",
            preserveNullAndEmptyArrays: true
          }
        },
        // Lookup untuk comments: populate username menjadi user object
        {
          $lookup: {
            from: "users",
            localField: "comments.username",
            foreignField: "username",
            as: "commentUsers"
          }
        },
        // Lookup untuk likes: populate username menjadi user object
        {
          $lookup: {
            from: "users",
            localField: "likes.username",
            foreignField: "username",
            as: "likeUsers"
          }
        },
        // Transform comments array untuk menambahkan user details
        {
          $addFields: {
            comments: {
              $map: {
                input: "$comments",
                as: "comment",
                in: {
                  content: "$$comment.content",
                  username: "$$comment.username",
                  createdAt: "$$comment.createdAt",
                  updatedAt: "$$comment.updatedAt",
                  user: {
                    $arrayElemAt: [
                      {
                        $filter: {
                          input: "$commentUsers",
                          as: "u",
                          cond: { $eq: ["$$u.username", "$$comment.username"] }
                        }
                      },
                      0
                    ]
                  }
                }
              }
            },
            likes: {
              $map: {
                input: "$likes",
                as: "like",
                in: {
                  username: "$$like.username",
                  createdAt: "$$like.createdAt",
                  updatedAt: "$$like.updatedAt",
                  user: {
                    $arrayElemAt: [
                      {
                        $filter: {
                          input: "$likeUsers",
                          as: "u",
                          cond: { $eq: ["$$u.username", "$$like.username"] }
                        }
                      },
                      0
                    ]
                  }
                }
              }
            }
          }
        },
        // Hapus field temporary
        {
          $project: {
            commentUsers: 0,
            likeUsers: 0
          }
        }
      ])
      .toArray();
    return posts[0];
  }

  static async addPost(payload) {
    const collection = this.getCollection();

    if (!ObjectId.isValid(payload.authorId)) {
      throw new Error("Invalid authorId: must be a 24-character hex string.");
    }

    const newPost = {
      ...payload,
      authorId: new ObjectId(payload.authorId),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const result = await collection.insertOne(newPost);
    return this.getPostById(result.insertedId);
  }

  static async addComment(postId, payload) {
    const _id = new ObjectId(postId);
    const collection = this.getCollection();
    
    const comment = {
      ...payload,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await collection.updateOne(
      { _id },
      { 
        $push: { comments: comment },
        $set: { updatedAt: new Date() }
      }
    );
    
    return "Comment added successfully";
  }

  static async likePost(postId, username) {
    const _id = new ObjectId(postId);
    const collection = this.getCollection();
    
    // Check if user already liked the post
    const post = await collection.findOne({ _id });
    const hasLiked = post.likes?.some(like => like.username === username);
    
    if (hasLiked) {
      // Unlike: remove the like
      await collection.updateOne(
        { _id },
        { 
          $pull: { likes: { username } },
          $set: { updatedAt: new Date() }
        }
      );
      return "Post unliked successfully";
    } else {
      // Like: add the like
      const like = {
        username,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await collection.updateOne(
        { _id },
        { 
          $push: { likes: like },
          $set: { updatedAt: new Date() }
        }
      );
      return "Post liked successfully";
    }
  }
}
