# Database

Linkbase stores data in MongoDB through Mongoose. Mongoose handles the schema, validation and connection pooling. Folder and naming rules come from `docs/architecture.md`.

## Layout

```
lib/db/
  connect.ts         Connection helper: single cached connection
  models/
    user.ts          One model per file, kebab-case file name
    link.ts
```

- The connection helper lives in `/lib/db`. Models live in `/lib/db/models`.
- Database code runs on the server only, meaning Server Components and Server Actions. Never import `/lib/db` from a Client Component.

## Connection

The app keeps one cached connection and reuses it across Server Actions, in both development and production. The cache sits on `globalThis` so it survives hot reloads in development (where module state is reset) and is reused across requests in production. The pending promise is cached as well as the resolved connection, so concurrent first calls don't open a second connection.

```ts
// lib/db/connect.ts
import mongoose from "mongoose";

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("MONGODB_URI is not set");

const cached = globalThis as typeof globalThis & {
  mongoose?: Promise<typeof mongoose>;
};

export function connectDb() {
  cached.mongoose ??= mongoose.connect(uri!, { serverSelectionTimeoutMS: 5000 });
  return cached.mongoose;
}
```

Call `await connectDb()` before any model query. Pooling is handled by the driver (`maxPoolSize` defaults to 100), so don't open extra connections or call `mongoose.disconnect()` per request.

## Schemas

Every schema uses:

- **Strict mode** (`strict: true`, the Mongoose default, set explicitly). Fields not in the schema are dropped and never saved.
- **Timestamps** (`timestamps: true`), which adds and maintains `createdAt` and `updatedAt`.
- **Indexes on `userId` and `handle`**:
  - `userId` is indexed on every model that belongs to a user.
  - `handle` (the public profile handle) is indexed and unique. `unique: true` creates the index, so don't also add `index: true`.
  - `handle` is **optional**: sign-up asks only for email and password, and the handle is chosen afterwards. It uses `unique: true, sparse: true`, so any number of users can have no handle while the ones that are set stay unique. Leave it unset rather than `null`, because sparse indexes still include `null` values.
  - Handle format: 3–30 characters, lowercase letters, numbers, hyphens and underscores (`/^[a-z0-9_-]+$/`), with a few reserved names. `lib/validation/handle.ts` is the source of truth, and the model repeats the rule as `minlength`/`maxlength`/`match`.

Register models with `mongoose.models.X || model(...)` so hot reloading doesn't throw `OverwriteModelError`.

```ts
// lib/db/models/link.ts
import { Schema, model, models, type InferSchemaType } from "mongoose";

const linkSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true },
    url: { type: String, required: true },
  },
  { strict: true, timestamps: true },
);

export type Link = InferSchemaType<typeof linkSchema>;
export const LinkModel = models.Link || model("Link", linkSchema);
```

```ts
// lib/db/models/user.ts (excerpt)
email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
passwordHash: { type: String, required: true, select: false }, // never returned unless asked for
handle: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
```

## Data access: always scope by user

Every query is scoped to the signed-in user's id, so a user can only ever touch their own data.

- Get the user id from the session (`/lib/auth`) on the server. Never take it from form data, URL params or the client.
- Put `userId` in the filter of **every** read, update and delete. Never query by `_id` alone.
- Set `userId` from the session on create. Never accept it as input.

```ts
"use server";
import { connectDb } from "@/lib/db/connect";
import { LinkModel } from "@/lib/db/models/link";
import { getSession } from "@/lib/auth/get-session";

export async function deleteLink(linkId: string) {
  const { userId } = await getSession();
  await connectDb();
  await LinkModel.deleteOne({ _id: linkId, userId }); // never { _id: linkId }
}
```

If a filtered query matches nothing, treat it as "not found". Don't reveal whether the record exists for another user.

**Exception: public profile.** The page at `/user/[handle]` reads a profile and its links by `handle` without a session. This lookup is read-only and returns only public fields. Writes are always scoped by `userId`. See `docs/auth.md`.
