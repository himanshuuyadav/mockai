import mongoose from "mongoose";

import { getEnv, getRequiredEnv } from "@/lib/env";

declare global {
  // eslint-disable-next-line no-var
  var mongooseConn: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  } | null;
}

const globalCache = global.mongooseConn ?? { conn: null, promise: null };

if (!global.mongooseConn) {
  global.mongooseConn = globalCache;
}

export async function connectToDatabase() {
  if (globalCache.conn) {
    return globalCache.conn;
  }

  if (!globalCache.promise) {
    const mongoUri = getRequiredEnv("MONGODB_URI");
    const dbName = getEnv("MONGODB_DB_NAME") ?? "mock";
    globalCache.promise = mongoose.connect(mongoUri, {
      dbName,
      bufferCommands: false,
    });
  }

  globalCache.conn = await globalCache.promise;
  return globalCache.conn;
}
