# 📚 NOTES - Social Media Backend (GraphQL + MongoDB)

## 🎯 Overview
Backend aplikasi social media menggunakan **GraphQL** (Apollo Server) dan **MongoDB** dengan fitur lengkap untuk user management, posting, comments, likes, dan follow system.

---

## 🔑 Konsep Penting untuk Pemula

### 1. **GraphQL vs REST API**
- **REST**: Multiple endpoints (`/users`, `/posts`, `/comments`)
- **GraphQL**: Single endpoint dengan query yang fleksibel
- Keuntungan: Client bisa request data yang **spesifik** (tidak over-fetching)

### 2. **MongoDB Aggregation Pipeline**
MongoDB aggregation adalah cara untuk memproses data dengan beberapa tahapan:

```javascript
.aggregate([
  { $match: { _id } },      // Filter data (seperti WHERE di SQL)
  { $lookup: {...} },        // Join dengan collection lain (seperti JOIN di SQL)
  { $unwind: {...} },        // Flatten array menjadi individual documents
  { $sort: { field: -1 } }   // Sort data (-1 = descending, 1 = ascending)
])
```

**Contoh Real**: Mengambil post dengan author name
```javascript
// Tanpa aggregation: harus query 2x
const post = await db.posts.findOne({ _id });
const author = await db.users.findOne({ _id: post.authorId });

// Dengan aggregation: 1x query saja!
const post = await db.posts.aggregate([
  { $match: { _id } },
  { $lookup: { from: "users", localField: "authorId", foreignField: "_id", as: "author" } }
]);
```

### 3. **Cache dengan Invalidation**
Cache = menyimpan data di memory untuk performa lebih cepat

**Strategi**:
- ✅ **Cache pada READ** (getPosts): Simpan hasil query di memory
- ❌ **Invalidate pada WRITE** (addPost, comment, like): Hapus cache agar data fresh

```javascript
// Cache storage
let postsCache = null;
let cacheTimestamp = null;

// Saat read: cek cache dulu
if (postsCache && !expired) {
  return postsCache; // Fast! No DB query
}

// Saat write: hapus cache
postsCache = null; // Next read akan fetch fresh data
```

### 4. **Authentication dengan JWT**
JWT (JSON Web Token) = Token yang berisi informasi user (encrypted)

**Flow**:
1. User login → Server generate JWT token
2. Client simpan token (localStorage/cookies)
3. Setiap request → Client kirim token di header `Authorization: Bearer <token>`
4. Server verify token → Ambil user info

```javascript
// Generate token saat login
const token = signToken({ username: user.username, _id: user._id });

// Verify token di middleware
const payload = verifyToken(token);
const user = await User.getUserById(payload._id);
```

---

## 📋 Requirement Checklist

### ✅ 1. Add User (Register)
**Query GraphQL**:
```graphql
mutation Register($newUser: UserInput!) {
  register(newUser: $newUser)
}
```
**Variables**:
```json
{
  "newUser": {
    "name": "John Doe",
    "username": "johndoe",
    "password": "password123"
  }
}
```
**Fitur**:
- Password di-hash menggunakan `bcrypt` (10 salt rounds)
- Return: "create sukses"

---

### ✅ 2. Login User
**Query GraphQL**:
```graphql
mutation Login($username: String!, $password: String!) {
  login(username: $username, password: $password)
}
```
**Variables**:
```json
{
  "username": "johndoe",
  "password": "password123"
}
```
**Fitur**:
- Compare password dengan `bcrypt.compareSync()`
- Generate JWT token dengan secret key
- Return: JWT token string

---

### ✅ 3. Search Users by Name/Username
**Query GraphQL**:
```graphql
query SearchUsers($username: String!) {
  searchUsers(username: $username) {
    _id
    name
    username
  }
}
```
**Variables**:
```json
{
  "username": "john"
}
```
**Fitur**:
- Menggunakan **MongoDB Regex** untuk partial matching
- **Case-insensitive** (`$options: "i"`)
- Mencari di field `username` **DAN** `name` (menggunakan `$or`)

