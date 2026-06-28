import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/futureblink_shopify_app";

if (process.env.NODE_ENV !== "production") {
  if (!global.mongooseGlobal) {
    global.mongooseGlobal = mongoose.connect(MONGODB_URI).catch((err) => {
      console.error("MongoDB connection error:", err);
    });
  }
}

export async function connectMongoDB() {
  if (process.env.NODE_ENV !== "production") {
    await global.mongooseGlobal;
    return mongoose.connection;
  }
  return mongoose.connect(MONGODB_URI);
}
