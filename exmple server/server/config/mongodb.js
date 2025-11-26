import {MongoClient} from "mongodb"

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017"
const dbName = process.env.MONGODB_DBNAME || "h8-p3-w1"

let db = null

export const client = new MongoClient(uri)

function connect(){
  try {
    db = client.db(dbName)
    return db
  } catch(err){
    console.log(err, "<<<< gagal terhubung ke db")
  }
}

export function getDb(){
  if(!db) return connect()
  return db
}