**Penjelasan Regex**:
```javascript
{ username: { $regex: "john", $options: "i" } }
// Akan match: "john", "John", "johnny", "JOHN123"
```

---

### ✅ 4. Follow User
**Query GraphQL**:
```graphql
mutation FollowUser($followingId: ID!) {
  followUser(followingId: $followingId)
}
```
**Headers** (perlu login dulu):
```json
{
  "Authorization": "Bearer <your_jwt_token>"
}
```
**Variables**:
```json
{
  "followingId": "674e5a1234567890abcdef12"
}
```
**Fitur**:
- Memerlukan **authentication** (harus login)
- Simpan relasi di collection `follows`
- Validasi: tidak bisa follow diri sendiri

**Struktur Data Follow**:
```javascript
{
  followingId: ObjectId("674e..."), // User yang di-follow
  followerId: ObjectId("674f..."),  // User yang follow
  createdAt: new Date(),
  updatedAt: new Date()
}
```

---

### ✅ 5. Get User by Id (dengan Followers & Following)
**Query GraphQL**:
```graphql
query GetUser($id: ID!) {
  getUserById(id: $id) {
    _id
    name
    username
    followers {
      _id
      name
      username
    }
    following {
      _id
      name
      username
    }
  }
}
```
**Variables**:
```json
{
  "id": "674e5a1234567890abcdef12"
}
```
**Fitur**:
- Menampilkan **list followers** (siapa saja yang follow user ini)
- Menampilkan **list following** (siapa saja yang di-follow oleh user ini)
- Menggunakan **MongoDB Aggregation** dengan `$lookup` dan `$replaceRoot`

**Penjelasan Aggregation**:
```javascript
// Get Followers
{ $match: { followingId: userId } }  // Cari semua yang followingId = userId
{ $lookup: { from: "users", localField: "followerId", foreignField: "_id" } }
{ $replaceRoot: { newRoot: "$follower" } }  // Replace document dengan user object

// Get Following
{ $match: { followerId: userId } }   // Cari semua yang followerId = userId
{ $lookup: { from: "users", localField: "followingId", foreignField: "_id" } }
{ $replaceRoot: { newRoot: "$following" } }
```

---

### ✅ 6. Add Post
**Query GraphQL**:
```graphql
mutation AddPost($newPost: PostInput!) {
  addPost(newPost: $newPost) {
    _id
    content
    author {
      name
      username
    }
  }
}
```
**Variables**:
```json
{
  "newPost": {
    "content": "Hello World! My first post",
    "tags": ["hello", "firstpost"],
    "imgUrl": "https://example.com/image.jpg",
    "authorId": "674e5a1234567890abcdef12"
  }
}
```
**Fitur**:
- Validasi: `content` tidak boleh kosong
- Validasi: `authorId` harus valid ObjectId (24 hex characters)
- Auto-add `createdAt` dan `updatedAt`
- **Invalidate cache** posts setelah add
- Return: Post object dengan author details (via aggregation)

---

### ✅ 7. Get Posts (dengan Cache)
**Query GraphQL**:
```graphql
query GetPosts {
  getPosts {
    _id
    content
    tags
    imgUrl
    author {
      _id
      name
      username
    }
    comments {
      content
      username
    }
    likes {
      username
    }
    createdAt
  }
}
```
**Fitur**:
- Menampilkan **author name/username** via `$lookup`
- Sort by **createdAt descending** (post terbaru di atas)
- **Cache di memory** selama 5 menit
- Console log: "Returning cached posts" atau "Fetching fresh posts from database"

**Cara Kerja Cache**:
```javascript
const CACHE_DURATION = 5 * 60 * 1000; // 5 menit

// Cek apakah cache masih valid
if (postsCache && (now - cacheTimestamp) < CACHE_DURATION) {
  return postsCache; // Return dari memory (fast!)
}

// Cache expired atau belum ada → fetch dari DB
const posts = await Post.getPosts();
postsCache = posts;
cacheTimestamp = now;
```

