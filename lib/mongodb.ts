import { MongoClient, Db } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "rsd-bot";

if (!uri) throw new Error("MONGODB_URI is missing");

const globalForMongo = globalThis as unknown as { mongo?: MongoClient };
const client = globalForMongo.mongo ?? new MongoClient(uri);

if (process.env.NODE_ENV !== "production") globalForMongo.mongo = client;

export async function db(): Promise<Db> {
  await client.connect();
  return client.db(dbName);
}
