import { ObjectId } from "mongodb";
import { client, getDb } from "../config/mongodb.js";
import {  comparePassword, hashPassword } from "../helpers/bcrypt.js";
import { signToken } from "../helpers/jwt.js";

export default class User {
  static getCollection(){
    const db = getDb() 
    const collection = db.collection("users")
    return collection
  }

  static async getUsers(){
    const collection = this.getCollection()
    const users = await collection.find().toArray()
    return users
  }
  
  static async getUserById(id){
    const _id = new ObjectId(id)
    const collection = this.getCollection()
    const user = await collection.findOne({_id})
    
    return user
  }
  
  static async createUser(payload){
    const collection = this.getCollection()
    payload.password = hashPassword(payload.password)
    await collection.insertOne(payload)
    
    return "create sukses"
  }
  
  static async login(username, password){
    const collection = this.getCollection()
    
    const user = await collection.findOne({username})
    if(!user) throw new Error("Invalid username or password")
    
    const isPasswordValid = comparePassword(password, user.password)
    if(!isPasswordValid) throw new Error("Invalid username or password")
    
    const token = signToken({username: user.username, _id: user._id})
    
    return token
  }

  static async transfer(amount, receiverId, senderId){
    const session = client.startSession();

    try {
      const message = await session.withTransaction(async () => {
        const collection = this.getCollection()
        const convertedSenderId = new ObjectId(senderId)
        const sender = await collection.findOne({_id: convertedSenderId})
        if(!sender) throw new Error("sender gak ada")

        if(sender.balance < amount) throw new Error("saldo tidak cukup")

        const convertedReceiverId = new ObjectId(receiverId)
        const receiver = await collection.findOne({_id: convertedReceiverId})
        if(!receiver) throw new Error("receiver gak ada")


        await collection.updateOne({_id: convertedSenderId}, {
          $set: {balance: sender.balance - amount} 
        }, {session})

        await collection.updateOne({_id: convertedReceiverId}, {
          $set: {balance: receiver.balance + amount} 
        }, {session})

        return "transfer berhasil"
      })

      return message
    } finally {
      await session.endSession()
    }
  }
}

await User.getUsers()