---

### ✅ 8. Get Post by Id (dengan Lookup Comments & Likes)
**Query GraphQL**:
```graphql
query GetPost($id: ID!) {
  getPostById(id: $id) {
    _id
    content
    author {
      _id
      name
      username
    }
    comments {
      content
      username
      user {
        _id
        name
        username
      }
    }
    likes {
      username
      user {
        _id
        name
        username
      }
    }
  }
}
```
**Variables**:
```json
{
  "id": "674e5a1234567890abcdef12"
}
```
**Fitur**:
- Menampilkan **author details**
- Menampilkan **user details di comments** (nama/username yang comment)
- Menampilkan **user details di likes** (nama/username yang like)
- Menggunakan **Advanced Aggregation** dengan `$map`, `$filter`, `$arrayElemAt`

**Penjelasan Aggregation Kompleks**:
```javascript
// 1. Lookup semua users yang mungkin comment/like
{ $lookup: { from: "users", localField: "comments.username", as: "commentUsers" } }

// 2. Map setiap comment dan tambahkan user details
{
  $addFields: {
    comments: {
      $map: {
        input: "$comments",
        as: "comment",
        in: {
          content: "$$comment.content",
          username: "$$comment.username",
          user: {
            $arrayElemAt: [
              {
                $filter: {
                  input: "$commentUsers",
                  cond: { $eq: ["$$u.username", "$$comment.username"] }
                }
              },
              0
            ]
          }
        }
      }
    }
  }
}

// 3. Hapus field temporary
{ $project: { commentUsers: 0 } }
```

---

### ✅ 9. Comment Post
**Query GraphQL**:
```graphql
mutation CommentPost($postId: ID!, $comment: CommentInput!) {
  commentPost(postId: $postId, comment: $comment)
}
```
**Variables**:
```json
{
  "postId": "674e5a1234567890abcdef12",
  "comment": {
    "content": "Nice post!",
    "username": "johndoe"
  }
}
```
**Fitur**:
- Validasi: `content` tidak boleh kosong
- Validasi: `username` tidak boleh kosong
- Menggunakan **MongoDB $push** untuk append ke array `comments`
- Auto-add `createdAt` dan `updatedAt` di comment
- **Invalidate cache** posts
- Return: "Comment added successfully"

**MongoDB Update Operation**:
```javascript
await collection.updateOne(
  { _id: postId },
  { 
    $push: { comments: commentData },  // Tambah ke array
    $set: { updatedAt: new Date() }    // Update timestamp post
  }
);
```

---

### ✅ 10. Like Post
**Query GraphQL**:
```graphql
mutation LikePost($postId: ID!, $username: String!) {
  likePost(postId: $postId, username: $username)
}
```
**Variables**:
```json
{
  "postId": "674e5a1234567890abcdef12",
  "username": "johndoe"
}
```
**Fitur**:
- Validasi: `username` tidak boleh kosong
- Menggunakan **MongoDB $push** untuk append ke array `likes`
- Auto-add `createdAt` dan `updatedAt` di like
- **Invalidate cache** posts
- Return: "Post liked successfully"

**Note**: Tidak ada validasi duplicate like (user bisa like berkali-kali). Untuk prevent duplicate, bisa tambahkan:
```javascript
// Check if user already liked
const post = await collection.findOne({ 
  _id: postId, 
  "likes.username": username 
});
if (post) throw new Error("You already liked this post");
```

---

## 🔧 MongoDB Operators Cheat Sheet

