import "server-only";
import mongoose from "mongoose";

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("MONGODB_URI is not set");
const mongoUri: string = uri;

const cached = globalThis as typeof globalThis & {
  mongoose?: Promise<typeof mongoose>;
};

async function openConnection() {
  try {
    return await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
  } catch (err) {
    // Drop the failed promise so the next call retries instead of reusing the rejection.
    cached.mongoose = undefined;
    throw new Error("Database connection failed", { cause: err });
  }
}

export function connectDb() {
  cached.mongoose ??= openConnection();
  return cached.mongoose;
}
