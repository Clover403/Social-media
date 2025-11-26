# Mastodon Social Media App - React Native

Aplikasi mobile social media dengan tema Mastodon menggunakan React Native Expo dan GraphQL.

## 🚀 Features

### Authentication
- ✅ Login Screen
- ✅ Register Screen
- ✅ JWT Token Management dengan AsyncStorage

### Main Features
- ✅ **Home Screen**: List semua posts dengan like & comment counter
- ✅ **Create Post**: Form untuk membuat post baru
- ✅ **Post Detail**: Detail post dengan list comments dan form comment
- ✅ **Search**: Cari user berdasarkan username
- ✅ **Profile**: Tampilan profile user dengan followers/following list

### GraphQL Operations
1. ✅ Register (Mutation)
2. ✅ Login (Mutation)
3. ✅ Get Posts (Query)
4. ✅ Add Post (Mutation)
5. ✅ Comment Post (Mutation)
6. ✅ Search User (Query)
7. ✅ Follow User (Mutation)
8. ✅ Get User by ID (Query)
9. ✅ Like Post (Mutation)

## 🎨 Design

Aplikasi ini menggunakan color scheme Mastodon:
- Background: `#191b22` dan `#282c37`
- Primary: `#6364ff`
- Text: `#fff` dan `#9baec8`
- Border: `#393f4f`

## 📁 Struktur Folder

```
app/
├── src/
│   ├── config/
│   │   └── apollo.js          # Apollo Client setup
│   ├── queries/
│   │   ├── queries.js         # GraphQL Queries
│   │   └── mutations.js       # GraphQL Mutations
│   ├── screens/
│   │   ├── LoginScreen.js
│   │   ├── RegisterScreen.js
│   │   ├── HomeScreen.js
│   │   ├── CreatePostScreen.js
│   │   ├── PostDetailScreen.js
│   │   ├── SearchScreen.js
│   │   └── ProfileScreen.js
│   └── navigators/
│       └── MainNavigator.js   # Bottom Tab Navigator
├── App.js                      # Root component
└── package.json
```

## 🔧 Installation

1. Install dependencies:
```bash
npm install
```

2. Update GraphQL server URL di `src/config/apollo.js`:
```javascript
uri: 'http://YOUR_IP:3000/'  // Ganti YOUR_IP dengan IP server
```

3. Start Expo:
```bash
npm start
```

## 📱 Usage

### Login
- Username: (username yang sudah register)
- Password: (password user)

### Create Post
- Content: Wajib diisi
- Tags: Optional, pisahkan dengan koma
- Image URL: Optional

### Search Users
- Ketik username di search bar
- Tap user untuk lihat profile

### Like & Comment
- Tap post untuk detail
- Like dengan tap icon ❤️
- Comment di form bawah

## 🔑 AsyncStorage Keys

- `access_token`: JWT token untuk authentication

## 🌐 API Endpoint

Default: `http://localhost:3000/`

Untuk testing di device fisik, ganti dengan IP komputer:
```javascript
http://192.168.x.x:3000/
```

## 📦 Dependencies

- React Native 0.81.5
- Expo ~54
- @apollo/client
- @react-navigation/native
- @react-navigation/native-stack
- @react-navigation/bottom-tabs
- @react-native-async-storage/async-storage

## 🎯 Requirements Checklist

- [x] Login Screen
- [x] Register Screen
- [x] Home Screen (List Posts)
- [x] Create Post Screen
- [x] Post Detail Screen
- [x] Search Screen
- [x] Profile Screen
- [x] React Navigation (Stack + Bottom Tabs)
- [x] Apollo Client GraphQL
- [x] 9 Query & Mutation operations
- [x] Mastodon theme design

## 🐛 Troubleshooting

### Error: Network request failed
- Pastikan server GraphQL running di port 3000
- Ganti `localhost` dengan IP address komputer
- Pastikan device dan komputer di network yang sama

### Error: Cannot find module
```bash
npm install
npx expo start -c
```

### AsyncStorage warnings
Install ulang package:
```bash
npm install @react-native-async-storage/async-storage
```