| Operator | Fungsi | Contoh |
|----------|--------|--------|
| `$match` | Filter documents (seperti WHERE) | `{ $match: { status: "active" } }` |
| `$lookup` | Join dengan collection lain | `{ $lookup: { from: "users", localField: "userId", foreignField: "_id", as: "user" } }` |
| `$unwind` | Flatten array menjadi document | `{ $unwind: "$comments" }` |
| `$sort` | Sort hasil | `{ $sort: { createdAt: -1 } }` |
| `$push` | Append ke array | `{ $push: { comments: newComment } }` |
| `$addFields` | Tambah field baru | `{ $addFields: { fullName: { $concat: ["$firstName", " ", "$lastName"] } } }` |
| `$project` | Select fields yang mau ditampilkan | `{ $project: { password: 0 } }` (hide password) |
| `$map` | Transform setiap element array | `{ $map: { input: "$items", as: "item", in: "$$item.name" } }` |
| `$filter` | Filter element di array | `{ $filter: { input: "$users", as: "u", cond: { $eq: ["$$u.age", 25] } } }` |

---

## 🚀 Testing Guide

### 1. Register User
```bash
curl -X POST http://localhost:3000/ \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { register(newUser: { name: \"Test\", username: \"test\", password: \"pass\" }) }"
  }'
```

### 2. Login & Get Token
```bash
curl -X POST http://localhost:3000/ \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { login(username: \"test\", password: \"pass\") }"
  }'
```

### 3. Follow User (dengan token)
```bash
curl -X POST http://localhost:3000/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_token>" \
  -d '{
    "query": "mutation { followUser(followingId: \"674e...\") }"
  }'
```

---

## 📊 Database Schema

### Collection: `users`
```javascript
{
  _id: ObjectId,
  name: String,
  username: String,
  password: String (hashed)
}
```

### Collection: `follows`
```javascript
{
  _id: ObjectId,
  followingId: ObjectId,  // ref: users._id
  followerId: ObjectId,   // ref: users._id
  createdAt: Date,
  updatedAt: Date
}
```

### Collection: `posts`
```javascript
{
  _id: ObjectId,
  content: String,
  tags: [String],
  imgUrl: String,
  authorId: ObjectId,  // ref: users._id
  comments: [
    {
      content: String,
      username: String,  // ref: users.username
      createdAt: Date,
      updatedAt: Date
    }
  ],
  likes: [
    {
      username: String,  // ref: users.username
      createdAt: Date,
      updatedAt: Date
    }
  ],
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🎓 Tips untuk Pemula

### 1. Gunakan Apollo Sandbox
- Buka http://localhost:3000/ di browser
- Auto-complete query
- Docs explorer built-in

### 2. MongoDB Compass
- GUI tool untuk lihat data di MongoDB
- Download: https://www.mongodb.com/products/compass
- Connect dengan MONGODB_URI dari `.env`

### 3. Testing dengan Postman
- Import GraphQL queries
- Save environment variables (token, userId, etc)
- Create test collections

### 4. Debug Tips
- Tambahkan `console.log()` di resolver untuk debug
- Cek MongoDB logs di terminal
- Gunakan `try-catch` untuk error handling

### 5. Best Practices
- ✅ Selalu hash password (never store plain text)
- ✅ Validate input sebelum save ke DB
- ✅ Use ObjectId.isValid() sebelum new ObjectId()
- ✅ Add indexes di MongoDB untuk field yang sering di-query
- ✅ Gunakan cache untuk query yang sering dipanggil

---

## 🔗 Resources

- **GraphQL Docs**: https://graphql.org/learn/
- **Apollo Server**: https://www.apollographql.com/docs/apollo-server/
- **MongoDB Aggregation**: https://www.mongodb.com/docs/manual/aggregation/
- **JWT**: https://jwt.io/introduction
- **Bcrypt**: https://www.npmjs.com/package/bcryptjs

---

## 📝 Changelog

### v1.0.0 - Initial Release
- ✅ User registration with bcrypt password hashing
- ✅ JWT authentication for login
- ✅ Search users with regex (case-insensitive)
- ✅ Follow/unfollow system with MongoDB relations
- ✅ Get user profile with followers & following lists
- ✅ Create posts with author lookup
- ✅ Get posts with caching (5 minutes)
- ✅ Get post by id with advanced lookups (comments & likes users)
- ✅ Comment on posts with cache invalidation
- ✅ Like posts with cache invalidation
- ✅ Complete aggregation pipelines for all relations

---

**Happy Coding! 🚀**
