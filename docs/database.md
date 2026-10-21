# Linkbase Database — MongoDB with Mongoose

How the app connects to MongoDB, defines models and scopes queries. All paths are under `src/`.

---

## Overview

- **MongoDB** is the database. **Mongoose** handles schemas, validation and connection pooling.
- **One cached connection** is created on first use and reused by every Server Action, in both development and production.
- **Every query is scoped to the signed-in user's id.** A user can only ever read or change their own data.

## Layout

```
src/lib/db/
├── connect.ts            # Connection helper (connectToDatabase)
└── models/
    ├── user.ts
    └── link.ts
```

- The connection helper lives in `lib/db/`.
- Models live in `lib/db/models/`, one file per model, named in kebab-case (see `docs/architecture.md`).

## Connection

The connection string comes from the `MONGODB_URI` environment variable.

The helper caches the connection on `globalThis`. In development this stops hot reloads from opening a new pool on every edit. In production it means one pool per server process. Call `connectToDatabase()` at the start of any Server Action or server function that queries the database.

```ts
// src/lib/db/connect.ts
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) throw new Error("MONGODB_URI is not set");

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalForMongoose = globalThis as typeof globalThis & {
  mongoose?: MongooseCache;
};
const cached = (globalForMongoose.mongoose ??= { conn: null, promise: null });

export async function connectToDatabase() {
  if (cached.conn) return cached.conn;
  cached.promise ??= mongoose.connect(MONGODB_URI!, { bufferCommands: false });
  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null; // let the next call retry
    throw error;
  }
  return cached.conn;
}
```

## Schemas

Every schema uses:

- **Strict mode** (`strict: true`, also Mongoose's default). Fields that aren't in the schema are dropped and never saved.
- **Timestamps** (`timestamps: true`). Mongoose sets `createdAt` and `updatedAt` automatically.
- **Indexes on `userId` and `handle`.** `userId` is indexed on every user-owned collection so scoped queries stay fast. `handle` is indexed for public profile lookups and is unique, since it identifies a profile URL.

Register models with `models.X ?? model(...)`. This reuses an already compiled model after a hot reload instead of throwing `OverwriteModelError`.

```ts
// src/lib/db/models/link.ts
import { Schema, model, models, type InferSchemaType } from "mongoose";

const linkSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 100 },
    url: { type: String, required: true, trim: true },
    position: { type: Number, required: true, min: 0 },
  },
  { strict: true, timestamps: true },
);

export type Link = InferSchemaType<typeof linkSchema>;
export const LinkModel = models.Link ?? model("Link", linkSchema);
```

```ts
// src/lib/db/models/user.ts (excerpt)
const userSchema = new Schema(
  {
    handle: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // ...
  },
  { strict: true, timestamps: true },
);
```

Validation lives in the schema (`required`, `min`, `maxlength`, `match`, custom validators), so every write path goes through the same rules.

## User scoping

Every query against user-owned data includes the signed-in user's id, taken from the session on the server and never from the client.

- Read the user id from the auth helpers in `lib/auth/`. Never accept a `userId` from form data or arguments.
- Put `userId` in the filter of **every** read, update and delete: `find`, `findOne`, `findOneAndUpdate`, `updateOne`, `deleteOne`, and so on.
- Never look a document up by `_id` alone. Use `findOne({ _id, userId })`, not `findById(id)`, so another user's id matches nothing.
- Set `userId` from the session when creating a document.
- Public reads, such as rendering a profile by `handle`, are the only unscoped queries. They return only public fields.

```ts
// src/app/(dashboard)/links/actions.ts
"use server";

import { connectToDatabase } from "@/lib/db/connect";
import { LinkModel } from "@/lib/db/models/link";
import { requireUserId } from "@/lib/auth"; // returns the session user's id or throws (see docs/auth.md)

export async function deleteLink(linkId: string) {
  const userId = await requireUserId();
  await connectToDatabase();
  await LinkModel.deleteOne({ _id: linkId, userId });
}
```

Server Actions follow the verb-first naming in `docs/architecture.md`.
