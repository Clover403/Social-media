# Dokumentasi Alur Code - Aplikasi E-Commerce

Dokumentasi ini menjelaskan secara detail bagaimana alur code bekerja saat proses **Register**, **Login**, dan **Fetch Product** hingga menampilkan data di halaman.

---

## Daftar Isi

1. [Alur Register](#1-alur-register)
2. [Alur Login](#2-alur-login)
3. [Alur Fetch Products](#3-alur-fetch-products)
4. [Alur Detail Product](#4-alur-detail-product)
5. [Sistem Autentikasi](#5-sistem-autentikasi)

---

## 1. Alur Register

### Diagram Alur

```
[User mengisi form] → [Server Action handleRegister] → [API /api/auth/register] → [UserModel.register()] → [MongoDB] → [Redirect ke /login]
```

### Step 1: Halaman Register (Server Component)

**File: `app/register/page.tsx`**

Halaman register adalah **Server Component** yang menggunakan **Server Action** untuk memproses form.

```tsx
// app/register/page.tsx

export default async function RegisterPage({ searchParams }: RegisterProps) {
  // Mengambil parameter dari URL untuk menampilkan error/success message
  const params = await searchParams;
  const error = Array.isArray(params.error) ? params.error[0] : params.error;
  const success = Array.isArray(params.success) ? params.success[0] : params.success;

  // Server Action - fungsi yang berjalan di server
  async function handleRegister(formData: FormData) {
    "use server";  // ← Directive untuk menandakan ini Server Action

    // Mengambil data dari form
    const name = String(formData.get("name") ?? "").trim();
    const username = String(formData.get("username") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "").trim();

    const payload = { name, username, email, password };

    // Mengirim request ke API endpoint
    const resp = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await resp.json();

    // Jika gagal, redirect dengan error message
    if (!resp.ok) {
      redirect(`/register?error=${encodeURIComponent(data.message || "Unable to register")}`);
    }

    // Jika berhasil, redirect ke halaman login dengan success message
    redirect(`/login?success=${encodeURIComponent("Account created, please sign in")}`);
  }

  return (
    <form action={handleRegister}>
      {/* Form inputs... */}
    </form>
  );
}
```

**Penjelasan:**
- `"use server"` menandakan bahwa fungsi ini berjalan di server (bukan di browser)
- `formData.get()` mengambil nilai dari input form berdasarkan atribut `name`
- `redirect()` melakukan redirect dengan query parameter untuk menampilkan pesan

### Step 2: API Route Register

**File: `app/api/auth/register/route.ts`**

API route ini menerima POST request dari Server Action.

```typescript
// app/api/auth/register/route.ts

import UserModel from "@/src/models/User";
import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

export async function POST(req: NextRequest) {
  try {
    // Parsing body dari request
    const body = await req.json();
    
    // Memanggil method register dari UserModel
    const message = await UserModel.register(body);

    // Mengembalikan response sukses
    return Response.json({ message }, { status: 201 });
  } catch (error) {
    // Jika error adalah ZodError (validasi gagal)
    if (error instanceof ZodError) {
      const message = error.issues
        .map((issue) => `${String(issue.path[0])}: ${issue.message}`)
        .join("; ");

      return NextResponse.json({ message }, { status: 400 });
    }

    // Error lainnya
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
```

**Penjelasan:**
- `req.json()` meng-parse body request menjadi object JavaScript
- `ZodError` adalah error dari library Zod saat validasi gagal
- Status 201 menandakan "Created" (berhasil membuat resource baru)

### Step 3: User Model - Method Register

**File: `src/models/User.ts`**

Method `register()` melakukan validasi dan menyimpan user ke database.

```typescript
// src/models/User.ts

import z from "zod";
import bcrypt from "bcryptjs";

// Schema validasi untuk register
const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be at most 20 characters"),
  email: z.string().email("Email must be a valid email address"),
  password: z.string().min(5, "Password must be at least 5 characters"),
});

export default class UserModel {
  static async register(payload: z.infer<typeof registerSchema>): Promise<string> {
    // 1. Koneksi ke MongoDB
    await dbConnect();

    // 2. Validasi data menggunakan Zod
    const data = registerSchema.parse(payload);
    // ↑ Jika validasi gagal, akan throw ZodError

    // 3. Cek apakah email sudah terdaftar
    const emailTaken = await User.findOne({
      email: { $regex: new RegExp(`^${data.email}$`, "i") },
    });
    if (emailTaken) {
      throw buildUniqueIssue("email", "Email already registered");
    }

    // 4. Cek apakah username sudah digunakan
    const usernameTaken = await User.findOne({
      username: { $regex: new RegExp(`^${data.username}$`, "i") },
    });
    if (usernameTaken) {
      throw buildUniqueIssue("username", "Username already taken");
    }

    // 5. Hash password menggunakan bcrypt (10 rounds)
    const hashedPassword = bcrypt.hashSync(data.password, 10);

    // 6. Simpan user ke database MongoDB
    await User.create({
      name: data.name,
      username: data.username,
      email: data.email,
      password: hashedPassword,  // ← Password yang sudah di-hash
    });

    return "Account created successfully";
  }
}
```

**Penjelasan:**
- `registerSchema.parse()` akan validasi data dan throw error jika tidak valid
- `$regex` dengan opsi `"i"` untuk case-insensitive search
- `bcrypt.hashSync(password, 10)` meng-hash password dengan 10 salt rounds
- Password yang disimpan adalah hash, bukan plain text (keamanan)

### Ringkasan Alur Register

1. **User** → Mengisi form dan submit
2. **Server Action** → Menangkap form data dan kirim ke API
3. **API Route** → Menerima request dan memanggil UserModel
4. **UserModel.register()** → Validasi → Cek duplikat → Hash password → Simpan ke MongoDB
5. **Response** → Redirect ke `/login` dengan pesan sukses

---

## 2. Alur Login

### Diagram Alur

```
[User mengisi form] → [handleSubmit] → [fetch /api/auth/login] → [UserModel.loginUser()] → [Generate JWT] → [setCookie] → [Redirect ke /]
```

### Step 1: Halaman Login (Client Component)

**File: `app/login/page.tsx`**

Halaman login adalah **Client Component** karena membutuhkan interaktivitas (state, event handler).

```tsx
// app/login/page.tsx

"use client"  // ← Directive untuk Client Component

import { useState } from "react"
import { useRouter } from "next/navigation"
import Swal from "sweetalert2"
import { setCookie } from "../(auth)/actions"

export default function LoginPage() {
  // State untuk menyimpan input user
  const [email, setEmail] = useState<string>("")
  const [password, setPassword] = useState<string>("")
  const router = useRouter()

  // Handler saat form di-submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()  // Mencegah reload halaman

    // Mengirim request ke API login
    const resp = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-type": "application/json" },
      body: JSON.stringify({ email, password })
    })
    
    const data = await resp.json()
    
    // Jika gagal, tampilkan error dengan SweetAlert2
    if (!resp.ok) {
      Swal.fire({
        icon: "error",
        title: "Login Failed",
        text: data.message
      }) 
      return
    }

    // Jika berhasil, simpan token ke cookie
    await setCookie("access_token", data.token)
    
    // Redirect ke halaman utama
    router.push("/")
  }

  return (
    <form onSubmit={handleSubmit}>
      <input value={email} onChange={(e) => setEmail(e.target.value)} />
      <input value={password} onChange={(e) => setPassword(e.target.value)} />
      <button type="submit">Sign in</button>
    </form>
  )
}
```

**Penjelasan:**
- `"use client"` menandakan ini Client Component (berjalan di browser)
- `useState` untuk mengelola state input
- `e.preventDefault()` mencegah form melakukan submit default (reload)
- `Swal.fire()` menampilkan popup error yang menarik
- `setCookie()` adalah Server Action untuk menyimpan token

### Step 2: API Route Login

**File: `app/api/auth/login/route.ts`**

```typescript
// app/api/auth/login/route.ts

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Memanggil method loginUser untuk autentikasi
    const token = await UserModel.loginUser(body);

    // Mengembalikan token JWT
    return Response.json({ token }, { status: 200 });
  } catch (error) {
    if (error instanceof ZodError) {
      const message = error.issues
        .map((issue) => `${String(issue.path[0])}: ${issue.message}`)
        .join("; ");

      return NextResponse.json({ message }, { status: 400 });
    }

    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
```

### Step 3: User Model - Method LoginUser

**File: `src/models/User.ts`**

```typescript
// src/models/User.ts

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "rahasia";

// Schema validasi untuk login
const loginSchema = z.object({
  email: z.string().email("Email must be a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export default class UserModel {
  static async loginUser(payload: z.infer<typeof loginSchema>): Promise<string> {
    // 1. Koneksi ke MongoDB
    await dbConnect();

    // 2. Validasi input
    const data = loginSchema.parse(payload);

    // 3. Cari user berdasarkan email
    const user = await User.findOne({
      email: { $regex: new RegExp(`^${data.email}$`, "i") },
    });

    // 4. Jika user tidak ditemukan, throw error
    if (!user) {
      throw new ZodError([
        {
          code: "custom",
          path: ["email"],
          message: "Invalid email/password",
        },
      ]);
    }

    // 5. Bandingkan password yang diinput dengan hash di database
    const isValid = bcrypt.compareSync(data.password, user.password);
    
    // 6. Jika password tidak cocok, throw error
    if (!isValid) {
      throw new ZodError([
        {
          code: "custom",
          path: ["email"],
          message: "Invalid email/password",
        },
      ]);
    }

    // 7. Generate JWT token dengan payload berisi _id dan email
    const token = jwt.sign(
      { _id: user._id.toString(), email: user.email },
      JWT_SECRET
    );

    return token;
  }
}
```

**Penjelasan:**
- `bcrypt.compareSync()` membandingkan password plain dengan hash
- Pesan error dibuat sama ("Invalid email/password") untuk keamanan (tidak memberi tahu apakah email atau password yang salah)
- `jwt.sign()` membuat token JWT dengan payload user

### Step 4: Menyimpan Token ke Cookie

**File: `app/(auth)/actions.ts`**

Server Action untuk mengelola cookie.

```typescript
// app/(auth)/actions.ts

"use server"

import { cookies } from "next/headers"

export async function setCookie(key: string, value: string): Promise<string> {
  const cookieStore = await cookies()

  cookieStore.set({
    name: key,                    // "access_token"
    value: value,                 // JWT token
    httpOnly: true,               // Tidak bisa diakses JavaScript (keamanan XSS)
    secure: process.env.NODE_ENV === "production",  // HTTPS di production
    sameSite: "strict",           // Perlindungan CSRF
    path: "/",                    // Cookie berlaku untuk semua path
  })

  return "success"
}
```

**Penjelasan:**
- `httpOnly: true` mencegah JavaScript di browser mengakses cookie (keamanan dari XSS attack)
- `secure: true` di production memastikan cookie hanya dikirim via HTTPS
- `sameSite: "strict"` mencegah cookie dikirim dari cross-site request (CSRF protection)

### Ringkasan Alur Login

1. **User** → Mengisi email & password
2. **handleSubmit** → Kirim POST request ke `/api/auth/login`
3. **API Route** → Memanggil `UserModel.loginUser()`
4. **loginUser()** → Validasi → Cari user → Compare password → Generate JWT
5. **Response** → Mengembalikan token
6. **Client** → `setCookie("access_token", token)` → Redirect ke `/`

---

## 3. Alur Fetch Products

### Diagram Alur

```
[User buka /products] → [ProductsPage] → [ProductsClient] → [fetch /api/products] → [ProductModel.findMany()] → [MongoDB] → [Render products]
```

### Step 1: Halaman Products (Server Component)

**File: `app/products/page.tsx`**

```tsx
// app/products/page.tsx

import ProductsClient from "@/components/ProductsClient";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  // Mengambil search parameter dari URL
  const params = await searchParams;
  const search = params.search ?? "";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Merender Client Component dengan initial search */}
      <ProductsClient initialSearch={search} />
    </div>
  );
}
```

**Penjelasan:**
- Server Component yang menerima search params dari URL
- Merender `ProductsClient` sebagai Client Component untuk interaktivitas

### Step 2: Products Client (Client Component)

**File: `components/ProductsClient.tsx`**

```tsx
// components/ProductsClient.tsx

"use client";

import { useCallback, useEffect, useState, useRef } from "react";

const PAGE_SIZE = 12;

export default function ProductsClient({ initialSearch = "" }: Props) {
  // State management
  const [products, setProducts] = useState<ProductWithWishlist[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [category, setCategory] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Ref untuk Intersection Observer (infinite scroll)
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // Fungsi untuk fetch products
  const fetchProducts = useCallback(
    async (pageToLoad: number, search: string, cat: string, replace = false) => {
      // Membuat query parameters
      const params = new URLSearchParams({
        page: String(pageToLoad),
        limit: String(PAGE_SIZE),
      });

      if (search) params.set("search", search);
      if (cat) params.set("category", cat);

      // Set loading state
      if (replace) setIsLoading(true);

      try {
        // Fetch ke API products
        const resp = await fetch(`/api/products?${params.toString()}`, {
          cache: "no-store",  // Selalu ambil data fresh
        });

        const data = await resp.json();

        // Update state products
        setProducts((prev) => {
          if (replace) return data.items;  // Replace semua data
          
          // Merge dengan data existing (hindari duplikat)
          const existingSlugs = new Set(prev.map((item) => item.slug));
          const merged = [...prev];
          data.items.forEach((item) => {
            if (!existingSlugs.has(item.slug)) {
              merged.push(item);
            }
          });
          return merged;
        });

        setPage(data.page);
        setHasMore(data.hasMore);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  // Effect untuk initial load dan saat search/category berubah
  useEffect(() => {
    fetchProducts(1, searchTerm, category, true);
  }, [fetchProducts, searchTerm, category]);

  // Infinite Scroll dengan Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // Jika element terlihat dan masih ada data, load more
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          fetchProducts(page + 1, searchTerm, category, false);
        }
      },
      { threshold: 0.1, rootMargin: "100px" }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoading, page, searchTerm, category, fetchProducts]);

  return (
    <div>
      {/* Product Grid */}
      <div className="grid grid-cols-4 gap-8">
        {products.map((product) => (
          <ProductCard key={product.slug} product={product} />
        ))}
      </div>
      
      {/* Trigger untuk infinite scroll */}
      <div ref={loadMoreRef} />
    </div>
  );
}
```

**Penjelasan:**
- `useCallback` memoize fungsi fetchProducts agar tidak di-create ulang setiap render
- `cache: "no-store"` memastikan data selalu fresh
- Intersection Observer mendeteksi kapan element trigger terlihat di viewport
- `rootMargin: "100px"` mulai load 100px sebelum element terlihat

### Step 3: API Route Products

**File: `app/api/products/route.ts`**

```typescript
// app/api/products/route.ts

import ProductModel from "@/src/models/Product";
import { getCurrentUserId } from "@/src/helpers/auth";
import z from "zod";

// Schema validasi untuk query parameters
const querySchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(40).optional(),
});

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  
  // Convert searchParams ke object
  const queryObject: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    queryObject[key] = value;
  });

  // Validasi query parameters
  const query = querySchema.safeParse(queryObject);
  if (!query.success) {
    return Response.json({ message: "Invalid query" }, { status: 400 });
  }

  const { search, category, page, limit } = query.data;
  
  // Ambil userId dari cookie (jika user login)
  const userId = await getCurrentUserId();
  
  // Fetch products dari database
  const result = await ProductModel.findMany({ 
    search, 
    category, 
    page, 
    limit, 
    userId: userId ?? undefined 
  });

  return Response.json(result);
}
```

**Penjelasan:**
- `z.coerce.number()` mengkonversi string ke number secara otomatis
- `getCurrentUserId()` mengambil user ID dari token di cookie
- userId dikirim ke model untuk menentukan apakah product sudah di-wishlist

### Step 4: Product Model - Method findMany

**File: `src/models/Product.ts`**

```typescript
// src/models/Product.ts

export default class ProductModel {
  static async findMany(rawParams): Promise<ListResult> {
    await dbConnect();

    const params = listParamsSchema.parse(rawParams);
    const skip = (params.page - 1) * params.limit;

    // Build query untuk search
    const query: Record<string, unknown> = {};
    if (params.search) {
      // Search di multiple fields dengan regex (case-insensitive)
      query.$or = [
        { name: { $regex: params.search, $options: "i" } },
        { description: { $regex: params.search, $options: "i" } },
        { slug: { $regex: params.search, $options: "i" } },
        { excerpt: { $regex: params.search, $options: "i" } },
      ];
    }
    
    // Filter by category
    if (params.category) {
      query.name = { $regex: params.category, $options: "i" };
    }

    // Fetch products dan count total secara parallel
    const [products, total] = await Promise.all([
      Product.find(query).skip(skip).limit(params.limit).lean(),
      Product.countDocuments(query),
    ]);

    // Cek wishlist status jika user login
    let wishlistedProductIds: Set<string> = new Set();
    if (params.userId) {
      const wishlistItems = await Wishlist.find({ userId: params.userId }).lean();
      wishlistedProductIds = new Set(wishlistItems.map((item) => item.productId.toString()));
    }

    // Map products dengan wishlist status
    const items = products.map((product) => ({
      ...product,
      isWishlisted: wishlistedProductIds.has(product._id.toString()),
    }));

    return {
      items,
      total,
      page: params.page,
      hasMore: skip + params.limit < total,
    };
  }
}
```

**Penjelasan:**
- `$or` untuk search di multiple fields
- `$regex` dengan `$options: "i"` untuk case-insensitive
- `skip()` dan `limit()` untuk pagination
- `Promise.all()` menjalankan query secara parallel (lebih cepat)
- `lean()` mengembalikan plain object (lebih cepat dari Mongoose document)

### Ringkasan Alur Fetch Products

1. **User** → Buka halaman `/products`
2. **ProductsPage** → Server Component merender ProductsClient
3. **ProductsClient** → useEffect trigger fetchProducts
4. **fetchProducts** → `fetch("/api/products?page=1&limit=12")`
5. **API Route** → Validasi query → Ambil userId → Panggil ProductModel
6. **ProductModel.findMany()** → Build query → Fetch dari MongoDB → Map wishlist status
7. **Response** → Return `{ items, page, hasMore }`
8. **Client** → Update state → Render product cards
9. **Infinite Scroll** → Intersection Observer trigger load more

---

## 4. Alur Detail Product

### Diagram Alur

```
[User klik product] → [/products/[slug]] → [ProductModel.findBySlug()] → [Cek wishlist] → [Render detail]
```

### Halaman Detail Product (Server Component)

**File: `app/products/[slug]/page.tsx`**

```tsx
// app/products/[slug]/page.tsx

import ProductModel from "@/src/models/Product";
import WishlistModel from "@/src/models/Wishlist";
import { getCurrentUserId } from "@/src/helpers/auth";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ slug: string }>;
};

// Generate metadata untuk SEO
export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const product = await ProductModel.findBySlug(slug);
  
  if (!product) {
    return { title: "Product Not Found" };
  }

  return {
    title: `${product.name} | iBox Clone`,
    description: product.excerpt,
    openGraph: {
      title: product.name,
      images: [product.thumbnail],
    },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  
  // Fetch product berdasarkan slug
  const product = await ProductModel.findBySlug(slug);

  // Jika tidak ditemukan, tampilkan 404
  if (!product) {
    notFound();
  }

  // Cek apakah user login
  const userId = await getCurrentUserId();
  let isWishlisted = false;
  
  // Jika login, cek apakah product ada di wishlist
  if (userId) {
    const wishlistItems = await WishlistModel.getProductsByUser(userId);
    isWishlisted = wishlistItems.some((item) => item.slug === product.slug);
  }

  return (
    <div>
      <ProductImageGallery images={product.images} />
      <h1>{product.name}</h1>
      <p>Rp {product.price.toLocaleString("id-ID")}</p>
      <AddToWishlistButton 
        productId={product.slug}
        initialIsWishlisted={isWishlisted}
      />
    </div>
  );
}
```

**Penjelasan:**
- `[slug]` adalah dynamic route parameter
- `generateMetadata` untuk SEO (title, description, OpenGraph)
- `notFound()` menampilkan halaman 404
- Server Component langsung fetch dari database (tidak perlu API)

---

## 5. Sistem Autentikasi

### Mengambil User dari Token

**File: `src/helpers/auth.ts`**

```typescript
// src/helpers/auth.ts

import { cookies } from "next/headers";
import UserModel from "@/src/models/User";

// Mengambil payload dari JWT token
export async function getUserFromToken(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  if (!token) return null;

  try {
    // Verifikasi dan decode token
    const payload = UserModel.verifyToken(token);
    return payload;
  } catch {
    return null;
  }
}

// Require auth - redirect ke login jika tidak ada token
export async function requireAuth(): Promise<JWTPayload> {
  const user = await getUserFromToken();
  
  if (!user) {
    redirect("/login");
  }

  return user;
}

// Hanya ambil user ID
export async function getCurrentUserId(): Promise<string | null> {
  const user = await getUserFromToken();
  return user?._id || null;
}
```

### Verifikasi Token

**File: `src/models/User.ts`**

```typescript
// src/models/User.ts

import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "rahasia";

export interface JWTPayload {
  _id: string;
  email: string;
}

export default class UserModel {
  static verifyToken(token: string): JWTPayload {
    try {
      // jwt.verify akan throw error jika token invalid
      const payload = jwt.verify(token, JWT_SECRET) as JWTPayload;
      return payload;
    } catch {
      throw new ZodError([
        {
          code: "custom",
          path: ["token"],
          message: "Invalid or expired token",
        },
      ]);
    }
  }
}
```

**Penjelasan:**
- `jwt.verify()` memverifikasi signature dan expiration token
- Jika valid, mengembalikan payload yang berisi `_id` dan `email`
- Jika invalid, throw error

---

## Kesimpulan

### Pattern yang Digunakan

1. **Server Components** - Untuk fetch data langsung dari database
2. **Client Components** - Untuk interaktivitas (form, state)
3. **Server Actions** - Untuk operasi server dari Client Components
4. **API Routes** - Untuk endpoint REST API
5. **Model Classes** - Untuk business logic dan database operations

### Keamanan

1. **Password Hashing** - bcrypt dengan 10 salt rounds
2. **JWT Token** - Untuk stateless authentication
3. **httpOnly Cookie** - Mencegah XSS attack
4. **Zod Validation** - Validasi input di server
5. **Case-insensitive** - Email dan username unique check

### Performance

1. **Infinite Scroll** - Load data saat dibutuhkan
2. **Promise.all()** - Parallel database queries
3. **lean()** - Plain objects untuk performa
4. **Pagination** - Limit data per request
